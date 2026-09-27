import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'ID định danh ngành hàng (dạng string để bảo toàn BigInt)',
    example: '1',
  })
  id!: string;

  @ApiProperty({
    description: 'Mã ngành hàng tự nhiên duy nhất toàn cục',
    example: 'BEV',
  })
  categoryCode!: string;

  @ApiProperty({
    description: 'Tên hiển thị của ngành hàng',
    example: 'Đồ Uống',
  })
  categoryName!: string;

  @ApiProperty({
    description: 'Mô tả phạm vi mặt hàng thuộc ngành hàng',
    example: 'Nước giải khát, nước ngọt, bia',
    nullable: true,
  })
  description!: string | null;

  @ApiProperty({
    description: 'Thời điểm tạo bản ghi (UTC ISO 8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Thời điểm cập nhật cuối (UTC ISO 8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  updatedAt!: string;
}
