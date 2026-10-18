import { ApiProperty } from '@nestjs/swagger';

export class ExplainRecommendationItemResponseDto {
  @ApiProperty({ example: 1001, description: 'ID dòng đề xuất mua hàng' })
  itemId: number;

  @ApiProperty({
    example:
      'Mặt hàng Sữa tươi TH True Milk 1L (MILK-TH-1L) thuộc nhóm A-X. Tồn khả dụng (15 Hộp) hiện đã rơi xuống dưới mức đặt hàng lại ROP (35 Hộp), tiềm ẩn rủi ro đứt hàng. Đề xuất đặt 50 Hộp từ Công ty Cổ phần Sữa TH do đối tác đạt điểm WSM cao nhất (92.5) với giá nhập tốt nhất và lịch sử giao hàng ổn định.',
    description: 'Đoạn giải thích lý do mua hàng tự nhiên On-demand',
  })
  llmExplanation: string;
}
