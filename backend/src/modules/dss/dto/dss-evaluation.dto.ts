import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DailyEvaluationItemDto {
  @ApiProperty({
    example: '2026-11-02',
    description: 'Ngày đánh giá (YYYY-MM-DD)',
  })
  date: string;

  @ApiProperty({ example: 12.5, description: 'Số lượng dự báo từ phiên DSS' })
  predicted: number;

  @ApiProperty({
    example: 14.0,
    description: 'Doanh số bán hàng thực tế đã ghi nhận',
  })
  actual: number;
}

export class SkuEvaluationDto {
  @ApiProperty({ example: '10', description: 'ID định danh sản phẩm' })
  productId: string;

  @ApiProperty({ example: 'MILK-VNM-1L', description: 'Mã SKU sản phẩm' })
  skuCode: string;

  @ApiProperty({
    example: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    description: 'Tên sản phẩm',
  })
  productName: string;

  @ApiProperty({
    example: 'Bơ Sữa & Sản phẩm từ sữa',
    description: 'Tên ngành hàng',
  })
  categoryName: string;

  @ApiProperty({ example: 'AX', description: 'Nhóm ma trận ABC-XYZ' })
  abcXyzGroup: string;

  @ApiProperty({
    example: 14.2,
    description: 'Sai số WAPE (%) của riêng SKU này',
  })
  wape: number;

  @ApiProperty({
    example: 16.5,
    description: 'Sai số MAPE (%) của riêng SKU này',
  })
  mape: number;

  @ApiProperty({ example: 1.8, description: 'Sai số MAE (đơn vị sản phẩm)' })
  mae: number;

  @ApiProperty({
    example: 2.1,
    description: 'Độ lệch thiên vị Forecast Bias (%)',
  })
  bias: number;

  @ApiProperty({
    example: 85,
    description: 'Tổng lượng dự báo trong cửa sổ đánh giá',
  })
  totalPredicted: number;

  @ApiProperty({
    example: 92,
    description: 'Tổng lượng bán thực tế trong cửa sổ đánh giá',
  })
  totalActual: number;

  @ApiProperty({
    example: 'EXCELLENT',
    enum: ['EXCELLENT', 'ACCEPTABLE', 'NEEDS_TUNING'],
    description:
      'Xếp loại chất lượng: EXCELLENT (<=20%), ACCEPTABLE (20-35%), NEEDS_TUNING (>35%)',
  })
  qualityRating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING';

  @ApiProperty({
    type: [DailyEvaluationItemDto],
    description: 'Chuỗi đối chiếu ngày theo ngày giữa dự báo và thực tế',
  })
  dailyTimeline: DailyEvaluationItemDto[];
}

export class OverallEvaluationSummaryDto {
  @ApiProperty({
    example: 18.4,
    description: 'Sai số WAPE tổng hợp toàn phiên (%)',
  })
  overallWape: number;

  @ApiProperty({
    example: 22.1,
    description: 'Sai số MAPE trung bình toàn phiên (%)',
  })
  overallMape: number;

  @ApiProperty({
    example: 3.2,
    description: 'Sai số MAE trung bình toàn phiên',
  })
  overallMae: number;

  @ApiProperty({
    example: 1.5,
    description: 'Độ lệch thiên vị tổng thể Forecast Bias (%)',
  })
  overallBias: number;

  @ApiProperty({
    example: 1250,
    description: 'Tổng số lượng dự báo toàn bộ SKU',
  })
  totalPredicted: number;

  @ApiProperty({
    example: 1280,
    description: 'Tổng số lượng bán thực tế toàn bộ SKU',
  })
  totalActual: number;

  @ApiProperty({
    example: 'EXCELLENT',
    enum: ['EXCELLENT', 'ACCEPTABLE', 'NEEDS_TUNING'],
    description: 'Đánh giá chất lượng toàn diện của phiên DSS',
  })
  qualityRating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING';

