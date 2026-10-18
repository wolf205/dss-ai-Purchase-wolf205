import { AbcXyzCalculator } from './abc-xyz.calculator';
import { AbcGroup, XyzGroup } from '../enums/abc-xyz.enum';
import { SkuSalesMetricsInput } from '../interfaces/dss-calculation.interface';

describe('AbcXyzCalculator (BR-05)', () => {
  it('should return empty array when input is empty or null', () => {
    expect(AbcXyzCalculator.classify([])).toEqual([]);
    expect(
      AbcXyzCalculator.classify(null as unknown as SkuSalesMetricsInput[]),
    ).toEqual([]);
  });

  it('should accurately classify ABC Pareto 80/15/5% and XYZ CV thresholds', () => {
    const items: SkuSalesMetricsInput[] = [
      {
        productId: 1,
        skuCode: 'SKU-01',
        totalRevenue: 45000000,
        avgDailyDemand: 10,
        demandStdDev: 2, // CV = 0.2 <= 0.5 (X)
        salesDaysCount: 60,
      },
      {
        productId: 2,
        skuCode: 'SKU-02',
        totalRevenue: 25000000,
        avgDailyDemand: 10,
        demandStdDev: 4, // CV = 0.4 <= 0.5 (X)
        salesDaysCount: 60,
      },
      {
        productId: 3,
        skuCode: 'SKU-03',
        totalRevenue: 10000000,
        avgDailyDemand: 10,
        demandStdDev: 7, // CV = 0.7 (Y)
        salesDaysCount: 60,
      },
      {
        productId: 4,
        skuCode: 'SKU-04',
        totalRevenue: 10000000,
        avgDailyDemand: 10,
        demandStdDev: 8, // CV = 0.8 (Y)
        salesDaysCount: 60,
      },
      {
        productId: 5,
        skuCode: 'SKU-05',
        totalRevenue: 5000000,
        avgDailyDemand: 10,
        demandStdDev: 15, // CV = 1.5 > 1.0 (Z)
        salesDaysCount: 60,
      },
      {
        productId: 6,
        skuCode: 'SKU-06',
        totalRevenue: 2500000,
        avgDailyDemand: 10,
        demandStdDev: 3, // CV = 0.3 <= 0.5 (X)
        salesDaysCount: 60,
      },
      {
        productId: 7,
        skuCode: 'SKU-07',
        totalRevenue: 1500000,
        avgDailyDemand: 10,
        demandStdDev: 9, // CV = 0.9 (Y)
        salesDaysCount: 60,
      },
      {
        productId: 8,
        skuCode: 'SKU-08',
        totalRevenue: 1000000,
        avgDailyDemand: 10,
        demandStdDev: 12, // CV = 1.2 (Z)
        salesDaysCount: 60,
      },
    ];

    const results = AbcXyzCalculator.classify(items);

    expect(results).toHaveLength(8);

    // SKU 1 -> AX
    expect(results[0].skuCode).toBe('SKU-01');
    expect(results[0].abcGroup).toBe(AbcGroup.A);
    expect(results[0].xyzGroup).toBe(XyzGroup.X);
    expect(results[0].badge).toBe('AX');
    expect(results[0].cumRevenuePercentage).toBe(45);
    expect(results[0].isFallback).toBe(false);

    // SKU 2 -> AX
    expect(results[1].skuCode).toBe('SKU-02');
    expect(results[1].abcGroup).toBe(AbcGroup.A);
    expect(results[1].xyzGroup).toBe(XyzGroup.X);
    expect(results[1].badge).toBe('AX');
    expect(results[1].cumRevenuePercentage).toBe(70);

    // SKU 3 -> AY
    expect(results[2].skuCode).toBe('SKU-03');
    expect(results[2].abcGroup).toBe(AbcGroup.A);
    expect(results[2].xyzGroup).toBe(XyzGroup.Y);
    expect(results[2].badge).toBe('AY');
    expect(results[2].cumRevenuePercentage).toBe(80);

    // SKU 4 -> BY
    expect(results[3].skuCode).toBe('SKU-04');
    expect(results[3].abcGroup).toBe(AbcGroup.B);
    expect(results[3].xyzGroup).toBe(XyzGroup.Y);
    expect(results[3].badge).toBe('BY');
    expect(results[3].cumRevenuePercentage).toBe(90);

    // SKU 5 -> BZ
    expect(results[4].skuCode).toBe('SKU-05');
    expect(results[4].abcGroup).toBe(AbcGroup.B);
    expect(results[4].xyzGroup).toBe(XyzGroup.Z);
    expect(results[4].badge).toBe('BZ');
    expect(results[4].cumRevenuePercentage).toBe(95);

    // SKU 6 -> CX
    expect(results[5].skuCode).toBe('SKU-06');
    expect(results[5].abcGroup).toBe(AbcGroup.C);
    expect(results[5].xyzGroup).toBe(XyzGroup.X);
    expect(results[5].badge).toBe('CX');
    expect(results[5].cumRevenuePercentage).toBe(97.5);

    // SKU 7 -> CY
    expect(results[6].skuCode).toBe('SKU-07');
    expect(results[6].abcGroup).toBe(AbcGroup.C);
    expect(results[6].xyzGroup).toBe(XyzGroup.Y);
    expect(results[6].badge).toBe('CY');
    expect(results[6].cumRevenuePercentage).toBe(99);

    // SKU 8 -> CZ
    expect(results[7].skuCode).toBe('SKU-08');
    expect(results[7].abcGroup).toBe(AbcGroup.C);
    expect(results[7].xyzGroup).toBe(XyzGroup.Z);
    expect(results[7].badge).toBe('CZ');
    expect(results[7].cumRevenuePercentage).toBe(100);
  });

  it('should test exact CV boundary thresholds for X, Y, Z', () => {
    const items: SkuSalesMetricsInput[] = [
      {
        productId: 101,
        skuCode: 'BOUNDARY-X',
        totalRevenue: 50000,
        avgDailyDemand: 10,
        demandStdDev: 5,
        salesDaysCount: 30,
      },
      {
        productId: 102,
        skuCode: 'BOUNDARY-Y',
        totalRevenue: 30000,
        avgDailyDemand: 10,
        demandStdDev: 10,
        salesDaysCount: 30,
      },
      {
        productId: 103,
        skuCode: 'BOUNDARY-Z',
        totalRevenue: 20000,
        avgDailyDemand: 10,
        demandStdDev: 10.1,
        salesDaysCount: 30,
      },
    ];

    const results = AbcXyzCalculator.classify(items);

    const itemX = results.find((r) => r.skuCode === 'BOUNDARY-X');
    const itemY = results.find((r) => r.skuCode === 'BOUNDARY-Y');
    const itemZ = results.find((r) => r.skuCode === 'BOUNDARY-Z');

    expect(itemX?.xyzGroup).toBe(XyzGroup.X);
    expect(itemX?.cv).toBe(0.5);

    expect(itemY?.xyzGroup).toBe(XyzGroup.Y);
    expect(itemY?.cv).toBe(1.0);

    expect(itemZ?.xyzGroup).toBe(XyzGroup.Z);
    expect(itemZ?.cv).toBe(1.01);
  });

  it('should fallback to CZ when SKU sales days < 7 (BR-05 Fallback)', () => {
    const items: SkuSalesMetricsInput[] = [
      {
        productId: 201,
        skuCode: 'NEW-SKU-HIGH-REV',
        totalRevenue: 100000000,
        avgDailyDemand: 50,
        demandStdDev: 2,
        salesDaysCount: 5,
      },
      {
        productId: 202,
        skuCode: 'STABLE-SKU',
        totalRevenue: 20000000,
        avgDailyDemand: 10,
        demandStdDev: 3,
        salesDaysCount: 30,
      },
    ];

    const results = AbcXyzCalculator.classify(items);
    const newSkuResult = results.find((r) => r.skuCode === 'NEW-SKU-HIGH-REV');

    expect(newSkuResult?.isFallback).toBe(true);
    expect(newSkuResult?.abcGroup).toBe(AbcGroup.C);
    expect(newSkuResult?.xyzGroup).toBe(XyzGroup.Z);
    expect(newSkuResult?.badge).toBe('CZ');
    expect(newSkuResult?.fallbackReason).toContain('under 7 days');
  });

  it('should fallback to CZ when SKU revenue is 0 or negative', () => {
    const items: SkuSalesMetricsInput[] = [
      {
        productId: 301,
        skuCode: 'ZERO-REV-SKU',
        totalRevenue: 0,
        avgDailyDemand: 0,
        demandStdDev: 0,
        salesDaysCount: 30,
      },
      {
        productId: 302,
        skuCode: 'NORMAL-SKU',
        totalRevenue: 50000000,
        avgDailyDemand: 10,
        demandStdDev: 2,
        salesDaysCount: 30,
      },
    ];

    const results = AbcXyzCalculator.classify(items);
    const zeroRevResult = results.find((r) => r.skuCode === 'ZERO-REV-SKU');

    expect(zeroRevResult?.isFallback).toBe(true);
    expect(zeroRevResult?.abcGroup).toBe(AbcGroup.C);
    expect(zeroRevResult?.xyzGroup).toBe(XyzGroup.Z);
    expect(zeroRevResult?.badge).toBe('CZ');
    expect(zeroRevResult?.fallbackReason).toContain('zero or negative revenue');
  });

  it('should handle single SKU store correctly (100% revenue -> A)', () => {
    const items: SkuSalesMetricsInput[] = [
      {
        productId: BigInt(999),
        skuCode: 'ONLY-SKU',
        totalRevenue: 10000000,
        avgDailyDemand: 5,
        demandStdDev: 1,
        salesDaysCount: 15,
      },
    ];

    const results = AbcXyzCalculator.classify(items);
    expect(results).toHaveLength(1);
    expect(results[0].abcGroup).toBe(AbcGroup.A);
    expect(results[0].xyzGroup).toBe(XyzGroup.X);
    expect(results[0].badge).toBe('AX');
    expect(results[0].cumRevenuePercentage).toBe(100);
    expect(results[0].isFallback).toBe(false);
  });

  it('should assign Z when average daily demand is 0 or negative', () => {
    const items: SkuSalesMetricsInput[] = [
      {
        productId: 401,
        skuCode: 'ZERO-AVG-DEMAND',
        totalRevenue: 1000000,
        avgDailyDemand: 0,
        demandStdDev: 5,
        salesDaysCount: 20,
      },
    ];

    const results = AbcXyzCalculator.classify(items);
    expect(results[0].xyzGroup).toBe(XyzGroup.Z);
    expect(results[0].cv).toBe(0);
  });

  it('should handle store with 0 total revenue safely', () => {
    const items: SkuSalesMetricsInput[] = [
      {
        productId: 501,
        skuCode: 'ALL-ZERO-1',
        totalRevenue: 0,
        avgDailyDemand: 0,
        demandStdDev: 0,
        salesDaysCount: 0,
      },
      {
        productId: 502,
        skuCode: 'ALL-ZERO-2',
        totalRevenue: 0,
        avgDailyDemand: 0,
        demandStdDev: 0,
        salesDaysCount: 1,
      },
    ];

    const results = AbcXyzCalculator.classify(items);
    expect(results).toHaveLength(2);
    expect(results[0].badge).toBe('CZ');
    expect(results[1].badge).toBe('CZ');
    expect(results[0].isFallback).toBe(true);
    expect(results[1].isFallback).toBe(true);
  });
});
