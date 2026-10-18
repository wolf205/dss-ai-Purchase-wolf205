import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryPendingPosDto {
  @ApiPropertyOptional({
    description: 'Số thứ tự trang (1-indexed)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên dương.' })
  @Min(1, { message: 'page tối thiểu là 1.' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số bản ghi trên mỗi trang (1 - 100)',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên dương.' })
  @Min(1, { message: 'limit tối thiểu là 1.' })
  @Max(100, { message: 'limit tối đa là 100.' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo mã đơn PO (poNumber) hoặc tên NCC',
    example: 'PO-2026',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'ID của nhà cung cấp để lọc đơn',
    example: '3',
  })
  @IsOptional()
  @IsString()
  supplierId?: string;
}
