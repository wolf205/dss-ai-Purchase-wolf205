import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateRecommendationItemDto {
  @ApiPropertyOptional({
    example: 60,
    description: 'Số lượng đặt mua do người dùng quyết định (>= 0)',
  })
  @IsOptional()
  @IsInt({ message: 'approvedQuantity phải là số nguyên' })
  @Min(0, { message: 'approvedQuantity không được nhỏ hơn 0' })
  approvedQuantity?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'ID nhà cung cấp do người dùng chọn (>= 1)',
  })
  @IsOptional()
  @IsInt({ message: 'approvedSupplierId phải là số nguyên dương' })
  @Min(1, { message: 'approvedSupplierId phải lớn hơn hoặc bằng 1' })
  approvedSupplierId?: number;
}
