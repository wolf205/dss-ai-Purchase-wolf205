import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SupplyConditionsService } from './supply-conditions.service';
import { UpdateSupplyConditionDto } from './dto/update-supply-condition.dto';
import { SupplyConditionResponseDto } from './dto/supply-condition-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('Suppliers')
@Controller('supply-conditions')
export class SupplyConditionsController {
  constructor(
    private readonly supplyConditionsService: SupplyConditionsService,
  ) {}

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_MANAGER)
  @ApiBearerAuth('access-token')
  @AuditLog({
    action: 'SUPPLIER_UPDATE_CONDITION',
    entityType: 'SupplyCondition',
    entityId: (req) => req.params?.id,
    description:
      'Cập nhật điều kiện cung ứng (Đơn giá nhập / MOQ / trạng thái cung ứng)',
  })
  @ApiOperation({
    summary: 'Cập nhật điều kiện cung ứng (Đơn giá nhập / MOQ / Trạng thái)',
    description:
      'Chỉ Store Manager mới có quyền cập nhật. Mức giá và MOQ mới chỉ áp dụng tiến về trước cho các phiên DSS tương lai theo BR-22 (snapshot đơn PO cũ không đổi). Khi ngừng cung ứng (status: Inactive), hệ thống chặn nếu SKU đang có hàng chờ giao trong đơn PO Approved (EF-5, BR-23).',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật điều kiện cung ứng thành công',
    type: SupplyConditionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dữ liệu đầu vào vi phạm ràng buộc DTO hoặc không cung cấp trường nào (VALIDATION_ERROR)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description:
      'Không có quyền thực hiện (Yêu cầu vai trò STORE_MANAGER) (FORBIDDEN_ROLE)',
  })
  @ApiResponse({
    status: 404,
    description:
      'Không tìm thấy điều kiện cung ứng tương ứng (RESOURCE_NOT_FOUND)',
  })
  @ApiResponse({
    status: 409,
    description:
      'Không thể ngừng cung ứng do SKU đang có hàng chờ giao trong đơn PO Approved (ON_ORDER_SKU_EXISTS)',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplyConditionDto) {
    return await this.supplyConditionsService.updateCondition(id, dto);
  }
}
