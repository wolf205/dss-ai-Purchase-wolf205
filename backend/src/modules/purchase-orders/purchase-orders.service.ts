import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { CancelPurchaseOrderDto } from './dto/cancel-purchase-order.dto';
import {
  PurchaseOrderDetailResponseDto,
  PurchaseOrderListResponseDto,
  PurchaseOrderSummaryResponseDto,
} from './dto/purchase-order-response.dto';
import { getStartOfDay, isPoOverdue } from './helpers/po-overdue.helper';
import { exportPurchaseOrder } from './helpers/po-exporter.helper';
import {
  PoExportData,
  PurchaseOrderWithRelations,
} from './interfaces/purchase-order.interface';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tra cứu danh sách Đơn mua hàng (PO) kèm bộ lọc và phân trang (UC-02 Bước 2, 3).
   * Tự động tính toán cờ quá hạn giao hàng runtime theo BR-09.
   */
  async findAll(
    query: QueryPurchaseOrderDto,
  ): Promise<PurchaseOrderListResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {};

    // 1. Lọc theo trạng thái PO
    if (query.status) {
      where.status = query.status;
    }

    // 2. Lọc theo Nhà cung cấp
    if (query.supplierId) {
      where.supplierId = BigInt(query.supplierId);
    }

    // 3. Lọc theo tình trạng quá hạn giao (BR-09)
    if (query.isOverdue !== undefined) {
      const today = getStartOfDay(new Date());
      if (query.isOverdue) {
        where.status = 'Approved';
        where.expectedDeliveryDate = { lt: today };
      } else {
        where.OR = [
          { status: { not: 'Approved' } },
          { expectedDeliveryDate: { gte: today } },
        ];
      }
    }

    // 4. Tìm kiếm từ khóa theo mã PO hoặc tên nhà cung cấp
    if (query.search && query.search.trim()) {
      const keyword = query.search.trim();
      where.AND = [
        {
          OR: [
            { poNumber: { contains: keyword, mode: 'insensitive' } },
            {
              supplier: {
                supplierName: { contains: keyword, mode: 'insensitive' },
              },
            },
          ],
        },
      ];
    }

    const [rawOrders, totalItems] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          session: {
            select: { id: true, sessionCode: true },
          },
          lineItems: {
            select: { id: true },
          },
        },
        orderBy: { id: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    const items: PurchaseOrderSummaryResponseDto[] = rawOrders.map((po) =>
      this.mapToSummaryDto(po),
    );

    const totalPages = Math.ceil(totalItems / limit) || 1;

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
   * Xem chi tiết Đơn mua hàng kèm đối tác NCC và các dòng line items bảo lưu snapshot (UC-02 Bước 4, 5).
   */
  async findOne(
    id: string | number | bigint,
  ): Promise<PurchaseOrderDetailResponseDto> {
    const poId = BigInt(id);
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        session: {
          select: { id: true, sessionCode: true },
        },
        lineItems: {
          include: {
            product: {
              select: {
                id: true,
                skuCode: true,
                productName: true,
                barcode: true,
                unit: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!po) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Đơn mua hàng với ID ${id} không tồn tại.`,
      });
    }

    return this.mapToDetailDto(po);
  }

  /**
   * Hủy Đơn mua hàng và hoàn trả on_order_quantity trong ACID Transaction (UC-02 Luồng rẽ nhánh AF-1).
   * Tuân thủ BR-06 (Chặn hủy đơn đã đóng) và BR-07 (Hoàn trả tồn kho đang về).
   */
  async cancel(
    id: string | number | bigint,
    dto: CancelPurchaseOrderDto,
  ): Promise<PurchaseOrderDetailResponseDto> {
    const poId = BigInt(id);
    this.logger.log(
      `Yêu cầu hủy đơn mua hàng PO ID ${id} với lý do: ${dto.cancellationReason}`,
    );

    // 1. Kiểm tra đơn hàng tồn tại
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        lineItems: true,
      },
    });

    if (!po) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Đơn mua hàng với ID ${id} không tồn tại.`,
      });
    }

    // 2. Kiểm soát vòng đời trạng thái theo BR-06
    if (po.status !== 'Approved') {
      this.logger.warn(
        `Từ chối hủy PO ID ${id}: Đơn đã ở trạng thái '${po.status}' (PO_ALREADY_CLOSED)`,
      );
      throw new ConflictException({
        code: 'PO_ALREADY_CLOSED',
        message: `Đơn mua hàng này hiện đang ở trạng thái '${po.status}'. Hệ thống không cho phép hủy các đơn hàng đã hoàn tất hoặc đã hủy trước đó (BR-06).`,
      });
    }

    // 3. Thực thi ACID Transaction: Chuyển Cancelled và hoàn trả on_order_quantity (BR-07, Thin DB)
    await this.prisma.$transaction(async (tx) => {
      // 3.1. Cập nhật trạng thái đơn PO
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'Cancelled',
          cancellationReason: dto.cancellationReason.trim(),
          cancelledAt: new Date(),
        },
      });

      // 3.2. Giảm trừ on_order_quantity cho từng SKU thuộc đơn
      for (const line of po.lineItems) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          select: { onOrderQuantity: true },
        });

        const currentOnOrder = product?.onOrderQuantity ?? 0;
        const newOnOrder = Math.max(0, currentOnOrder - line.quantity);

        await tx.product.update({
          where: { id: line.productId },
          data: {
            onOrderQuantity: newOnOrder,
          },
        });
      }
    });

    this.logger.log(
      `Đã hủy thành công PO ID ${id} và hoàn trả on_order_quantity cho ${po.lineItems.length} SKU.`,
    );

    // 4. Trả về thông tin chi tiết đơn đã hủy
    return await this.findOne(poId);
  }

  /**
   * Xuất chứng từ Đơn mua hàng (PDF/Excel) và ghi nhận thời điểm xuất gần nhất (UC-02 Bước 6, 7).
   */
  async export(
    id: string | number | bigint,
    format: 'pdf' | 'excel' = 'pdf',
  ): Promise<PoExportData> {
    const poId = BigInt(id);

    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        session: {
          select: { id: true, sessionCode: true },
        },
        lineItems: {
          include: {
            product: {
              select: {
                id: true,
                skuCode: true,
                productName: true,
                barcode: true,
                unit: true,
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!po) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Đơn mua hàng với ID ${id} không tồn tại.`,
      });
    }

    // Cập nhật metadata lastExportedAt
    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { lastExportedAt: new Date() },
    });

    return exportPurchaseOrder(po, format);
  }

  private mapToSummaryDto(
    po: Prisma.PurchaseOrderGetPayload<{
      include: {
        supplier: true;
        session: { select: { id: true; sessionCode: true } };
        lineItems: { select: { id: true } };
      };
    }>,
  ): PurchaseOrderSummaryResponseDto {
    const isOverdue = isPoOverdue(po.status, po.expectedDeliveryDate);

    return {
      id: po.id.toString(),
      poNumber: po.poNumber,
      sessionId: po.sessionId.toString(),
      sessionCode: po.session?.sessionCode,
      supplierId: po.supplierId.toString(),
      supplierCode: po.supplier.supplierCode,
      supplierName: po.supplier.supplierName,
      status: po.status,
      approvalDate: po.approvalDate.toISOString().split('T')[0],
      historicalLeadTimeDays: po.historicalLeadTimeDays,
      expectedDeliveryDate: po.expectedDeliveryDate.toISOString().split('T')[0],
      totalAmount: Number(po.totalAmount),
      totalLines: po.lineItems.length,
      isOverdue,
      cancellationReason: po.cancellationReason,
      cancelledAt: po.cancelledAt ? po.cancelledAt.toISOString() : null,
      lastExportedAt: po.lastExportedAt
        ? po.lastExportedAt.toISOString()
        : null,
      createdAt: po.createdAt.toISOString(),
      updatedAt: po.updatedAt.toISOString(),
    };
  }

  private mapToDetailDto(
    po: PurchaseOrderWithRelations,
  ): PurchaseOrderDetailResponseDto {
    const summary = this.mapToSummaryDto({
      ...po,
      lineItems: po.lineItems.map((l) => ({ id: l.id })),
    });

    return {
      ...summary,
      supplier: {
        id: po.supplier.id.toString(),
        supplierCode: po.supplier.supplierCode,
        supplierName: po.supplier.supplierName,
        contactPerson: po.supplier.contactPerson,
        phoneNumber: po.supplier.phoneNumber,
        email: po.supplier.email,
        address: po.supplier.address,
      },
      lineItems: po.lineItems.map((item) => ({
        id: item.id.toString(),
        productId: item.productId.toString(),
        skuCode: item.product.skuCode,
        productName: item.product.productName,
        barcode: item.product.barcode,
        unit: item.product.unit,
        quantity: item.quantity,
        historicalUnitPrice: Number(item.historicalUnitPrice),
        historicalMoq: item.historicalMoq,
        lineTotal: Number(
          item.lineTotal ?? item.quantity * Number(item.historicalUnitPrice),
        ),
      })),
    };
  }
}
