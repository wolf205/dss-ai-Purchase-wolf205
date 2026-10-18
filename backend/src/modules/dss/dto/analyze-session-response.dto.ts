import { ApiProperty } from '@nestjs/swagger';

export class AnalyzeSessionResponseDto {
  @ApiProperty({
    example: 105,
    description: 'ID định danh của phiên phân tích DSS',
  })
  sessionId: number;

  @ApiProperty({
    example: 'REC-20261004-001',
    description: 'Mã phiên đề xuất mua hàng duy nhất',
  })
  sessionCode: string;

  @ApiProperty({
    example: 120,
    description: 'Tổng số SKU hợp lệ được quét và phân tích',
  })
  totalSkusAnalyzed: number;

  @ApiProperty({
    example: 18,
    description: 'Số lượng SKU có nhu cầu đặt hàng (suggestedQuantity > 0)',
  })
  suggestedOrderCount: number;

  @ApiProperty({
    example: '2026-10-04T15:30:00.000Z',
    description: 'Thời điểm khởi tạo phiên',
  })
  createdAt: string;
}
