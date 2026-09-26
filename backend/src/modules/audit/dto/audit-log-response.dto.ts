import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponseMetaDto } from '../../../common/dto/api-response.dto';

export class AuditLogItemDto {
  @ApiProperty({
    description: 'Mã định danh bản ghi kiểm toán',
    example: '801',
  })
  id!: string;

  @ApiPropertyOptional({
    description: 'Mã định danh người dùng thực hiện (null nếu user đã bị xóa)',
    example: '1',
  })
  userId?: string | null;

  @ApiProperty({
    description: 'Snapshot tên đăng nhập tại thời điểm thực hiện thao tác',
    example: 'manager_an',
  })
  username!: string;

  @ApiProperty({
    description: 'Mã hành vi nghiệp vụ',
    example: 'DSS_APPROVE_RECOMMENDATION',
  })
  action!: string;

  @ApiPropertyOptional({
    description: 'Loại thực thể bị tác động',
    example: 'RecommendationSession',
  })
  entityType?: string | null;

  @ApiPropertyOptional({
    description: 'Mã định danh thực thể bị tác động',
    example: '105',
  })
  entityId?: string | null;

  @ApiPropertyOptional({
    description: 'Mô tả tóm tắt hành động',
    example: 'Phê duyệt phiên đề xuất mua hàng số 105',
  })
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Dữ liệu chi tiết bổ sung (JSON)',
    example: { poGeneratedCount: 2, totalAmount: 28400000.0 },
  })
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Địa chỉ IP của client thực hiện yêu cầu',
    example: '192.168.1.15',
  })
  ipAddress?: string | null;

  @ApiProperty({
    description: 'Thời điểm ghi nhận sự kiện (ISO-8601 UTC)',
    example: '2026-09-15T09:15:30.000Z',
  })
  createdAt!: string;
}

export class AuditLogListResponseDto {
  @ApiProperty({ description: 'Cờ trạng thái thành công', example: true })
  success!: boolean;

  @ApiProperty({
    description: 'Danh sách các bản ghi nhật ký kiểm toán',
    type: [AuditLogItemDto],
  })
  data!: AuditLogItemDto[];

  @ApiProperty({
    description: 'Thông tin phân trang và thời điểm phản hồi',
    type: ResponseMetaDto,
  })
  meta!: ResponseMetaDto;
}
