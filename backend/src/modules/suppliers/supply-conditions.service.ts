import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplyConditionDto } from './dto/create-supply-condition.dto';
import { UpdateSupplyConditionDto } from './dto/update-supply-condition.dto';
import { SupplyConditionResponseDto } from './dto/supply-condition-response.dto';
import { mapToSupplyConditionResponseDto } from './helpers/supplier-mapper.helper';

@Injectable()
export class SupplyConditionsService {
  private readonly logger = new Logger(SupplyConditionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách điều kiện cung ứng (SKU, Giá nhập, MOQ) của một nhà cung cấp.
   */
  async findConditionsBySupplierId(
    id: string | number | bigint,
  ): Promise<SupplyConditionResponseDto[]> {
    const supplierId = BigInt(id);

    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Nhà cung cấp với ID ${id} không tồn tại.`,
      });
    }

    const conditions = await this.prisma.supplyCondition.findMany({
      where: { supplierId },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    return conditions.map((condition) =>
      mapToSupplyConditionResponseDto(condition),
    );
  }

  /**
   * Gán SKU cho Nhà cung cấp với Đơn giá nhập và MOQ (UC-06 Step 8-11).
   * Tuân thủ:
   * - SKU phải tồn tại và đang ở trạng thái Active (Precondition UC-06 mục 3.2).
   * - Chống trùng lặp SKU trên cùng NCC theo EF-2 và DB constraint @@unique([productId, supplierId]).
   * - BR-22: Áp dụng tiến về trước cho các phiên DSS tương lai.
   */
  async createCondition(
    supplierIdInput: string | number | bigint,
    dto: CreateSupplyConditionDto,
  ): Promise<SupplyConditionResponseDto> {
    const supplierId = BigInt(supplierIdInput);
    const productId = BigInt(dto.productId);

    this.logger.log(
      `Gán SKU ID ${dto.productId} cho NCC ID ${supplierIdInput} (Price: ${dto.purchasePrice}, MOQ: ${dto.moq ?? 1})`,
    );

    // 1. Kiểm tra nhà cung cấp tồn tại
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Nhà cung cấp với ID ${supplierIdInput} không tồn tại.`,
      });
    }

    // 2. Kiểm tra sản phẩm tồn tại
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy mặt hàng với ID ${dto.productId}.`,
      });
    }

    // 3. Ràng buộc Precondition UC-06 mục 3.2: SKU phải đang Active
    if (product.status !== 'Active') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: `Mặt hàng '${product.skuCode}' đang ở trạng thái '${product.status}'. Chỉ cho phép gán các mặt hàng đang Active cho nhà cung cấp.`,
      });
    }

    // 4. Ràng buộc chống trùng lặp theo EF-2
    const existingCondition = await this.prisma.supplyCondition.findUnique({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
    });

    if (existingCondition) {
      throw new ConflictException({
        code: 'DUPLICATE_SKU_ASSIGNMENT',
        message:
          "Mặt hàng này đã có trong danh mục cung ứng của nhà cung cấp. Vui lòng sử dụng chức năng 'Sửa điều kiện' nếu muốn điều chỉnh đơn giá nhập hoặc MOQ.",
      });
    }

    // 5. Tạo mới điều kiện cung ứng
    const condition = await this.prisma.supplyCondition.create({
      data: {
        supplierId,
        productId,
        purchasePrice: dto.purchasePrice,
        moq: dto.moq ?? 1,
        status: 'Active',
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    return mapToSupplyConditionResponseDto(condition);
  }

  /**
   * Cập nhật điều kiện cung ứng (Đơn giá nhập, MOQ, trạng thái Active/Inactive) - AF-2, AF-3.
   * Tuân thủ:
   * - BR-22: Áp dụng tiến về trước cho các phiên DSS tương lai, PO snapshot cũ không đổi.
   * - BR-23 & EF-5: Chặn ngừng cung ứng (status: Inactive) nếu SKU đang nằm trong đơn PO Approved của chính NCC này.
   * - BR-23: Cảnh báo mềm (isSoleSupplier) nếu đây là NCC duy nhất hiện tại của SKU.
   */
  async updateCondition(
    id: string | number | bigint,
    dto: UpdateSupplyConditionDto,
  ): Promise<SupplyConditionResponseDto> {
    const conditionId = BigInt(id);
    this.logger.log(`Cập nhật điều kiện cung ứng ID: ${id}`);

    // 1. Kiểm tra tồn tại bản ghi điều kiện cung ứng
    const condition = await this.prisma.supplyCondition.findUnique({
      where: { id: conditionId },
      include: {
        product: {
          include: { category: true },
        },
        supplier: true,
      },
    });

    if (!condition) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy điều kiện cung ứng với ID ${id}.`,
      });
    }

    // 2. Kiểm tra ít nhất 1 trường được truyền lên
    if (
      dto.purchasePrice === undefined &&
      dto.moq === undefined &&
      dto.status === undefined
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'Cần cung cấp ít nhất một trường để cập nhật (purchasePrice, moq, hoặc status).',
      });
    }

    // 3. Ràng buộc EF-5 & BR-23: Chặn chuyển Inactive nếu SKU đang nằm trong đơn PO Approved của chính NCC này
    if (dto.status === 'Inactive' && condition.status !== 'Inactive') {
      const activePoWithSku = await this.prisma.purchaseOrder.findFirst({
        where: {
          supplierId: condition.supplierId,
          status: 'Approved',
          lineItems: {
            some: {
              productId: condition.productId,
            },
          },
        },
        select: {
          poNumber: true,
        },
      });

      if (activePoWithSku) {
        this.logger.warn(
          `Từ chối ngừng cung ứng SKU ${condition.product.skuCode} của NCC ${condition.supplier.supplierCode} do đang có trong PO Approved ${activePoWithSku.poNumber} (EF-5, BR-23)`,
        );
        throw new ConflictException({
          code: 'ON_ORDER_SKU_EXISTS',
          message: `Không thể ngừng cung ứng sản phẩm '${condition.product.productName}' do đang có hàng chờ giao trong Đơn mua hàng ${activePoWithSku.poNumber}. Vui lòng hoàn tất nhận hàng (UC-03) hoặc hủy đơn mua hàng (UC-02) trước khi ngừng cung ứng mặt hàng này.`,
        });
      }
    }

    // 4. Kiểm tra cảnh báo mềm Sole Supplier (BR-23)
    let isSoleSupplier = false;
    if (dto.status === 'Inactive') {
      const otherActiveSuppliersCount = await this.prisma.supplyCondition.count(
        {
          where: {
            productId: condition.productId,
            status: 'Active',
            id: { not: conditionId },
          },
        },
      );
      isSoleSupplier = otherActiveSuppliersCount === 0;
    }

    // 5. Chuẩn bị dữ liệu cập nhật
    const updateData: Prisma.SupplyConditionUpdateInput = {};
    if (dto.purchasePrice !== undefined) {
      updateData.purchasePrice = dto.purchasePrice;
    }
    if (dto.moq !== undefined) {
      updateData.moq = dto.moq;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    const updatedCondition = await this.prisma.supplyCondition.update({
      where: { id: conditionId },
      data: updateData,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const response = mapToSupplyConditionResponseDto(updatedCondition);
    if (dto.status === 'Inactive') {
      response.isSoleSupplier = isSoleSupplier;
    }

    return response;
  }
}
