import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateRecommendationItemDto } from '../dto/update-recommendation-item.dto';
import {
  DailyForecastDto,
  RecommendationItemDetailDto,
  SuggestedSupplierDetailDto,
  SupplierRankingDto,
} from '../dto/dss-session-detail-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class DssItemAdjustmentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Điều chỉnh số lượng và nhà cung cấp được duyệt (Human Adjustment)
   * PATCH /api/v1/dss/items/:itemId
   */
  async updateItem(
    itemId: number,
    dto: UpdateRecommendationItemDto,
  ): Promise<RecommendationItemDetailDto> {
    if (
      dto.approvedQuantity === undefined &&
      dto.approvedSupplierId === undefined
    ) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'Cần cung cấp ít nhất một trường approvedQuantity hoặc approvedSupplierId để điều chỉnh',
      });
    }

    const item = await this.prisma.recommendationItem.findUnique({
      where: { id: BigInt(itemId) },
      include: {
        session: true,
        product: {
          include: {
            category: true,
            supplyConditions: {
              where: { status: 'Active' },
              include: { supplier: true },
            },
          },
        },
        suggestedSupplier: true,
      },
    });

    if (!item) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy mặt hàng đề xuất với ID ${itemId}`,
      });
    }

    // Kiểm tra trạng thái phiên Draft (INV-REC-03)
    if (item.session.status !== 'Draft') {
      throw new BadRequestException({
        code: 'SESSION_NOT_IN_DRAFT',
        message:
          'Chỉ có thể điều chỉnh mặt hàng trong phiên phân tích ở trạng thái Draft',
      });
    }

    // Nếu thay đổi nhà cung cấp, kiểm tra xem NCC đó có cung ứng sản phẩm này không
    if (dto.approvedSupplierId !== undefined) {
      const activeCondition = item.product.supplyConditions.find(
        (sc) =>
          Number(sc.supplierId) === dto.approvedSupplierId &&
          sc.supplier &&
          sc.supplier.status === 'Active',
      );

      if (!activeCondition) {
        throw new BadRequestException({
          code: 'INVALID_SUPPLIER',
          message: `Nhà cung cấp ID ${dto.approvedSupplierId} không cung cấp sản phẩm này hoặc không ở trạng thái Active`,
        });
      }
    }

    const newApprovedQty =
      dto.approvedQuantity !== undefined
        ? dto.approvedQuantity
        : item.approvedQuantity;
    const newApprovedSupId =
      dto.approvedSupplierId !== undefined
        ? BigInt(dto.approvedSupplierId)
        : item.approvedSupplierId;

    // Xác định cờ can thiệp người dùng (isOverridden)
    const isOverridden =
      newApprovedQty !== item.suggestedQuantity ||
      newApprovedSupId?.toString() !== item.suggestedSupplierId?.toString();

    // Thực hiện cập nhật item và tính lại tổng tiền phiên trong Transaction
    const updatedItem = await this.prisma.$transaction(async (tx) => {
      const savedItem = await tx.recommendationItem.update({
        where: { id: item.id },
        data: {
          approvedQuantity: newApprovedQty,
          approvedSupplierId: newApprovedSupId,
          isOverridden,
        },
        include: {
          product: {
            include: { category: true },
          },
          suggestedSupplier: true,
        },
      });

      // Tính lại totalApprovedAmount cho session
      const allSessionItems = await tx.recommendationItem.findMany({
        where: { sessionId: item.sessionId },
        select: {
          productId: true,
          approvedQuantity: true,
          approvedSupplierId: true,
          supplierRankings: true,
        },
      });

      let totalApprovedAmount = 0;
      for (const sItem of allSessionItems) {
        if (sItem.approvedQuantity > 0 && sItem.approvedSupplierId) {
          let unitPrice = 0;
          if (Array.isArray(sItem.supplierRankings)) {
            const ranking = (
              sItem.supplierRankings as Record<string, unknown>[]
            ).find(
              (r) => Number(r.supplierId) === Number(sItem.approvedSupplierId),
            );
            if (ranking) {
              unitPrice = Number(ranking.purchasePrice ?? ranking.price ?? 0);
            }
          }

          if (unitPrice === 0) {
            const sc = await tx.supplyCondition.findFirst({
              where: {
                productId: sItem.productId,
                supplierId: sItem.approvedSupplierId,
                status: 'Active',
              },
            });
            if (sc) {
              unitPrice = Number(sc.purchasePrice);
            }
          }

          totalApprovedAmount += sItem.approvedQuantity * unitPrice;
        }
      }

      await tx.recommendationSession.update({
        where: { id: item.sessionId },
        data: {
          totalApprovedAmount: new Prisma.Decimal(
            totalApprovedAmount.toFixed(2),
          ),
        },
      });

      return savedItem;
    });

    return this.mapToItemDetailDto(updatedItem);
  }

  private mapToItemDetailDto(
    item: Prisma.RecommendationItemGetPayload<{
      include: {
        product: { include: { category: true } };
        suggestedSupplier: true;
      };
    }>,
  ): RecommendationItemDetailDto {
    const rankings = (Array.isArray(item.supplierRankings)
      ? item.supplierRankings
      : []) as unknown as Record<string, unknown>[];

    let suggestedSupplier: SuggestedSupplierDetailDto | null = null;

    if (item.suggestedSupplier) {
      let unitPrice = 0;
      let moq = 1;
      let leadTimeDays = item.suggestedSupplier.committedLeadTimeDays;
      let wsmScore = item.suggestedSupplierWsmScore
        ? Number(item.suggestedSupplierWsmScore)
        : null;

      const matchedRanking = rankings.find(
        (r) => Number(r.supplierId) === Number(item.suggestedSupplierId),
      );

      if (matchedRanking) {
        unitPrice = Number(
          matchedRanking.purchasePrice ?? matchedRanking.price ?? 0,
        );
        moq = Number(matchedRanking.moq ?? 1);
        leadTimeDays = Number(
          matchedRanking.committedLeadTimeDays ??
            matchedRanking.leadTime ??
            leadTimeDays,
        );
        if (wsmScore === null && matchedRanking.wsmScore !== undefined) {
          wsmScore = Number(matchedRanking.wsmScore);
        }
      }

      suggestedSupplier = {
        id: Number(item.suggestedSupplier.id),
        code: item.suggestedSupplier.supplierCode,
        name: item.suggestedSupplier.supplierName,
        leadTimeDays,
        moq,
        unitPrice,
        wsmScore,
      };
    }

    const dailyForecasts = (Array.isArray(item.dailyForecasts)
      ? item.dailyForecasts
      : []) as unknown as DailyForecastDto[];

    const supplierRankings: SupplierRankingDto[] = rankings.map((r) => ({
      supplierId: Number(r.supplierId),
      name: String(r.supplierName ?? r.name ?? ''),
      score: Number(r.wsmScore ?? r.score ?? 0),
      price: Number(r.purchasePrice ?? r.price ?? 0),
      leadTime: Number(r.committedLeadTimeDays ?? r.leadTime ?? 0),
      moq: r.moq !== undefined ? Number(r.moq) : undefined,
    }));

    const group = item.abcXyzGroup || 'CZ';
    const abc = group.length > 0 ? group[0] : 'C';
    const xyz = group.length > 1 ? group[1] : 'Z';

    return {
      itemId: Number(item.id),
      skuId: Number(item.productId),
      skuCode: item.product.skuCode,
      skuName: item.product.productName,
      categoryName: item.product.category?.categoryName || 'Chưa phân loại',
      abcClassification: abc,
      xyzClassification: xyz,
      abcXyzBadge: group,
      currentInventory: item.snapshotCurrentInventory,
      onOrderQuantity: item.snapshotOnOrderQuantity,
      reorderPoint: item.reorderPoint,
      safetyStock: item.safetyStock,
      stockRiskStatus: item.stockRiskStatus,
      suggestedQuantity: item.suggestedQuantity,
      approvedQuantity: item.approvedQuantity,
      suggestedSupplier,
      approvedSupplierId: item.approvedSupplierId
        ? Number(item.approvedSupplierId)
        : null,
      dailyForecasts,
      supplierRankings,
      isOverridden: item.isOverridden,
      llmExplanation: item.whyBuyExplanation,
    };
  }
}
