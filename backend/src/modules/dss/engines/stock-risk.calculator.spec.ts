import { StockRiskCalculator } from './stock-risk.calculator';
import { StockRiskStatus } from '../enums/stock-risk.enum';

describe('StockRiskCalculator (BR-01)', () => {
  it('should classify as Critical when onHand = 0 and IP <= ROP', () => {
    // onHand = 0, onOrder = 5, ROP = 10 -> IP = 5 <= 10 -> Critical
    const result = StockRiskCalculator.classify({
      currentInventory: 0,
      onOrderQuantity: 5,
      reorderPoint: 10,
      forecastedDemand: 2,
      reviewPeriodDays: 7,
    });

    expect(result.status).toBe(StockRiskStatus.CRITICAL);
    expect(result.label).toBe('🔴 Cần mua gấp');
    expect(result.inventoryPosition).toBe(5);
  });

  it('should classify as Warning when onHand > 0 and IP <= ROP', () => {
    // onHand = 8, onOrder = 0, ROP = 10 -> IP = 8 <= 10 -> Warning
    const result = StockRiskCalculator.classify({
      currentInventory: 8,
      onOrderQuantity: 0,
      reorderPoint: 10,
      forecastedDemand: 2,
      reviewPeriodDays: 7,
    });

    expect(result.status).toBe(StockRiskStatus.WARNING);
    expect(result.label).toBe('🟠 Sắp hết / Chạm ROP');
    expect(result.inventoryPosition).toBe(8);
  });

  it('should classify as Warning when onHand touches ROP exactly (IP = ROP)', () => {
    const result = StockRiskCalculator.classify({
      currentInventory: 10,
      onOrderQuantity: 0,
      reorderPoint: 10,
      forecastedDemand: 2,
    });

    expect(result.status).toBe(StockRiskStatus.WARNING);
  });

  it('should classify as Warning when onHand = 0 but onOrder is on the way (IP > ROP)', () => {
    // onHand = 0, onOrder = 20, ROP = 10 -> IP = 20 > 10
    // Kệ rỗng nhưng hàng sắp về -> Warning (chờ hàng)
    const result = StockRiskCalculator.classify({
      currentInventory: 0,
      onOrderQuantity: 20,
      reorderPoint: 10,
      forecastedDemand: 2,
      reviewPeriodDays: 7,
    });

    expect(result.status).toBe(StockRiskStatus.WARNING);
    expect(result.inventoryPosition).toBe(20);
  });

  it('should classify as Safe when ROP < IP <= ROP + d*2R', () => {
    // ROP = 10, d = 2, R = 7 -> Overstock threshold = 10 + 2*(14) = 38
    // onHand = 15, onOrder = 0 -> IP = 15 -> Safe
    const result = StockRiskCalculator.classify({
      currentInventory: 15,
      onOrderQuantity: 0,
      reorderPoint: 10,
      forecastedDemand: 2,
      reviewPeriodDays: 7,
    });

    expect(result.status).toBe(StockRiskStatus.SAFE);
    expect(result.label).toBe('🟢 An toàn');
    expect(result.overstockThreshold).toBe(38);
  });

  it('should classify as Safe at exact overstock threshold boundary', () => {
    // Threshold = 10 + 2*14 = 38
    // onHand = 38 -> Safe
    const result = StockRiskCalculator.classify({
      currentInventory: 38,
      onOrderQuantity: 0,
      reorderPoint: 10,
      forecastedDemand: 2,
      reviewPeriodDays: 7,
    });

    expect(result.status).toBe(StockRiskStatus.SAFE);
  });

  it('should classify as Overstock when IP > ROP + d*2R', () => {
    // Threshold = 38, onHand = 45 -> Overstock
    const result = StockRiskCalculator.classify({
      currentInventory: 45,
      onOrderQuantity: 0,
      reorderPoint: 10,
      forecastedDemand: 2,
      reviewPeriodDays: 7,
    });

    expect(result.status).toBe(StockRiskStatus.OVERSTOCK);
    expect(result.label).toBe('⚪ Dư thừa');
    expect(result.inventoryPosition).toBe(45);
  });

  it('should handle zero demand (d = 0) properly', () => {
    // d = 0 -> threshold = ROP = 10
    // onHand = 15 -> IP = 15 > 10 -> Overstock
    const result = StockRiskCalculator.classify({
      currentInventory: 15,
      onOrderQuantity: 0,
      reorderPoint: 10,
      forecastedDemand: 0,
    });

    expect(result.status).toBe(StockRiskStatus.OVERSTOCK);
    expect(result.overstockThreshold).toBe(10);
  });

  it('should classify as Critical when onHand <= safetyStock and IP <= ROP', () => {
    // onHand = 3 <= SS = 5, onOrder = 0 -> IP = 3 <= ROP = 9 -> Critical
    const result = StockRiskCalculator.classify({
      currentInventory: 3,
      onOrderQuantity: 0,
      reorderPoint: 9,
      forecastedDemand: 2,
      reviewPeriodDays: 7,
      safetyStock: 5,
    });

    expect(result.status).toBe(StockRiskStatus.CRITICAL);
    expect(result.label).toBe('🔴 Cần mua gấp');
  });

  it('should classify as Warning when onHand <= safetyStock but onOrder > 0 and IP > ROP', () => {
    // onHand = 3 <= SS = 5, onOrder = 10 -> IP = 13 > ROP = 9 -> Warning (hàng đang về)
    const result = StockRiskCalculator.classify({
      currentInventory: 3,
      onOrderQuantity: 10,
      reorderPoint: 9,
      forecastedDemand: 2,
      reviewPeriodDays: 7,
      safetyStock: 5,
    });

    expect(result.status).toBe(StockRiskStatus.WARNING);
    expect(result.label).toBe('🟠 Sắp hết / Chạm ROP');
  });
});
