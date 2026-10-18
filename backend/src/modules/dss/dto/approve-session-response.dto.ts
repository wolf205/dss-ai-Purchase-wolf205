import { ApiProperty } from '@nestjs/swagger';

export class GeneratedPurchaseOrderDto {
  @ApiProperty({ example: 201, description: 'ID đơn mua hàng PO được sinh' })
  poId: number;

  @ApiProperty({
    example: 'PO-20261004-001',
    description: 'Mã số đơn mua hàng duy nhất',
  })
  poNumber: string;

  @ApiProperty({
    example: 'Công ty Cổ phần Sữa TH',
    description: 'Tên nhà cung cấp được đặt hàng',
  })
  supplierName: string;

  @ApiProperty({
    example: 5,
    description: 'Tổng số dòng mặt hàng trong đơn PO',
  })
  totalLines: number;

  @ApiProperty({
    example: 12500000.0,
    description: 'Tổng giá trị đơn mua hàng (VNĐ)',
  })
  totalAmount: number;

  @ApiProperty({
    example: '2026-10-06T00:00:00.000Z',
    description: 'Ngày dự kiến giao hàng (dựa trên Lead Time cam kết của NCC)',
  })
  expectedDeliveryDate: string;
}

export class ApproveSessionResponseDto {
  @ApiProperty({
    example: 105,
    description: 'ID phiên phân tích DSS vừa được phê duyệt',
  })
  sessionId: number;

  @ApiProperty({
    type: [GeneratedPurchaseOrderDto],
    description:
      'Danh sách các đơn mua hàng (PO) được tự động sinh gom theo NCC',
  })
  generatedPurchaseOrders: GeneratedPurchaseOrderDto[];
}
