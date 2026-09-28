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
import { QuerySupplierDto } from './dto/query-supplier.dto';
import {
  SupplierListResponseDto,
  SupplierResponseDto,
} from './dto/supplier-response.dto';
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
}
