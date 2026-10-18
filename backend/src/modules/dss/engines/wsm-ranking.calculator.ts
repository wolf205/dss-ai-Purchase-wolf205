import {
  SupplierCandidateInput,
  SupplierRankingItem,
  WsmRankingResult,
  WsmWeightsInput,
} from '../interfaces/dss-calculation.interface';

/**
 * WsmRankingCalculator — Động cơ chấm điểm & xếp hạng Nhà cung cấp WSM (BR-02, BR-24, BR-25)
 *
 * 1. Chuẩn hóa tiêu chí Chi phí (Cost Criteria - Càng thấp càng tốt):
 *    - S_Price = (min(P) / P) * 100
 *    - S_LeadTime = (min(L) / L) * 100
 *    - S_MOQ = (min(M) / M) * 100
 *
 * 2. Tiêu chí Lịch sử & Cơ chế Cold Start (BR-24):
 *    - Nếu completedOrderCount < 3 (NCC Mới): S_History = 80 (Mức Khá)
 *    - Nếu completedOrderCount >= 3: S_History = performanceScore (thang 100)
 *
 * 3. Tổng điểm WSM (Weighted Sum Model):
 *    TotalScore = (w_Price * S_Price) + (w_LeadTime * S_LeadTime) + (w_MOQ * S_MOQ) + (w_History * S_History)
 *
 * 4. Phá vỡ thế cân bằng (Tie-breaking - BR-02, BR-25):
 *    TotalScore bằng nhau -> Ưu tiên S_Price cao hơn -> Ưu tiên S_History cao hơn -> Ưu tiên ID nhỏ hơn.
 */
export class WsmRankingCalculator {
  static rank(
    candidates: SupplierCandidateInput[],
    weights?: WsmWeightsInput,
  ): WsmRankingResult {
    if (!candidates || candidates.length === 0) {
      return {
        suggestedSupplierId: null,
        suggestedSupplierScore: null,
        suggestedSupplier: null,
        rankings: [],
      };
    }

    // 1. Chuẩn hóa bộ 4 trọng số WSM (tổng chuẩn = 1.0)
    let wP = weights?.priceWeight ?? 0.4;
    let wL = weights?.leadTimeWeight ?? 0.2;
    let wM = weights?.moqWeight ?? 0.15;
    let wH = weights?.historyWeight ?? 0.25;

    // Nếu trọng số truyền dạng phần trăm (ví dụ 40 thay vì 0.40)
    const sumRaw = wP + wL + wM + wH;
    if (sumRaw > 1.5) {
      wP /= 100;
      wL /= 100;
      wM /= 100;
      wH /= 100;
    }
    const totalWeight = wP + wL + wM + wH;
    if (totalWeight > 0) {
      wP /= totalWeight;
      wL /= totalWeight;
      wM /= totalWeight;
      wH /= totalWeight;
    }

    // 2. Tìm giá trị nhỏ nhất (tốt nhất) cho 3 tiêu chí Cost
    const minP = Math.min(
      ...candidates.map((c) => Math.max(0.01, Number(c.purchasePrice) || 0.01)),
    );
    const minL = Math.min(
      ...candidates.map((c) =>
        Math.max(1, Number(c.committedLeadTimeDays) || 1),
      ),
    );
    const minM = Math.min(
      ...candidates.map((c) => Math.max(1, Number(c.moq) || 1)),
    );

    // 3. Tính điểm từng tiêu chí cho từng ứng viên
    const scoredCandidates: Omit<SupplierRankingItem, 'rank'>[] =
      candidates.map((c) => {
        const P = Math.max(0.01, Number(c.purchasePrice) || 0.01);
        const L = Math.max(1, Number(c.committedLeadTimeDays) || 1);
        const M = Math.max(1, Number(c.moq) || 1);

        const priceScore = Number(((minP / P) * 100).toFixed(2));
        const leadTimeScore = Number(((minL / L) * 100).toFixed(2));
        const moqScore = Number(((minM / M) * 100).toFixed(2));

        // Cơ chế Cold Start (BR-24)
        const completedOrders = Number(c.completedOrderCount) || 0;
        let historyScore = 80;
        let isColdStart = false;

        if (completedOrders < 3) {
          historyScore = 80;
          isColdStart = true;
        } else {
          const perf = Number(c.performanceScore) || 0;
          if (perf <= 1.0) {
            historyScore = Number((perf * 100).toFixed(2));
          } else {
            historyScore = Math.min(100, Number(perf.toFixed(2)));
          }
          isColdStart = false;
        }

        // Tính tổng điểm WSM
        const totalScore = Number(
          (
            wP * priceScore +
            wL * leadTimeScore +
            wM * moqScore +
            wH * historyScore
          ).toFixed(2),
        );

        return {
          supplierId: c.supplierId,
          supplierCode: c.supplierCode,
          supplierName: c.supplierName,
          totalScore,
          priceScore,
          leadTimeScore,
          moqScore,
          historyScore,
          purchasePrice: P,
          committedLeadTimeDays: L,
          moq: M,
          isColdStart,
        };
      });

    // 4. Sắp xếp thứ hạng kèm Tie-breaking theo BR-02 & BR-25
    scoredCandidates.sort((a, b) => {
      // 1. Tổng điểm cao hơn xếp trước
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      // 2. Tie-breaking 1: Ưu tiên điểm Đơn giá S_Price cao hơn
      if (b.priceScore !== a.priceScore) {
        return b.priceScore - a.priceScore;
      }
      // 3. Tie-breaking 2: Ưu tiên điểm Lịch sử S_History cao hơn
      if (b.historyScore !== a.historyScore) {
        return b.historyScore - a.historyScore;
      }
      // 4. Tie-breaking 3: ID nhỏ hơn xếp trước (tất định)
      return String(a.supplierId).localeCompare(String(b.supplierId));
    });

    // 5. Gán rank
    const rankings: SupplierRankingItem[] = scoredCandidates.map(
      (item, idx) => ({
        ...item,
        rank: idx + 1,
      }),
    );

    const suggested = rankings[0] || null;
    const suggestedSupplierScore = suggested
      ? Number((suggested.totalScore / 100).toFixed(4))
      : null;

    return {
      suggestedSupplierId: suggested ? suggested.supplierId : null,
      suggestedSupplierScore,
      suggestedSupplier: suggested,
      rankings,
    };
  }
}
