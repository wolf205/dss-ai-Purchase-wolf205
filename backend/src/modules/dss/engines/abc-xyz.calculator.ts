import { AbcGroup, AbcXyzBadge, XyzGroup } from '../enums/abc-xyz.enum';
import {
  AbcXyzClassificationResult,
  SkuSalesMetricsInput,
} from '../interfaces/dss-calculation.interface';

/**
 * AbcXyzCalculator — Động cơ phân loại ma trận tồn kho ABC - XYZ (BR-05)
 *
 * 1. Pareto ABC (Doanh thu tích lũy):
 *    - Nhóm A: Các SKU đóng góp đến 80% doanh thu tích lũy đầu tiên (prevCumPct < 80%)
 *    - Nhóm B: Các SKU kế tiếp đóng góp 15% tiếp theo (80% <= prevCumPct < 95%)
 *    - Nhóm C: Các SKU còn lại đóng góp 5% cuối cùng (prevCumPct >= 95%)
 *
 * 2. XYZ (Hệ số biến thiên nhu cầu CV = sigma_d / d_bar):
 *    - Nhóm X (Rất ổn định): CV <= 0.5
 *    - Nhóm Y (Biến động vừa): 0.5 < CV <= 1.0
 *    - Nhóm Z (Biến động mạnh/khó dự báo): CV > 1.0 hoặc d_bar <= 0
 *
 * 3. Cơ chế dự phòng Fallback:
 *    - SKU có số ngày bán < 7 ngày HOẶC doanh thu <= 0: Mặc định xếp vào nhóm CZ
 */
export class AbcXyzCalculator {
  static classify(items: SkuSalesMetricsInput[]): AbcXyzClassificationResult[] {
    if (!items || items.length === 0) {
      return [];
    }

    // 1. Tính tổng doanh thu toàn cửa hàng (chỉ tính giá trị dương)
    const totalStoreRevenue = items.reduce((sum, item) => {
      const rev = Number(item.totalRevenue);
      return sum + (rev > 0 ? rev : 0);
    }, 0);

    // 2. Sắp xếp danh sách SKU giảm dần theo tổng doanh thu
    const sortedItems = [...items].sort((a, b) => {
      const revA = Number(a.totalRevenue) || 0;
      const revB = Number(b.totalRevenue) || 0;
      return revB - revA;
    });

    let runningRevenue = 0;
    const results: AbcXyzClassificationResult[] = [];

    for (const item of sortedItems) {
      const revenue = Math.max(0, Number(item.totalRevenue) || 0);
      const prevRevenue = runningRevenue;
      runningRevenue += revenue;

      const prevCumPct =
        totalStoreRevenue > 0 ? (prevRevenue / totalStoreRevenue) * 100 : 0;
      const cumPct =
        totalStoreRevenue > 0
          ? Number(((runningRevenue / totalStoreRevenue) * 100).toFixed(2))
          : 0;

      // Kiểm tra điều kiện Fallback theo BR-05
      const isShortHistory = item.salesDaysCount < 7;
      const isZeroRevenue = revenue <= 0;

      if (isShortHistory || isZeroRevenue) {
        let fallbackReason = '';
        if (isShortHistory && isZeroRevenue) {
          fallbackReason =
            'SKU has sales history under 7 days and zero revenue';
        } else if (isShortHistory) {
          fallbackReason = 'SKU has sales history under 7 days';
        } else {
          fallbackReason = 'SKU has zero or negative revenue';
        }

        results.push({
          productId: item.productId,
          skuCode: item.skuCode,
          revenue,
          cumRevenuePercentage: cumPct,
          abcGroup: AbcGroup.C,
          xyzGroup: XyzGroup.Z,
          badge: 'CZ',
          cv: 0,
          isFallback: true,
          fallbackReason,
        });
        continue;
      }

      // Phân loại ABC theo nguyên lý Pareto
      let abcGroup: AbcGroup;
      if (prevCumPct < 80) {
        abcGroup = AbcGroup.A;
      } else if (prevCumPct < 95) {
        abcGroup = AbcGroup.B;
      } else {
        abcGroup = AbcGroup.C;
      }

      // Phân loại XYZ theo Hệ số biến thiên CV = sigma_d / d_bar
      const avgDemand = Number(item.avgDailyDemand) || 0;
      const stdDev = Math.max(0, Number(item.demandStdDev) || 0);

      let cv = 0;
      let xyzGroup: XyzGroup;

      if (avgDemand <= 0) {
        cv = 0;
        xyzGroup = XyzGroup.Z;
      } else {
        cv = Number((stdDev / avgDemand).toFixed(4));
        if (cv <= 0.5) {
          xyzGroup = XyzGroup.X;
        } else if (cv <= 1.0) {
          xyzGroup = XyzGroup.Y;
        } else {
          xyzGroup = XyzGroup.Z;
        }
      }

      const badge = `${abcGroup}${xyzGroup}` as AbcXyzBadge;

      results.push({
        productId: item.productId,
        skuCode: item.skuCode,
        revenue,
        cumRevenuePercentage: cumPct,
        abcGroup,
        xyzGroup,
        badge,
        cv,
        isFallback: false,
      });
    }

    return results;
  }
}
