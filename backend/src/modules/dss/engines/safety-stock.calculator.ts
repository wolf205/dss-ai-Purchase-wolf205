import {
  SafetyStockInput,
  SafetyStockResult,
} from '../interfaces/dss-calculation.interface';

/**
 * SafetyStockCalculator — Động cơ tính Tồn kho an toàn (Safety Stock - SS) theo BR-01 và BR-26
 *
 * 1. Ánh xạ Service Level -> Z-factor (BR-26):
 *    - 90% (0.90) -> Z = 1.28
 *    - 95% (0.95) -> Z = 1.65 (Mặc định)
 *    - 98% (0.98) -> Z = 2.05
 *    - 99% (0.99) -> Z = 2.33
 *
 * 2. Công thức chuẩn (khi lịch sử >= 14 ngày):
 *    SS = Z * sigma_d * sqrt(L)
 *
 * 3. Cơ chế dự phòng Fallback (khi lịch sử < 14 ngày):
 *    SS_fallback = d_bar * Safety Days (mặc định 5 ngày)
 *
 * Kết quả được làm tròn trần (Math.ceil) để đảm bảo không vi phạm Service Level mục tiêu.
 */
export class SafetyStockCalculator {
  /**
   * Ánh xạ Mức độ phục vụ (Service Level) sang Hệ số an toàn Z theo BR-26
   */
  static mapServiceLevelToZ(serviceLevel?: number): number {
    if (serviceLevel === undefined || serviceLevel === null) {
      return 1.65; // Mặc định chuẩn 95%
    }

    const sl = serviceLevel > 1 ? serviceLevel / 100 : serviceLevel;

    if (Math.abs(sl - 0.9) < 0.005) return 1.28;
    if (Math.abs(sl - 0.95) < 0.005) return 1.65;
    if (Math.abs(sl - 0.98) < 0.005) return 2.05;
    if (Math.abs(sl - 0.99) < 0.005) return 2.33;

    return 1.65;
  }

  /**
   * Tính Tồn kho an toàn (Safety Stock)
   */
  static calculate(input: SafetyStockInput): SafetyStockResult {
    const salesDaysCount = Number(input.salesDaysCount) || 0;
    const avgDemand = Math.max(0, Number(input.avgDailyDemand) || 0);
    const stdDev = Math.max(0, Number(input.demandStdDev) || 0);
    const leadTime = Math.max(1, Number(input.leadTimeDays) || 1);
    const safetyDays = Math.max(1, Number(input.safetyDaysFallback) || 5);

    // Xác định hệ số Z
    let z: number;
    if (
      input.zFactor !== undefined &&
      input.zFactor !== null &&
      Number(input.zFactor) > 0
    ) {
      z = Number(input.zFactor);
    } else {
      z = this.mapServiceLevelToZ(input.targetServiceLevel);
    }

    // Kiểm tra cơ chế Fallback (< 14 ngày bán)
    if (salesDaysCount < 14) {
      const rawSS = avgDemand * safetyDays;
      const safetyStock = Math.ceil(rawSS);

      return {
        safetyStock,
        rawSafetyStock: Number(rawSS.toFixed(4)),
        zFactor: z,
        isFallback: true,
        fallbackReason: 'SKU has sales history under 14 days',
      };
    }

    // Công thức chuẩn BR-01: SS = Z * sigma_d * sqrt(L)
    const rawSS = z * stdDev * Math.sqrt(leadTime);
    const safetyStock = Math.ceil(rawSS);

    return {
      safetyStock,
      rawSafetyStock: Number(rawSS.toFixed(4)),
      zFactor: z,
      isFallback: false,
    };
  }
}
