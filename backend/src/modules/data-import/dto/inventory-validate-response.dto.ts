import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryPreviewRowDto {
  @ApiProperty({
    example: 'BEV-COCA-330',
    description: 'Mã SKU của sản phẩm kiểm kê',
  })
  skuCode: string;

  @ApiProperty({
    example: 120,
    description: 'Số lượng kiểm kê thực tế trên kệ',
  })
  stockQuantity: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Tồn kho khả dụng hiện hành trong hệ thống trước kiểm kê',
  })
  currentInventory?: number;

  @ApiPropertyOptional({
    example: 20,
    description:
      'Độ chênh lệch giữa số lượng thực tế và hệ thống (stockQuantity - currentInventory)',
  })
  difference?: number;
}

export class InventoryValidateResponseDto {
  @ApiProperty({
    example: true,
    description:
      'Trạng thái tính hợp lệ của toàn bộ tệp kiểm kê (All-or-Nothing)',
  })
  isValid: boolean;

  @ApiProperty({
    example: 50,
    description: 'Tổng số dòng dữ liệu kiểm kê hợp lệ',
  })
  totalRows: number;

  @ApiProperty({
    type: [InventoryPreviewRowDto],
    description:
      'Danh sách các dòng xem trước đầu tiên kèm thông tin so sánh chênh lệch tồn kho',
  })
  previewRows: InventoryPreviewRowDto[];
}
