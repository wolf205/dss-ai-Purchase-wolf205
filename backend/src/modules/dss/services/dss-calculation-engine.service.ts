import { Injectable, Logger } from '@nestjs/common';
import {
  AbcXyzClassificationResult,
  RopSoqInput,
  RopSoqResult,
  SafetyStockInput,
  SafetyStockResult,
  SkuSalesMetricsInput,
  StockRiskInput,
  StockRiskResult,
  SupplierCandidateInput,
  WsmRankingResult,
  WsmWeightsInput,
} from '../interfaces/dss-calculation.interface';
import { AbcXyzCalculator } from '../engines/abc-xyz.calculator';
import { SafetyStockCalculator } from '../engines/safety-stock.calculator';
import { RopSoqCalculator } from '../engines/rop-soq.calculator';
import { WsmRankingCalculator } from '../engines/wsm-ranking.calculator';
import { StockRiskCalculator } from '../engines/stock-risk.calculator';

/**
 * DssCalculationEngineService — Facade tập hợp các động cơ tính toán tất định DSS (Domain Layer)
 *
 * Chịu trách nhiệm ủy quyền (delegate) thực thi các quy tắc nghiệp vụ toán học:
 * - BR-05: Phân loại ma trận ABC - XYZ (AbcXyzCalculator)
 * - BR-01, BR-26: Tồn kho an toàn Safety Stock & Hệ số Z (SafetyStockCalculator)
 * - BR-01, BR-03: Reorder Point & SOQ (RopSoqCalculator — Task 5A.3)
 * - BR-02, BR-24, BR-25: Chấm điểm WSM Nhà Cung Cấp (WsmRankingCalculator — Task 5A.4)
 * - BR-01: Phân loại rủi ro StockRiskStatus (StockRiskCalculator — Task 5A.5)
 */
@Injectable()
export class DssCalculationEngineService {
  private readonly logger = new Logger(DssCalculationEngineService.name);

  /**
   * Phân loại mặt hàng theo ma trận ABC - XYZ (BR-05)
   */
  classifyAbcXyz(items: SkuSalesMetricsInput[]): AbcXyzClassificationResult[] {
    return AbcXyzCalculator.classify(items);
  }

  /**
   * Ánh xạ Mức độ phục vụ sang Hệ số an toàn Z (BR-26)
   */
  mapServiceLevelToZ(serviceLevel?: number): number {
    return SafetyStockCalculator.mapServiceLevelToZ(serviceLevel);
  }

  /**
   * Tính Tồn kho an toàn Safety Stock (BR-01, BR-26)
   */
  calculateSafetyStock(input: SafetyStockInput): SafetyStockResult {
    return SafetyStockCalculator.calculate(input);
  }

  /**
   * Tính Điểm đặt hàng lại (ROP) & Lượng mua đề xuất (SOQ) (BR-01, BR-03)
   */
  calculateRopAndSoq(input: RopSoqInput): RopSoqResult {
    return RopSoqCalculator.calculate(input);
  }

  /**
   * Chấm điểm & Xếp hạng Nhà cung cấp theo WSM (BR-02, BR-24, BR-25)
   */
  rankSuppliersWsm(
    candidates: SupplierCandidateInput[],
    weights?: WsmWeightsInput,
  ): WsmRankingResult {
    return WsmRankingCalculator.rank(candidates, weights);
  }

  /**
   * Phân loại trạng thái sức khỏe tồn kho (BR-01)
   */
  classifyStockRisk(input: StockRiskInput): StockRiskResult {
    return StockRiskCalculator.classify(input);
  }
}
