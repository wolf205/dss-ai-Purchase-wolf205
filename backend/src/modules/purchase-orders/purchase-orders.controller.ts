import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { PurchaseOrdersService } from './purchase-orders.service';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { CancelPurchaseOrderDto } from './dto/cancel-purchase-order.dto';
import { ExportPurchaseOrderQueryDto } from './dto/export-purchase-order-query.dto';
import {
  PurchaseOrderDetailResponseDto,
  PurchaseOrderSummaryResponseDto,
} from './dto/purchase-order-response.dto';
import { StandardApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Purchase Orders (UC-02)')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/purchase-orders')
export class PurchaseOrdersController {
  constructor(
    private readonly purchaseOrdersService: PurchaseOrdersService,
  ) {}

  @Get()
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary: 'Tra cứu danh sách Đơn mua hàng (UC-02)',
    description:
      'Hỗ trợ phân trang, tìm kiếm theo mã PO/tên NCC, lọc theo trạng thái và tình trạng quá hạn giao runtime (BR-09).',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách đơn mua hàng kèm thông tin phân trang.',
    type: StandardApiResponse,
  })
  async findAll(@Query() query: QueryPurchaseOrderDto) {
    const result = await this.purchaseOrdersService.findAll(query);
    return {
      success: true,
      data: result.items,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: result.pagination,
      },
    };
  }

  @Get(':id')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary: 'Xem chi tiết Đơn mua hàng (UC-02)',
    description:
      'Trả về thông tin chi tiết PO kèm đối tác NCC và các dòng line items bảo lưu giá cam kết snapshot (BR-22).',
  })
  @ApiParam({ name: 'id', description: 'ID của đơn mua hàng', example: '201' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin chi tiết đơn mua hàng.',
    type: PurchaseOrderDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'RESOURCE_NOT_FOUND: Đơn mua hàng không tồn tại.',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.purchaseOrdersService.findOne(id);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary: 'Hủy Đơn mua hàng & Hoàn trả on_order_quantity (UC-02 Luồng rẽ nhánh AF-1)',
    description:
      'Chỉ cho phép hủy khi PO ở trạng thái Approved (BR-06). Tự động giảm trừ on_order_quantity cho từng SKU trong ACID transaction (BR-07).',
  })
  @ApiParam({ name: 'id', description: 'ID của đơn mua hàng', example: '201' })
  @ApiResponse({
    status: 200,
    description: 'Hủy đơn hàng thành công, trả về chi tiết đơn đã cập nhật Cancelled.',
    type: PurchaseOrderDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'RESOURCE_NOT_FOUND: Đơn mua hàng không tồn tại.',
  })
  @ApiResponse({
    status: 409,
    description:
      'PO_ALREADY_CLOSED: Đơn mua hàng đã ở trạng thái Completed hoặc Cancelled, không thể hủy bỏ.',
  })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelPurchaseOrderDto,
  ) {
    const data = await this.purchaseOrdersService.cancel(id, dto);
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(':id/export')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary: 'Phát hành / Xuất chứng từ Đơn mua hàng (UC-02 Bước 6, 7)',
    description:
      'Tải về chứng từ PO dưới định dạng PDF (HTML print) hoặc Excel (CSV UTF-8 BOM) và cập nhật last_exported_at.',
  })
  @ApiParam({ name: 'id', description: 'ID của đơn mua hàng', example: '201' })
  @ApiResponse({
    status: 200,
    description: 'Tải về file chứng từ đơn mua hàng.',
  })
  @ApiResponse({
    status: 404,
    description: 'RESOURCE_NOT_FOUND: Đơn mua hàng không tồn tại.',
  })
  async export(
    @Param('id') id: string,
    @Query() query: ExportPurchaseOrderQueryDto,
    @Res() res: Response,
  ) {
    const exportData = await this.purchaseOrdersService.export(
      id,
      query.format || 'pdf',
    );

    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${exportData.fileName}"`,
    );
    res.setHeader('Content-Length', exportData.buffer.length);

    return res.end(exportData.buffer);
  }
}
