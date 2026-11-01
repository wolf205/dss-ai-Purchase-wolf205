/**
 * AccuracyEvaluationCalculator — Động cơ tính toán chỉ số đối soát & độ chính xác dự báo (WAPE, MAPE, MAE, Bias)
 * Dành cho Hệ thống DSS Hỗ trợ Ra Quyết Định Mua Hàng Bán Lẻ.
 *
 * 1. Sai số WAPE (Weighted Absolute Percentage Error - Chuẩn vàng bán lẻ):
 *    WAPE = (Sum |Actual - Predicted| / Sum Actual) * 100%
 *
 * 2. Sai số MAPE (Mean Absolute Percentage Error kèm Epsilon Smoothing):
 *    MAPE = (1 / N) * Sum (|Actual - Predicted| / (Actual + 1)) * 100%
 *
 * 3. Sai số tuyệt đối trung bình MAE (Mean Absolute Error - đơn vị sp/ngày):
 *    MAE = (1 / N) * Sum |Actual - Predicted|
 *
 * 4. Độ lệch thiên vị Forecast Bias (Over / Under forecasting):
 *    Bias = ((Sum Predicted - Sum Actual) / Sum Actual) * 100%
 *
 * 5. Bảng xếp loại chất lượng dự báo bán lẻ FMCG:
 *    - EXCELLENT: WAPE <= 20%
 *    - ACCEPTABLE: 20% < WAPE <= 35%
 *    - NEEDS_TUNING: WAPE > 35%
 */

export interface DailyComparisonPoint {
  date: string;
  predicted: number;
  actual: number;
}

export type AccuracyQualityRating = 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING';

export interface SkuAccuracyCalculationResult {
  wape: number;
  mape: number;
  mae: number;
  bias: number;
  totalPredicted: number;
  totalActual: number;
  totalAbsError: number;
  qualityRating: AccuracyQualityRating;
}

export interface OverallAccuracyCalculationResult {
  overallWape: number;
  overallMape: number;
  overallMae: number;
  overallBias: number;
  totalPredicted: number;
  totalActual: number;
  qualityRating: AccuracyQualityRating;
}

export class AccuracyEvaluationCalculator {
  /**
   * Xếp loại chất lượng dự báo dựa trên ngưỡng WAPE chuẩn bán lẻ FMCG Daily
   */
  static classifyQualityRating(wape: number): AccuracyQualityRating {
    if (wape <= 30) {
      return 'EXCELLENT';
    }
    if (wape <= 45) {
      return 'ACCEPTABLE';
    }
    return 'NEEDS_TUNING';
  }

  /**
   * Tính toán bộ chỉ số độ chính xác cho từng SKU riêng lẻ
   */
  static calculateSkuMetrics(
    timeline: DailyComparisonPoint[],
  ): SkuAccuracyCalculationResult {
    if (!timeline || timeline.length === 0) {
      return {
        wape: 0,
        mape: 0,
        mae: 0,
        bias: 0,
        totalPredicted: 0,
        totalActual: 0,
        totalAbsError: 0,
        qualityRating: 'EXCELLENT',
      };
    }

    let actSum = 0;
    let predSum = 0;
    let absErrSum = 0;
    const mapeTerms: number[] = [];

    for (const point of timeline) {
      const act = Math.max(0, point.actual);
      const pred = Math.max(0, point.predicted);
      const absErr = Math.abs(act - pred);

      actSum += act;
      predSum += pred;
      absErrSum += absErr;

      // Epsilon smoothing (+1) để chống chia 0 khi nhu cầu ngày = 0
      mapeTerms.push((absErr / (act + 1)) * 100);
    }

    const n = timeline.length;
    const wape = actSum > 0 ? (absErrSum / actSum) * 100 : 0;
    const mape = n > 0 ? mapeTerms.reduce((a, b) => a + b, 0) / n : 0;
    const mae = n > 0 ? absErrSum / n : 0;
    const bias = actSum > 0 ? ((predSum - actSum) / actSum) * 100 : 0;

    return {
      wape: Number(wape.toFixed(2)),
      mape: Number(mape.toFixed(2)),
      mae: Number(mae.toFixed(2)),
      bias: Number(bias.toFixed(2)),
      totalPredicted: Math.round(predSum),
      totalActual: Math.round(actSum),
      totalAbsError: Number(absErrSum.toFixed(2)),
      qualityRating: this.classifyQualityRating(wape),
    };
  }

