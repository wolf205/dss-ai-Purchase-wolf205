import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Kiểm tra trạng thái sẵn sàng của dịch vụ Backend Web API',
    description:
      'Trả về trạng thái sức khỏe, uptime, thời gian hệ thống và môi trường thực thi theo chuẩn Standard API Envelope.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dịch vụ Backend hoạt động bình thường.',
    type: HealthResponseDto,
  })
  check(): HealthResponseDto {
    return this.healthService.check();
  }
}
