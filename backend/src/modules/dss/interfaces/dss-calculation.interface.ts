import { AbcGroup, AbcXyzBadge, XyzGroup } from '../enums/abc-xyz.enum';
import { StockRiskStatus } from '../enums/stock-risk.enum';

/**
 * Dữ liệu bán hàng đầu vào của từng SKU phục vụ tính toán ma trận ABC-XYZ theo BR-05
 */
export interface SkuSalesMetricsInput {
  productId: bigint | number | string;
  skuCode?: string;
  totalRevenue: number;
  avgDailyDemand: number; // Mức tiêu thụ trung bình ngày (d_bar)
  demandStdDev: number; // Độ lệch chuẩn nhu cầu ngày (sigma_d)
  salesDaysCount: number; // Số ngày có phát sinh bán hàng/lịch sử trong kỳ phân tích
}

/**
 * Kết quả phân loại ma trận ABC-XYZ cho từng SKU theo BR-05
 */
export interface AbcXyzClassificationResult {
  productId: bigint | number | string;
  skuCode?: string;
  revenue: number;
  cumRevenuePercentage: number; // Tỷ lệ % tích lũy doanh thu (0.00 -> 100.00)
  abcGroup: AbcGroup;
  xyzGroup: XyzGroup;
  badge: AbcXyzBadge;
  cv: number; // Hệ số biến thiên sigma_d / d_bar
  isFallback: boolean; // True nếu rơi vào điều kiện dự phòng (< 7 ngày hoặc 0 doanh thu -> CZ)
  fallbackReason?: string;
}

/**
 * Đầu vào tính Tồn kho an toàn (Safety Stock) theo BR-01 và BR-26
 */
export interface SafetyStockInput {
  avgDailyDemand: number; // Mức tiêu thụ trung bình ngày (d_bar)
  demandStdDev: number; // Độ lệch chuẩn nhu cầu ngày (sigma_d)
  leadTimeDays: number; // Thời gian chờ hàng của Nhà cung cấp (L >= 1)
  salesDaysCount: number; // Số ngày có phát sinh bán hàng/lịch sử
  targetServiceLevel?: number; // Mức phục vụ mục tiêu (0.90, 0.95, 0.98, 0.99)
  zFactor?: number; // Hệ số an toàn trực tiếp (Z)
  safetyDaysFallback?: number; // Số ngày tồn kho an toàn dự phòng (mặc định 5 ngày)
}

/**
 * Kết quả tính Tồn kho an toàn theo BR-01
 */
export interface SafetyStockResult {
  safetyStock: number; // Mức tồn kho an toàn đã làm tròn trần (Integer >= 0)
  rawSafetyStock: number; // Giá trị tính toán nguyên bản chưa làm tròn
  zFactor: number; // Hệ số Z được sử dụng
  isFallback: boolean; // True nếu áp dụng công thức fallback (< 14 ngày)
  fallbackReason?: string;
}

/**
 * Đầu vào tính Điểm đặt hàng lại (ROP) & Lượng mua đề xuất (SOQ) theo BR-01, BR-03
 */
export interface RopSoqInput {
  forecastedDemand: number; // Mức tiêu thụ dự báo trung bình ngày (d_forecast >= 0)
  leadTimeDays: number; // Thời gian chờ hàng của Nhà cung cấp (L >= 1)
  safetyStock: number; // Tồn kho an toàn (SS >= 0)
  currentInventory: number; // Tồn kho thực tế trên kệ (I_on_hand >= 0)
  onOrderQuantity: number; // Hàng đang chờ về từ các PO Approved (I_on_order >= 0)
  reviewPeriodDays?: number; // Chu kỳ rà soát mua hàng (R, mặc định 7 ngày theo BR-27)
  moq?: number; // Số lượng đặt tối thiểu của Nhà cung cấp (MOQ >= 1, mặc định 1)
  packSize?: number; // Quy cách đóng gói (Pack size >= 1, mặc định 1)
}

/**
 * Kết quả tính toán ROP & SOQ theo BR-01 và BR-03
 */
