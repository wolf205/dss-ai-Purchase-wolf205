import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogListResponseDto } from './dto/audit-log-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.STORE_MANAGER)
  @ApiOperation({
    summary: 'Tra cứu nhật ký kiểm toán hệ thống (Audit Trail)',
    description:
      'Chỉ người dùng có vai trò STORE_MANAGER mới có quyền truy cập. Hỗ trợ phân trang và tìm kiếm đa tiêu chí.',
  })
  @ApiResponse({
    status: 200,
    description: 'Truy vấn nhật ký kiểm toán thành công',
    type: AuditLogListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (Yêu cầu vai trò STORE_MANAGER)',
  })
  async getAuditLogs(@Query() query: QueryAuditLogDto) {
    const { items, pagination } = await this.auditService.findAll(query);

    return {
      data: items,
      meta: {
        pagination,
      },
    };
  }
}
