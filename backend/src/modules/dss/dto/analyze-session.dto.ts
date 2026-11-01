import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalyzeSessionRequestDto {
  @ApiPropertyOptional({
    example: 1,
    description:
      'ID ngành hàng / danh mục SKU cần phân tích (null hoặc bỏ trống = toàn bộ cửa hàng)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoryId phải là số nguyên' })
  @Min(1, { message: 'categoryId phải >= 1' })
  categoryId?: number;

  @ApiPropertyOptional({
    example: '2026-10-05',
    description:
      'Ngày phân tích mô phỏng / chỉ định (ISO YYYY-MM-DD). Mặc định là ngày hiện tại.',
  })
  @IsOptional()
  asOfDate?: string;
}
