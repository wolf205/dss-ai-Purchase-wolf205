import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiErrorDetailDto,
  StandardApiErrorResponse,
} from '../dto/api-response.dto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Đã có lỗi xảy ra trên hệ thống máy chủ.';
    let details: ApiErrorDetailDto[] | string[] = [];

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const respObj = exceptionResponse as Record<string, unknown>;

        // Trích xuất error code nếu được chỉ định cụ thể
        if (typeof respObj.code === 'string') {
          errorCode = respObj.code;
        } else {
          errorCode = this.mapHttpStatusToErrorCode(status);
        }

        // Xử lý thông báo và chi tiết validation từ class-validator
        if (Array.isArray(respObj.message)) {
          errorCode = 'VALIDATION_ERROR';
          message = 'Dữ liệu yêu cầu không hợp lệ.';
          details = (respObj.message as string[]).map((msg: string) => {
            const parts = msg.split(' ');
            return {
              field: parts[0] || 'input',
              issue: msg,
            };
          });
        } else if (typeof respObj.message === 'string') {
          message = respObj.message;
        }

        if (respObj.details) {
          details = (
            Array.isArray(respObj.details) ? respObj.details : [respObj.details]
          ) as ApiErrorDetailDto[] | string[];
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
    }

    const errorPayload: StandardApiErrorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    response.status(status).json(errorPayload);
  }

  private mapHttpStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN_ROLE';
      case HttpStatus.NOT_FOUND:
        return 'RESOURCE_NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT_ERROR';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'AI_SERVICE_UNAVAILABLE';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
