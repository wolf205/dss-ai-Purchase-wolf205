import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto';

export class ProductCategorySummaryDto {
  @ApiProperty({
    description: 'ID định danh ngành hàng (dạng string)',
    example: '1',
  })
  id!: string;

  @ApiProperty({
    description: 'Mã ngành hàng tự nhiên',
    example: 'BEV',
  })
  categoryCode!: string;

  @ApiProperty({
    description: 'Tên hiển thị ngành hàng',
    example: 'Đồ Uống',
  })
  categoryName!: string;
}

export class ProductResponseDto {
  @ApiProperty({
    description: 'ID sản phẩm (string để bảo toàn BigInt)',
    example: '12',
  })
  id!: string;

  @ApiProperty({
    description: 'Mã định danh SKU duy nhất toàn cục',
    example: 'MILK-TH-1L',
  })
  skuCode!: string;

  @ApiProperty({
    description: 'Tên thương mại của sản phẩm',
    example: 'Sữa tươi tiệt trùng TH True Milk 1L',
  })
  productName!: string;

  @ApiProperty({
    description: 'Mã vạch sản phẩm (nếu có)',
    example: '8936036010011',
    nullable: true,
  })
  barcode!: string | null;

  @ApiProperty({
    description: 'Đơn vị tính lưu kho và giao dịch',
    example: 'Hộp',
  })
  unit!: string;

  @ApiProperty({
    description: 'Trạng thái kinh doanh (Active / Inactive)',
    example: 'Active',
  })
  status!: string;

  @ApiProperty({
    description: 'Tồn kho thực tế hiện hữu trên kệ',
    example: 15,
  })
  currentInventory!: number;

  @ApiProperty({
    description: 'Tổng lượng hàng đang về từ các đơn PO Approved',
    example: 0,
  })
  onOrderQuantity!: number;

  @ApiProperty({
    description: 'ID ngành hàng trực thuộc',
    example: '1',
  })
  categoryId!: string;

  @ApiProperty({
    description: 'Thông tin tóm tắt ngành hàng liên kết',
    type: ProductCategorySummaryDto,
  })
  category!: ProductCategorySummaryDto;

  @ApiProperty({
    description: 'Thời điểm tạo bản ghi (UTC ISO-8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Thời điểm cập nhật cuối (UTC ISO-8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  updatedAt!: string;
}

export class ProductListResponseDto {
  @ApiProperty({
    description: 'Danh sách sản phẩm',
    type: [ProductResponseDto],
  })
  items!: ProductResponseDto[];

  @ApiProperty({
    description: 'Thông tin phân trang',
    type: PaginationMetaDto,
  })
  pagination!: PaginationMetaDto;
}

export class DeleteProductResponseDto {
  @ApiProperty({
    description: 'Thông báo kết quả xóa',
    example: 'Đã xóa vĩnh viễn sản phẩm MILK-TH-1L khỏi danh mục hệ thống.',
  })
  message!: string;

  @ApiProperty({
    description: 'Mã SKU của sản phẩm đã bị xóa',
    example: 'MILK-TH-1L',
  })
  deletedSkuCode!: string;
}
