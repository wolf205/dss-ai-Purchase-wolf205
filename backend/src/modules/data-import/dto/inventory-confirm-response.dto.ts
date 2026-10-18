import { ApiProperty } from '@nestjs/swagger';

export class InventoryConfirmResponseDto {
  @ApiProperty({
    example: 50,
    description: 'Số lượng SKU đã được cập nhật số tồn kho trên kệ',
  })
  updatedCount: number;

  @ApiProperty({
    example: 'Cập nhật số liệu kiểm kê thành công cho 50 sản phẩm.',
    description: 'Thông báo kết quả thực thi',
  })
  message: string;
}
