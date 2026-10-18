import { SafetyStockCalculator } from './safety-stock.calculator';

describe('SafetyStockCalculator (BR-01, BR-26)', () => {
  describe('mapServiceLevelToZ (BR-26)', () => {
    it('should map 4 standard discrete Service Levels to exact Z-factors', () => {
      expect(SafetyStockCalculator.mapServiceLevelToZ(0.9)).toBe(1.28);
      expect(SafetyStockCalculator.mapServiceLevelToZ(0.95)).toBe(1.65);
      expect(SafetyStockCalculator.mapServiceLevelToZ(0.98)).toBe(2.05);
      expect(SafetyStockCalculator.mapServiceLevelToZ(0.99)).toBe(2.33);
    });

    it('should support percentage notation (e.g. 90, 95, 98, 99)', () => {
      expect(SafetyStockCalculator.mapServiceLevelToZ(90)).toBe(1.28);
      expect(SafetyStockCalculator.mapServiceLevelToZ(95)).toBe(1.65);
      expect(SafetyStockCalculator.mapServiceLevelToZ(98)).toBe(2.05);
      expect(SafetyStockCalculator.mapServiceLevelToZ(99)).toBe(2.33);
    });

    it('should default to 1.65 (95% SL) when undefined or unmapped', () => {
      expect(SafetyStockCalculator.mapServiceLevelToZ(undefined)).toBe(1.65);
      expect(
        SafetyStockCalculator.mapServiceLevelToZ(null as unknown as number),
      ).toBe(1.65);
      expect(SafetyStockCalculator.mapServiceLevelToZ(0.85)).toBe(1.65);
    });
  });

  describe('calculate (BR-01)', () => {
    it('should compute standard SS = Z * sigma_d * sqrt(L) with ceil rounding', () => {
      const result1 = SafetyStockCalculator.calculate({
        avgDailyDemand: 10,
        demandStdDev: 4,
        leadTimeDays: 4,
        salesDaysCount: 30,
        targetServiceLevel: 0.95,
      });

      expect(result1.safetyStock).toBe(14);
      expect(result1.rawSafetyStock).toBe(13.2);
      expect(result1.zFactor).toBe(1.65);
      expect(result1.isFallback).toBe(false);

      const result2 = SafetyStockCalculator.calculate({
        avgDailyDemand: 15,
        demandStdDev: 5,
        leadTimeDays: 9,
        salesDaysCount: 20,
        targetServiceLevel: 0.98,
      });

      expect(result2.safetyStock).toBe(31);
      expect(result2.rawSafetyStock).toBe(30.75);
      expect(result2.zFactor).toBe(2.05);
      expect(result2.isFallback).toBe(false);
    });

    it('should support direct zFactor override', () => {
      const result = SafetyStockCalculator.calculate({
        avgDailyDemand: 10,
        demandStdDev: 3,
        leadTimeDays: 16,
        salesDaysCount: 30,
        zFactor: 2.0,
      });

      expect(result.safetyStock).toBe(24);
      expect(result.rawSafetyStock).toBe(24.0);
      expect(result.zFactor).toBe(2.0);
      expect(result.isFallback).toBe(false);
    });

    it('should trigger fallback formula when salesDaysCount < 14 (BR-01 Fallback)', () => {
      const result = SafetyStockCalculator.calculate({
        avgDailyDemand: 8,
        demandStdDev: 10,
        leadTimeDays: 7,
        salesDaysCount: 10,
        targetServiceLevel: 0.95,
      });

      expect(result.isFallback).toBe(true);
      expect(result.safetyStock).toBe(40);
      expect(result.rawSafetyStock).toBe(40.0);
      expect(result.fallbackReason).toContain('under 14 days');
    });

    it('should support custom safetyDaysFallback for new SKU', () => {
      const result = SafetyStockCalculator.calculate({
        avgDailyDemand: 6.2,
        demandStdDev: 2,
        leadTimeDays: 5,
        salesDaysCount: 5,
        safetyDaysFallback: 7,
      });

      expect(result.isFallback).toBe(true);
      expect(result.safetyStock).toBe(44);
      expect(result.rawSafetyStock).toBe(43.4);
    });

    it('should apply standard formula at exact boundary salesDaysCount = 14', () => {
      const result = SafetyStockCalculator.calculate({
        avgDailyDemand: 10,
        demandStdDev: 2,
        leadTimeDays: 4,
        salesDaysCount: 14,
        targetServiceLevel: 0.95,
      });

      expect(result.isFallback).toBe(false);
      expect(result.safetyStock).toBe(7);
      expect(result.rawSafetyStock).toBe(6.6);
    });

    it('should handle zero demand variations and edge cases safely', () => {
      const zeroStdDevResult = SafetyStockCalculator.calculate({
        avgDailyDemand: 20,
        demandStdDev: 0,
        leadTimeDays: 5,
        salesDaysCount: 30,
      });
      expect(zeroStdDevResult.safetyStock).toBe(0);
      expect(zeroStdDevResult.rawSafetyStock).toBe(0);

      const zeroLtResult = SafetyStockCalculator.calculate({
        avgDailyDemand: 10,
        demandStdDev: 2,
        leadTimeDays: 0,
        salesDaysCount: 30,
        zFactor: 1.5,
      });
      expect(zeroLtResult.safetyStock).toBe(3);
    });
  });
});
