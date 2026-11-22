import { Prisma } from '@prisma/client';
import {
  AbcXyzClassificationResult,
  SupplierCandidateInput,
  WsmWeightsInput,
} from '../interfaces/dss-calculation.interface';
import { SkuForecastResult } from '../interfaces/ai-forecasting.interface';
import { DssCalculationEngineService } from '../services/dss-calculation-engine.service';
import { AggregatedProductSales } from './dss-data-preparer.helper';

export interface ProductAnalysisEntity {
  id: bigint;
  skuCode: string;
  currentInventory: number;
  onOrderQuantity: number;
  supplyConditions: {
    supplierId: bigint;
    purchasePrice: Prisma.Decimal | number;
    moq: number;
    status: string;
    supplier: {
      supplierCode: string;
      supplierName: string;
      committedLeadTimeDays: number;
      performanceScore: Prisma.Decimal | number;
      completedOrderCount: number;
      status: string;
    } | null;
  }[];
}

export interface RecommendationItemsBuildResult {
  itemsToCreate: Prisma.RecommendationItemCreateManySessionInput[];
  suggestedOrderCount: number;
  totalSuggestedAmount: number;
}

export class DssItemBuilderHelper {
  /**
   * Chạy vòng lặp 5A (WSM, SS, ROP & SOQ, StockRisk) cho toàn bộ danh sách SKU
   * và đóng gói mảng recommendation_items chuẩn bị lưu database.
   */
  static buildRecommendationItems(
    products: ProductAnalysisEntity[],
    salesByProduct: Map<string, AggregatedProductSales>,
    forecastMap: Map<string, SkuForecastResult>,
    abcMap: Map<string, AbcXyzClassificationResult>,
    wsmWeights: WsmWeightsInput,
    config: {
      targetServiceLevel: number;
      zFactor: number;
      reviewPeriodDays: number;
    },
    calcEngine: DssCalculationEngineService,
  ): RecommendationItemsBuildResult {
    let totalSuggestedAmount = 0;
    let suggestedOrderCount = 0;
    const itemsToCreate: Prisma.RecommendationItemCreateManySessionInput[] = [];

    for (const product of products) {
      const pIdStr = product.id.toString();
      const sales = salesByProduct.get(pIdStr)!;
      const forecast = forecastMap.get(pIdStr)!;
      const abcRes = abcMap.get(pIdStr)!;

      // 8a. Lọc NCC hợp lệ và xếp hạng WSM (5A.4)
      const validCandidates: SupplierCandidateInput[] = product.supplyConditions
        .filter((sc) => sc.supplier && sc.supplier.status === 'Active')
        .map((sc) => ({
          supplierId: sc.supplierId,
          supplierCode: sc.supplier!.supplierCode,
          supplierName: sc.supplier!.supplierName,
          purchasePrice: Number(sc.purchasePrice),
          committedLeadTimeDays: sc.supplier!.committedLeadTimeDays,
          moq: sc.moq,
          performanceScore: Number(sc.supplier!.performanceScore),
          completedOrderCount: sc.supplier!.completedOrderCount,
        }));

      const wsmResult = calcEngine.rankSuppliersWsm(
        validCandidates,
        wsmWeights,
      );
      const suggestedSupplier = wsmResult.suggestedSupplier;

      const leadTime = suggestedSupplier
        ? suggestedSupplier.committedLeadTimeDays
        : 1;
      const moq = suggestedSupplier ? suggestedSupplier.moq : 1;
      const unitPrice = suggestedSupplier ? suggestedSupplier.purchasePrice : 0;

      // 8b. Tính Tồn kho an toàn Safety Stock (5A.2)
      const ssResult = calcEngine.calculateSafetyStock({
        avgDailyDemand: forecast.dailyAverage,
        demandStdDev: forecast.dailyDemandStd,
        leadTimeDays: leadTime,
        salesDaysCount: sales.distinctDates.size,
        targetServiceLevel: config.targetServiceLevel,
        zFactor: config.zFactor,
      });

      // 8c. Tính ROP & SOQ (5A.3)
      const ropSoqResult = calcEngine.calculateRopAndSoq({
        forecastedDemand: forecast.dailyAverage,
        leadTimeDays: leadTime,
        safetyStock: ssResult.safetyStock,
        currentInventory: product.currentInventory,
        onOrderQuantity: product.onOrderQuantity,
        reviewPeriodDays: config.reviewPeriodDays,
        moq,
      });

      // 8d. Phân loại rủi ro StockRiskStatus (5A.5)
      const riskResult = calcEngine.classifyStockRisk({
        currentInventory: product.currentInventory,
        onOrderQuantity: product.onOrderQuantity,
        reorderPoint: ropSoqResult.reorderPoint,
        forecastedDemand: forecast.dailyAverage,
        reviewPeriodDays: config.reviewPeriodDays,
        safetyStock: ssResult.safetyStock,
      });

      const suggestedQty = ropSoqResult.suggestedQuantity;
      if (suggestedQty > 0) {
        suggestedOrderCount++;
        totalSuggestedAmount += suggestedQty * unitPrice;
      }

      itemsToCreate.push({
        productId: product.id,
        forecastedDemand: new Prisma.Decimal(forecast.dailyAverage.toFixed(2)),
        dailyForecasts:
          forecast.dailyForecasts as unknown as Prisma.InputJsonValue,
        snapshotCurrentInventory: product.currentInventory,
        snapshotOnOrderQuantity: product.onOrderQuantity,
        safetyStock: ssResult.safetyStock,
        reorderPoint: ropSoqResult.reorderPoint,
        abcXyzGroup: abcRes.badge,
        stockRiskStatus: riskResult.status,
        suggestedQuantity: suggestedQty,
        suggestedSupplierId: wsmResult.suggestedSupplierId
          ? BigInt(wsmResult.suggestedSupplierId)
          : null,
        suggestedSupplierWsmScore: wsmResult.suggestedSupplierScore
          ? new Prisma.Decimal(wsmResult.suggestedSupplierScore.toFixed(4))
          : null,
        supplierRankings:
          wsmResult.rankings as unknown as Prisma.InputJsonValue,
        approvedQuantity: suggestedQty,
        approvedSupplierId: wsmResult.suggestedSupplierId
          ? BigInt(wsmResult.suggestedSupplierId)
          : null,
        isOverridden: false,
        whyBuyExplanation: null,
      });
    }

    return {
      itemsToCreate,
      suggestedOrderCount,
      totalSuggestedAmount,
    };
  }
}