export interface RopSoqResult {
  reorderPoint: number; // Điểm đặt hàng lại (ROP = ceil(d * L + SS))
  inventoryPosition: number; // Vị thế tồn kho khả dụng (IP = on_hand + on_order)
  netRequirement: number; // Nhu cầu thiếu hụt (ROP - IP)
  baseSoq: number; // Lượng mua cơ sở chưa áp dụng MOQ/Pack size (Base SOQ)
  suggestedQuantity: number; // Lượng mua đề xuất cuối cùng (Final SOQ >= 0)
  isOrderRequired: boolean; // True nếu Final SOQ > 0
  moqApplied: boolean; // True nếu Base SOQ > 0 và nhỏ hơn MOQ nên được nâng lên bằng MOQ
  targetStock: number; // Mức tồn kho mục tiêu (Target Stock = d * (L + R) + SS)
}

/**
 * Trọng số cấu hình WSM (BR-02, BR-25)
 */
export interface WsmWeightsInput {
  priceWeight?: number; // Mặc định 0.40 (40%)
  leadTimeWeight?: number; // Mặc định 0.20 (20%)
  moqWeight?: number; // Mặc định 0.15 (15%)
  historyWeight?: number; // Mặc định 0.25 (25%)
}

/**
 * Thông tin Nhà cung cấp ứng viên chào bán SKU (Đầu vào WSM)
 */
export interface SupplierCandidateInput {
  supplierId: bigint | number | string;
  supplierCode?: string;
  supplierName?: string;
  purchasePrice: number; // Đơn giá nhập P (VNĐ)
  committedLeadTimeDays: number; // Thời gian giao hàng cam kết L (ngày >= 1)
  moq: number; // Số lượng đặt tối thiểu M (MOQ >= 1)
  performanceScore?: number; // Điểm hiệu suất giao hàng (0.00 - 1.00 hoặc 0 - 100)
  completedOrderCount?: number; // Số đơn PO Completed (phục vụ Cold Start theo BR-24)
}

/**
 * Chi tiết điểm số từng Nhà cung cấp sau khi xếp hạng WSM
 */
export interface SupplierRankingItem {
  supplierId: bigint | number | string;
  supplierCode?: string;
  supplierName?: string;
  rank: number; // Thứ hạng xếp hạng (1, 2, 3...)
  totalScore: number; // Tổng điểm WSM (0 - 100)
  priceScore: number; // Điểm Đơn giá S_Price (0 - 100)
  leadTimeScore: number; // Điểm Lead Time S_LeadTime (0 - 100)
  moqScore: number; // Điểm MOQ S_MOQ (0 - 100)
  historyScore: number; // Điểm Lịch sử S_History (0 - 100)
  purchasePrice: number;
  committedLeadTimeDays: number;
  moq: number;
  isColdStart: boolean; // True nếu áp dụng Cold Start (< 3 đơn completed)
}

/**
 * Kết quả xếp hạng Nhà cung cấp theo WSM cho 1 SKU
 */
export interface WsmRankingResult {
  suggestedSupplierId: bigint | number | string | null;
  suggestedSupplierScore: number | null; // Tổng điểm WSM của NCC rank 1 (0.0000 - 1.0000 hoặc 0 - 100)
  suggestedSupplier: SupplierRankingItem | null;
  rankings: SupplierRankingItem[]; // Danh sách xếp hạng lưu JSONB vào CSDL
}

/**
 * Đầu vào phân loại trạng thái rủi ro tồn kho (BR-01)
 */
export interface StockRiskInput {
  currentInventory: number; // Tồn kho thực tế trên kệ (I_on_hand >= 0)
  onOrderQuantity: number; // Hàng đang chờ về từ PO Approved (I_on_order >= 0)
  reorderPoint: number; // Điểm đặt hàng lại (ROP >= 0)
  forecastedDemand: number; // Nhu cầu dự báo trung bình ngày (d_forecast >= 0)
  reviewPeriodDays?: number; // Chu kỳ rà soát mua hàng (R, mặc định 7 ngày theo BR-27)
  safetyStock?: number; // Tồn kho an toàn khuyến nghị (SS >= 0 theo BR-01)
}

/**
 * Kết quả phân loại trạng thái rủi ro tồn kho
 */
export interface StockRiskResult {
  status: StockRiskStatus; // Trạng thái ('Critical' | 'Warning' | 'Safe' | 'Overstock')
  label: string; // Nhãn hiển thị ('🔴 Cần mua gấp' | '🟠 Sắp hết / Chạm ROP' | '🟢 An toàn' | '⚪ Dư thừa')
  inventoryPosition: number; // Vị thế tồn kho khả dụng (IP = on_hand + on_order)
  reorderPoint: number;
  overstockThreshold: number; // Ngưỡng vượt trần (ROP + d * 2R)
}
