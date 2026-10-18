import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigurationService } from './configuration.service';
import { DssConfigurationResponseDto } from './dto/dss-configuration-response.dto';
import { UpdateDssConfigurationDto } from './dto/update-dss-configuration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-payload.interface';

@ApiTags('Configuration')
@Controller('dss-configurations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  @Get()
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary: 'Lấy cấu hình Singleton DSS hiện hành (Get DSS Configuration)',
    description:
      'Cho phép cả Store Manager và Purchasing Staff (Staff xem ở chế độ Read-only) lấy bộ tham số cấu hình DSS đang áp dụng toàn cửa hàng.',
  })
  @ApiResponse({
    status: 200,
    description: 'Truy vấn cấu hình DSS Singleton thành công',
    type: DssConfigurationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  async getConfiguration(): Promise<DssConfigurationResponseDto> {
    return await this.configurationService.getConfiguration();
  }

  @Put()
  @Roles(Role.STORE_MANAGER)
  @AuditLog({
    action: 'CONFIG_UPDATE_PARAMETERS',
    entityType: 'DSSConfiguration',
    entityId: '1',
    description: 'Cập nhật bộ tham số cấu hình DSS toàn hệ thống',
  })
  @ApiOperation({
    summary:
      'Cập nhật tham số cấu hình DSS Singleton (Update DSS Configuration)',
    description:
      'Chỉ người dùng có vai trò STORE_MANAGER mới có quyền cập nhật. Yêu cầu tổng 4 trọng số WSM = 1.0 (± 0.001), targetServiceLevel thuộc {0.90, 0.95, 0.98, 0.99}, reviewPeriodDays trong khoảng [1, 30].',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật cấu hình DSS thành công',
    type: DssConfigurationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dữ liệu vi phạm ràng buộc DTO hoặc tổng 4 trọng số khác 100% (SUM_WEIGHT_NOT_100)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description:
      'Không có quyền thực hiện, chỉ STORE_MANAGER được phép (FORBIDDEN_ROLE)',
  })
  async updateConfiguration(
    @Body() dto: UpdateDssConfigurationDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<DssConfigurationResponseDto> {
    return await this.configurationService.updateConfiguration(
      dto,
      user?.username,
    );
  }

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STORE_MANAGER)
  @AuditLog({
    action: 'CONFIG_RESET_DEFAULTS',
    entityType: 'DSSConfiguration',
    entityId: '1',
    description:
      'Khôi phục tham số cấu hình DSS về mặc định chuẩn mực của hệ thống',
  })
  @ApiOperation({
    summary: 'Khôi phục cấu hình DSS về mặc định chuẩn mực (Reset to Defaults)',
    description:
      'Chỉ người dùng có vai trò STORE_MANAGER mới có quyền khôi phục về cấu hình khuyến nghị ban đầu của hệ thống theo BR-28.',
  })
  @ApiResponse({
    status: 200,
    description: 'Khôi phục cấu hình mặc định thành công',
    type: DssConfigurationResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description:
      'Không có quyền thực hiện, chỉ STORE_MANAGER được phép (FORBIDDEN_ROLE)',
  })
  async resetToDefaults(
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<DssConfigurationResponseDto> {
    return await this.configurationService.resetToDefaults(user?.username);
  }
}
