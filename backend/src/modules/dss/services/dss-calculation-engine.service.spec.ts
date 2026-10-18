import { Test, TestingModule } from '@nestjs/testing';
import { DssCalculationEngineService } from './dss-calculation-engine.service';
import { AbcGroup, XyzGroup } from '../enums/abc-xyz.enum';
import { StockRiskStatus } from '../enums/stock-risk.enum';
import { SkuSalesMetricsInput } from '../interfaces/dss-calculation.interface';

describe('DssCalculationEngineService (Facade Integration)', () => {
  let service: DssCalculationEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DssCalculationEngineService],
    }).compile();

    service = module.get<DssCalculationEngineService>(
      DssCalculationEngineService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate classifyAbcXyz to AbcXyzCalculator', () => {
    const items: SkuSalesMetricsInput[] = [
      {
        productId: 1,
        skuCode: 'SKU-01',
        totalRevenue: 1000000,
        avgDailyDemand: 10,
        demandStdDev: 2,
        salesDaysCount: 30,
      },
    ];

    const results = service.classifyAbcXyz(items);
    expect(results).toHaveLength(1);
    expect(results[0].abcGroup).toBe(AbcGroup.A);
    expect(results[0].xyzGroup).toBe(XyzGroup.X);
    expect(results[0].badge).toBe('AX');
  });

  it('should delegate mapServiceLevelToZ to SafetyStockCalculator', () => {
    expect(service.mapServiceLevelToZ(0.95)).toBe(1.65);
    expect(service.mapServiceLevelToZ(0.9)).toBe(1.28);
  });

  it('should delegate calculateSafetyStock to SafetyStockCalculator', () => {
    const result = service.calculateSafetyStock({
      avgDailyDemand: 10,
      demandStdDev: 4,
      leadTimeDays: 4,
      salesDaysCount: 30,
      targetServiceLevel: 0.95,
    });

    expect(result.safetyStock).toBe(14);
    expect(result.rawSafetyStock).toBe(13.2);
    expect(result.isFallback).toBe(false);
  });

  it('should delegate calculateRopAndSoq to RopSoqCalculator', () => {
    const result = service.calculateRopAndSoq({
      forecastedDemand: 5,
      leadTimeDays: 2,
      safetyStock: 4,
      currentInventory: 6,
      onOrderQuantity: 0,
      reviewPeriodDays: 7,
      moq: 10,
    });

    expect(result.reorderPoint).toBe(14);
    expect(result.inventoryPosition).toBe(6);
    expect(result.suggestedQuantity).toBe(43);
    expect(result.isOrderRequired).toBe(true);
  });

  it('should delegate rankSuppliersWsm to WsmRankingCalculator', () => {
    const result = service.rankSuppliersWsm([
      {
        supplierId: 10,
        purchasePrice: 1000,
        committedLeadTimeDays: 2,
        moq: 10,
      },
    ]);

    expect(result.suggestedSupplierId).toBe(10);
    expect(result.rankings).toHaveLength(1);
    expect(result.suggestedSupplier?.priceScore).toBe(100);
  });

  it('should delegate classifyStockRisk to StockRiskCalculator', () => {
    const result = service.classifyStockRisk({
      currentInventory: 0,
      onOrderQuantity: 5,
      reorderPoint: 10,
      forecastedDemand: 2,
    });

    expect(result.status).toBe(StockRiskStatus.CRITICAL);
    expect(result.label).toBe('🔴 Cần mua gấp');
  });
});
