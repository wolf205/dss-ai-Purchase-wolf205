import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto';

export class PurchaseOrderLineItemDto {
  @ApiProperty({ description: 'ID dòng đơn mua hàng', example: '1' })
  id: string;

  @ApiProperty({ description: 'ID sản phẩm SKU', example: '12' })
  productId: string;

  @ApiProperty({ description: 'Mã SKU', example: 'MILK-TH-1L' })
  skuCode: string;

  @ApiProperty({
    description: 'Tên sản phẩm',
    example: 'Sữa tươi TH True Milk 1L',
  })
  productName: string;

  @ApiPropertyOptional({
    description: 'Mã vạch barcode',
    example: '8934673200025',
  })
  barcode: string | null;

  @ApiProperty({ description: 'Đơn vị tính', example: 'Hộp' })
  unit: string;

  @ApiProperty({ description: 'Số lượng đặt mua', example: 50 })
  quantity: number;

  @ApiProperty({
    description:
      'Đơn giá nhập snapshot cam kết tại thời điểm duyệt đơn (BR-22)',
    example: 31000,
  })
  historicalUnitPrice: number;

  @ApiProperty({
    description: 'Số lượng đặt tối thiểu (MOQ) snapshot tại thời điểm duyệt',
    example: 20,
  })
  historicalMoq: number;

  @ApiProperty({
    description: 'Thành tiền = quantity * historicalUnitPrice',
    example: 1550000,
  })
  lineTotal: number;
}

export class PurchaseOrderSupplierDto {
  @ApiProperty({ description: 'ID nhà cung cấp', example: '3' })
  id: string;

  @ApiProperty({ description: 'Mã nhà cung cấp', example: 'NCC-THM' })
  supplierCode: string;

  @ApiProperty({
    description: 'Tên nhà cung cấp',
    example: 'Công ty Cổ phần Sữa TH',
  })
  supplierName: string;

  @ApiPropertyOptional({
    description: 'Người liên hệ',
    example: 'Nguyễn Văn A',
  })
  contactPerson: string | null;

  @ApiPropertyOptional({
    description: 'Số điện thoại liên hệ',
    example: '0901234567',
  })
  phoneNumber: string | null;

  @ApiPropertyOptional({
    description: 'Email liên hệ',
    example: 'contact@thmilk.vn',
  })
  email: string | null;

  @ApiPropertyOptional({
    description: 'Địa chỉ nhà cung cấp',
    example: 'Nghệ An, Việt Nam',
  })
  address: string | null;
}

export class PurchaseOrderSummaryResponseDto {
  @ApiProperty({ description: 'ID đơn mua hàng', example: '201' })
  id: string;

  @ApiProperty({ description: 'Mã đơn mua hàng', example: 'PO-20261018-001' })
  poNumber: string;

  @ApiProperty({ description: 'ID phiên phân tích DSS gốc', example: '105' })
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Mã phiên phân tích DSS gốc',
    example: 'REC-20261018-001',
  })
  sessionCode?: string;

  @ApiProperty({ description: 'ID nhà cung cấp', example: '3' })
  supplierId: string;

  @ApiProperty({ description: 'Mã nhà cung cấp', example: 'NCC-THM' })
  supplierCode: string;

  @ApiProperty({
    description: 'Tên nhà cung cấp',
    example: 'Công ty Cổ phần Sữa TH',
  })
  supplierName: string;

  @ApiProperty({
    description: 'Trạng thái đơn mua hàng',
    enum: ['Approved', 'Completed', 'Cancelled'],
    example: 'Approved',
  })
  status: string;

  @ApiProperty({
    description: 'Ngày phê duyệt đơn (YYYY-MM-DD)',
    example: '2026-10-18',
  })
  approvalDate: string;

  @ApiProperty({
    description: 'Lead time cam kết snapshot (ngày)',
    example: 2,
  })
  historicalLeadTimeDays: number;

  @ApiProperty({
    description: 'Ngày giao hàng dự kiến cố định (BR-08, YYYY-MM-DD)',
    example: '2026-10-20',
  })
  expectedDeliveryDate: string;

  @ApiProperty({
    description: 'Tổng giá trị đơn mua hàng (VNĐ)',
    example: 12500000,
  })
  totalAmount: number;

  @ApiProperty({ description: 'Tổng số dòng mặt hàng SKU', example: 5 })
  totalLines: number;

  @ApiProperty({
    description:
      'Cảnh báo quá hạn giao runtime theo BR-09 (status = Approved và expectedDeliveryDate < TODAY)',
    example: false,
  })
  isOverdue: boolean;

  @ApiPropertyOptional({
    description: 'Lý do hủy đơn hàng (nếu status = Cancelled, theo BR-10)',
    example: null,
  })
  cancellationReason: string | null;

  @ApiPropertyOptional({
    description: 'Thời điểm hủy đơn hàng',
    example: null,
  })
  cancelledAt: string | null;

  @ApiPropertyOptional({
    description: 'Thời điểm xuất chứng từ gần nhất',
    example: null,
  })
  lastExportedAt: string | null;

  @ApiProperty({
    description: 'Thời điểm tạo bản ghi',
    example: '2026-10-18T08:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Thời điểm cập nhật gần nhất',
    example: '2026-10-18T08:30:00.000Z',
  })
  updatedAt: string;
}

export class PurchaseOrderDetailResponseDto extends PurchaseOrderSummaryResponseDto {
  @ApiProperty({
    description: 'Thông tin đối tác nhà cung cấp',
    type: PurchaseOrderSupplierDto,
  })
  supplier: PurchaseOrderSupplierDto;

  @ApiProperty({
    description:
      'Danh sách các mặt hàng đặt mua bảo lưu snapshot đơn giá và MOQ (BR-22)',
    type: [PurchaseOrderLineItemDto],
  })
  lineItems: PurchaseOrderLineItemDto[];
}

export class PurchaseOrderListResponseDto {
  @ApiProperty({
    description: 'Danh sách các đơn mua hàng',
    type: [PurchaseOrderSummaryResponseDto],
  })
  items: PurchaseOrderSummaryResponseDto[];

  @ApiProperty({
    description: 'Thông tin phân trang',
    type: PaginationMetaDto,
  })
  pagination: PaginationMetaDto;
}
