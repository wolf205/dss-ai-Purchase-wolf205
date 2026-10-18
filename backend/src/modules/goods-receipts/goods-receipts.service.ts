import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryPendingPosDto } from './dto/query-pending-pos.dto';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';
import {
  GoodsReceiptResponseDto,
  ReceiptLineItemResponseDto,
  SupplierPerformanceUpdateDto,
} from './dto/goods-receipt-response.dto';
import {
  PendingPoLineItemDto,
  PendingPoSummaryDto,
} from './dto/pending-po-response.dto';
import {
  calculateOnTimeFactor,
  calculateOrderScore,
  resolvePerformanceLabel,
} from '../suppliers/helpers/supplier-scoring.helper';
import { getStartOfDay } from '../purchase-orders/helpers/po-overdue.helper';

@Injectable()
export class GoodsReceiptsService {
  private readonly logger = new Logger(GoodsReceiptsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 6B.1 — Lấy danh sách Đơn mua hàng (PO) ở trạng thái Approved chưa nhận hàng (UC-03 Bước 1, 2).
   * Kèm thông tin chi tiết các mặt hàng để giao diện tự động điền sẵn số lượng thực nhận (BR-11).
   */
  async getPendingPurchaseOrders(query: QueryPendingPosDto): Promise<{
    items: PendingPoSummaryDto[];
    totalItems: number;
    totalPages: number;
  }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {
      status: 'Approved',
      goodsReceipt: null,
    };

    if (query.supplierId) {
      where.supplierId = BigInt(query.supplierId);
    }

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

    const todayStart = getStartOfDay(new Date());

    const [rawOrders, totalItems] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
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
        orderBy: [{ expectedDeliveryDate: 'asc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    const items: PendingPoSummaryDto[] = rawOrders.map((po) => {
      const expDate = new Date(po.expectedDeliveryDate);
      const isOverdue = expDate < todayStart;
      const daysOverdue = isOverdue
        ? Math.max(
            0,
            Math.ceil(
              (todayStart.getTime() - expDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ),
          )
        : 0;

      const lineItems: PendingPoLineItemDto[] = po.lineItems.map((line) => {
        const unitPrice = Number(line.historicalUnitPrice);
        const qty = line.quantity;
        const lineTotal = line.lineTotal
          ? Number(line.lineTotal)
          : qty * unitPrice;

        return {
          id: line.id.toString(),
          productId: line.productId.toString(),
          skuCode: line.product.skuCode,
          productName: line.product.productName,
          barcode: line.product.barcode,
          unit: line.product.unit,
          orderedQuantity: line.quantity,
          historicalUnitPrice: unitPrice,
          lineTotal,
        };
      });

      return {
        id: po.id.toString(),
        poNumber: po.poNumber,
        supplierId: po.supplierId.toString(),
        supplierName: po.supplier.supplierName,
        supplierCode: po.supplier.supplierCode,
        approvalDate: po.approvalDate.toISOString().split('T')[0],
        expectedDeliveryDate: po.expectedDeliveryDate
          .toISOString()
          .split('T')[0],
        totalAmount: Number(po.totalAmount),
        isOverdue,
        daysOverdue,
        totalLines: po.lineItems.length,
        lineItems,
      };
    });

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items,
      totalItems,
      totalPages,
    };
  }

