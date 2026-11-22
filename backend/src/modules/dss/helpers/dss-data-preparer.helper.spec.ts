import { DssDataPreparerHelper } from './dss-data-preparer.helper';
import { Prisma } from '@prisma/client';

describe('DssDataPreparerHelper', () => {
  describe('resolveDateRange', () => {
    it('should calculate 90-day window correctly from asOfDate', () => {
      const res = DssDataPreparerHelper.resolveDateRange('2026-11-14');
      expect(res.effectiveUtc).toEqual(new Date('2026-11-14T00:00:00.000Z'));
      expect(res.ninetyDaysAgoUtc).toEqual(
        new Date('2026-08-16T00:00:00.000Z'),
      );
      expect(res.historyStartDateStr).toBe('2026-08-16');
      expect(res.historyDays).toBe(90);
    });
  });

  describe('aggregateSalesRecords', () => {
    it('should aggregate revenue and quantities by product id', () => {
      const products = [{ id: BigInt(1) }, { id: BigInt(2) }];
      const sales = [
        {
          productId: BigInt(1),
          revenue: new Prisma.Decimal(100000),
          quantitySold: 5,
          saleDate: new Date('2026-09-01'),
        },
        {
          productId: BigInt(1),
          revenue: new Prisma.Decimal(200000),
          quantitySold: 10,
          saleDate: new Date('2026-09-02'),
        },
      ];

      const map = DssDataPreparerHelper.aggregateSalesRecords(products, sales);
      const p1 = map.get('1')!;
      expect(p1.totalRevenue).toBe(300000);
      expect(p1.totalQty).toBe(15);
      expect(p1.records.length).toBe(2);
      expect(p1.distinctDates.size).toBe(2);

      const p2 = map.get('2')!;
      expect(p2.totalRevenue).toBe(0);
      expect(p2.totalQty).toBe(0);
    });
  });

  describe('mapStockoutDatesByProduct', () => {
    it('should map stockout snapshot dates grouped by product', () => {
      const snaps = [
        { productId: BigInt(1), snapshotDate: new Date('2026-09-05T00:00:00Z') },
        { productId: BigInt(1), snapshotDate: new Date('2026-09-10T00:00:00Z') },
        { productId: BigInt(2), snapshotDate: new Date('2026-09-12T00:00:00Z') },
      ];
      const res = DssDataPreparerHelper.mapStockoutDatesByProduct(snaps);
      expect(res.get('1')).toEqual(['2026-09-05', '2026-09-10']);
      expect(res.get('2')).toEqual(['2026-09-12']);
    });
  });
});
