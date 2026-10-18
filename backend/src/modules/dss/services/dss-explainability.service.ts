import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiExplainerClient } from '../clients/gemini-explainer.client';
import { ExplainRecommendationItemResponseDto } from '../dto/explain-item-response.dto';
import { RecommendationExplanationContext } from '../interfaces/explanation-context.interface';

@Injectable()
export class DssExplainabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geminiClient: GeminiExplainerClient,
  ) {}

  /**
   * Sinh giải thích tự nhiên On-demand cho một SKU đề xuất mua hàng (UC-01 - Bước 5)
   * POST /api/v1/dss/items/:itemId/explain
   */
  async explainItem(
    itemId: number,
  ): Promise<ExplainRecommendationItemResponseDto> {
    const item = await this.prisma.recommendationItem.findUnique({
      where: { id: BigInt(itemId) },
      include: {
        product: {
          include: { category: true },
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

    // Cơ chế Cache tầng CSDL: Nếu đã có lời giải thích trước đó, trả về ngay lập tức
    if (item.whyBuyExplanation && item.whyBuyExplanation.trim().length > 0) {
      return {
        itemId: Number(item.id),
        llmExplanation: item.whyBuyExplanation,
      };
    }

    // Trích xuất đơn giá và MOQ từ snapshot supplierRankings
    let purchasePrice = 0;
    let moq = 1;
    let leadTimeDays = item.suggestedSupplier?.committedLeadTimeDays ?? 1;

    if (Array.isArray(item.supplierRankings)) {
      const rankings = item.supplierRankings as Record<string, unknown>[];
      const matched = rankings.find(
        (r) => Number(r.supplierId) === Number(item.suggestedSupplierId),
      );
      if (matched) {
        purchasePrice = Number(matched.purchasePrice ?? matched.price ?? 0);
        moq = Number(matched.moq ?? 1);
        leadTimeDays = Number(
          matched.committedLeadTimeDays ?? matched.leadTime ?? leadTimeDays,
        );
      }
    }

    const context: RecommendationExplanationContext = {
      skuCode: item.product.skuCode,
      productName: item.product.productName,
      categoryName: item.product.category?.categoryName || 'Chưa phân loại',
      unit: item.product.unit || 'sản phẩm',
      abcXyzBadge: item.abcXyzGroup,
      currentInventory: item.snapshotCurrentInventory,
      onOrderQuantity: item.snapshotOnOrderQuantity,
      reorderPoint: item.reorderPoint,
      safetyStock: item.safetyStock,
      stockRiskStatus: item.stockRiskStatus,
      suggestedQuantity: item.suggestedQuantity,
      supplierName:
        item.suggestedSupplier?.supplierName || 'Nhà cung cấp đề xuất',
      purchasePrice,
      leadTimeDays,
      moq,
      wsmScore: item.suggestedSupplierWsmScore
        ? Number(item.suggestedSupplierWsmScore)
        : null,
    };

    // Gọi Gemini Explainer Client (kèm fallback tất định)
    const explanation = await this.geminiClient.explainRecommendation(context);

    // Lưu vào database để cache cho các lần xem tiếp theo
    await this.prisma.recommendationItem.update({
      where: { id: item.id },
      data: { whyBuyExplanation: explanation },
    });

    return {
      itemId: Number(item.id),
      llmExplanation: explanation,
    };
  }
}
