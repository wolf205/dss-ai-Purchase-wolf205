import { ApiProperty } from '@nestjs/swagger';

export class SalesPreviewRowDto {
  @ApiProperty({
    description: 'Ngày bán hàng (YYYY-MM-DD)',
    example: '2026-09-14',
  })
  date!: string;

  @ApiProperty({
    description: 'Mã định danh SKU sản phẩm',
    example: 'MILK-TH-1L',
  })
  skuCode!: string;

  @ApiProperty({
    description: 'Số lượng sản phẩm bán ra',
    example: 18,
  })
  quantity!: number;

  @ApiProperty({
    description: 'Doanh thu thuần thu được (VNĐ)',
    example: 576000,
  })
  revenue!: number;
}

export class SalesValidateResponseDto {
  @ApiProperty({
    description: 'Trạng thái tính hợp lệ 100% của tệp',
    example: true,
  })
  isValid!: boolean;

  @ApiProperty({
    description: 'Tổng số dòng dữ liệu bán hàng hợp lệ trong tệp',
    example: 250,
  })
  totalRows!: number;

  @ApiProperty({
    description:
      'Danh sách các ngày trong tệp đã tồn tại dữ liệu trong CSDL (cần cảnh báo ghi đè)',
    example: ['2026-09-14'],
    type: [String],
  })
  duplicateDatesFound!: string[];

  @ApiProperty({
    description:
      'Danh sách các dòng dữ liệu đầu tiên để người dùng xem trước trực quan (tối đa 10 dòng)',
    type: [SalesPreviewRowDto],
  })
  previewRows!: SalesPreviewRowDto[];
}
