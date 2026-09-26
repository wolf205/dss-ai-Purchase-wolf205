import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';

export const AUDIT_LOG_KEY = 'audit_log_options';

export interface AuditLogOptions {
  /**
   * Mã hành vi nghiệp vụ chuẩn hóa (e.g. 'AUTH_LOGIN', 'DSS_APPROVE_RECOMMENDATION')
   */
  action: string;

  /**
   * Loại thực thể bị tác động (e.g. 'User', 'RecommendationSession', 'PurchaseOrder')
   */
  entityType?: string;

  /**
   * Mã định danh của bản ghi hoặc hàm trích xuất entityId từ request/response
   */
  entityId?: string | ((req: Request, resData: unknown) => string | undefined);

  /**
   * Mô tả tóm tắt hành động hoặc hàm tạo mô tả từ request/response
   */
  description?:
    string | ((req: Request, resData: unknown) => string | undefined);

  /**
   * Hàm tùy chọn trích xuất dữ liệu bổ sung lưu vào trường metadata (JSONB)
   */
  extractMetadata?: (
    req: Request,
    resData: unknown,
  ) => Record<string, unknown> | undefined;
}

export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);
