import { ApiProperty } from '@nestjs/swagger';

export class SalesConfirmResponseDto {
  @ApiProperty({
    example: 250,
    description: 'Tổng số bản ghi bán hàng đã được nạp thành công vào CSDL',
  })
  importedCount: number;

  @ApiProperty({
    example: 30,
    description: 'Số lượng bản ghi cũ bị xóa ghi đè do trùng ngày',
  })
  deletedCount: number;

  @ApiProperty({
    example: ['2026-09-14'],
    description: 'Danh sách các ngày bị trùng lặp đã được xóa cũ ghi mới',
  })
  overwrittenDates: string[];

  @ApiProperty({
    example:
      'Nạp dữ liệu bán hàng thành công. Đã ghi đè 1 ngày trùng lặp và lưu mới 250 bản ghi.',
    description: 'Thông báo kết quả nạp dữ liệu',
  })
  message: string;
}
