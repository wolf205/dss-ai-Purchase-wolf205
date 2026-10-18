import { ApiProperty } from '@nestjs/swagger';

export class DailyForecastDto {
  @ApiProperty({ example: '2026-10-05', description: 'Ngày dự báo' })
  date: string;

  @ApiProperty({ example: 12.0, description: 'Lượng tiêu thụ dự báo' })
  predicted: number;

  @ApiProperty({ example: 10.0, description: 'Cận dưới khoảng tin cậy 95%' })
  lower: number;

  @ApiProperty({ example: 14.0, description: 'Cận trên khoảng tin cậy 95%' })
  upper: number;
}

export class SupplierRankingDto {
  @ApiProperty({ example: 3, description: 'ID nhà cung cấp' })
  supplierId: number;

  @ApiProperty({ example: 'TH True Milk', description: 'Tên nhà cung cấp' })
  name: string;

  @ApiProperty({ example: 92.5, description: 'Điểm tổng hợp WSM' })
  score: number;

  @ApiProperty({ example: 32000, description: 'Đơn giá chào mua' })
  price: number;

  @ApiProperty({ example: 2, description: 'Thời gian giao hàng (ngày)' })
  leadTime: number;

  @ApiProperty({ example: 20, description: 'Số lượng đặt hàng tối thiểu MOQ' })
  moq?: number;
}

export class SuggestedSupplierDetailDto {
  @ApiProperty({ example: 3, description: 'ID nhà cung cấp được gợi ý' })
  id: number;

  @ApiProperty({ example: 'TH_TRUE_MILK', description: 'Mã nhà cung cấp' })
  code: string;

  @ApiProperty({
    example: 'Công ty Cổ phần Sữa TH',
    description: 'Tên nhà cung cấp',
  })
  name: string;

  @ApiProperty({ example: 2, description: 'Thời gian giao hàng (ngày)' })
  leadTimeDays: number;

  @ApiProperty({
    example: 20,
    description: 'Số lượng đặt hàng tối thiểu (MOQ)',
  })
  moq: number;

  @ApiProperty({ example: 32000.0, description: 'Đơn giá mua hiện hành' })
  unitPrice: number;

  @ApiProperty({
    example: 92.5,
    description: 'Điểm WSM tổng hợp',
    nullable: true,
  })
  wsmScore: number | null;
}

export class RecommendationItemDetailDto {
  @ApiProperty({ example: 1001, description: 'ID bản ghi đề xuất' })
  itemId: number;

  @ApiProperty({ example: 12, description: 'ID sản phẩm SKU' })
  skuId: number;

  @ApiProperty({ example: 'MILK-TH-1L', description: 'Mã SKU' })
  skuCode: string;

  @ApiProperty({
    example: 'Sữa tươi TH True Milk 1L',
    description: 'Tên sản phẩm',
  })
  skuName: string;

  @ApiProperty({ example: 'Hàng Tươi Sống', description: 'Tên ngành hàng' })
  categoryName: string;

  @ApiProperty({ example: 'A', description: 'Nhóm doanh thu ABC (A/B/C)' })
  abcClassification: string;

  @ApiProperty({ example: 'X', description: 'Nhóm biến động XYZ (X/Y/Z)' })
  xyzClassification: string;

  @ApiProperty({ example: 'AX', description: 'Nhãn phân loại ma trận ABC-XYZ' })
  abcXyzBadge: string;

  @ApiProperty({
    example: 15,
    description: 'Tồn kho hiện tại tại thời điểm snapshot',
  })
  currentInventory: number;

  @ApiProperty({
    example: 0,
    description: 'Hàng đang về tại thời điểm snapshot',
  })
  onOrderQuantity: number;

  @ApiProperty({ example: 35, description: 'Điểm đặt hàng lại (ROP)' })
  reorderPoint: number;

  @ApiProperty({ example: 12, description: 'Tồn kho an toàn (SS)' })
  safetyStock: number;

  @ApiProperty({
    example: 'Critical',
    description: 'Trạng thái rủi ro tồn kho (StockRiskStatus)',
  })
  stockRiskStatus: string;

  @ApiProperty({ example: 50, description: 'Số lượng hệ thống đề xuất (SOQ)' })
  suggestedQuantity: number;

  @ApiProperty({
    example: 50,
    description: 'Số lượng mua đã duyệt (mặc định = suggestedQuantity)',
  })
  approvedQuantity: number;

  @ApiProperty({
    type: SuggestedSupplierDetailDto,
    nullable: true,
    description: 'Nhà cung cấp được hệ thống đề xuất (WSM Rank 1)',
  })
  suggestedSupplier: SuggestedSupplierDetailDto | null;

  @ApiProperty({
    example: 3,
    nullable: true,
    description: 'ID nhà cung cấp được duyệt mua',
  })
  approvedSupplierId: number | null;

  @ApiProperty({
    type: [DailyForecastDto],
    description: 'Chuỗi dự báo nhu cầu 14 ngày tới',
  })
  dailyForecasts: DailyForecastDto[];

  @ApiProperty({
    type: [SupplierRankingDto],
    description: 'Bảng xếp hạng so sánh các nhà cung cấp theo thuật toán WSM',
  })
  supplierRankings: SupplierRankingDto[];

  @ApiProperty({
    example: false,
    description: 'Đánh dấu bản ghi đã bị can thiệp bởi con người hay chưa',
  })
  isOverridden: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Giải thích lý do mua hàng từ Google Gemini 1.5 Flash',
  })
  llmExplanation: string | null;
}

export class DssSessionDetailResponseDto {
  @ApiProperty({
    example: 105,
    description: 'ID định danh phiên phân tích DSS',
  })
  sessionId: number;

  @ApiProperty({
    example: 'REC-20261004-001',
    description: 'Mã phiên đề xuất duy nhất',
  })
  sessionCode: string;

  @ApiProperty({
    example: 'Draft',
    description: 'Trạng thái phiên (Draft, Approved, Discarded)',
  })
  status: string;

  @ApiProperty({
    example: 1,
    nullable: true,
    description: 'ID ngành hàng phân tích (null nếu toàn bộ)',
  })
  categoryId: number | null;

  @ApiProperty({
    example: 'All Categories',
    description: 'Phạm vi phân tích ngành hàng',
  })
  scope: string;

  @ApiProperty({
    example: 15000000.0,
    description: 'Tổng giá trị đơn hàng đề xuất ban đầu (VNĐ)',
  })
  totalSuggestedAmount: number;

  @ApiProperty({
    example: 15000000.0,
    description: 'Tổng giá trị đơn hàng sau khi duyệt/điều chỉnh (VNĐ)',
  })
  totalApprovedAmount: number;

  @ApiProperty({
    example: '2026-10-04T15:30:00.000Z',
    description: 'Thời điểm khởi tạo phiên',
  })
  createdAt: string;

  @ApiProperty({
    type: [RecommendationItemDetailDto],
    description: 'Danh sách các mặt hàng đề xuất trong phiên',
  })
  items: RecommendationItemDetailDto[];
}
