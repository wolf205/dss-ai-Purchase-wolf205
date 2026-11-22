import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DailyForecastDto,
  DssSessionDetailResponseDto,
  RecommendationItemDetailDto,
  SuggestedSupplierDetailDto,
  SupplierRankingDto,
} from '../dto/dss-session-detail-response.dto';
import { DssSessionSummaryItemDto } from '../dto/dss-evaluation.dto';

@Injectable()
export class DssSessionQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy phiên đề xuất mua hàng trạng thái Draft gần nhất (nếu có)
   * GET /api/v1/dss/sessions/active/draft
   */
  async getActiveDraftSession(): Promise<DssSessionDetailResponseDto | null> {
    const session = await this.prisma.recommendationSession.findFirst({
      where: { status: 'Draft' },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return null;
    }

    return this.getSessionById(Number(session.id));
  }

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
          if (
            wsmScore === null &&
            (matchedRanking.totalScore !== undefined ||
              matchedRanking.wsmScore !== undefined)
          ) {
            wsmScore = Number(
              matchedRanking.totalScore ?? matchedRanking.wsmScore,
            );
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
        score: Number(r.totalScore ?? r.wsmScore ?? r.score ?? 0),
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

    // Sắp xếp danh sách đề xuất theo mức độ gấp giảm dần (UC-01 Bước 3.2)
    const RISK_PRIORITY: Record<string, number> = {
      Critical: 1,
      Warning: 2,
      Safe: 3,
      Normal: 3,
      Overstock: 4,
    };
    const ABC_PRIORITY: Record<string, number> = {
      A: 1,
      B: 2,
      C: 3,
    };

    items.sort((a, b) => {
      const pA = RISK_PRIORITY[a.stockRiskStatus] ?? 99;
      const pB = RISK_PRIORITY[b.stockRiskStatus] ?? 99;
      if (pA !== pB) return pA - pB;

      // Trong cùng nhóm Critical hoặc Warning:
      if (pA <= 2) {
        // 1. Ưu tiên mặt hàng có gợi ý mua > 0 lên trước
        const hasOrderA = a.suggestedQuantity > 0 ? 1 : 0;
        const hasOrderB = b.suggestedQuantity > 0 ? 1 : 0;
        if (hasOrderA !== hasOrderB) return hasOrderB - hasOrderA;

        // 2. Ưu tiên mức độ cạn kiệt (tồn kho / ROP càng nhỏ càng nguy cấp)
        const ratioA =
          (a.currentInventory + a.onOrderQuantity) /
          Math.max(1, a.reorderPoint);
        const ratioB =
          (b.currentInventory + b.onOrderQuantity) /
          Math.max(1, b.reorderPoint);
        if (ratioA !== ratioB) return ratioA - ratioB;

        // 3. Ưu tiên nhóm hàng A > B > C
        const abcA = ABC_PRIORITY[a.abcClassification] ?? 9;
        const abcB = ABC_PRIORITY[b.abcClassification] ?? 9;
        if (abcA !== abcB) return abcA - abcB;
      }

      return a.skuCode.localeCompare(b.skuCode);
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

  /**
   * Lấy danh sách toàn bộ các phiên phân tích mua hàng DSS
   * GET /api/v1/dss/sessions
   */
  async getAllSessions(): Promise<DssSessionSummaryItemDto[]> {
    const sessions = await this.prisma.recommendationSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        sessionCode: true,
        scope: true,
        status: true,
        totalSuggestedAmount: true,
        totalApprovedAmount: true,
        createdBy: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    return sessions.map((s) => ({
      id: s.id.toString(),
      sessionCode: s.sessionCode,
      scope: s.scope,
      status: s.status,
      totalSuggestedAmount: Number(s.totalSuggestedAmount),
      totalApprovedAmount: Number(s.totalApprovedAmount),
      createdBy: s.createdBy,
      approvedAt: s.approvedAt ? s.approvedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    }));
  }
}
