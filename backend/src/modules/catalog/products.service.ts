import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { QueryProductDto } from './dto/query-product.dto';
import {
  ProductCategorySummaryDto,
  ProductResponseDto,
} from './dto/product-response.dto';
import { PaginationMetaDto } from '../../common/dto/api-response.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tra cứu danh sách sản phẩm (hỗ trợ phân trang, lọc theo ngành hàng, trạng thái và tìm kiếm).
   */
  async findAll(query: QueryProductDto): Promise<{
    items: ProductResponseDto[];
    pagination: PaginationMetaDto;
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (query.categoryId) {
      where.categoryId = BigInt(query.categoryId);
    }

    if (query.status && query.status !== 'All') {
      where.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { skuCode: { contains: term, mode: 'insensitive' } },
        { productName: { contains: term, mode: 'insensitive' } },
      ];
    }

    this.logger.log(
      `Tra cứu sản phẩm: page=${page}, limit=${limit}, search=${query.search || ''}, categoryId=${query.categoryId || ''}, status=${query.status || ''}`,
    );

    const [rawItems, totalItems] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { id: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const items: ProductResponseDto[] = rawItems.map((p) =>
      this.mapToResponseDto(p),
    );

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Tạo mới một SKU sản phẩm trong danh mục Master Data (UC-05).
   * Tuân thủ BR-17 (Mã SKU duy nhất, bất biến), BR-19 (Khởi tạo tồn kho = 0, on-order = 0).
   */
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    this.logger.log(`Tạo mới sản phẩm SKU: ${dto.skuCode}`);

    // 1. Kiểm tra Category tồn tại
    const categoryIdBigInt = BigInt(dto.categoryId);
    const category = await this.prisma.category.findUnique({
      where: { id: categoryIdBigInt },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Ngành hàng với ID ${dto.categoryId} không tồn tại`,
      });
    }

    // 2. Kiểm tra tính duy nhất toàn cục của mã SKU (Case-Insensitive theo BR-17)
    const existingSku = await this.prisma.product.findFirst({
      where: {
        skuCode: {
          equals: dto.skuCode,
          mode: 'insensitive',
        },
      },
    });
    if (existingSku) {
      throw new ConflictException({
        code: 'DUPLICATE_CODE',
        message: `Mã SKU '${dto.skuCode}' đã tồn tại trong hệ thống.`,
      });
    }

    // 3. Kiểm tra tính duy nhất của mã vạch nếu có nhập (EF-2)
    if (dto.barcode) {
      const existingBarcode = await this.prisma.product.findFirst({
        where: {
          barcode: dto.barcode,
        },
      });
      if (existingBarcode) {
        throw new ConflictException({
          code: 'DUPLICATE_CODE',
          message: `Mã vạch '${dto.barcode}' đã được gán cho sản phẩm khác (${existingBarcode.skuCode} - ${existingBarcode.productName}).`,
        });
      }
    }

    // 4. Lưu sản phẩm với giá trị khởi tạo an toàn (BR-19)
    const newProduct = await this.prisma.product.create({
      data: {
        skuCode: dto.skuCode,
        productName: dto.productName,
        categoryId: categoryIdBigInt,
        unit: dto.unit,
        barcode: dto.barcode || null,
        status: 'Active',
        currentInventory: 0,
        onOrderQuantity: 0,
      },
      include: {
        category: true,
      },
    });

    return this.mapToResponseDto(newProduct);
  }

  /**
   * Lấy chi tiết thông tin một sản phẩm theo ID.
   */
  async findById(id: string | number | bigint): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy sản phẩm với ID ${id}`,
      });
    }

    return this.mapToResponseDto(product);
  }

  /**
   * Cập nhật thông tin sản phẩm (tên, ngành hàng, đơn vị tính, mã vạch).
   * Tuyệt đối cấm sửa mã skuCode (BR-17).
   */
  async update(
    id: string | number | bigint,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const productIdBigInt = BigInt(id);
    this.logger.log(`Cập nhật thông tin sản phẩm ID: ${id}`);

    // 1. Kiểm tra sản phẩm tồn tại
    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productIdBigInt },
    });

    if (!existingProduct) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy sản phẩm với ID ${id}`,
      });
    }

    // 2. Nếu có thay đổi categoryId, kiểm tra category mới tồn tại
    if (dto.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({
        where: { id: BigInt(dto.categoryId) },
      });
      if (!category) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: `Ngành hàng với ID ${dto.categoryId} không tồn tại`,
        });
      }
    }

    // 3. Nếu có cập nhật barcode mới (khác null và rỗng), kiểm tra trùng với SKU khác
    if (dto.barcode && dto.barcode.trim()) {
      const duplicateBarcode = await this.prisma.product.findFirst({
        where: {
          barcode: dto.barcode.trim(),
          id: { not: productIdBigInt },
        },
      });
      if (duplicateBarcode) {
        throw new ConflictException({
          code: 'DUPLICATE_CODE',
          message: `Mã vạch '${dto.barcode.trim()}' đã được gán cho sản phẩm khác (${duplicateBarcode.skuCode} - ${duplicateBarcode.productName}).`,
        });
      }
    }

    // 4. Chuẩn bị dữ liệu cập nhật
    const updateData: Prisma.ProductUpdateInput = {};
    if (dto.productName !== undefined) {
      updateData.productName = dto.productName.trim();
    }
    if (dto.unit !== undefined) {
      updateData.unit = dto.unit.trim();
    }
    if (dto.categoryId !== undefined) {
      updateData.category = {
        connect: { id: BigInt(dto.categoryId) },
      };
    }
    if (dto.barcode !== undefined) {
      updateData.barcode =
        dto.barcode && dto.barcode.trim() ? dto.barcode.trim() : null;
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productIdBigInt },
      data: updateData,
      include: {
        category: true,
      },
    });

    return this.mapToResponseDto(updatedProduct);
  }

  /**
   * Chuyển đổi trạng thái kinh doanh của SKU giữa Active và Inactive (Soft Deactivate / Reactivate).
   * Tuân thủ INV-PROD-03 & BR-18: Cho phép chuyển Inactive ngay cả khi on_order_quantity > 0.
   */
  async updateStatus(
    id: string | number | bigint,
    dto: UpdateProductStatusDto,
  ): Promise<ProductResponseDto> {
    const productIdBigInt = BigInt(id);
    this.logger.log(`Cập nhật trạng thái sản phẩm ID: ${id} -> ${dto.status}`);

    const existingProduct = await this.prisma.product.findUnique({
      where: { id: productIdBigInt },
    });

    if (!existingProduct) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy sản phẩm với ID ${id}`,
      });
    }

    if (dto.status === 'Inactive' && existingProduct.onOrderQuantity > 0) {
      this.logger.warn(
        `Cảnh báo (INV-PROD-03): Sản phẩm ${existingProduct.skuCode} chuyển sang Inactive trong khi đang có ${existingProduct.onOrderQuantity} đơn vị hàng trên đường về (PO). Mặt hàng này sẽ bị loại trừ khỏi gợi ý mua mới DSS (UC-01) nhưng vẫn tiếp nhận nhận hàng (UC-03) để bán xả tồn.`,
      );
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productIdBigInt },
      data: { status: dto.status },
      include: { category: true },
    });

    return this.mapToResponseDto(updatedProduct);
  }

  /**
   * Xóa cứng (Hard Delete) sản phẩm khỏi CSDL.
   * Tuân thủ INV-PROD-02 & BR-18: Chỉ cho phép xóa khi Zero-Link (chưa từng phát sinh bất kỳ liên kết dữ liệu nào).
   * Trả về HTTP 409 HARD_DELETE_PROHIBITED nếu đã có liên kết lịch sử.
   */
  async remove(
    id: string | number | bigint,
  ): Promise<{ message: string; deletedSkuCode: string }> {
    const productIdBigInt = BigInt(id);
    this.logger.log(`Yêu cầu xóa sản phẩm ID: ${id}`);

    const product = await this.prisma.product.findUnique({
      where: { id: productIdBigInt },
      include: {
        _count: {
          select: {
            supplyConditions: true,
            salesRecords: true,
            inventorySnapshots: true,
            recommendationItems: true,
            poLineItems: true,
            receiptLineItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy sản phẩm với ID ${id}`,
      });
    }

    const totalLinks =
      product._count.supplyConditions +
      product._count.salesRecords +
      product._count.inventorySnapshots +
      product._count.recommendationItems +
      product._count.poLineItems +
      product._count.receiptLineItems;

    if (
      totalLinks > 0 ||
      product.currentInventory > 0 ||
      product.onOrderQuantity > 0
    ) {
      this.logger.warn(
        `Từ chối xóa SKU ${product.skuCode} do vi phạm Zero-Link: totalLinks=${totalLinks}, currentInventory=${product.currentInventory}, onOrderQuantity=${product.onOrderQuantity}`,
      );
      throw new ConflictException({
        code: 'HARD_DELETE_PROHIBITED',
        message:
          'Không thể xóa sản phẩm này do đã phát sinh dữ liệu liên kết trong hệ thống. Nếu cửa hàng không còn kinh doanh mặt hàng này, vui lòng sử dụng chức năng "Ngừng kinh doanh" (Deactivate).',
      });
    }

    await this.prisma.product.delete({
      where: { id: productIdBigInt },
    });

    this.logger.log(`Đã xóa vĩnh viễn sản phẩm ${product.skuCode}`);

    return {
      message: `Đã xóa vĩnh viễn sản phẩm ${product.skuCode} khỏi danh mục hệ thống.`,
      deletedSkuCode: product.skuCode,
    };
  }

  /**
   * Helper ánh xạ từ bản ghi Prisma sang DTO chuẩn hóa
   */
  private mapToResponseDto(
    product: Prisma.ProductGetPayload<{ include: { category: true } }>,
  ): ProductResponseDto {
    const categorySummary: ProductCategorySummaryDto = {
      id: product.category.id.toString(),
      categoryCode: product.category.categoryCode,
      categoryName: product.category.categoryName,
    };

    return {
      id: product.id.toString(),
      skuCode: product.skuCode,
      productName: product.productName,
      barcode: product.barcode,
      unit: product.unit,
      status: product.status,
      currentInventory: product.currentInventory,
      onOrderQuantity: product.onOrderQuantity,
      categoryId: product.categoryId.toString(),
      category: categorySummary,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
