import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QuerySupplierDto {
  @ApiPropertyOptional({
    description: 'Số thứ tự trang (bắt đầu từ 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page phải là số nguyên' })
  @Min(1, { message: 'page tối thiểu là 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi trên một trang',
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit phải là số nguyên' })
  @Min(1, { message: 'limit tối thiểu là 1' })
  @Max(100, { message: 'limit tối đa là 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description:
      'Từ khóa tìm kiếm theo mã NCC, tên nhà cung cấp hoặc số điện thoại (không phân biệt hoa thường)',
    example: 'Vinamilk',
  })
  @IsOptional()
  @IsString({ message: 'search phải là chuỗi' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái hợp tác (mặc định là Active)',
    enum: ['Active', 'Inactive', 'All'],
    default: 'Active',
    example: 'Active',
  })
  @IsOptional()
  @IsIn(['Active', 'Inactive', 'All'], {
    message: 'status phải là Active, Inactive hoặc All',
  })
  status?: string = 'Active';
}
