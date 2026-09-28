import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/api-response.dto';

export class SupplierResponseDto {
  @ApiProperty({
    description: 'ID nhà cung cấp (string để bảo toàn BigInt)',
    example: '1',
  })
  id!: string;

  @ApiProperty({
    description: 'Mã định danh NCC duy nhất toàn cục (bất biến)',
    example: 'VINAMILK',
  })
  supplierCode!: string;

  @ApiProperty({
    description: 'Tên thương mại / doanh nghiệp nhà cung cấp',
    example: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
  })
  supplierName!: string;

  @ApiProperty({
    description: 'Người đại diện liên hệ',
    example: 'Nguyễn Văn A',
    nullable: true,
  })
  contactPerson!: string | null;

  @ApiProperty({
    description: 'Số điện thoại liên lạc chính thức',
    example: '0901234567',
    nullable: true,
  })
  phoneNumber!: string | null;

  @ApiProperty({
    description: 'Email giao dịch chính thức',
    example: 'sales@vinamilk.com.vn',
    nullable: true,
  })
  email!: string | null;

  @ApiProperty({
    description: 'Địa chỉ kho xuất hàng hoặc văn phòng đại diện',
    example: '10 Tân Trào, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    nullable: true,
  })
  address!: string | null;

  @ApiProperty({
    description: 'Thời gian giao hàng cam kết tiêu chuẩn (Lead Time theo ngày)',
    example: 3,
  })
  committedLeadTimeDays!: number;

  @ApiProperty({
    description: 'Trạng thái hợp tác (Active / Inactive)',
    example: 'Active',
  })
  status!: string;

  @ApiProperty({
    description: 'Điểm phong độ giao hàng 5 đơn gần nhất (thang 0.0 - 1.0)',
    example: 0.8,
  })
  performanceScore!: number;

  @ApiProperty({
    description:
      'Điểm hiệu suất giao hàng tích lũy toàn thời gian (thang 0.0 - 1.0)',
    example: 0.8,
  })
  allTimePerformanceScore!: number;

  @ApiProperty({
    description: 'Tổng số đơn mua hàng (PO) đã hoàn tất nhận hàng',
    example: 0,
  })
  completedOrderCount!: number;

  @ApiProperty({
    description: 'Số lượng SKU đang Active trong danh mục cung ứng của NCC',
    example: 12,
  })
  activeSkuCount!: number;

  @ApiProperty({
    description:
      'Tỷ lệ giao đúng hạn trong tối đa 5 đơn Completed gần nhất (0.0 - 1.0, null nếu chưa có đơn)',
    example: 1.0,
    nullable: true,
  })
  recent5OrderOnTimeRate!: number | null;

  @ApiProperty({
    description:
      'Tỷ lệ giao đủ hàng trung bình trong tối đa 5 đơn Completed gần nhất (0.0 - 1.0, null nếu chưa có đơn)',
    example: 0.985,
    nullable: true,
  })
  recent5OrderFulfillmentRate!: number | null;

  @ApiProperty({
    description:
      'Nhãn phân loại phong độ đối tác theo BR-24 ([NCC Mới - Điểm khởi tạo: 80%], [Lịch sử: N đơn], [Phong độ 5 đơn gần nhất])',
    example: '[NCC Mới - Điểm khởi tạo: 80%]',
  })
  performanceLabel!: string;

  @ApiProperty({
    description: 'Thời điểm tạo hồ sơ NCC (UTC ISO-8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: 'Thời điểm cập nhật cuối (UTC ISO-8601)',
    example: '2026-09-15T08:00:00.000Z',
  })
  updatedAt!: string;
}

export class SupplierListResponseDto {
  @ApiProperty({
    description: 'Danh sách các nhà cung cấp thỏa mãn điều kiện',
    type: [SupplierResponseDto],
  })
  data!: SupplierResponseDto[];

  @ApiProperty({
    description: 'Metadata phân trang',
    type: PaginationMetaDto,
  })
  meta!: {
    pagination: PaginationMetaDto;
  };
}
