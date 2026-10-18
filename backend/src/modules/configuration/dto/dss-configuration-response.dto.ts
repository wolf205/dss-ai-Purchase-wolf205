import { ApiProperty } from '@nestjs/swagger';

export class DssConfigurationResponseDto {
  @ApiProperty({
    description: 'Khóa chính kỹ thuật Singleton của bảng cấu hình (luôn là 1)',
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: 'Trọng số tiêu chí Đơn giá (Price Weight, thang 0.0 - 1.0)',
    example: 0.4,
  })
  priceWeight!: number;

  @ApiProperty({
    description:
      'Trọng số tiêu chí Thời gian giao hàng (Lead Time Weight, thang 0.0 - 1.0)',
    example: 0.2,
  })
  leadTimeWeight!: number;

  @ApiProperty({
    description:
      'Trọng số tiêu chí Số lượng đặt tối thiểu (MOQ Weight, thang 0.0 - 1.0)',
    example: 0.15,
  })
  moqWeight!: number;

  @ApiProperty({
    description:
      'Trọng số tiêu chí Lịch sử giao hàng (Historical Performance Weight, thang 0.0 - 1.0)',
    example: 0.25,
  })
  historyWeight!: number;

  @ApiProperty({
    description: 'Alias cho priceWeight tương thích API Specification',
    example: 0.4,
  })
  weightPrice!: number;

  @ApiProperty({
    description: 'Alias cho leadTimeWeight tương thích API Specification',
    example: 0.2,
  })
  weightLeadTime!: number;

  @ApiProperty({
    description: 'Alias cho moqWeight tương thích API Specification',
    example: 0.15,
  })
  weightMoq!: number;

  @ApiProperty({
    description: 'Alias cho historyWeight tương thích API Specification',
    example: 0.25,
  })
  weightHistory!: number;

  @ApiProperty({
    description:
      'Mức độ phục vụ mong muốn (Target Service Level: 0.90, 0.95, 0.98, 0.99)',
    example: 0.95,
  })
  targetServiceLevel!: number;

  @ApiProperty({
    description:
      'Hệ số an toàn Z tương ứng trong phân phối chuẩn tắc (1.28, 1.65, 2.05, 2.33)',
    example: 1.65,
  })
  zFactor!: number;

  @ApiProperty({
    description: 'Chu kỳ rà soát mua hàng định kỳ (1 - 30 ngày)',
    example: 7,
  })
  reviewPeriodDays!: number;

  @ApiProperty({
    description: 'Người dùng cập nhật cấu hình gần nhất',
    example: 'Store Manager',
  })
  updatedBy!: string;

  @ApiProperty({
    description: 'Thời điểm khởi tạo cấu hình (UTC ISO-8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Thời điểm cập nhật cuối (UTC ISO-8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  updatedAt!: string;
}
