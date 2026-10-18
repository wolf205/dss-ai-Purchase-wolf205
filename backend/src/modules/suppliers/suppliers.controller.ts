import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UpdateSupplierStatusDto } from './dto/update-supplier-status.dto';
import { CreateSupplyConditionDto } from './dto/create-supply-condition.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import {
  SupplierListResponseDto,
  SupplierResponseDto,
} from './dto/supplier-response.dto';
import { SupplyConditionResponseDto } from './dto/supply-condition-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('Suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({
    summary: 'Tra cứu danh sách nhà cung cấp (Supplier list)',
    description:
      'Endpoint công khai (public) cho phép tra cứu danh sách nhà cung cấp với hỗ trợ phân trang, lọc theo trạng thái và tìm kiếm theo mã / tên / SĐT. Trả về kèm số SKU cung ứng và OTIF 5 đơn Completed gần nhất.',
  })
  @ApiResponse({
    status: 200,
    description: 'Truy vấn danh sách nhà cung cấp thành công',
    type: SupplierListResponseDto,
  })
  async findAll(@Query() query: QuerySupplierDto) {
    const { items, pagination } = await this.suppliersService.findAll(query);

    return {
      data: items,
      meta: {
        pagination,
      },
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_MANAGER)
  @ApiBearerAuth('access-token')
  @AuditLog({
    action: 'SUPPLIER_CREATE',
    entityType: 'Supplier',
    entityId: (_req, resData) =>
      (resData as Record<string, unknown> & { id?: string })?.id?.toString(),
    description: 'Tạo mới hồ sơ nhà cung cấp trong hệ thống Master Data',
  })
  @ApiOperation({
    summary: 'Tạo mới nhà cung cấp (Create Supplier)',
    description:
      'Chỉ người dùng có vai trò STORE_MANAGER mới có quyền tạo mới nhà cung cấp. Mã NCC là duy nhất toàn cục và bất biến. Điểm tín nhiệm ban đầu được khởi tạo bằng 80% (Cold Start).',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo mới nhà cung cấp thành công',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào vi phạm ràng buộc DTO (VALIDATION_ERROR)',
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
    status: 409,
    description: 'Mã nhà cung cấp đã tồn tại trong hệ thống (DUPLICATE_CODE)',
  })
  async create(@Body() dto: CreateSupplierDto) {
    return await this.suppliersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết nhà cung cấp (Get Supplier Details)',
    description:
      'Endpoint công khai (public) cho phép tra cứu thông tin chi tiết một nhà cung cấp theo ID, kèm điểm OTIF 5 đơn Completed gần nhất và nhãn phong độ BR-24.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin chi tiết nhà cung cấp thành công',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy nhà cung cấp tương ứng (RESOURCE_NOT_FOUND)',
  })
  async findById(@Param('id') id: string) {
    return await this.suppliersService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_MANAGER)
  @ApiBearerAuth('access-token')
  @AuditLog({
    action: 'SUPPLIER_UPDATE',
    entityType: 'Supplier',
    entityId: (req) => req.params?.id,
    description: 'Cập nhật thông tin hồ sơ nhà cung cấp (cấm sửa supplierCode)',
  })
  @ApiOperation({
    summary: 'Cập nhật hồ sơ nhà cung cấp (Update Supplier)',
    description:
      'Chỉ người dùng có vai trò STORE_MANAGER mới có quyền cập nhật. Cho phép sửa tên, người liên hệ, số điện thoại, thời gian giao cam kết, email, địa chỉ. Tuyệt đối cấm sửa mã nhà cung cấp (BR-21).',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật nhà cung cấp thành công',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dữ liệu đầu vào vi phạm ràng buộc DTO hoặc cố ý sửa supplierCode (VALIDATION_ERROR)',
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
    description: 'Không tìm thấy nhà cung cấp tương ứng (RESOURCE_NOT_FOUND)',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return await this.suppliersService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_MANAGER)
  @ApiBearerAuth('access-token')
  @AuditLog({
    action: 'SUPPLIER_UPDATE_STATUS',
    entityType: 'Supplier',
    entityId: (req) => req.params?.id,
    description:
      'Chuyển đổi trạng thái hoạt động của nhà cung cấp (Active/Inactive)',
  })
  @ApiOperation({
    summary: 'Chuyển đổi trạng thái nhà cung cấp (Active / Inactive)',
    description:
      'Chỉ Store Manager mới có quyền đổi trạng thái. Chặn chuyển sang Inactive nếu nhà cung cấp còn đơn mua hàng (PO) ở trạng thái Approved đang chờ giao hàng (EF-4, BR-24).',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái nhà cung cấp thành công',
    type: SupplierResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu đầu vào vi phạm ràng buộc DTO (VALIDATION_ERROR)',
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
    description: 'Không tìm thấy nhà cung cấp tương ứng (RESOURCE_NOT_FOUND)',
  })
  @ApiResponse({
    status: 409,
    description:
      'Không thể chuyển sang Inactive do còn đơn PO Approved đang chờ giao hàng (ACTIVE_PO_EXISTS)',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSupplierStatusDto,
  ) {
    return await this.suppliersService.updateStatus(id, dto);
  }

  @Get(':id/conditions')
  @ApiOperation({
    summary: 'Danh sách điều kiện cung ứng của nhà cung cấp',
    description:
      'Endpoint công khai (public) cho phép tra cứu danh sách các mặt hàng SKU kèm Đơn giá nhập và MOQ do nhà cung cấp này phân phối.',
  })
  @ApiResponse({
    status: 200,
    description: 'Truy vấn danh sách điều kiện cung ứng thành công',
    type: [SupplyConditionResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy nhà cung cấp tương ứng (RESOURCE_NOT_FOUND)',
  })
  async findConditions(@Param('id') id: string) {
    return await this.suppliersService.findConditionsBySupplierId(id);
  }

  @Post(':id/conditions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_MANAGER)
  @ApiBearerAuth('access-token')
  @AuditLog({
    action: 'SUPPLIER_ASSIGN_SKU',
    entityType: 'SupplyCondition',
    entityId: (_req, resData) =>
      (resData as Record<string, unknown> & { id?: string })?.id?.toString(),
    description: 'Gán SKU cho nhà cung cấp với đơn giá nhập và MOQ',
  })
  @ApiOperation({
    summary: 'Gán mặt hàng (SKU) cho nhà cung cấp kèm giá nhập và MOQ',
    description:
      'Chỉ Store Manager mới có quyền gán SKU. Yêu cầu SKU phải tồn tại và đang ở trạng thái Active (UC-05). Cấm gán trùng mặt hàng đã có trong danh mục của NCC này (EF-2).',
  })
  @ApiResponse({
    status: 201,
    description: 'Gán SKU cho nhà cung cấp thành công',
    type: SupplyConditionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dữ liệu đầu vào vi phạm ràng buộc DTO hoặc SKU đang ở trạng thái Inactive (VALIDATION_ERROR)',
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
      'Không tìm thấy nhà cung cấp hoặc sản phẩm tương ứng (RESOURCE_NOT_FOUND)',
  })
  @ApiResponse({
    status: 409,
    description:
      'Mặt hàng này đã có trong danh mục cung ứng của nhà cung cấp (DUPLICATE_SKU_ASSIGNMENT)',
  })
  async createCondition(
    @Param('id') id: string,
    @Body() dto: CreateSupplyConditionDto,
  ) {
    return await this.suppliersService.createCondition(id, dto);
  }
}
