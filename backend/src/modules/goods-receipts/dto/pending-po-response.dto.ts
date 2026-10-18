import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PendingPoLineItemDto {
  @ApiProperty({
    description: 'ID của dòng hàng trên đơn PO (po_line_items.id)',
    example: '501',
  })
  id!: string;

  @ApiProperty({ description: 'ID của SKU/sản phẩm', example: '12' })
  productId!: string;

  @ApiProperty({ description: 'Mã SKU', example: 'MILK-TH-1L' })
  skuCode!: string;

  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Sữa tươi TH True Milk 1L',
  })
  productName!: string;

  @ApiPropertyOptional({
    description: 'Mã vạch sản phẩm',
    example: '8936012345678',
  })
  barcode?: string | null;

  @ApiProperty({ description: 'Đơn vị tính', example: 'Hộp' })
  unit!: string;

  @ApiProperty({
    description: 'Số lượng đặt mua trên PO (Qty_ordered)',
    example: 50,
  })
  orderedQuantity!: number;

  @ApiProperty({
    description: 'Đơn giá cam kết snapshot (VNĐ)',
    example: 32000,
  })
  historicalUnitPrice!: number;

  @ApiProperty({ description: 'Thành tiền dòng (VNĐ)', example: 1600000 })
  lineTotal!: number;
}

export class PendingPoSummaryDto {
  @ApiProperty({
    description: 'ID của đơn mua hàng (purchase_orders.id)',
    example: '201',
  })
  id!: string;

  @ApiProperty({
    description: 'Mã đơn mua hàng tự nhiên',
    example: 'PO-20260915-001',
  })
  poNumber!: string;

  @ApiProperty({ description: 'ID nhà cung cấp', example: '3' })
  supplierId!: string;

  @ApiProperty({
    description: 'Tên nhà cung cấp',
    example: 'Công ty Cổ phần Sữa TH',
  })
  supplierName!: string;

  @ApiProperty({ description: 'Mã nhà cung cấp', example: 'SUP-TH' })
  supplierCode!: string;

  @ApiProperty({
    description: 'Ngày phê duyệt đơn (YYYY-MM-DD)',
    example: '2026-09-15',
  })
  approvalDate!: string;

  @ApiProperty({
    description: 'Ngày giao dự kiến cam kết (YYYY-MM-DD)',
    example: '2026-09-17',
  })
  expectedDeliveryDate!: string;

  @ApiProperty({
    description: 'Tổng giá trị đơn hàng (VNĐ)',
    example: 12500000,
  })
  totalAmount!: number;

  @ApiProperty({
    description: 'Cờ quá hạn giao hàng runtime (expectedDeliveryDate < TODAY)',
    example: false,
  })
  isOverdue!: boolean;

  @ApiProperty({
    description: 'Số ngày quá hạn tính đến hiện tại (0 nếu chưa quá hạn)',
    example: 0,
  })
  daysOverdue!: number;

  @ApiProperty({ description: 'Tổng số dòng mặt hàng trên đơn', example: 5 })
  totalLines!: number;

  @ApiProperty({
    description:
      'Danh sách chi tiết các mặt hàng để điền trước số lượng thực nhận',
    type: [PendingPoLineItemDto],
  })
  lineItems!: PendingPoLineItemDto[];
}
