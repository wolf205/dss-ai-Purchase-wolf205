import {
  Body,
  Controller,
  Delete,
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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { QueryProductDto } from './dto/query-product.dto';
import {
  DeleteProductResponseDto,
  ProductListResponseDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuditLog } from '../../common/decorators/audit-log.decorator';

@ApiTags('Catalog')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'Tra cứu danh sách sản phẩm (SKU list)',
    description:
      'Endpoint công khai (public) cho phép tra cứu danh sách sản phẩm với hỗ trợ phân trang, lọc theo ngành hàng, trạng thái và tìm kiếm theo mã SKU / tên sản phẩm.',
  })
  @ApiResponse({
    status: 200,
    description: 'Truy vấn danh sách sản phẩm thành công',
    type: ProductListResponseDto,
  })
  async findAll(@Query() query: QueryProductDto) {
    const { items, pagination } = await this.productsService.findAll(query);

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
    action: 'CATALOG_CREATE_PRODUCT',
    entityType: 'Product',
    entityId: (_req, resData) =>
      (resData as Record<string, unknown> & { id?: string })?.id?.toString(),
    description: 'Tạo mới sản phẩm SKU trong danh mục hàng hóa',
  })
  @ApiOperation({
    summary: 'Tạo mới sản phẩm SKU (Create Product)',
    description:
      'Chỉ người dùng có vai trò STORE_MANAGER mới có quyền tạo mới SKU. Mã SKU là duy nhất và bất biến. Tồn kho và hàng đang về khởi tạo bằng 0.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo mới sản phẩm thành công',
    type: ProductResponseDto,
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
    description: 'Không tìm thấy ngành hàng tương ứng (RESOURCE_NOT_FOUND)',
  })
  @ApiResponse({
    status: 409,
    description:
      'Mã SKU hoặc mã vạch đã tồn tại trong hệ thống (DUPLICATE_CODE)',
  })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Xem chi tiết sản phẩm SKU (Get Product Details)',
    description:
      'Endpoint công khai (public) trả về toàn bộ thông tin chi tiết của một sản phẩm SKU và ngành hàng liên kết.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin chi tiết sản phẩm thành công',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy sản phẩm tương ứng (RESOURCE_NOT_FOUND)',
  })
  async findById(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_MANAGER)
  @ApiBearerAuth('access-token')
  @AuditLog({
    action: 'CATALOG_UPDATE_PRODUCT',
    entityType: 'Product',
    entityId: (req) => req.params?.id,
    description: 'Cập nhật thông tin hồ sơ sản phẩm SKU (cấm sửa skuCode)',
  })
  @ApiOperation({
    summary: 'Cập nhật thông tin sản phẩm SKU (Update Product)',
    description:
      'Chỉ người dùng có vai trò STORE_MANAGER mới có quyền cập nhật. Cho phép sửa tên, ngành hàng, đơn vị tính, mã vạch. Tuyệt đối cấm sửa mã SKU (BR-17).',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật sản phẩm thành công',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Dữ liệu đầu vào vi phạm ràng buộc DTO hoặc cố ý sửa skuCode (VALIDATION_ERROR)',
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
      'Không tìm thấy sản phẩm hoặc ngành hàng tương ứng (RESOURCE_NOT_FOUND)',
  })
  @ApiResponse({
    status: 409,
    description:
      'Mã vạch đã được gán cho sản phẩm khác trong hệ thống (DUPLICATE_CODE)',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_MANAGER)
  @ApiBearerAuth('access-token')
  @AuditLog({
    action: 'CATALOG_UPDATE_PRODUCT_STATUS',
    entityType: 'Product',
    entityId: (req) => req.params?.id,
    description: 'Chuyển đổi trạng thái kinh doanh SKU (Active/Inactive)',
  })
  @ApiOperation({
    summary: 'Chuyển đổi trạng thái kinh doanh của SKU (Active / Inactive)',
    description:
      'Chỉ Store Manager mới có quyền đổi trạng thái. Khi Inactive: SKU bị loại trừ khỏi gợi ý mua mới DSS (UC-01), cho phép chuyển Inactive ngay cả khi on_order > 0 theo INV-PROD-03.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái sản phẩm thành công',
    type: ProductResponseDto,
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
    description: 'Không tìm thấy sản phẩm tương ứng (RESOURCE_NOT_FOUND)',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateProductStatusDto: UpdateProductStatusDto,
  ) {
    return this.productsService.updateStatus(id, updateProductStatusDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STORE_MANAGER)
  @ApiBearerAuth('access-token')
  @AuditLog({
    action: 'CATALOG_DELETE_PRODUCT',
    entityType: 'Product',
    entityId: (req) => req.params?.id,
    description: 'Xóa vĩnh viễn sản phẩm SKU khỏi hệ thống (Zero-Link)',
  })
  @ApiOperation({
    summary: 'Xóa vĩnh viễn sản phẩm SKU (Hard Delete)',
    description:
      'Chỉ Store Manager mới có quyền xóa. Yêu cầu sản phẩm hoàn toàn chưa phát sinh bất kỳ liên kết dữ liệu nào (Zero-Link). Ném 409 HARD_DELETE_PROHIBITED nếu đã có liên kết lịch sử.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa sản phẩm thành công',
    type: DeleteProductResponseDto,
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
    description: 'Không tìm thấy sản phẩm tương ứng (RESOURCE_NOT_FOUND)',
  })
  @ApiResponse({
    status: 409,
    description:
      'Sản phẩm đã có dữ liệu liên kết trong hệ thống (HARD_DELETE_PROHIBITED)',
  })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
