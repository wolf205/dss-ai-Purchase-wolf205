import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Tên thương mại của sản phẩm',
    example: 'Sữa tươi tiệt trùng TH True Milk 1L vị dâu',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Tên sản phẩm phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên sản phẩm không được để rỗng' })
  @MaxLength(255, { message: 'Tên sản phẩm tối đa 255 ký tự' })
  productName?: string;

  @ApiPropertyOptional({
    description: 'ID ngành hàng mới (nếu muốn thay đổi phân loại)',
    example: '2',
  })
  @IsOptional()
  categoryId?: string | number;

  @ApiPropertyOptional({
    description: 'Đơn vị tính lưu kho và giao dịch',
    example: 'Thùng',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Đơn vị tính phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Đơn vị tính không được để rỗng' })
  @MaxLength(30, { message: 'Đơn vị tính tối đa 30 ký tự' })
  unit?: string;

  @ApiPropertyOptional({
    description:
      'Mã vạch sản phẩm (truyền chuỗi mới để đổi, hoặc null / "" để xóa mã vạch)',
    example: '8936036010028',
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Mã vạch phải là chuỗi ký tự' })
  @MaxLength(50, { message: 'Mã vạch tối đa 50 ký tự' })
  barcode?: string | null;
}
