import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class InventoryRecordItemDto {
  @ApiProperty({
    example: 'BEV-COCA-330',
    description: 'Mã SKU của sản phẩm',
  })
  @IsNotEmpty({ message: 'Mã SKU không được để trống' })
  @IsString({ message: 'Mã SKU phải là chuỗi ký tự' })
  skuCode: string;

  @ApiProperty({
    example: 120,
    description: 'Số lượng kiểm kê thực tế trên kệ (số nguyên >= 0)',
  })
  @IsInt({ message: 'Số lượng kiểm kê phải là số nguyên' })
  @Min(0, { message: 'Số lượng kiểm kê không được là số âm' })
  stockQuantity: number;
}

export class ConfirmInventoryDto {
  @ApiPropertyOptional({
    type: [InventoryRecordItemDto],
    description:
      'Danh sách các bản ghi kiểm kê (nếu gửi dữ liệu dạng JSON thay vì tải tệp CSV)',
  })
  @IsOptional()
  @IsArray({ message: 'Danh sách bản ghi phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => InventoryRecordItemDto)
  items?: InventoryRecordItemDto[];
}
