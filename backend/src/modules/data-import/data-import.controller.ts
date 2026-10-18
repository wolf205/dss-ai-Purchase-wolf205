import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataImportService } from './data-import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { UploadedFile as IUploadedFile } from './interfaces/uploaded-file.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/auth-payload.interface';
import { SalesValidateResponseDto } from './dto/sales-validate-response.dto';
import { SalesConfirmResponseDto } from './dto/sales-confirm-response.dto';
import { ConfirmSalesDto } from './dto/confirm-sales.dto';
import { InventoryValidateResponseDto } from './dto/inventory-validate-response.dto';
import { InventoryConfirmResponseDto } from './dto/inventory-confirm-response.dto';
import { ConfirmInventoryDto } from './dto/confirm-inventory.dto';

@ApiTags('Data Import')
@Controller('data-imports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class DataImportController {
  constructor(private readonly dataImportService: DataImportService) {}

  @Get('templates/:type')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @ApiOperation({
    summary: 'Tải file mẫu chuẩn CSV (Download CSV Template)',
    description:
      'Cung cấp file mẫu CSV chuẩn mực cho Bán hàng (type=sales) hoặc Kiểm kê kho (type=inventory) có sẵn các cột bắt buộc và dữ liệu minh họa.',
  })
  @ApiParam({
    name: 'type',
    enum: ['sales', 'inventory'],
    description: 'Loại biểu mẫu cần tải về (sales hoặc inventory)',
  })
  @ApiResponse({
    status: 200,
    description: 'Tải file mẫu thành công (Trả về stream tệp CSV)',
  })
  @ApiResponse({
    status: 400,
    description: 'Loại file mẫu không hợp lệ (VALIDATION_ERROR)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  downloadTemplate(@Param('type') type: string, @Res() res: Response) {
    const { filename, content } = this.dataImportService.getTemplate(type);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    return res.send(content);
  }

  @Post('sales/validate')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'File CSV bán hàng cần thẩm định (cột: Date, SKU, Quantity, Revenue)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary:
      'Thẩm định file CSV bán hàng (Validate Sales File - All-or-Nothing)',
    description:
      'Tải lên và tiền kiểm tra tệp bán hàng. Áp dụng nguyên tắc All-or-Nothing: chỉ cần 1 dòng sai sẽ từ chối toàn bộ và trả về danh sách chi tiết các lỗi. Nếu hợp lệ 100%, trả về preview và danh sách ngày bị trùng lặp trong CSDL.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tệp bán hàng hợp lệ 100% (Sẵn sàng tiếp nhận)',
    type: SalesValidateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Tệp rỗng, sai cấu trúc hoặc có dòng vi phạm (ALL_OR_NOTHING_IMPORT_FAILED / VALIDATION_ERROR)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  async validateSales(
    @UploadedFile() file: IUploadedFile,
  ): Promise<SalesValidateResponseDto> {
    return await this.dataImportService.validateSalesFile(file);
  }

  @Post('sales/confirm')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description:
      'File CSV bán hàng (cột: Date, SKU, Quantity, Revenue) hoặc JSON payload danh sách bản ghi',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Tệp CSV bán hàng',
        },
        items: {
          type: 'array',
          description: 'Danh sách bản ghi bán hàng (nếu không tải tệp)',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', example: '2026-09-14' },
              skuCode: { type: 'string', example: 'BEV-COCA-330' },
              quantity: { type: 'integer', example: 50 },
              revenue: { type: 'number', example: 500000 },
            },
            required: ['date', 'skuCode', 'quantity', 'revenue'],
          },
        },
      },
    },
  })
  @ApiOperation({
    summary:
      'Xác nhận ghi đè và nạp dữ liệu bán hàng (Confirm Sales Ingestion - ACID Transaction)',
    description:
      'Xóa dữ liệu cũ các ngày trùng lặp (deleteMany) và chèn hàng loạt bản ghi mới (createMany) trong một ACID transaction duy nhất. Đảm bảo nguyên tắc All-or-Nothing và không cộng dồn doanh số.',
  })
  @ApiResponse({
    status: 201,
    description: 'Nạp dữ liệu bán hàng thành công',
    type: SalesConfirmResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Tệp rỗng, sai cấu trúc, có dòng vi phạm hoặc SKU không tồn tại (ALL_OR_NOTHING_IMPORT_FAILED / VALIDATION_ERROR)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  async confirmSales(
    @UploadedFile() file?: IUploadedFile,
    @Body() body?: ConfirmSalesDto,
  ): Promise<SalesConfirmResponseDto> {
    return await this.dataImportService.confirmSales(file, body);
  }

  @Post('inventory/validate')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File CSV kiểm kê kệ cần thẩm định (cột: SKU, StockQuantity)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiOperation({
    summary:
      'Thẩm định file CSV kiểm kê kho kệ (Validate Inventory File - All-or-Nothing)',
    description:
      'Tải lên và tiền kiểm tra tệp kiểm kê kệ. Áp dụng nguyên tắc All-or-Nothing: chỉ cần 1 dòng sai sẽ từ chối toàn bộ. Nếu hợp lệ 100%, trả về preview so sánh tồn kho thực tế và hiện hành.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tệp kiểm kê hợp lệ 100% (Sẵn sàng tiếp nhận)',
    type: InventoryValidateResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Tệp rỗng, sai cấu trúc hoặc có dòng vi phạm (ALL_OR_NOTHING_IMPORT_FAILED / VALIDATION_ERROR)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  async validateInventory(
    @UploadedFile() file: IUploadedFile,
  ): Promise<InventoryValidateResponseDto> {
    return await this.dataImportService.validateInventoryFile(file);
  }

  @Post('inventory/confirm')
  @Roles(Role.STORE_MANAGER, Role.PURCHASING_STAFF)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description:
      'File CSV kiểm kê kệ (cột: SKU, StockQuantity) hoặc JSON payload danh sách bản ghi',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Tệp CSV kiểm kê kệ',
        },
        items: {
          type: 'array',
          description: 'Danh sách bản ghi kiểm kê (nếu không tải tệp)',
          items: {
            type: 'object',
            properties: {
              skuCode: { type: 'string', example: 'BEV-COCA-330' },
              stockQuantity: { type: 'integer', example: 120 },
            },
            required: ['skuCode', 'stockQuantity'],
          },
        },
      },
    },
  })
  @ApiOperation({
    summary:
      'Xác nhận cập nhật tồn kho kệ từ file kiểm kê (Confirm Inventory Ingestion - ACID Transaction)',
    description:
      'Cập nhật products.current_inventory cho các SKU trong tệp, bảo lưu tồn kho các SKU vắng mặt và bảo lưu nguyên vẹn on_order_quantity (BR-16). Đồng thời lưu vết kiểm toán vào inventory_snapshots.',
  })
  @ApiResponse({
    status: 201,
    description: 'Cập nhật số liệu kiểm kê thành công',
    type: InventoryConfirmResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Tệp rỗng, sai cấu trúc, có dòng vi phạm hoặc SKU không tồn tại (ALL_OR_NOTHING_IMPORT_FAILED / VALIDATION_ERROR)',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập hoặc token không hợp lệ (UNAUTHORIZED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập (FORBIDDEN_ROLE)',
  })
  async confirmInventory(
    @UploadedFile() file?: IUploadedFile,
    @Body() body?: ConfirmInventoryDto,
    @CurrentUser() user?: AuthenticatedUser,
  ): Promise<InventoryConfirmResponseDto> {
    return await this.dataImportService.confirmInventory(
      file,
      body,
      user?.username,
    );
  }
}
