import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplyConditionProductSummaryDto {
  @ApiProperty({
    description: 'ID định danh sản phẩm SKU (dạng string)',
    example: '12',
  })
  id!: string;

  @ApiProperty({
    description: 'Mã SKU tự nhiên duy nhất toàn cục',
    example: 'MILK-TH-1L',
  })
  skuCode!: string;

  @ApiProperty({
    description: 'Tên thương mại của sản phẩm',
    example: 'Sữa tươi tiệt trùng TH True Milk 1L',
  })
  productName!: string;

  @ApiProperty({
    description: 'Mã vạch sản phẩm (nếu có)',
    example: '8936036010011',
    nullable: true,
  })
  barcode!: string | null;

  @ApiProperty({
    description: 'Đơn vị tính lưu kho',
    example: 'Hộp',
  })
  unit!: string;

  @ApiProperty({
    description: 'Trạng thái kinh doanh của SKU (Active / Inactive)',
    example: 'Active',
  })
  status!: string;

  @ApiProperty({
    description: 'Tên ngành hàng trực thuộc',
    example: 'Đồ Uống',
  })
  categoryName!: string;
}

export class SupplyConditionResponseDto {
  @ApiProperty({
    description: 'ID điều kiện cung ứng (dạng string)',
    example: '1',
  })
  id!: string;

  @ApiProperty({
    description: 'ID nhà cung cấp',
    example: '1',
  })
  supplierId!: string;

  @ApiProperty({
    description: 'ID sản phẩm SKU',
    example: '12',
  })
  productId!: string;

  @ApiProperty({
    description: 'Đơn giá nhập hàng tính theo VNĐ (chính xác)',
    example: 32000,
  })
  purchasePrice!: number;

  @ApiProperty({
    description: 'Số lượng đặt hàng tối thiểu cho mỗi lần mua (MOQ >= 1)',
    example: 10,
  })
  moq!: number;

  @ApiProperty({
    description:
      'Trạng thái cung ứng của mặt hàng này từ NCC (Active / Inactive)',
    example: 'Active',
  })
  status!: string;

  @ApiProperty({
    description: 'Thông tin tóm tắt sản phẩm SKU được cung ứng',
    type: SupplyConditionProductSummaryDto,
  })
  product!: SupplyConditionProductSummaryDto;

  @ApiProperty({
    description: 'Thời điểm tạo liên kết cung ứng (UTC ISO-8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Thời điểm cập nhật cuối (UTC ISO-8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  updatedAt!: string;

  @ApiPropertyOptional({
    description:
      'Cảnh báo mềm (Soft Warning - BR-23): Đối tác này là nhà cung cấp duy nhất hiện tại của SKU',
    example: false,
  })
  isSoleSupplier?: boolean;
}
