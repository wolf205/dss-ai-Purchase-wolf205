import {
  StockRiskInput,
  StockRiskResult,
} from '../interfaces/dss-calculation.interface';
import { STOCK_RISK_LABELS, StockRiskStatus } from '../enums/stock-risk.enum';

/**
 * StockRiskCalculator — Động cơ phân loại trạng thái rủi ro tồn kho (BR-01)
 *
 * 1. 🔴 Critical (Cần mua gấp / Hết hàng):
 *    - Khi I_on_hand = 0 VÀ IP <= ROP
 *
 * 2. 🟠 Warning (Sắp hết / Chạm ROP):
 *    - Khi IP <= ROP (với I_on_hand > 0)
 *    - Hoặc khi I_on_hand = 0 nhưng IP > ROP (kệ rỗng nhưng đang chờ PO về)
 *
 * 3. ⚪ Overstock (Dư thừa / Vượt trần):
 *    - Khi IP > ROP + (d_forecast * 2R)
 *
 * 4. 🟢 Safe (An toàn):
 *    - Khi ROP < IP <= ROP + (d_forecast * 2R)
 */
export class StockRiskCalculator {
  static classify(input: StockRiskInput): StockRiskResult {
    const onHand = Math.max(0, Number(input.currentInventory) || 0);
    const onOrder = Math.max(0, Number(input.onOrderQuantity) || 0);
    const rop = Math.max(0, Number(input.reorderPoint) || 0);
    const d = Math.max(0, Number(input.forecastedDemand) || 0);
    const R = Math.max(1, Number(input.reviewPeriodDays) || 7);

    const inventoryPosition = onHand + onOrder;
    const overstockThreshold = Math.ceil(rop + d * (2 * R));

    let status: StockRiskStatus;

    if (onHand === 0 && inventoryPosition <= rop) {
      status = StockRiskStatus.CRITICAL;
    } else if (inventoryPosition <= rop || onHand === 0) {
      status = StockRiskStatus.WARNING;
    } else if (inventoryPosition > overstockThreshold) {
      status = StockRiskStatus.OVERSTOCK;
    } else {
      status = StockRiskStatus.SAFE;
    }

    return {
      status,
      label: STOCK_RISK_LABELS[status],
      inventoryPosition,
      reorderPoint: rop,
      overstockThreshold,
    };
  }
}
