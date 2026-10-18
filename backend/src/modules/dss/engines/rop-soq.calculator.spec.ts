import { RopSoqCalculator } from './rop-soq.calculator';

describe('RopSoqCalculator (BR-01, BR-03)', () => {
  it('should not suggest order when inventory position IP >= ROP', () => {
    // d = 5, L = 2, SS = 4 -> ROP = ceil(5*2 + 4) = 14
    // onHand = 10, onOrder = 5 -> IP = 15 > 14
    const result = RopSoqCalculator.calculate({
      forecastedDemand: 5,
      leadTimeDays: 2,
      safetyStock: 4,
      currentInventory: 10,
      onOrderQuantity: 5,
      reviewPeriodDays: 7,
      moq: 10,
    });

    expect(result.reorderPoint).toBe(14);
    expect(result.inventoryPosition).toBe(15);
    expect(result.netRequirement).toBe(-1);
    expect(result.baseSoq).toBe(0);
    expect(result.suggestedQuantity).toBe(0);
    expect(result.isOrderRequired).toBe(false);
    expect(result.moqApplied).toBe(false);
  });

  it('should compute exact SOQ when IP < ROP and Base SOQ > MOQ', () => {
    // d = 5, L = 2, R = 7, SS = 4
    // ROP = 5*2 + 4 = 14
    // Target Stock = 5 * (2 + 7) + 4 = 49
    // onHand = 6, onOrder = 0 -> IP = 6 < 14
    // Base SOQ = 49 - 6 = 43
    // MOQ = 10 -> Final SOQ = max(10, 43) = 43
    const result = RopSoqCalculator.calculate({
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
    expect(result.netRequirement).toBe(8);
    expect(result.targetStock).toBe(49);
    expect(result.baseSoq).toBe(43);
    expect(result.suggestedQuantity).toBe(43);
    expect(result.isOrderRequired).toBe(true);
    expect(result.moqApplied).toBe(false);
  });

  it('should lift SOQ up to MOQ when Base SOQ < MOQ (BR-03)', () => {
    // d = 1, L = 2, R = 7, SS = 2
    // ROP = 1*2 + 2 = 4
    // Target Stock = 1 * (2 + 7) + 2 = 11
    // onHand = 3, onOrder = 0 -> IP = 3 < 4
    // Base SOQ = 11 - 3 = 8
    // MOQ = 24 -> Final SOQ = max(24, 8) = 24
    const result = RopSoqCalculator.calculate({
      forecastedDemand: 1,
      leadTimeDays: 2,
      safetyStock: 2,
      currentInventory: 3,
      onOrderQuantity: 0,
      reviewPeriodDays: 7,
      moq: 24,
    });

    expect(result.reorderPoint).toBe(4);
    expect(result.inventoryPosition).toBe(3);
    expect(result.baseSoq).toBe(8);
    expect(result.suggestedQuantity).toBe(24);
    expect(result.isOrderRequired).toBe(true);
    expect(result.moqApplied).toBe(true);
  });

  it('should round up to Pack Size multiples according to BR-03', () => {
    // Target Stock - IP = 22
    // Pack size = 12 (thùng 12 cái), MOQ = 12
    // ceil(22 / 12) * 12 = 2 * 12 = 24
    const result = RopSoqCalculator.calculate({
      forecastedDemand: 3,
      leadTimeDays: 2,
      safetyStock: 4,
      currentInventory: 9,
      onOrderQuantity: 0,
      reviewPeriodDays: 7,
      moq: 12,
      packSize: 12,
    });

    // ROP = 3*2 + 4 = 10. IP = 9 < 10
    // Target Stock = 3*(2+7) + 4 = 31.
    // Base SOQ = 31 - 9 = 22
    // Pack rounded = ceil(22/12)*12 = 24
    expect(result.baseSoq).toBe(22);
    expect(result.suggestedQuantity).toBe(24);
    expect(result.isOrderRequired).toBe(true);
  });

  it('should ceiling-round fractional ROP properly', () => {
    // d = 2.4, L = 3, SS = 5
    // rawROP = 2.4*3 + 5 = 12.2 -> ceil = 13
    const result = RopSoqCalculator.calculate({
      forecastedDemand: 2.4,
      leadTimeDays: 3,
      safetyStock: 5,
      currentInventory: 13,
      onOrderQuantity: 0,
    });

    expect(result.reorderPoint).toBe(13);
    expect(result.inventoryPosition).toBe(13);
    expect(result.isOrderRequired).toBe(false);
  });

  it('should handle zero demand and edge cases gracefully', () => {
    // d = 0, SS = 10 -> ROP = 10, Target = 10
    // onHand = 5 -> IP = 5 < 10 -> Base SOQ = 5
    const result = RopSoqCalculator.calculate({
      forecastedDemand: 0,
      leadTimeDays: 2,
      safetyStock: 10,
      currentInventory: 5,
      onOrderQuantity: 0,
      moq: 1,
    });

    expect(result.reorderPoint).toBe(10);
    expect(result.targetStock).toBe(10);
    expect(result.baseSoq).toBe(5);
    expect(result.suggestedQuantity).toBe(5);
    expect(result.isOrderRequired).toBe(true);
  });

  it('should guard leadTimeDays to at least 1 day', () => {
    // leadTimeDays = 0 -> clamped to 1
    // d = 4, L = 1 (clamped), SS = 2 -> ROP = 4*1 + 2 = 6
    const result = RopSoqCalculator.calculate({
      forecastedDemand: 4,
      leadTimeDays: 0,
      safetyStock: 2,
      currentInventory: 10,
      onOrderQuantity: 0,
    });

    expect(result.reorderPoint).toBe(6);
  });
});
