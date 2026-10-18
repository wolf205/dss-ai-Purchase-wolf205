import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateDssConfigurationDto {
  @ApiPropertyOptional({
    description:
      'Trọng số tiêu chí Đơn giá (Price Weight, thang 0.0 - 1.0) theo chuẩn API Spec',
    example: 0.4,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weightPrice?: number;

  @ApiPropertyOptional({
    description:
      'Trọng số tiêu chí Đơn giá (Price Weight, thang 0.0 - 1.0) theo chuẩn Domain Model',
    example: 0.4,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  priceWeight?: number;

  @ApiPropertyOptional({
    description:
      'Trọng số tiêu chí Thời gian giao hàng (Lead Time Weight, thang 0.0 - 1.0) theo chuẩn API Spec',
    example: 0.2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weightLeadTime?: number;

  @ApiPropertyOptional({
    description:
      'Trọng số tiêu chí Thời gian giao hàng (Lead Time Weight, thang 0.0 - 1.0) theo chuẩn Domain Model',
    example: 0.2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  leadTimeWeight?: number;

  @ApiPropertyOptional({
    description:
      'Trọng số tiêu chí Số lượng đặt tối thiểu (MOQ Weight, thang 0.0 - 1.0) theo chuẩn API Spec',
    example: 0.15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weightMoq?: number;

  @ApiPropertyOptional({
    description:
      'Trọng số tiêu chí Số lượng đặt tối thiểu (MOQ Weight, thang 0.0 - 1.0) theo chuẩn Domain Model',
    example: 0.15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  moqWeight?: number;

  @ApiPropertyOptional({
    description:
      'Trọng số tiêu chí Lịch sử giao hàng (Historical Weight, thang 0.0 - 1.0) theo chuẩn API Spec',
    example: 0.25,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weightHistory?: number;

  @ApiPropertyOptional({
    description:
      'Trọng số tiêu chí Lịch sử giao hàng (Historical Weight, thang 0.0 - 1.0) theo chuẩn Domain Model',
    example: 0.25,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  historyWeight?: number;

  @ApiProperty({
    description:
      'Mức độ phục vụ mong muốn (Target Service Level), bắt buộc thuộc tập [0.90, 0.95, 0.98, 0.99]',
    example: 0.95,
  })
  @IsNumber()
  @IsIn([0.9, 0.95, 0.98, 0.99], {
    message:
      'targetServiceLevel phải thuộc 1 trong 4 mốc chuẩn: 0.90 (90%), 0.95 (95%), 0.98 (98%), hoặc 0.99 (99%).',
  })
  targetServiceLevel!: number;

  @ApiProperty({
    description:
      'Chu kỳ rà soát mua hàng định kỳ (Review Period Days), số nguyên từ 1 đến 30 ngày',
    example: 7,
  })
  @IsInt({ message: 'reviewPeriodDays phải là số nguyên' })
  @Min(1, { message: 'reviewPeriodDays tối thiểu là 1 ngày' })
  @Max(30, { message: 'reviewPeriodDays tối đa là 30 ngày' })
  reviewPeriodDays!: number;
}
