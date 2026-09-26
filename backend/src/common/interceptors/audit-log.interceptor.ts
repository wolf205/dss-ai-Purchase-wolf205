import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import {
  AUDIT_LOG_KEY,
  AuditLogOptions,
} from '../decorators/audit-log.decorator';
import { AuditService } from '../../modules/audit/audit.service';
import { AuthenticatedUser } from '../../modules/auth/interfaces/auth-payload.interface';

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditOptions = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Không cấu hình @AuditLog -> Bỏ qua, tiếp tục luồng xử lý
    if (!auditOptions) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<RequestWithUser>();

    return next.handle().pipe(
      tap({
        next: (resData: unknown) => {
          // Bắt sự kiện thành công (Status 2xx) và kích hoạt background promise
          this.recordAuditLogAsync(req, resData, auditOptions);
        },
      }),
    );
  }

  private recordAuditLogAsync(
    req: RequestWithUser,
    resData: unknown,
    options: AuditLogOptions,
  ): void {
    // Chạy trong background promise không làm chậm luồng response tới client
    Promise.resolve().then(async () => {
      try {
        const resDataObj = resData as Record<string, unknown> | null;

        // Trích xuất thông tin người dùng từ JWT guard hoặc từ body/response (ví dụ login/logout)
        const userId =
          req.user?.id ||
          (resDataObj?.user as Record<string, unknown>)?.id?.toString() ||
          null;

        const username =
          req.user?.username ||
          (resDataObj?.user as Record<string, unknown>)?.username?.toString() ||
          (req.body as Record<string, unknown>)?.username?.toString() ||
          'SYSTEM';

        // Trích xuất địa chỉ IP máy trạm (hỗ trợ reverse proxy header X-Forwarded-For)
        const forwardedHeader = req.headers['x-forwarded-for'];
        const rawIp =
          typeof forwardedHeader === 'string'
            ? forwardedHeader
            : Array.isArray(forwardedHeader)
              ? forwardedHeader[0]
              : req.ip || req.socket?.remoteAddress || '';
        const clientIp = rawIp ? rawIp.split(',')[0].trim() : undefined;

        // Xác định entityId
        let entityId: string | undefined;
        if (typeof options.entityId === 'function') {
          entityId = options.entityId(req, resData);
        } else if (options.entityId) {
          entityId = options.entityId;
        } else {
          entityId =
            (req.params?.id as string) ||
            (resDataObj?.data as Record<string, unknown>)?.id?.toString() ||
            resDataObj?.id?.toString() ||
            'N/A';
        }

        // Xác định description
        let description: string | undefined;
        if (typeof options.description === 'function') {
          description = options.description(req, resData);
        } else if (options.description) {
          description = options.description;
        } else {
          description = `Thao tác ${options.action} trên ${options.entityType || 'hệ thống'}`;
        }

        // Trích xuất metadata
        let metadata: Record<string, unknown> | undefined;
        if (options.extractMetadata) {
          metadata = options.extractMetadata(req, resData);
        } else {
          metadata = {
            method: req.method,
            path: req.originalUrl || req.url,
          };
        }

        await this.auditService.createLog({
          userId,
          username,
          action: options.action,
          entityType: options.entityType || 'SYSTEM',
          entityId: entityId || 'N/A',
          description,
          metadata,
          ipAddress: clientIp,
        });
      } catch (err) {
        this.logger.warn(
          `Không thể ghi nhật ký kiểm toán [${options.action}] trong background:`,
          err,
        );
      }
    });
  }
}
