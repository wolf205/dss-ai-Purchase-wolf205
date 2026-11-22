import { DssItemBuilderHelper, ProductAnalysisEntity } from './dss-item-builder.helper';
import { DssCalculationEngineService } from '../services/dss-calculation-engine.service';
import { Prisma } from '@prisma/client';
import { AbcXyzClassificationResult } from '../interfaces/dss-calculation.interface';
import { SkuForecastResult } from '../interfaces/ai-forecasting.interface';
import { AggregatedProductSales } from './dss-data-preparer.helper';

describe('DssItemBuilderHelper', () => {
  let calcEngine: DssCalculationEngineService;

  beforeEach(() => {
    calcEngine = new DssCalculationEngineService();
  });

  it('should build recommendation items and calculate totals correctly', () => {
    const products: ProductAnalysisEntity[] = [
      {
        id: BigInt(1),
        skuCode: 'SKU-001',
        currentInventory: 5,
        onOrderQuantity: 0,
        supplyConditions: [
          {
            supplierId: BigInt(10),
            purchasePrice: new Prisma.Decimal(20000),
            moq: 10,
            status: 'Active',
            supplier: {
              supplierCode: 'NCC-001',
              supplierName: 'Vinamilk',
              committedLeadTimeDays: 2,
              performanceScore: new Prisma.Decimal(90),
              completedOrderCount: 10,
              status: 'Active',
            },
          },
        ],
      },
    ];

    const salesByProduct = new Map<string, AggregatedProductSales>();
    salesByProduct.set('1', {
      totalRevenue: 200000,
      totalQty: 10,
      records: [],
      distinctDates: new Set(['2026-09-01', '2026-09-02']),
    });

    const forecastMap = new Map<string, SkuForecastResult>();
    forecastMap.set('1', {
      dailyAverage: 10,
      dailyDemandStd: 2,
      modelUsed: 'AUTO_ARIMA',
      dailyForecasts: [{ date: '2026-10-01', predicted: 10, lower: 8, upper: 12 }],
    });

    const abcMap = new Map<string, AbcXyzClassificationResult>();
    abcMap.set('1', {
      productId: BigInt(1),
      skuCode: 'SKU-001',
      revenue: 200000,
      cumRevenuePercentage: 100.0,
      abcGroup: 'A' as any,
      xyzGroup: 'X' as any,
      badge: 'AX' as any,
      cv: 0.2,
      isFallback: false,
    });

    const wsmWeights = {
      priceWeight: 0.4,
      leadTimeWeight: 0.2,
      moqWeight: 0.15,
      historyWeight: 0.25,
    };

    const config = {
      targetServiceLevel: 0.95,
      zFactor: 1.65,
      reviewPeriodDays: 7,
    };

    const result = DssItemBuilderHelper.buildRecommendationItems(
      products,
      salesByProduct,
      forecastMap,
      abcMap,
      wsmWeights,
      config,
      calcEngine,
    );

    expect(result.itemsToCreate.length).toBe(1);
    const item = result.itemsToCreate[0];
    expect(item.productId).toBe(BigInt(1));
    expect(item.abcXyzGroup).toBe('AX');
    expect(item.suggestedSupplierId).toBe(BigInt(10));
    expect(result.totalSuggestedAmount).toBeGreaterThanOrEqual(0);
  });
});
