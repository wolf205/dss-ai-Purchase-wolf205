import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-payload.interface';
import { AuditLog } from '../../common/decorators/audit-log.decorator';
import { GoodsReceiptsService } from './goods-receipts.service';
import { QueryPendingPosDto } from './dto/query-pending-pos.dto';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import { GoodsReceiptResponseDto } from './dto/goods-receipt-response.dto';
import { StandardApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Goods Receipts (UC-03)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/goods-receipts')
export class GoodsReceiptsController {
  constructor(private readonly goodsReceiptsService: GoodsReceiptsService) {}

  @Get('pending-pos')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary: 'Danh sách Đơn mua hàng Approved chưa nhận hàng (6B.1, UC-03)',
    description:
      'Lấy danh sách các đơn PO ở trạng thái Approved chưa có phiếu nhận hàng. Trả kèm các dòng line items để tự động điền trước số lượng thực nhận (BR-11).',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách đơn mua hàng chờ nhận hàng thành công.',
    type: StandardApiResponse,
  })
  async getPendingPurchaseOrders(@Query() query: QueryPendingPosDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));

    const result =
      await this.goodsReceiptsService.getPendingPurchaseOrders(query);

    return {
      success: true,
      data: result.items,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          totalItems: result.totalItems,
          totalPages: result.totalPages,
        },
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @AuditLog({
    action: 'GOODS_RECEIPT_CONFIRM',
    entityType: 'GoodsReceipt',
    description:
      'Ghi nhận phiếu nhận hàng kho, cập nhật tồn kho, đóng PO và tính OTIF',
  })
  @ApiOperation({
    summary: 'Xác nhận Phiếu nhận hàng kho (6B.2, UC-03)',
    description:
      'Thực thi trong ACID Transaction: (1) Tăng current_inventory; (2) Tất toán on_order_quantity; (3) Đóng đơn PO Completed; (4) Tính OTIF Score và làm mới phong độ 5 đơn gần nhất của NCC (BR-11, BR-12, BR-13, BR-24).',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo phiếu nhận hàng thành công.',
    type: GoodsReceiptResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'VALIDATION_ERROR / ZERO_FULFILLMENT_RECEIPT / INVALID_FUTURE_DATE.',
  })
  @ApiResponse({
    status: 404,
    description: 'RESOURCE_NOT_FOUND: Đơn mua hàng không tồn tại.',
  })
  @ApiResponse({
    status: 409,
    description:
      'PO_ALREADY_CLOSED: Đơn mua hàng không ở trạng thái Approved hoặc đã được nhận trước đó.',
  })
  async confirmGoodsReceipt(
    @Body() dto: CreateGoodsReceiptDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const receivedBy = user?.username || 'PURCHASING_STAFF';
    const data = await this.goodsReceiptsService.confirmGoodsReceipt(
      dto,
      receivedBy,
    );

    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(':id')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary: 'Xem chi tiết Phiếu nhận hàng kho (UC-03)',
    description:
      'Trả về thông tin chi tiết phiếu nhận hàng kèm các dòng mặt hàng thực nhận và cập nhật điểm phong độ NCC.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phiếu nhận hàng',
    example: '301',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết phiếu nhận hàng.',
    type: GoodsReceiptResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'RESOURCE_NOT_FOUND: Phiếu nhận hàng không tồn tại.',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.goodsReceiptsService.findOne(id);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
