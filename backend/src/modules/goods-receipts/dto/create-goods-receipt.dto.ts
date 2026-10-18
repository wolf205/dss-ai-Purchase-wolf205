import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateReceiptLineItemDto {
  @ApiProperty({
    description: 'ID của dòng hàng trên Đơn mua hàng (po_line_items.id)',
    example: 501,
  })
  @IsNotEmpty({ message: 'poLineItemId không được để trống.' })
  @Type(() => Number)
  @IsInt({ message: 'poLineItemId phải là số nguyên dương.' })
  @Min(1, { message: 'poLineItemId tối thiểu là 1.' })
  poLineItemId!: number;

  @ApiProperty({
    description: 'ID của sản phẩm/SKU (products.id)',
    example: 12,
  })
  @IsNotEmpty({ message: 'skuId không được để trống.' })
  @Type(() => Number)
  @IsInt({ message: 'skuId phải là số nguyên dương.' })
  @Min(1, { message: 'skuId tối thiểu là 1.' })
  skuId!: number;

  @ApiProperty({
    description: 'Số lượng thực nhận vào kho (>= 0, cho phép giao dư hoặc 0)',
    example: 50,
  })
  @IsNotEmpty({ message: 'receivedQuantity không được để trống.' })
  @Type(() => Number)
  @IsInt({ message: 'receivedQuantity phải là số nguyên không âm.' })
  @Min(0, { message: 'receivedQuantity phải >= 0.' })
  receivedQuantity!: number;
}

export class CreateGoodsReceiptDto {
  @ApiProperty({
    description: 'ID của Đơn mua hàng cần nhận (purchase_orders.id)',
    example: 201,
  })
  @IsNotEmpty({ message: 'purchaseOrderId không được để trống.' })
  @Type(() => Number)
  @IsInt({ message: 'purchaseOrderId phải là số nguyên dương.' })
  @Min(1, { message: 'purchaseOrderId tối thiểu là 1.' })
  purchaseOrderId!: number;

  @ApiProperty({
    description: 'Ngày nhận hàng thực tế (YYYY-MM-DD)',
    example: '2026-09-17',
  })
  @IsNotEmpty({ message: 'receiptDate không được để trống.' })
  @IsDateString(
    {},
    { message: 'receiptDate phải là chuỗi ngày hợp lệ ISO (YYYY-MM-DD).' },
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'receiptDate phải có định dạng YYYY-MM-DD.',
  })
  receiptDate!: string;

  @ApiPropertyOptional({
    description:
      'Ghi chú tiếp nhận (bắt buộc nhập nếu có sai lệch số lượng/chất lượng)',
    example: 'Giao hàng đúng hẹn, bao bì nguyên vẹn',
  })
  @IsOptional()
  @IsString({ message: 'note phải là chuỗi văn bản.' })
  @MaxLength(1000, { message: 'note tối đa 1000 ký tự.' })
  note?: string;

  @ApiProperty({
    description: 'Danh sách chi tiết số lượng thực nhận cho từng mặt hàng',
    type: [CreateReceiptLineItemDto],
  })
  @IsArray({ message: 'lines phải là một mảng.' })
  @ArrayNotEmpty({
    message: 'Danh sách mặt hàng thực nhận không được để trống.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateReceiptLineItemDto)
  lines!: CreateReceiptLineItemDto[];
}
