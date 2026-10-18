import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSupplyConditionDto {
  @ApiPropertyOptional({
    description:
      'Đơn giá nhập mới tính theo VNĐ (phải là số dương lớn hơn 0, chỉ áp dụng tiến về trước theo BR-22)',
    example: 35000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'purchasePrice phải là số' })
  @IsPositive({ message: 'purchasePrice phải là số dương lớn hơn 0' })
  purchasePrice?: number;

  @ApiPropertyOptional({
    description:
      'Số lượng đặt tối thiểu mới (MOQ) (phải là số nguyên >= 1, chỉ áp dụng tiến về trước theo BR-22)',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'moq phải là số nguyên' })
  @Min(1, { message: 'moq phải là số nguyên từ 1 trở lên' })
  moq?: number;

  @ApiPropertyOptional({
    description:
      'Trạng thái cung ứng của mặt hàng này (Active / Inactive). Khi Inactive: chặn nếu SKU đang nằm trong PO Approved (EF-5, BR-23).',
    enum: ['Active', 'Inactive'],
    example: 'Inactive',
  })
  @IsOptional()
  @IsString({ message: 'status phải là chuỗi ký tự' })
  @IsIn(['Active', 'Inactive'], {
    message: 'status chỉ chấp nhận một trong hai giá trị: Active hoặc Inactive',
  })
  status?: 'Active' | 'Inactive';
}
