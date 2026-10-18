import { Prisma } from '@prisma/client';

export interface RecentOrderPerformanceMetrics {
  recent5OrderOnTimeRate: number | null;
  recent5OrderFulfillmentRate: number | null;
  performanceLabel: string;
}

/**
 * Tính hệ số thời gian (On-Time Factor) suy giảm tuyến tính theo số ngày trễ (BR-13).
 * Ngưỡng trễ tối đa T_grace = 3 ngày.
 */
export function calculateOnTimeFactor(daysLate: number): number {
  if (daysLate <= 0) {
    return 1.0;
  }
  return Math.max(0, 1 - daysLate / 3);
}

/**
 * Tính điểm đánh giá hiệu suất của một đơn hàng thành phần (BR-24):
 * Order Score = (On-Time Factor * 50) + (Fulfillment Rate * 0.5)
 */
export function calculateOrderScore(
  daysLate: number,
  fulfillmentRate: number,
): number {
  const onTimeFactor = calculateOnTimeFactor(daysLate);
  const clampedFulfillment = Math.min(100, Math.max(0, fulfillmentRate));
  return Number((onTimeFactor * 50 + clampedFulfillment * 0.5).toFixed(2));
}

/**
 * Xác định nhãn phong độ NCC theo cửa sổ trượt và cơ chế Cold Start (BR-24).
 */
export function resolvePerformanceLabel(completedCount: number): string {
  if (completedCount < 3) {
    return '[NCC Mới - Điểm khởi tạo: 80%]';
  }
  if (completedCount < 5) {
    return `[Lịch sử: ${completedCount} đơn]`;
  }
  return '[Phong độ 5 đơn gần nhất]';
}

/**
 * Tính toán các chỉ số OTIF 5 đơn Completed gần nhất cho NCC (BR-13, BR-24).
 */
export function calculateRecentOrderMetrics(
  recentOrders: {
    goodsReceipt?: {
      daysLate: number;
      overallFulfillmentRate: Prisma.Decimal | number;
    } | null;
  }[],
  completedCount: number,
): RecentOrderPerformanceMetrics {
  let recent5OrderOnTimeRate: number | null = null;
  let recent5OrderFulfillmentRate: number | null = null;

  if (recentOrders && recentOrders.length > 0) {
    // 1. Tỷ lệ giao đúng hạn 5 đơn gần nhất (daysLate == 0 theo BR-13)
    const onTimeOrders = recentOrders.filter(
      (po) => po.goodsReceipt && po.goodsReceipt.daysLate === 0,
    ).length;
    recent5OrderOnTimeRate = Number(
      (onTimeOrders / recentOrders.length).toFixed(4),
    );

    // 2. Tỷ lệ giao đủ hàng 5 đơn gần nhất
    const fulfillmentSum = recentOrders.reduce(
      (sum, po) => sum + Number(po.goodsReceipt?.overallFulfillmentRate || 0),
      0,
    );
    recent5OrderFulfillmentRate = Number(
      (fulfillmentSum / recentOrders.length).toFixed(4),
    );
  }

  const performanceLabel = resolvePerformanceLabel(completedCount);

  return {
    recent5OrderOnTimeRate,
    recent5OrderFulfillmentRate,
    performanceLabel,
  };
}
