import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryPurchaseOrderDto {
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
    description: 'Trạng thái đơn mua hàng',
    enum: ['Approved', 'Completed', 'Cancelled'],
    example: 'Approved',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Approved', 'Completed', 'Cancelled'], {
    message:
      'status phải là một trong các giá trị: Approved, Completed, Cancelled.',
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'ID của nhà cung cấp để lọc đơn',
    example: '1',
  })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiPropertyOptional({
    description:
      'Lọc theo trạng thái quá hạn giao hàng (BR-09: status = Approved và expectedDeliveryDate < TODAY)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'isOverdue phải là giá trị boolean (true/false).' })
  isOverdue?: boolean;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo mã đơn PO (poNumber) hoặc tên NCC',
    example: 'PO-2026',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
