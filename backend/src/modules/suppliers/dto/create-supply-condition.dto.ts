import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplyConditionDto {
  @ApiProperty({
    description: 'ID của mặt hàng SKU cần gán (phải đang ở trạng thái Active)',
    example: '12',
  })
  @IsString({ message: 'productId phải là chuỗi ký tự ID' })
  @IsNotEmpty({ message: 'productId không được để trống' })
  productId!: string;

  @ApiProperty({
    description: 'Đơn giá nhập tính theo VNĐ (phải là số dương lớn hơn 0)',
    example: 32000,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'purchasePrice phải là số' })
  @IsPositive({ message: 'purchasePrice phải là số dương lớn hơn 0' })
  purchasePrice!: number;

  @ApiPropertyOptional({
    description: 'Số lượng đặt tối thiểu (MOQ) (phải là số nguyên >= 1)',
    example: 10,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'moq phải là số nguyên' })
  @Min(1, { message: 'moq phải là số nguyên từ 1 trở lên' })
  moq?: number;
}
