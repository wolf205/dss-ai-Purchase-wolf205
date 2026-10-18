import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApproveSessionResponseDto,
  GeneratedPurchaseOrderDto,
} from '../dto/approve-session-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DssApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Phê duyệt phiên phân tích mua hàng và tự động sinh các đơn PO gom theo NCC (UC-01 - Bước 7)
   * ACID Transaction: Chốt session -> Tạo POs + PO lines -> Tăng on_order_quantity (INV-24..27)
   * POST /api/v1/dss/sessions/:id/approve
   */
  async approveSession(sessionId: number): Promise<ApproveSessionResponseDto> {
    const session = await this.prisma.recommendationSession.findUnique({
      where: { id: BigInt(sessionId) },
      include: {
        items: {
          include: {
            product: {
              include: {
                supplyConditions: {
                  where: { status: 'Active' },
                  include: { supplier: true },
                },
              },
            },
            approvedSupplier: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy phiên phân tích với ID ${sessionId}`,
      });
    }

    // Kiểm tra trạng thái phiên Draft (INV-REC-03)
    if (session.status !== 'Draft') {
      throw new BadRequestException({
        code: 'SESSION_NOT_IN_DRAFT',
        message: 'Chỉ có thể phê duyệt phiên phân tích ở trạng thái Draft',
      });
    }

    // Lọc các mặt hàng có số lượng đặt > 0 và đã chọn nhà cung cấp
    const actionableItems = session.items.filter(
      (item) => item.approvedQuantity > 0 && item.approvedSupplierId !== null,
    );

    // Gom nhóm các mặt hàng theo từng approvedSupplierId (BR-04, INV-25)
    const itemsBySupplier = new Map<string, typeof actionableItems>();

    for (const item of actionableItems) {
      const supIdStr = item.approvedSupplierId!.toString();
      if (!itemsBySupplier.has(supIdStr)) {
        itemsBySupplier.set(supIdStr, []);
      }
      itemsBySupplier.get(supIdStr)!.push(item);
    }

    // Thực thi ACID Transaction toàn vẹn (INV-24, 25, 26, 27)
    const generatedPurchaseOrders = await this.prisma.$transaction(
      async (tx) => {
        // 1. Chốt phiên đề xuất sang Approved (INV-24)
        await tx.recommendationSession.update({
          where: { id: session.id },
          data: {
            status: 'Approved',
            approvedAt: new Date(),
          },
        });

        const poDtos: GeneratedPurchaseOrderDto[] = [];

        // Nếu không có mặt hàng nào cần đặt (AF-1 hoặc toàn bộ SL = 0), kết thúc transaction
        if (itemsBySupplier.size === 0) {
          return poDtos;
        }

        // Tạo tiền tố sinh mã PO theo ngày: PO-YYYYMMDD-
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const prefix = `PO-${yyyy}${mm}${dd}-`;

        let seqCounter = await tx.purchaseOrder.count({
          where: { poNumber: { startsWith: prefix } },
        });

        const approvalDate = new Date();
        approvalDate.setHours(0, 0, 0, 0);

        // 2. Tạo PO cho từng nhóm nhà cung cấp (INV-25)
        for (const [supIdStr, groupItems] of itemsBySupplier.entries()) {
          seqCounter++;
          const poNumber = `${prefix}${String(seqCounter).padStart(3, '0')}`;

          const supplierId = BigInt(supIdStr);
          const supplier =
            groupItems[0].approvedSupplier ||
            groupItems[0].product.supplyConditions.find(
              (sc) => sc.supplierId.toString() === supIdStr,
            )?.supplier;

          const leadTimeDays = supplier?.committedLeadTimeDays ?? 1;
          const supplierName = supplier?.supplierName ?? 'Nhà cung cấp';

          const expectedDeliveryDate = new Date(approvalDate);
          expectedDeliveryDate.setDate(
            expectedDeliveryDate.getDate() + leadTimeDays,
          );

          // Chuẩn bị snapshot cho từng dòng PO Line Item (INV-26)
          let poTotalAmount = 0;
          const linesData: {
            productId: bigint;
            quantity: number;
            unitPrice: number;
            moq: number;
            lineTotal: number;
          }[] = [];

          for (const item of groupItems) {
            let unitPrice = 0;
            let moq = 1;

            if (Array.isArray(item.supplierRankings)) {
              const rankings = item.supplierRankings as Record<
                string,
                unknown
              >[];
              const matched = rankings.find(
                (r) => Number(r.supplierId) === Number(supplierId),
              );
              if (matched) {
                unitPrice = Number(matched.purchasePrice ?? matched.price ?? 0);
                moq = Number(matched.moq ?? 1);
              }
            }

            if (unitPrice === 0) {
              const sc = item.product.supplyConditions.find(
                (c) => c.supplierId.toString() === supIdStr,
              );
              if (sc) {
                unitPrice = Number(sc.purchasePrice);
                moq = sc.moq;
              }
            }

            const lineTotal = item.approvedQuantity * unitPrice;
            poTotalAmount += lineTotal;

            linesData.push({
              productId: item.productId,
              quantity: item.approvedQuantity,
              unitPrice,
              moq,
              lineTotal,
            });
          }

          // Tạo bản ghi PurchaseOrder
          const createdPo = await tx.purchaseOrder.create({
            data: {
              poNumber,
              supplierId,
              sessionId: session.id,
              status: 'Approved',
              approvalDate,
              historicalLeadTimeDays: leadTimeDays,
              expectedDeliveryDate,
              totalAmount: new Prisma.Decimal(poTotalAmount.toFixed(2)),
            },
          });

          // Tạo các dòng POLineItem với snapshot bất biến (INV-26)
          await tx.pOLineItem.createMany({
            data: linesData.map((line) => ({
              poId: createdPo.id,
              productId: line.productId,
              quantity: line.quantity,
              historicalUnitPrice: new Prisma.Decimal(
                line.unitPrice.toFixed(2),
              ),
              historicalMoq: line.moq,
              lineTotal: new Prisma.Decimal(line.lineTotal.toFixed(2)),
            })),
          });

          // 3. Tăng hàng đang về on_order_quantity tại Tầng Ứng Dụng (INV-27)
          for (const line of linesData) {
            await tx.product.update({
              where: { id: line.productId },
              data: {
                onOrderQuantity: {
                  increment: line.quantity,
                },
              },
            });
          }

          poDtos.push({
            poId: Number(createdPo.id),
            poNumber: createdPo.poNumber,
            supplierName,
            totalLines: linesData.length,
            totalAmount: Number(poTotalAmount.toFixed(2)),
            expectedDeliveryDate: expectedDeliveryDate.toISOString(),
          });
        }

        return poDtos;
      },
    );

    return {
      sessionId: Number(session.id),
      generatedPurchaseOrders,
    };
  }
}
