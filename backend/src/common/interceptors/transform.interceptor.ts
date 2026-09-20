import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StandardApiResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardApiResponse<T>> {
    return next.handle().pipe(
      map((resData) => {
        const timestamp = new Date().toISOString();

        // Nếu dữ liệu đã có cấu trúc envelope từ controller (e.g. có meta phân trang)
        if (
          resData &&
          typeof resData === 'object' &&
          'success' in resData &&
          'data' in resData
        ) {
          return {
            success: true,
            data: resData.data,
            meta: {
              timestamp,
              ...(resData.meta || {}),
            },
          };
        }

        // Tự động đóng gói chuẩn Standard API Envelope
        return {
          success: true,
          data: resData,
          meta: {
            timestamp,
          },
        };
      }),
    );
  }
}
