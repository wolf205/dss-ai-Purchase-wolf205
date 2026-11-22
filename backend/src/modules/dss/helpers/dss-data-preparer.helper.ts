import { Prisma } from '@prisma/client';
import {
  SkuForecastInput,
  SkuSalesHistoryItem,
} from '../interfaces/ai-forecasting.interface';

export interface AggregatedProductSales {
  totalRevenue: number;
  totalQty: number;
  records: SkuSalesHistoryItem[];
  distinctDates: Set<string>;
}

export interface AnalysisDateRangeInfo {
  effectiveDate: Date;
  effectiveUtc: Date;
  ninetyDaysAgoUtc: Date;
  salesDateFilter: Prisma.DateTimeFilter;
  historyStartDateStr: string;
  historyDays: number;
}

export class DssDataPreparerHelper {
  /**
   * Tính toán các mốc ngày trong cửa sổ phân tích 90 ngày
   */
  static resolveDateRange(asOfDateInput?: string): AnalysisDateRangeInfo {
    const effectiveDate = asOfDateInput
      ? new Date(asOfDateInput)
      : new Date();
    const effectiveUtc = new Date(
      Date.UTC(
        effectiveDate.getUTCFullYear(),
        effectiveDate.getUTCMonth(),
        effectiveDate.getUTCDate(),
      ),
    );
    const ninetyDaysAgoUtc = new Date(effectiveUtc);
    ninetyDaysAgoUtc.setUTCDate(ninetyDaysAgoUtc.getUTCDate() - 90);

    const salesDateFilter: Prisma.DateTimeFilter = {
      gte: ninetyDaysAgoUtc,
      ...(asOfDateInput ? { lt: effectiveUtc } : {}),
    };

    const historyStartDateStr = ninetyDaysAgoUtc.toISOString().split('T')[0];

    return {
      effectiveDate,
      effectiveUtc,
      ninetyDaysAgoUtc,
      salesDateFilter,
      historyStartDateStr,
      historyDays: 90,
    };
  }

  /**
   * Gom dữ liệu bán hàng 90 ngày theo từng SKU
   */
  static aggregateSalesRecords(
    products: { id: bigint }[],
    salesRecords: {
      productId: bigint;
      revenue: Prisma.Decimal;
      quantitySold: number;
      saleDate: Date;
    }[],
  ): Map<string, AggregatedProductSales> {
    const salesByProduct = new Map<string, AggregatedProductSales>();

    for (const p of products) {
      salesByProduct.set(p.id.toString(), {
        totalRevenue: 0,
        totalQty: 0,
        records: [],
        distinctDates: new Set(),
      });
    }

    for (const record of salesRecords) {
      const pIdStr = record.productId.toString();
      const entry = salesByProduct.get(pIdStr);
      if (entry) {
        const rev = Number(record.revenue) || 0;
        const qty = record.quantitySold || 0;
        const dateStr = record.saleDate.toISOString().split('T')[0];

        entry.totalRevenue += rev;
        entry.totalQty += qty;
        entry.records.push({ date: dateStr, quantity: qty });
        entry.distinctDates.add(dateStr);
      }
    }

    return salesByProduct;
  }

  /**
   * Gom danh sách ngày hết hàng từ snapshot kiểm kê (Stockout Uncensoring)
   */
  static mapStockoutDatesByProduct(
    stockoutSnapshots: { productId: bigint; snapshotDate: Date }[],
  ): Map<string, string[]> {
    const stockoutDatesByProduct = new Map<string, string[]>();
    for (const snap of stockoutSnapshots) {
      const pKey = snap.productId.toString();
      const dStr = snap.snapshotDate.toISOString().split('T')[0];
      const existing = stockoutDatesByProduct.get(pKey) ?? [];
      existing.push(dStr);
      stockoutDatesByProduct.set(pKey, existing);
    }
    return stockoutDatesByProduct;
  }

  /**
   * Chuẩn bị payload đầu vào gửi sang AI Forecasting Client kèm neo ngày bắt đầu/kết thúc
   */
  static buildForecastInputs(
    products: {
      id: bigint;
      category?: { categoryCode?: string } | null;
    }[],
    salesByProduct: Map<string, AggregatedProductSales>,
    stockoutDatesByProduct: Map<string, string[]>,
    salesRecords: { saleDate: Date }[],
    effectiveDate: Date,
    asOfDateInput?: string,
  ): SkuForecastInput[] {
    const historyEndDate = new Date(effectiveDate);
    historyEndDate.setUTCDate(historyEndDate.getUTCDate() - 1);
    const defaultEndDateStr = historyEndDate.toISOString().split('T')[0];

    const latestSaleDateStr =
      salesRecords.length > 0
        ? salesRecords[salesRecords.length - 1].saleDate
            .toISOString()
            .split('T')[0]
        : null;

    const historyEndDateStr =
      !asOfDateInput &&
      latestSaleDateStr &&
      latestSaleDateStr > defaultEndDateStr
        ? latestSaleDateStr
        : defaultEndDateStr;

    const dateRange = this.resolveDateRange(asOfDateInput);
    const historyStartDateStr = dateRange.historyStartDateStr;

    return products.map((p) => {
      const sales = salesByProduct.get(p.id.toString())!;
      const records = [...sales.records];

      // Đảm bảo chuỗi có neo ngày bắt đầu và ngày kết thúc lịch sử để AI service xác định đúng chu kỳ
      if (
        records.length === 0 ||
        records[records.length - 1].date < historyEndDateStr
      ) {
        records.push({ date: historyEndDateStr, quantity: 0 });
      }
      if (records[0].date > historyStartDateStr) {
        records.unshift({ date: historyStartDateStr, quantity: 0 });
      }

      const stockoutDates = stockoutDatesByProduct.get(p.id.toString());
      return {
        productId: p.id,
        history: records,
        categoryCode: p.category?.categoryCode,
        ...(stockoutDates && stockoutDates.length > 0 ? { stockoutDates } : {}),
      };
    });
  }
}
