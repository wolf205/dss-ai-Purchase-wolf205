import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateProductStatusDto {
  @ApiProperty({
    description: 'Trạng thái kinh doanh mới của SKU',
    enum: ['Active', 'Inactive'],
    example: 'Inactive',
  })
  @IsString({ message: 'status phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'status không được để trống' })
  @IsIn(['Active', 'Inactive'], {
    message: 'status chỉ chấp nhận một trong hai giá trị: Active hoặc Inactive',
  })
  status!: 'Active' | 'Inactive';
}
