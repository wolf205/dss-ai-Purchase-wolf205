/**
 * Trạng thái rủi ro tồn kho (Stock Risk Status) theo BR-01 và DB Constraint
 * chk_rec_items_risk_status CHECK (stock_risk_status IN ('Critical', 'Warning', 'Safe', 'Overstock'))
 */
export enum StockRiskStatus {
  CRITICAL = 'Critical', // 🔴 Cần mua gấp / Hết hàng
  WARNING = 'Warning', // 🟠 Sắp hết / Chạm ROP
  SAFE = 'Safe', // 🟢 An toàn
  OVERSTOCK = 'Overstock', // ⚪ Dư thừa / Vượt trần
}

export const STOCK_RISK_LABELS: Record<StockRiskStatus, string> = {
  [StockRiskStatus.CRITICAL]: '🔴 Cần mua gấp',
  [StockRiskStatus.WARNING]: '🟠 Sắp hết / Chạm ROP',
  [StockRiskStatus.SAFE]: '🟢 An toàn',
  [StockRiskStatus.OVERSTOCK]: '⚪ Dư thừa',
};
