import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DailyForecastDto,
  DssSessionDetailResponseDto,
  RecommendationItemDetailDto,
  SuggestedSupplierDetailDto,
  SupplierRankingDto,
} from '../dto/dss-session-detail-response.dto';

@Injectable()
export class DssSessionQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy chi tiết phiên phân tích và bảng danh sách các mặt hàng đề xuất mua (UC-01)
   * GET /api/v1/dss/sessions/:id
   */
  async getSessionById(id: number): Promise<DssSessionDetailResponseDto> {
    const session = await this.prisma.recommendationSession.findUnique({
      where: { id: BigInt(id) },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            suggestedSupplier: true,
          },
          orderBy: [{ id: 'asc' }],
        },
      },
    });

    if (!session) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy phiên phân tích với ID ${id}`,
      });
    }

    const items: RecommendationItemDetailDto[] = session.items.map((item) => {
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
    });

    return {
      sessionId: Number(session.id),
      sessionCode: session.sessionCode,
      status: session.status,
      categoryId: session.categoryId ? Number(session.categoryId) : null,
      scope: session.scope,
      totalSuggestedAmount: Number(session.totalSuggestedAmount),
      totalApprovedAmount: Number(session.totalApprovedAmount),
      createdAt: session.createdAt.toISOString(),
      items,
    };
  }
}
