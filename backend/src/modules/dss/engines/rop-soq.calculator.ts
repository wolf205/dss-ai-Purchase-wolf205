import {
  RopSoqInput,
  RopSoqResult,
} from '../interfaces/dss-calculation.interface';

/**
 * RopSoqCalculator — Động cơ tính Điểm đặt hàng lại (ROP) & Lượng mua đề xuất (SOQ) (BR-01, BR-03)
 *
 * 1. Điểm đặt hàng lại (Reorder Point - ROP):
 *    ROP = ceil((d_forecast * L) + SS)
 *
 * 2. Vị thế tồn kho khả dụng (Inventory Position - IP):
 *    IP = I_on_hand + I_on_order
 *
 * 3. Nhu cầu thiếu hụt (Net Requirement):
 *    Net Need = ROP - IP
 *
 * 4. Lượng mua cơ sở (Base SOQ):
 *    - Nếu IP >= ROP (Net Need <= 0): Base SOQ = 0 (tồn kho an toàn, chưa cần mua)
 *    - Nếu IP < ROP (Net Need > 0):
 *      Target Stock = (d_forecast * (L + R)) + SS
 *      Base SOQ = Target Stock - IP
 *
 * 5. Lượng mua đề xuất cuối cùng (Final SOQ) theo BR-03:
 *    - Nếu Base SOQ <= 0: Final SOQ = 0
 *    - Nếu Base SOQ > 0:
 *      - Làm tròn theo Pack Size nếu có: packRounded = ceil(Base SOQ / packSize) * packSize
 *      - Áp dụng ràng buộc MOQ: Final SOQ = max(MOQ, packRounded)
 */
export class RopSoqCalculator {
  static calculate(input: RopSoqInput): RopSoqResult {
    const d = Math.max(0, Number(input.forecastedDemand) || 0);
    const L = Math.max(1, Number(input.leadTimeDays) || 1);
    const ss = Math.max(0, Number(input.safetyStock) || 0);
    const onHand = Math.max(0, Number(input.currentInventory) || 0);
    const onOrder = Math.max(0, Number(input.onOrderQuantity) || 0);
    const R = Math.max(1, Number(input.reviewPeriodDays) || 7);
    const moq = Math.max(1, Number(input.moq) || 1);
    const packSize = Math.max(1, Number(input.packSize) || 1);

    // 1. ROP = ceil(d * L + SS)
    const rawRop = d * L + ss;
    const reorderPoint = Math.ceil(rawRop);

    // 2. IP = onHand + onOrder
    const inventoryPosition = onHand + onOrder;

    // 3. Net Requirement = ROP - IP
    const netRequirement = reorderPoint - inventoryPosition;

    // 4. Target Stock = d * (L + R) + SS
    const targetStock = Number((d * (L + R) + ss).toFixed(2));

    // Nếu tồn kho khả dụng IP >= ROP -> Chưa cần đặt hàng (Base SOQ = 0)
    if (netRequirement <= 0) {
      return {
        reorderPoint,
        inventoryPosition,
        netRequirement,
        baseSoq: 0,
        suggestedQuantity: 0,
        isOrderRequired: false,
        moqApplied: false,
        targetStock,
      };
    }

    // 5. Tính Base SOQ khi IP < ROP
    const rawBaseSoq = targetStock - inventoryPosition;
    if (rawBaseSoq <= 0) {
      return {
        reorderPoint,
        inventoryPosition,
        netRequirement,
        baseSoq: 0,
        suggestedQuantity: 0,
        isOrderRequired: false,
        moqApplied: false,
        targetStock,
      };
    }

    const baseSoq = Number(rawBaseSoq.toFixed(2));

    // 6. Áp dụng MOQ và Pack Size theo BR-03
    let roundedByPack = Math.ceil(baseSoq);
    if (packSize > 1) {
      roundedByPack = Math.ceil(baseSoq / packSize) * packSize;
    }

    const finalSoq = Math.max(moq, roundedByPack);
    const moqApplied = Math.ceil(baseSoq) < moq;

    return {
      reorderPoint,
      inventoryPosition,
      netRequirement,
      baseSoq,
      suggestedQuantity: finalSoq,
      isOrderRequired: finalSoq > 0,
      moqApplied,
      targetStock,
    };
  }
}
