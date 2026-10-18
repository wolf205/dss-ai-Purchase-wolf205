import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class SalesRecordItemDto {
  @ApiProperty({
    example: '2026-09-14',
    description: 'Ngày bán hàng (định dạng YYYY-MM-DD, không trong tương lai)',
  })
  @IsNotEmpty({ message: 'Ngày bán hàng không được để trống' })
  @IsString({ message: 'Ngày bán hàng phải là chuỗi ký tự' })
  date: string;

  @ApiProperty({
    example: 'BEV-COCA-330',
    description: 'Mã SKU sản phẩm tồn tại trong hệ thống',
  })
  @IsNotEmpty({ message: 'Mã SKU không được để trống' })
  @IsString({ message: 'Mã SKU phải là chuỗi ký tự' })
  skuCode: string;

  @ApiProperty({
    example: 50,
    description: 'Số lượng bán (số nguyên dương > 0)',
  })
  @IsInt({ message: 'Số lượng bán phải là số nguyên' })
  @Min(1, { message: 'Số lượng bán phải lớn hơn hoặc bằng 1' })
  quantity: number;

  @ApiProperty({
    example: 500000,
    description: 'Doanh thu bán hàng (số không âm >= 0)',
  })
  @IsNumber({}, { message: 'Doanh thu phải là số' })
  @Min(0, { message: 'Doanh thu không được là số âm' })
  revenue: number;
}

export class ConfirmSalesDto {
  @ApiPropertyOptional({
    type: [SalesRecordItemDto],
    description:
      'Danh sách các bản ghi bán hàng cần nạp (sử dụng khi gửi qua JSON payload thay vì tải tệp CSV)',
  })
  @IsOptional()
  @IsArray({ message: 'Danh sách bản ghi phải là một mảng' })
  @ValidateNested({ each: true })
  @Type(() => SalesRecordItemDto)
  items?: SalesRecordItemDto[];
}
