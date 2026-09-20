import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Trang hiện tại (1-based)', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Số lượng bản ghi trên một trang', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Tổng số lượng bản ghi', example: 150 })
  totalItems!: number;

  @ApiProperty({ description: 'Tổng số trang', example: 8 })
  totalPages!: number;
}

export class ResponseMetaDto {
  @ApiProperty({
    description: 'Thời điểm phản hồi theo chuẩn ISO-8601',
    example: '2026-09-17T15:00:00.000Z',
  })
  timestamp!: string;

  @ApiPropertyOptional({
    description: 'Thông tin phân trang (nếu có)',
    type: PaginationMetaDto,
  })
  pagination?: PaginationMetaDto;

  [key: string]: unknown;
}

export class StandardApiResponse<T> {
  @ApiProperty({ description: 'Cờ trạng thái thành công', example: true })
  success!: boolean;

  @ApiProperty({ description: 'Dữ liệu kết quả nghiệp vụ' })
  data!: T;

  @ApiProperty({
    description: 'Metadata kèm theo phản hồi',
    type: ResponseMetaDto,
  })
  meta!: ResponseMetaDto;
}

export class ApiErrorDetailDto {
  @ApiPropertyOptional({
    description: 'Trường dữ liệu vi phạm',
    example: 'committedLeadTimeDays',
  })
  field?: string;

  @ApiProperty({
    description: 'Nội dung chi tiết lỗi',
    example: 'committedLeadTimeDays phải là số nguyên dương >= 1.',
  })
  issue!: string;
}

export class StandardErrorBodyDto {
  @ApiProperty({
    description: 'Mã lỗi nghiệp vụ chuẩn hóa (Error Code Taxonomy)',
    example: 'VALIDATION_ERROR',
  })
  code!: string;

  @ApiProperty({
    description: 'Thông báo lỗi người dùng',
    example: 'Dữ liệu yêu cầu không hợp lệ.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Chi tiết danh sách các vi phạm',
    type: [ApiErrorDetailDto],
  })
  details?: ApiErrorDetailDto[] | string[];

  @ApiProperty({
    description: 'Thời điểm xảy ra lỗi theo chuẩn ISO-8601',
    example: '2026-09-17T15:00:00.000Z',
  })
  timestamp!: string;

  @ApiPropertyOptional({
    description: 'Đường dẫn API phát sinh lỗi',
    example: '/api/v1/suppliers',
  })
  path?: string;
}

export class StandardApiErrorResponse {
  @ApiProperty({ description: 'Cờ trạng thái thất bại', example: false })
  success!: false;

  @ApiProperty({
    description: 'Thông tin chi tiết lỗi chuẩn hóa',
    type: StandardErrorBodyDto,
  })
  error!: StandardErrorBodyDto;
}
