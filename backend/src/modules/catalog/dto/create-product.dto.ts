import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description:
      'Mã SKU duy nhất toàn hệ thống (chỉ gồm chữ cái, chữ số, -, _)',
    example: 'MILK-TH-1L',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Mã SKU phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mã SKU không được để trống' })
  @MaxLength(50, { message: 'Mã SKU tối đa 50 ký tự' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Mã SKU chỉ được phép chứa chữ cái, chữ số, dấu gạch nối (-) hoặc gạch dưới (_)',
  })
  skuCode!: string;

  @ApiProperty({
    description: 'Tên thương mại của sản phẩm',
    example: 'Sữa tươi tiệt trùng TH True Milk 1L',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Tên sản phẩm phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  @MaxLength(255, { message: 'Tên sản phẩm tối đa 255 ký tự' })
  productName!: string;

  @ApiProperty({
    description:
      'ID ngành hàng trực thuộc (BigInt định dạng string hoặc number)',
    example: '1',
  })
  @IsNotEmpty({ message: 'Ngành hàng không được để trống' })
  categoryId!: string | number;

  @ApiProperty({
    description:
      'Đơn vị tính lưu kho và giao dịch (Chai, Lon, Hộp, Gói, Kg...)',
    example: 'Hộp',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  @MaxLength(30, { message: 'Đơn vị tính tối đa 30 ký tự' })
  unit!: string;

  @ApiPropertyOptional({
    description: 'Mã vạch sản phẩm (nếu có phải duy nhất)',
    example: '8936036010011',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Mã vạch phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Mã vạch tối đa 50 ký tự' })
  barcode?: string;
}