  @ApiProperty({
    example: 7,
    description: 'Số ngày trong kỳ đã có dữ liệu thực tế đối soát',
  })
  evaluatedDaysCount: number;

  @ApiProperty({ example: 7, description: 'Tổng số ngày trong chu kỳ dự báo' })
  totalDaysHorizon: number;

  @ApiProperty({
    type: [DailyEvaluationItemDto],
    description:
      'Tổng hợp doanh số dự báo vs thực tế theo từng ngày của toàn cửa hàng',
  })
  dailyAggregateTimeline: DailyEvaluationItemDto[];
}

export class EvaluationWindowDto {
  @ApiProperty({
    example: '2026-11-02',
    description: 'Ngày bắt đầu cửa sổ đánh giá',
  })
  startDate: string;

  @ApiProperty({
    example: '2026-11-08',
    description: 'Ngày kết thúc cửa sổ đánh giá',
  })
  endDate: string;

  @ApiProperty({ example: 7, description: 'Số ngày trong cửa sổ đánh giá' })
  totalDays: number;
}

export class DssSessionEvaluationResponseDto {
  @ApiProperty({ example: '1', description: 'ID định danh phiên DSS' })
  sessionId: string;

  @ApiProperty({
    example: 'REC-20261101-0001',
    description: 'Mã phiên đề xuất DSS',
  })
  sessionCode: string;

  @ApiProperty({ example: 'Approved', description: 'Trạng thái phiên đề xuất' })
  sessionStatus: string;

  @ApiPropertyOptional({
    example: '2026-11-01T15:30:00Z',
    description: 'Thời điểm phê duyệt phiên',
  })
  approvedAt: string | null;

  @ApiProperty({
    example: true,
    description: 'Cho biết hệ thống đã có dữ liệu thực tế để đối soát hay chưa',
  })
  hasActualData: boolean;

  @ApiPropertyOptional({
    example: 'Đã hoàn tất đối soát với dữ liệu bán hàng thực tế',
    description: 'Thông điệp trạng thái đối soát',
  })
  message?: string;

  @ApiProperty({
    type: EvaluationWindowDto,
    description: 'Khoảng thời gian chu kỳ đánh giá',
  })
  evaluationWindow: EvaluationWindowDto;

  @ApiPropertyOptional({
    type: OverallEvaluationSummaryDto,
    description: 'Chỉ số KPI tổng hợp (null nếu chưa có dữ liệu thực tế)',
  })
  summary: OverallEvaluationSummaryDto | null;

  @ApiProperty({
    type: [SkuEvaluationDto],
    description: 'Danh sách chi tiết đánh giá độ chính xác từng SKU',
  })
  skuEvaluations: SkuEvaluationDto[];
}

export class DssSessionSummaryItemDto {
  @ApiProperty({ example: '1', description: 'ID phiên đề xuất DSS' })
  id: string;

  @ApiProperty({
    example: 'REC-20261101-0001',
    description: 'Mã phiên đề xuất DSS',
  })
  sessionCode: string;

  @ApiProperty({ example: 'All Categories', description: 'Phạm vi phân tích' })
  scope: string;

  @ApiProperty({ example: 'Approved', description: 'Trạng thái phiên' })
  status: string;

  @ApiProperty({
    example: 45000000,
    description: 'Tổng giá trị đề xuất ban đầu (VNĐ)',
  })
  totalSuggestedAmount: number;

  @ApiProperty({
    example: 42000000,
    description: 'Tổng giá trị phê duyệt (VNĐ)',
  })
  totalApprovedAmount: number;

  @ApiProperty({ example: 'manager_an', description: 'Người tạo phiên' })
  createdBy: string;

  @ApiPropertyOptional({
    example: '2026-11-01T15:30:00Z',
    description: 'Thời điểm phê duyệt',
  })
  approvedAt: string | null;

  @ApiProperty({
    example: '2026-11-01T10:00:00Z',
    description: 'Thời điểm khởi tạo',
  })
  createdAt: string;
}
