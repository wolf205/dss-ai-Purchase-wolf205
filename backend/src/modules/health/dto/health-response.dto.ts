import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ description: 'Trạng thái hoạt động của dịch vụ', example: 'ok' })
  status!: string;

  @ApiProperty({ description: 'Tên định danh dịch vụ Backend', example: 'dss-backend' })
  service!: string;

  @ApiProperty({ description: 'Phiên bản hệ thống hiện tại', example: '1.0.0' })
  version!: string;

  @ApiProperty({ description: 'Thời gian đã hoạt động tính bằng giây (uptime)', example: 12.34 })
  uptimeSeconds!: number;

  @ApiProperty({ description: 'Thời gian phản hồi hiện tại của máy chủ', example: '2026-09-17T15:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ description: 'Môi trường thực thi', example: 'development' })
  environment!: string;
}
