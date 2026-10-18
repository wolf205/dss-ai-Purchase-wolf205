import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelPurchaseOrderDto {
  @ApiProperty({
    description:
      'Lý do hủy đơn hàng bắt buộc theo BR-10 (từ danh mục chuẩn hoặc văn bản giải thích)',
    example: 'Nhà cung cấp báo hết hàng đột xuất tại kho tổng',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'cancellationReason không được để trống.' })
  @IsString({ message: 'cancellationReason phải là chuỗi văn bản.' })
  @MaxLength(255, {
    message: 'cancellationReason không được vượt quá 255 ký tự.',
  })
  cancellationReason: string;
}
