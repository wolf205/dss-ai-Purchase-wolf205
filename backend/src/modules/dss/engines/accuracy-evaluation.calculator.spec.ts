import {
  AccuracyEvaluationCalculator,
  DailyComparisonPoint,
} from './accuracy-evaluation.calculator';

describe('AccuracyEvaluationCalculator (Pure Domain Engine)', () => {
  describe('classifyQualityRating', () => {
    it('should classify <= 20% as EXCELLENT', () => {
      expect(AccuracyEvaluationCalculator.classifyQualityRating(0)).toBe(
        'EXCELLENT',
      );
      expect(AccuracyEvaluationCalculator.classifyQualityRating(14.5)).toBe(
        'EXCELLENT',
      );
      expect(AccuracyEvaluationCalculator.classifyQualityRating(20.0)).toBe(
        'EXCELLENT',
      );
    });

    it('should classify > 20% and <= 35% as ACCEPTABLE', () => {
      expect(AccuracyEvaluationCalculator.classifyQualityRating(20.01)).toBe(
        'ACCEPTABLE',
      );
      expect(AccuracyEvaluationCalculator.classifyQualityRating(28.4)).toBe(
        'ACCEPTABLE',
      );
      expect(AccuracyEvaluationCalculator.classifyQualityRating(35.0)).toBe(
        'ACCEPTABLE',
      );
    });

    it('should classify > 35% as NEEDS_TUNING', () => {
      expect(AccuracyEvaluationCalculator.classifyQualityRating(35.01)).toBe(
        'NEEDS_TUNING',
      );
      expect(AccuracyEvaluationCalculator.classifyQualityRating(65.2)).toBe(
        'NEEDS_TUNING',
      );
    });
  });

  describe('calculateSkuMetrics', () => {
    it('should return default zero metrics for empty timeline', () => {
      const result = AccuracyEvaluationCalculator.calculateSkuMetrics([]);
      expect(result.wape).toBe(0);
      expect(result.mape).toBe(0);
      expect(result.mae).toBe(0);
      expect(result.bias).toBe(0);
      expect(result.totalPredicted).toBe(0);
      expect(result.totalActual).toBe(0);
      expect(result.qualityRating).toBe('EXCELLENT');
    });

    it('should calculate 0% error for perfect forecast', () => {
      const timeline: DailyComparisonPoint[] = [
        { date: '2026-11-02', predicted: 10, actual: 10 },
        { date: '2026-11-03', predicted: 20, actual: 20 },
      ];

      const result = AccuracyEvaluationCalculator.calculateSkuMetrics(timeline);
      expect(result.wape).toBe(0);
      expect(result.mape).toBe(0);
      expect(result.mae).toBe(0);
      expect(result.bias).toBe(0);
      expect(result.totalPredicted).toBe(30);
      expect(result.totalActual).toBe(30);
      expect(result.qualityRating).toBe('EXCELLENT');
    });

    it('should correctly compute WAPE, MAPE, MAE and Bias for sample sales', () => {
      // Day 1: Pred = 12, Act = 10 -> diff = 2
      // Day 2: Pred = 8,  Act = 10 -> diff = 2
      // ActSum = 20, PredSum = 20, AbsErrSum = 4
      // WAPE = (4 / 20) * 100 = 20.0%
      // MAE = 4 / 2 = 2.0
      // Bias = ((20 - 20) / 20) * 100 = 0.0%
      // Day 1 MAPE term: 2 / (10 + 1) * 100 = 18.1818%
      // Day 2 MAPE term: 2 / (10 + 1) * 100 = 18.1818%
      // Average MAPE = 18.18%
      const timeline: DailyComparisonPoint[] = [
        { date: '2026-11-02', predicted: 12, actual: 10 },
        { date: '2026-11-03', predicted: 8, actual: 10 },
      ];

      const result = AccuracyEvaluationCalculator.calculateSkuMetrics(timeline);
      expect(result.wape).toBe(20.0);
      expect(result.mae).toBe(2.0);
      expect(result.bias).toBe(0.0);
      expect(result.mape).toBe(18.18);
      expect(result.qualityRating).toBe('EXCELLENT');
    });

    it('should detect positive bias (overforecasting)', () => {
      // Pred = 15, Act = 10 -> Bias = +50%
      const timeline: DailyComparisonPoint[] = [
        { date: '2026-11-02', predicted: 15, actual: 10 },
      ];

      const result = AccuracyEvaluationCalculator.calculateSkuMetrics(timeline);
      expect(result.bias).toBe(50.0);
      expect(result.wape).toBe(50.0);
      expect(result.qualityRating).toBe('NEEDS_TUNING');
    });

    it('should detect negative bias (underforecasting)', () => {
      // Pred = 5, Act = 10 -> Bias = -50%
      const timeline: DailyComparisonPoint[] = [
        { date: '2026-11-02', predicted: 5, actual: 10 },
      ];

      const result = AccuracyEvaluationCalculator.calculateSkuMetrics(timeline);
      expect(result.bias).toBe(-50.0);
      expect(result.wape).toBe(50.0);
    });

    it('should avoid division by zero when actual sales are 0 on intermittent days', () => {
      const timeline: DailyComparisonPoint[] = [
        { date: '2026-11-02', predicted: 2, actual: 0 },
        { date: '2026-11-03', predicted: 0, actual: 0 },
      ];

      const result = AccuracyEvaluationCalculator.calculateSkuMetrics(timeline);
      expect(result.totalActual).toBe(0);
      expect(result.wape).toBe(0);
      expect(result.bias).toBe(0);
      // Day 1: diff 2, 2 / (0 + 1) * 100 = 200%. Day 2: 0 / 1 = 0%. Avg MAPE = 100%
      expect(result.mape).toBe(100.0);
      expect(result.mae).toBe(1.0);
    });
  });

  describe('calculateOverallMetrics', () => {
    it('should return default zero metrics for empty sku list', () => {
      const overall = AccuracyEvaluationCalculator.calculateOverallMetrics([]);
      expect(overall.overallWape).toBe(0);
      expect(overall.overallMape).toBe(0);
      expect(overall.overallMae).toBe(0);
      expect(overall.overallBias).toBe(0);
      expect(overall.totalPredicted).toBe(0);
      expect(overall.totalActual).toBe(0);
      expect(overall.qualityRating).toBe('EXCELLENT');
    });

    it('should compute store-wide overall weighted metrics correctly', () => {
      const sku1 = AccuracyEvaluationCalculator.calculateSkuMetrics([
        { date: '2026-11-02', predicted: 10, actual: 10 },
      ]);
      const sku2 = AccuracyEvaluationCalculator.calculateSkuMetrics([
        { date: '2026-11-02', predicted: 15, actual: 10 },
      ]);

      const overall = AccuracyEvaluationCalculator.calculateOverallMetrics([
        sku1,
        sku2,
      ]);
      // Sku1: act 10, pred 10, absErr 0
      // Sku2: act 10, pred 15, absErr 5
      // Total Act = 20, Total Pred = 25, Total AbsErr = 5
      // Overall WAPE = (5 / 20) * 100 = 25.0% -> ACCEPTABLE
      // Overall Bias = ((25 - 20) / 20) * 100 = +25.0%
      expect(overall.overallWape).toBe(25.0);
      expect(overall.overallBias).toBe(25.0);
      expect(overall.qualityRating).toBe('ACCEPTABLE');
      expect(overall.totalActual).toBe(20);
      expect(overall.totalPredicted).toBe(25);
    });
  });
});
