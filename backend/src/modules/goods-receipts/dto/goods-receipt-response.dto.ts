import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReceiptLineItemResponseDto {
  @ApiProperty({
    description: 'ID của dòng nhận hàng (receipt_line_items.id)',
    example: '801',
  })
  id!: string;

  @ApiProperty({
    description: 'ID dòng đơn mua hàng tương ứng',
    example: '501',
  })
  poLineItemId!: string;

  @ApiProperty({ description: 'ID sản phẩm', example: '12' })
  productId!: string;

  @ApiProperty({ description: 'Mã SKU', example: 'MILK-TH-1L' })
  skuCode!: string;

  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Sữa tươi TH True Milk 1L',
  })
  productName!: string;

  @ApiProperty({ description: 'Đơn vị tính', example: 'Hộp' })
  unit!: string;

  @ApiProperty({
    description: 'Số lượng đặt mua ban đầu (ordered_quantity)',
    example: 50,
  })
  orderedQuantity!: number;

  @ApiProperty({
    description: 'Số lượng thực nhận nhập kho (received_quantity)',
    example: 50,
  })
  receivedQuantity!: number;

  @ApiProperty({
    description: 'Đơn giá cam kết snapshot (VNĐ)',
    example: 32000,
  })
  historicalUnitPrice!: number;

  @ApiProperty({
    description: 'Giá trị thực nhận của dòng (VNĐ)',
    example: 1600000,
  })
  lineReceivedTotal!: number;

  @ApiProperty({
    description: 'Tỷ lệ giao đủ của dòng mặt hàng (Cap 100% = 1.0000)',
    example: 1.0,
  })
  itemFulfillmentRate!: number;

  @ApiProperty({
    description: 'Thời điểm tạo dòng hàng',
    example: '2026-09-17T15:00:00.000Z',
  })
  createdAt!: string;
}

export class SupplierPerformanceUpdateDto {
  @ApiProperty({ description: 'ID nhà cung cấp', example: '3' })
  supplierId!: string;

  @ApiProperty({
    description: 'Tổng số đơn PO đã hoàn tất tích lũy',
    example: 5,
  })
  completedOrderCount!: number;

  @ApiProperty({
    description:
      'Điểm hiệu suất 5 đơn gần nhất (0.0000 - 1.0000, Cold Start < 3 đơn là 0.8000)',
    example: 0.925,
  })
  performanceScore!: number;

  @ApiProperty({
    description: 'Điểm hiệu suất toàn thời gian của NCC (0.0000 - 1.0000)',
    example: 0.91,
  })
  allTimePerformanceScore!: number;

  @ApiProperty({
    description: 'Nhãn phong độ hiển thị theo BR-24',
    example: '[Phong độ 5 đơn gần nhất]',
  })
  performanceLabel!: string;
}

export class GoodsReceiptResponseDto {
  @ApiProperty({
    description: 'ID phiếu nhận hàng (goods_receipts.id)',
    example: '301',
  })
  id!: string;

  @ApiProperty({
    description: 'Mã phiếu nhận hàng tự nhiên (GR-YYYYMMDD-XXX)',
    example: 'GR-20260917-001',
  })
  receiptNumber!: string;

  @ApiProperty({ description: 'ID đơn mua hàng tương ứng', example: '201' })
  purchaseOrderId!: string;

  @ApiProperty({ description: 'Mã đơn mua hàng', example: 'PO-20260915-001' })
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
    description: 'Ngày nhận hàng thực tế tại kho (YYYY-MM-DD)',
    example: '2026-09-17',
  })
  actualDeliveryDate!: string;

  @ApiProperty({
    description: 'Ngày giao hàng cam kết ban đầu (YYYY-MM-DD)',
    example: '2026-09-17',
  })
  expectedDeliveryDate!: string;

  @ApiProperty({
    description: 'Số ngày giao trễ (0 nếu đúng hạn hoặc sớm)',
    example: 0,
  })
  daysLate!: number;

  @ApiProperty({
    description: 'Trạng thái giao đúng hạn (true nếu daysLate == 0)',
    example: true,
  })
  isOnTime!: boolean;

  @ApiProperty({
    description:
      'Hệ số đúng hạn theo Linear Penalty Decay (1.0 -> 0.67 -> 0.33 -> 0.0)',
    example: 1.0,
  })
  onTimeFactor!: number;

  @ApiProperty({
    description: 'Tỷ lệ giao đủ toàn đơn (Cap 100% = 1.0000)',
    example: 1.0,
  })
  overallFulfillmentRate!: number;

  @ApiProperty({
    description: 'Điểm hiệu suất của đơn hàng này (0.0000 - 1.0000)',
    example: 1.0,
  })
  orderPerformanceScore!: number;

  @ApiPropertyOptional({
    description: 'Ghi chú tiếp nhận',
    example: 'Giao hàng đúng hẹn, bao bì nguyên vẹn',
  })
  notes?: string | null;

  @ApiProperty({
    description: 'Tên nhân viên kho tiếp nhận',
    example: 'staff01',
  })
  receivedBy!: string;

  @ApiProperty({
    description: 'Thời điểm tạo phiếu nhận hàng (ISO-8601)',
    example: '2026-09-17T15:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Danh sách các dòng mặt hàng thực nhận nhập kho',
    type: [ReceiptLineItemResponseDto],
  })
  lines!: ReceiptLineItemResponseDto[];

  @ApiProperty({
    description:
      'Thông tin cập nhật chỉ số hiệu suất của Nhà cung cấp sau khi đóng đơn',
    type: SupplierPerformanceUpdateDto,
  })
  supplierPerformance!: SupplierPerformanceUpdateDto;
}