  /**
   * 6B.2 — Xác nhận phiếu nhận hàng kho trong ACID Transaction (UC-03 Bước 4, 5).
   * Thực hiện toàn bộ các nghiệp vụ khép kín:
   * 1. Thẩm định điều kiện nhận hàng (PO Approved, ngày nhận hợp lệ, số lượng hợp lệ).
   * 2. Chặn xác nhận nếu 100% receivedQuantity = 0 (ZERO_FULFILLMENT_RECEIPT - EF-2).
   * 3. Tính toán các chỉ số OTIF theo 6C / BR-13 / BR-24 (Fulfillment Rate, Days Late, On-Time Factor).
   * 4. Mở ACID Transaction:
   *    - Sinh mã phiếu GR-YYYYMMDD-XXX
   *    - INSERT goods_receipts & receipt_line_items
   *    - UPDATE products: tăng current_inventory, tất toán on_order_quantity
   *    - UPDATE purchase_orders: chuyển trạng thái sang Completed
   *    - UPDATE suppliers: cập nhật completed_order_count & rolling 5-order performance_score
   */
  async confirmGoodsReceipt(
    dto: CreateGoodsReceiptDto,
    receivedBy: string,
  ): Promise<GoodsReceiptResponseDto> {
    const poId = BigInt(dto.purchaseOrderId);

    // 1. Kiểm tra tồn tại của PO
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        lineItems: {
          include: {
            product: true,
          },
          orderBy: { id: 'asc' },
        },
        goodsReceipt: true,
      },
    });

    if (!po) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Đơn mua hàng với ID ${dto.purchaseOrderId} không tồn tại.`,
      });
    }

    // 2. Kiểm tra trạng thái PO (INV-31, EF-5, BR-11)
    if (po.status !== 'Approved' || po.goodsReceipt) {
      throw new ConflictException({
        code: 'PO_ALREADY_CLOSED',
        message:
          'Đơn mua hàng không còn ở trạng thái Đã duyệt (Approved) hoặc đã được nhận hàng trước đó.',
      });
    }

    // 3. Kiểm tra tính hợp lệ của ngày nhận hàng thực tế (EF-3, INV-35)
    const actualDeliveryDate = new Date(`${dto.receiptDate}T00:00:00.000Z`);
    const actualDateMidnight = new Date(
      actualDeliveryDate.getUTCFullYear(),
      actualDeliveryDate.getUTCMonth(),
      actualDeliveryDate.getUTCDate(),
      0,
      0,
      0,
      0,
    );

    const now = new Date();
    const todayMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    if (actualDateMidnight.getTime() > todayMidnight.getTime()) {
      throw new BadRequestException({
        code: 'INVALID_FUTURE_DATE',
        message: 'Ngày nhận hàng thực tế không được lớn hơn ngày hiện tại.',
      });
    }

    const approvalDate = new Date(po.approvalDate);
    const approvalDateMidnight = new Date(
      approvalDate.getUTCFullYear(),
      approvalDate.getUTCMonth(),
      approvalDate.getUTCDate(),
      0,
      0,
      0,
      0,
    );

    if (actualDateMidnight.getTime() < approvalDateMidnight.getTime()) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'Ngày nhận hàng thực tế không được nhỏ hơn ngày phê duyệt đơn mua hàng.',
      });
    }

    // 4. Kiểm tra danh sách mặt hàng thực nhận (EF-2, EF-4, BR-11, INV-36)
    if (!dto.lines || dto.lines.length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Danh sách mặt hàng thực nhận không được để trống.',
      });
    }

    // Kiểm tra trùng lặp line items trong request
    const seenPoLineIds = new Set<number>();
    for (const line of dto.lines) {
      if (seenPoLineIds.has(line.poLineItemId)) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Có dòng mặt hàng bị trùng lặp trong phiếu nhận hàng.',
        });
      }
      seenPoLineIds.add(line.poLineItemId);
    }

    // Kiểm tra toàn bộ các dòng trên PO phải có mặt trong request
    if (po.lineItems.length !== dto.lines.length) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'Danh sách mặt hàng thực nhận phải bao gồm đầy đủ tất cả các dòng trên Đơn mua hàng.',
      });
    }

    const lineMap = new Map<number, (typeof dto.lines)[0]>();
    for (const reqLine of dto.lines) {
      lineMap.set(reqLine.poLineItemId, reqLine);
    }

    for (const poLine of po.lineItems) {
      const match = lineMap.get(Number(poLine.id));
      if (!match) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `Không tìm thấy dòng hàng ID ${poLine.id} trong danh sách nhận hàng.`,
        });
      }
      if (match.skuId !== Number(poLine.productId)) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `Mã sản phẩm (skuId: ${match.skuId}) không khớp với dòng đơn mua hàng ID ${poLine.id}.`,
        });
      }
      if (match.receivedQuantity < 0) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message:
            'Số lượng thực nhận của mỗi mặt hàng phải là số nguyên không âm (>= 0).',
        });
      }
    }

    // Chặn nhận hàng nếu toàn bộ số lượng thực nhận bằng 0 (EF-2, ZERO_FULFILLMENT_RECEIPT)
    const totalReceivedQty = dto.lines.reduce(
      (sum, item) => sum + item.receivedQuantity,
      0,
    );
    if (totalReceivedQty === 0) {
      throw new BadRequestException({
        code: 'ZERO_FULFILLMENT_RECEIPT',
        message:
          'Bạn đang ghi nhận số lượng thực nhận bằng 0 cho toàn bộ đơn hàng. Nếu từ chối nhận hàng do hàng lỗi/giao sai, vui lòng không xác nhận nhận hàng mà giữ đơn ở trạng thái Chờ giao để Nhà cung cấp giao lại. Trường hợp Nhà cung cấp không thể giao lại hàng, vui lòng sang chức năng Quản lý đơn hàng (UC-02) để thực hiện Hủy đơn.',
      });
    }

    // 5. Tính toán các chỉ số OTIF & Supplier Performance (6C, BR-13, BR-24)
    const totalOrderedQty = po.lineItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const overallFulfillmentRate = Math.min(
      1.0,
      Number((totalReceivedQty / totalOrderedQty).toFixed(4)),
    );

    const expectedDeliveryDate = new Date(po.expectedDeliveryDate);
    const expectedDateMidnight = new Date(
      expectedDeliveryDate.getUTCFullYear(),
      expectedDeliveryDate.getUTCMonth(),
      expectedDeliveryDate.getUTCDate(),
      0,
      0,
      0,
      0,
    );

    const diffMs =
      actualDateMidnight.getTime() - expectedDateMidnight.getTime();
    const daysLate = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const isOnTime = daysLate === 0;

    const onTimeFactor = Number(calculateOnTimeFactor(daysLate).toFixed(4));

    // Điểm hiệu suất của đơn: OrderScore = (OnTimeFactor * 50) + (FulfillmentRate * 0.5)
    // Giá trị chuẩn hóa [0.0000, 1.0000] phù hợp với DB CHECK constraint chk_gr_order_score_range
    const orderScoreHundred = calculateOrderScore(
      daysLate,
      overallFulfillmentRate * 100,
    );
    const orderPerformanceScore = Number((orderScoreHundred / 100).toFixed(4));

    // 6. Thực thi ACID Transaction (INV-31..38, BR-06, BR-07, BR-12, BR-24)
    const result = await this.prisma.$transaction(async (tx) => {
      // 6a. Sinh mã phiếu nhận hàng tự nhiên theo ngày (GR-YYYYMMDD-XXX)
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const prefix = `GR-${yyyy}${mm}${dd}-`;

      const todayReceiptCount = await tx.goodsReceipt.count({
        where: { receiptNumber: { startsWith: prefix } },
      });
      const receiptNumber = `${prefix}${String(todayReceiptCount + 1).padStart(3, '0')}`;

      // 6b. Tạo bản ghi goods_receipts
      const goodsReceipt = await tx.goodsReceipt.create({
        data: {
          receiptNumber,
          poId: po.id,
          actualDeliveryDate,
          daysLate,
          onTimeFactor: new Prisma.Decimal(onTimeFactor),
          overallFulfillmentRate: new Prisma.Decimal(overallFulfillmentRate),
          orderPerformanceScore: new Prisma.Decimal(orderPerformanceScore),
          notes: dto.note?.trim() || null,
          receivedBy,
        },
      });

      // 6c. Tạo receipt_line_items & cập nhật tồn kho sản phẩm (BR-12)
      const createdLines: ReceiptLineItemResponseDto[] = [];

      for (const poLine of po.lineItems) {
        const reqLine = lineMap.get(Number(poLine.id))!;
        const itemFulfillmentRate = Math.min(
          1.0,
          Number((reqLine.receivedQuantity / poLine.quantity).toFixed(4)),
        );

        const receiptLine = await tx.receiptLineItem.create({
          data: {
            receiptId: goodsReceipt.id,
            poLineItemId: poLine.id,
            productId: poLine.productId,
            orderedQuantity: poLine.quantity,
            receivedQuantity: reqLine.receivedQuantity,
            historicalUnitPrice: poLine.historicalUnitPrice,
            itemFulfillmentRate: new Prisma.Decimal(itemFulfillmentRate),
          },
        });

        // Đồng bộ tồn kho: tăng currentInventory theo thực nhận, tất toán onOrderQuantity theo đặt ban đầu
        const product = await tx.product.findUniqueOrThrow({
          where: { id: poLine.productId },
        });

        const newCurrentInventory =
          product.currentInventory + reqLine.receivedQuantity;
        const newOnOrder = Math.max(
          0,
          product.onOrderQuantity - poLine.quantity,
        );

        await tx.product.update({
          where: { id: poLine.productId },
          data: {
            currentInventory: newCurrentInventory,
            onOrderQuantity: newOnOrder,
          },
        });

        const historicalUnitPrice = Number(poLine.historicalUnitPrice);
        const lineReceivedTotal =
          reqLine.receivedQuantity * historicalUnitPrice;

        createdLines.push({
          id: receiptLine.id.toString(),
          poLineItemId: poLine.id.toString(),
          productId: poLine.productId.toString(),
          skuCode: poLine.product.skuCode,
          productName: poLine.product.productName,
          unit: poLine.product.unit,
          orderedQuantity: poLine.quantity,
          receivedQuantity: reqLine.receivedQuantity,
          historicalUnitPrice,
          lineReceivedTotal,
          itemFulfillmentRate,
          createdAt: receiptLine.createdAt.toISOString(),
        });
      }

      // 6d. Chuyển trạng thái đơn mua hàng sang Completed (BR-06)
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: 'Completed',
        },
      });

      // 6e. Cập nhật hiệu suất Nhà cung cấp theo BR-24 (Cửa sổ trượt 5 đơn gần nhất)
      const recentReceipts = await tx.goodsReceipt.findMany({
        where: {
          po: {
            supplierId: po.supplierId,
            status: 'Completed',
          },
        },
        orderBy: [{ actualDeliveryDate: 'desc' }, { id: 'desc' }],
        take: 5,
        select: { orderPerformanceScore: true },
      });

      const agg = await tx.goodsReceipt.aggregate({
        where: {
          po: {
            supplierId: po.supplierId,
            status: 'Completed',
          },
        },
        _avg: { orderPerformanceScore: true },
        _count: { id: true },
      });

      const completedOrderCount = agg._count.id;
      const allTimePerformanceScore = Number(
        Number(agg._avg.orderPerformanceScore ?? 0.8).toFixed(4),
      );

      let performanceScore = 0.8;
      if (completedOrderCount < 3) {
        performanceScore = 0.8; // Cold Start BR-24
      } else {
        const sumRecent = recentReceipts.reduce(
          (sum, item) => sum + Number(item.orderPerformanceScore),
          0,
        );
        performanceScore = Number(
          (sumRecent / recentReceipts.length).toFixed(4),
        );
      }

      await tx.supplier.update({
        where: { id: po.supplierId },
        data: {
          completedOrderCount,
          performanceScore: new Prisma.Decimal(performanceScore),
          allTimePerformanceScore: new Prisma.Decimal(allTimePerformanceScore),
        },
      });

      const performanceLabel = resolvePerformanceLabel(completedOrderCount);

      const supplierPerformance: SupplierPerformanceUpdateDto = {
        supplierId: po.supplierId.toString(),
        completedOrderCount,
        performanceScore,
        allTimePerformanceScore,
        performanceLabel,
      };

      return {
        id: goodsReceipt.id.toString(),
        receiptNumber: goodsReceipt.receiptNumber,
        purchaseOrderId: po.id.toString(),
        poNumber: po.poNumber,
        supplierId: po.supplierId.toString(),
        supplierName: po.supplier.supplierName,
        supplierCode: po.supplier.supplierCode,
        actualDeliveryDate: dto.receiptDate,
        expectedDeliveryDate: po.expectedDeliveryDate
          .toISOString()
          .split('T')[0],
        daysLate,
        isOnTime,
        onTimeFactor,
        overallFulfillmentRate,
        orderPerformanceScore,
        notes: goodsReceipt.notes,
        receivedBy: goodsReceipt.receivedBy,
        createdAt: goodsReceipt.createdAt.toISOString(),
        lines: createdLines,
        supplierPerformance,
      };
    });

    this.logger.log(
      `Đã ghi nhận thành công Phiếu nhận hàng ${result.receiptNumber} cho PO ${po.poNumber}. Đơn hàng đã đóng Completed.`,
    );

    return result;
  }

  /**
   * Xem chi tiết Phiếu nhận hàng kho theo ID.
   */
  async findOne(
    id: string | number | bigint,
  ): Promise<GoodsReceiptResponseDto> {
    const grId = BigInt(id);
    const gr = await this.prisma.goodsReceipt.findUnique({
      where: { id: grId },
      include: {
        po: {
          include: {
            supplier: true,
          },
        },
        lineItems: {
          include: {
            product: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!gr) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Phiếu nhận hàng với ID ${id} không tồn tại.`,
      });
    }

    const lines: ReceiptLineItemResponseDto[] = gr.lineItems.map((line) => {
      const historicalUnitPrice = Number(line.historicalUnitPrice);
      const lineReceivedTotal = line.lineReceivedTotal
        ? Number(line.lineReceivedTotal)
        : line.receivedQuantity * historicalUnitPrice;

      return {
        id: line.id.toString(),
        poLineItemId: line.poLineItemId.toString(),
        productId: line.productId.toString(),
        skuCode: line.product.skuCode,
        productName: line.product.productName,
        unit: line.product.unit,
        orderedQuantity: line.orderedQuantity,
        receivedQuantity: line.receivedQuantity,
        historicalUnitPrice,
        lineReceivedTotal,
        itemFulfillmentRate: Number(line.itemFulfillmentRate ?? 1.0),
        createdAt: line.createdAt.toISOString(),
      };
    });

    const supplier = gr.po.supplier;
    const performanceLabel = resolvePerformanceLabel(
      supplier.completedOrderCount,
    );

    return {
      id: gr.id.toString(),
      receiptNumber: gr.receiptNumber,
      purchaseOrderId: gr.po.id.toString(),
      poNumber: gr.po.poNumber,
      supplierId: supplier.id.toString(),
      supplierName: supplier.supplierName,
      supplierCode: supplier.supplierCode,
      actualDeliveryDate: gr.actualDeliveryDate.toISOString().split('T')[0],
      expectedDeliveryDate: gr.po.expectedDeliveryDate
        .toISOString()
        .split('T')[0],
      daysLate: gr.daysLate,
      isOnTime: gr.daysLate === 0,
      onTimeFactor: Number(gr.onTimeFactor),
      overallFulfillmentRate: Number(gr.overallFulfillmentRate),
      orderPerformanceScore: Number(gr.orderPerformanceScore),
      notes: gr.notes,
      receivedBy: gr.receivedBy,
      createdAt: gr.createdAt.toISOString(),
      lines,
      supplierPerformance: {
        supplierId: supplier.id.toString(),
        completedOrderCount: supplier.completedOrderCount,
        performanceScore: Number(supplier.performanceScore),
        allTimePerformanceScore: Number(supplier.allTimePerformanceScore),
        performanceLabel,
      },
    };
  }
}
