import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryAuditLogDto {
  @ApiPropertyOptional({
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page tối thiểu là 1' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi trên một trang',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(100, { message: 'limit tối đa là 100' })
  limit: number = 20;

  @ApiPropertyOptional({
    description:
      'Lọc theo mã hành động (ví dụ: AUTH_LOGIN, DSS_APPROVE_RECOMMENDATION)',
    example: 'DSS_APPROVE_RECOMMENDATION',
  })
  @IsOptional()
  @IsString({ message: 'action phải là chuỗi' })
  action?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo tên tài khoản thực hiện hành động',
    example: 'manager_an',
  })
  @IsOptional()
  @IsString({ message: 'username phải là chuỗi' })
  username?: string;

  @ApiPropertyOptional({
    description: 'Lọc từ thời điểm (định dạng ISO-8601)',
    example: '2026-09-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'fromDate phải là chuỗi định dạng ISO-8601 hợp lệ' },
  )
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Lọc đến thời điểm (định dạng ISO-8601)',
    example: '2026-09-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'toDate phải là chuỗi định dạng ISO-8601 hợp lệ' },
  )
  toDate?: string;
}