  /**
   * Tính toán chỉ số tổng hợp toàn bộ SKU trong phiên DSS
   */
  static calculateOverallMetrics(
    skuMetricsList: SkuAccuracyCalculationResult[],
  ): OverallAccuracyCalculationResult {
    if (!skuMetricsList || skuMetricsList.length === 0) {
      return {
        overallWape: 0,
        overallMape: 0,
        overallMae: 0,
        overallBias: 0,
        totalPredicted: 0,
        totalActual: 0,
        qualityRating: 'EXCELLENT',
      };
    }

    let grandTotalAct = 0;
    let grandTotalPred = 0;
    let grandTotalAbsErr = 0;
    const allMapeList: number[] = [];
    const allMaeList: number[] = [];

    for (const sku of skuMetricsList) {
      grandTotalAct += sku.totalActual;
      grandTotalPred += sku.totalPredicted;
      grandTotalAbsErr += sku.totalAbsError;
      allMapeList.push(sku.mape);
      allMaeList.push(sku.mae);
    }

    const overallWape =
      grandTotalAct > 0 ? (grandTotalAbsErr / grandTotalAct) * 100 : 0;
    const overallMape =
      allMapeList.length > 0
        ? allMapeList.reduce((a, b) => a + b, 0) / allMapeList.length
        : 0;
    const overallMae =
      allMaeList.length > 0
        ? allMaeList.reduce((a, b) => a + b, 0) / allMaeList.length
        : 0;
    const overallBias =
      grandTotalAct > 0
        ? ((grandTotalPred - grandTotalAct) / grandTotalAct) * 100
        : 0;

    return {
      overallWape: Number(overallWape.toFixed(2)),
      overallMape: Number(overallMape.toFixed(2)),
      overallMae: Number(overallMae.toFixed(2)),
      overallBias: Number(overallBias.toFixed(2)),
      totalPredicted: Math.round(grandTotalPred),
      totalActual: Math.round(grandTotalAct),
      qualityRating: this.classifyQualityRating(overallWape),
    };
  }

  /**
   * Tính toán chỉ số đối soát tổng chu kỳ tuần (Weekly Horizon Aggregation).
   * Triệt tiêu sai lệch nhịp ngày, phản ánh độ chính xác của quyết định đặt hàng (ROP/SOQ) chu kỳ 7 ngày.
   */
  static calculateWeeklyHorizonMetrics(
    skuMetricsList: SkuAccuracyCalculationResult[],
  ): OverallAccuracyCalculationResult {
    if (!skuMetricsList || skuMetricsList.length === 0) {
      return {
        overallWape: 0,
        overallMape: 0,
        overallMae: 0,
        overallBias: 0,
        totalPredicted: 0,
        totalActual: 0,
        qualityRating: 'EXCELLENT',
      };
    }

    let grandTotalAct = 0;
    let grandTotalPred = 0;
    let totalWeeklyAbsErr = 0;
    const weeklyMapeTerms: number[] = [];

    for (const sku of skuMetricsList) {
      grandTotalAct += sku.totalActual;
      grandTotalPred += sku.totalPredicted;
      const skuWeeklyAbsErr = Math.abs(sku.totalActual - sku.totalPredicted);
      totalWeeklyAbsErr += skuWeeklyAbsErr;
      weeklyMapeTerms.push((skuWeeklyAbsErr / (sku.totalActual + 1)) * 100);
    }

    const weeklyWape =
      grandTotalAct > 0 ? (totalWeeklyAbsErr / grandTotalAct) * 100 : 0;
    const weeklyMape =
      weeklyMapeTerms.length > 0
        ? weeklyMapeTerms.reduce((a, b) => a + b, 0) / weeklyMapeTerms.length
        : 0;
    const weeklyMae =
      skuMetricsList.length > 0 ? totalWeeklyAbsErr / skuMetricsList.length : 0;
    const weeklyBias =
      grandTotalAct > 0
        ? ((grandTotalPred - grandTotalAct) / grandTotalAct) * 100
        : 0;

    return {
      overallWape: Number(weeklyWape.toFixed(2)),
      overallMape: Number(weeklyMape.toFixed(2)),
      overallMae: Number(weeklyMae.toFixed(2)),
      overallBias: Number(weeklyBias.toFixed(2)),
      totalPredicted: Math.round(grandTotalPred),
      totalActual: Math.round(grandTotalAct),
      qualityRating: this.classifyQualityRating(weeklyWape),
    };
  }
}
