import { WsmRankingCalculator } from './wsm-ranking.calculator';
import { SupplierCandidateInput } from '../interfaces/dss-calculation.interface';

describe('WsmRankingCalculator (BR-02, BR-24, BR-25)', () => {
  it('should return empty result when candidate list is empty or null', () => {
    expect(WsmRankingCalculator.rank([])).toEqual({
      suggestedSupplierId: null,
      suggestedSupplierScore: null,
      suggestedSupplier: null,
      rankings: [],
    });
    expect(
      WsmRankingCalculator.rank(null as unknown as SupplierCandidateInput[]),
    ).toEqual({
      suggestedSupplierId: null,
      suggestedSupplierScore: null,
      suggestedSupplier: null,
      rankings: [],
    });
  });

  it('should calculate WSM scores and rank suppliers accurately with default weights (40/20/15/25)', () => {
    // 2 Ứng viên:
    // A: Giá 10.000, LT 2, MOQ 50, 5 đơn completed, perf 0.90 (90%)
    // B: Giá 8.000, LT 5, MOQ 100, 10 đơn completed, perf 0.85 (85%)
    // Min values: P_min = 8.000, L_min = 2, M_min = 50
    //
    // Điểm A:
    // S_Price = (8000/10000)*100 = 80
    // S_LeadTime = (2/2)*100 = 100
    // S_MOQ = (50/50)*100 = 100
    // S_History = 90
    // TotalScore_A = 0.4*80 + 0.2*100 + 0.15*100 + 0.25*90 = 32 + 20 + 15 + 22.5 = 89.5
    //
    // Điểm B:
    // S_Price = (8000/8000)*100 = 100
    // S_LeadTime = (2/5)*100 = 40
    // S_MOQ = (50/100)*100 = 50
    // S_History = 85
    // TotalScore_B = 0.4*100 + 0.2*40 + 0.15*50 + 0.25*85 = 40 + 8 + 7.5 + 21.25 = 76.75
    const candidates: SupplierCandidateInput[] = [
      {
        supplierId: 1,
        supplierCode: 'SUPP-A',
        purchasePrice: 10000,
        committedLeadTimeDays: 2,
        moq: 50,
        performanceScore: 0.9,
        completedOrderCount: 5,
      },
      {
        supplierId: 2,
        supplierCode: 'SUPP-B',
        purchasePrice: 8000,
        committedLeadTimeDays: 5,
        moq: 100,
        performanceScore: 0.85,
        completedOrderCount: 10,
      },
    ];

    const result = WsmRankingCalculator.rank(candidates);

    expect(result.suggestedSupplierId).toBe(1);
    expect(result.suggestedSupplierScore).toBe(0.895);
    expect(result.rankings).toHaveLength(2);

    const rank1 = result.rankings[0];
    expect(rank1.supplierCode).toBe('SUPP-A');
    expect(rank1.rank).toBe(1);
    expect(rank1.priceScore).toBe(80);
    expect(rank1.leadTimeScore).toBe(100);
    expect(rank1.moqScore).toBe(100);
    expect(rank1.historyScore).toBe(90);
    expect(rank1.totalScore).toBe(89.5);
    expect(rank1.isColdStart).toBe(false);

    const rank2 = result.rankings[1];
    expect(rank2.supplierCode).toBe('SUPP-B');
    expect(rank2.rank).toBe(2);
    expect(rank2.priceScore).toBe(100);
    expect(rank2.leadTimeScore).toBe(40);
    expect(rank2.moqScore).toBe(50);
    expect(rank2.historyScore).toBe(85);
    expect(rank2.totalScore).toBe(76.75);
    expect(rank2.isColdStart).toBe(false);
  });

  it('should trigger Cold Start default 80 points when completed orders < 3 (BR-24)', () => {
    const candidates: SupplierCandidateInput[] = [
      {
        supplierId: 10,
        supplierCode: 'NEW-VENDOR',
        purchasePrice: 10000,
        committedLeadTimeDays: 3,
        moq: 10,
        performanceScore: 0.5, // Dù điểm cũ thấp
        completedOrderCount: 1, // Nhưng mới có 1 đơn (< 3)
      },
      {
        supplierId: 20,
        supplierCode: 'SEASONED-VENDOR',
        purchasePrice: 10000,
        committedLeadTimeDays: 3,
        moq: 10,
        performanceScore: 0.95,
        completedOrderCount: 8, // Đã có 8 đơn
      },
    ];

    const result = WsmRankingCalculator.rank(candidates);

    const newVendor = result.rankings.find(
      (r) => r.supplierCode === 'NEW-VENDOR',
    );
    const seasonedVendor = result.rankings.find(
      (r) => r.supplierCode === 'SEASONED-VENDOR',
    );

    expect(newVendor?.isColdStart).toBe(true);
    expect(newVendor?.historyScore).toBe(80); // Gán chuẩn 80 theo BR-24

    expect(seasonedVendor?.isColdStart).toBe(false);
    expect(seasonedVendor?.historyScore).toBe(95);
  });

  it('should apply tie-breaking rules: S_Price > S_History > ID (BR-02, BR-25)', () => {
    // 2 NCC có tổng điểm WSM bằng nhau, nhưng NCC 1 có điểm giá cao hơn
    // Trọng số: 50% Giá, 50% Lịch sử
    // NCC 1: Price 100 (S_Price = 100), Hist = 80 -> Score = 0.5*100 + 0.5*80 = 90
    // NCC 2: Price 125 (S_Price = 80), Hist = 100 -> Score = 0.5*80 + 0.5*100 = 90
    const candidates: SupplierCandidateInput[] = [
      {
        supplierId: 2,
        supplierCode: 'TIE-BETTER-HIST',
        purchasePrice: 125,
        committedLeadTimeDays: 2,
        moq: 10,
        performanceScore: 1.0, // Hist 100
        completedOrderCount: 5,
      },
      {
        supplierId: 1,
        supplierCode: 'TIE-BETTER-PRICE',
        purchasePrice: 100, // Giá tốt hơn (min = 100 -> S_Price = 100)
        committedLeadTimeDays: 2,
        moq: 10,
        performanceScore: 0.8, // Hist 80
        completedOrderCount: 5,
      },
    ];

    const result = WsmRankingCalculator.rank(candidates, {
      priceWeight: 0.5,
      leadTimeWeight: 0,
      moqWeight: 0,
      historyWeight: 0.5,
    });

    expect(result.rankings[0].totalScore).toBe(90);
    expect(result.rankings[1].totalScore).toBe(90);

    // Ưu tiên S_Price cao hơn -> TIE-BETTER-PRICE phải đứng Rank 1
    expect(result.rankings[0].supplierCode).toBe('TIE-BETTER-PRICE');
    expect(result.rankings[0].rank).toBe(1);
    expect(result.rankings[1].supplierCode).toBe('TIE-BETTER-HIST');
    expect(result.rankings[1].rank).toBe(2);
  });

  it('should handle single candidate safely with perfect 100 cost scores', () => {
    const candidates: SupplierCandidateInput[] = [
      {
        supplierId: 99,
        supplierCode: 'SOLE-SUPPLIER',
        purchasePrice: 50000,
        committedLeadTimeDays: 7,
        moq: 200,
        performanceScore: 0.88,
        completedOrderCount: 15,
      },
    ];

    const result = WsmRankingCalculator.rank(candidates);
    expect(result.suggestedSupplierId).toBe(99);
    expect(result.rankings).toHaveLength(1);

    const sole = result.rankings[0];
    expect(sole.priceScore).toBe(100);
    expect(sole.leadTimeScore).toBe(100);
    expect(sole.moqScore).toBe(100);
    expect(sole.historyScore).toBe(88);
    // 0.4*100 + 0.2*100 + 0.15*100 + 0.25*88 = 40 + 20 + 15 + 22 = 97
    expect(sole.totalScore).toBe(97);
  });

  it('should accept percentage-formatted weights (e.g. 40, 20, 15, 25)', () => {
    const candidates: SupplierCandidateInput[] = [
      {
        supplierId: 1,
        purchasePrice: 100,
        committedLeadTimeDays: 2,
        moq: 10,
        completedOrderCount: 5,
        performanceScore: 0.8,
      },
    ];

    const result = WsmRankingCalculator.rank(candidates, {
      priceWeight: 40,
      leadTimeWeight: 20,
      moqWeight: 15,
      historyWeight: 25,
    });

    expect(result.rankings[0].totalScore).toBe(95); // 40 + 20 + 15 + 20 = 95
  });
});
