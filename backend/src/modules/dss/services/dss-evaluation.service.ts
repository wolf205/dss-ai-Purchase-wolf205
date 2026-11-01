import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DailyEvaluationItemDto,
  DssSessionEvaluationResponseDto,
  EvaluationWindowDto,
  OverallEvaluationSummaryDto,
  SkuEvaluationDto,
} from '../dto/dss-evaluation.dto';
import { ForecastDailyItem } from '../interfaces/ai-forecasting.interface';
import {
  AccuracyEvaluationCalculator,
  SkuAccuracyCalculationResult,
} from '../engines/accuracy-evaluation.calculator';

@Injectable()
export class DssEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Đánh giá độ chính xác và đối soát kết quả dự báo của một phiên đề xuất DSS
   * GET /api/v1/dss/sessions/:id/evaluation
   */
  async evaluateSession(
    sessionId: bigint,
  ): Promise<DssSessionEvaluationResponseDto> {
    const session = await this.prisma.recommendationSession.findUnique({
      where: { id: sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: `Không tìm thấy phiên DSS với ID ${sessionId}`,
      });
    }

    if (!session.items || session.items.length === 0) {
      return {
        sessionId: session.id.toString(),
        sessionCode: session.sessionCode,
        sessionStatus: session.status,
        approvedAt: session.approvedAt
          ? session.approvedAt.toISOString()
          : null,
        hasActualData: false,
        message: 'Phiên DSS không có sản phẩm nào để đánh giá',
        evaluationWindow: {
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date().toISOString().slice(0, 10),
          totalDays: 0,
        },
        summary: null,
        skuEvaluations: [],
      };
    }

    // 1. Thu thập danh sách ngày trong chu kỳ dự báo từ dailyForecasts của các item
    const forecastDatesSet = new Set<string>();
    for (const item of session.items) {
      const dailyForecasts = item.dailyForecasts as unknown as
        ForecastDailyItem[] | null;
      if (Array.isArray(dailyForecasts)) {
        for (const df of dailyForecasts) {
          if (df?.date) {
            forecastDatesSet.add(df.date);
          }
        }
      }
    }

    // Nếu không có dailyForecasts, giả định 7 ngày sau ngày tạo phiên
    const sortedDates = Array.from(forecastDatesSet).sort();
    if (sortedDates.length === 0) {
      const baseDate = session.createdAt
        ? new Date(session.createdAt)
        : new Date();
      for (let i = 1; i <= 7; i++) {
        const d = new Date(baseDate);
        d.setUTCDate(d.getUTCDate() + i);
        sortedDates.push(d.toISOString().slice(0, 10));
      }
    }

    const startDateStr = sortedDates[0];
    const endDateStr = sortedDates[sortedDates.length - 1];
    const evaluationWindow: EvaluationWindowDto = {
      startDate: startDateStr,
      endDate: endDateStr,
      totalDays: sortedDates.length,
    };

    // 2. Truy vấn dữ liệu bán hàng thực tế (sales_records) với select projection
    const productIds = session.items.map((it) => it.productId);
    const startDateObj = new Date(`${startDateStr}T00:00:00.000Z`);
    const endDateObj = new Date(`${endDateStr}T23:59:59.999Z`);

    const salesRecords = await this.prisma.salesRecord.findMany({
      where: {
        productId: { in: productIds },
        saleDate: {
          gte: startDateObj,
          lte: endDateObj,
        },
      },
      select: {
        productId: true,
        saleDate: true,
        quantitySold: true,
      },
    });

    // 3. Nếu chưa có bất kỳ bản ghi bán hàng nào trong kỳ dự báo -> Báo chưa có dữ liệu đối soát
    if (salesRecords.length === 0) {
      return {
        sessionId: session.id.toString(),
        sessionCode: session.sessionCode,
        sessionStatus: session.status,
        approvedAt: session.approvedAt
          ? session.approvedAt.toISOString()
          : null,
        hasActualData: false,
        message: `Chưa có dữ liệu bán hàng thực tế trong khoảng thời gian dự báo (${startDateStr} đến ${endDateStr}). Vui lòng tải lên dữ liệu bán hàng qua chức năng Nhập dữ liệu vận hành để xem kết quả đối soát.`,
        evaluationWindow,
        summary: null,
        skuEvaluations: [],
      };
    }

    // Tổ chức dữ liệu bán hàng theo Map: `productId_date` -> quantitySold
    const salesMap = new Map<string, number>();
    const actualDatesSet = new Set<string>();

    for (const record of salesRecords) {
      const dStr = record.saleDate.toISOString().slice(0, 10);
      actualDatesSet.add(dStr);
      const key = `${record.productId.toString()}_${dStr}`;
      salesMap.set(key, (salesMap.get(key) ?? 0) + record.quantitySold);
    }

    // Các ngày thực tế có xuất hiện dữ liệu
    const evaluatedDates = sortedDates.filter((d) => actualDatesSet.has(d));

    // 4. Đánh giá chi tiết từng SKU qua Domain Engine
    const skuEvaluations: SkuEvaluationDto[] = [];
    const skuMetricsList: SkuAccuracyCalculationResult[] = [];
    const dailyAggMap = new Map<
      string,
      { predicted: number; actual: number }
    >();

    for (const d of evaluatedDates) {
      dailyAggMap.set(d, { predicted: 0, actual: 0 });
    }

    for (const item of session.items) {
      const pIdStr = item.productId.toString();
      const dailyForecasts = item.dailyForecasts as unknown as
        ForecastDailyItem[] | null;
      const fcstMap = new Map<string, number>();

      if (Array.isArray(dailyForecasts)) {
        for (const df of dailyForecasts) {
          if (df?.date) {
            fcstMap.set(df.date, Number(df.predicted || 0));
          }
        }
      }

      const defaultPred = Number(item.forecastedDemand || 0);
      const timeline: DailyEvaluationItemDto[] = [];

      for (const d of evaluatedDates) {
        const predVal = Number((fcstMap.get(d) ?? defaultPred).toFixed(2));
        const actVal = salesMap.get(`${pIdStr}_${d}`) ?? 0;

        timeline.push({
          date: d,
          predicted: predVal,
          actual: actVal,
        });

        // Cộng dồn aggregate toàn cửa hàng theo từng ngày
        const agg = dailyAggMap.get(d)!;
        agg.predicted += predVal;
        agg.actual += actVal;
      }

      // Tính toán chỉ số của SKU qua Domain Engine
      const skuMetrics =
        AccuracyEvaluationCalculator.calculateSkuMetrics(timeline);
      skuMetricsList.push(skuMetrics);

      skuEvaluations.push({
        productId: pIdStr,
        skuCode: item.product.skuCode,
        productName: item.product.productName,
        categoryName: item.product.category.categoryName,
        abcXyzGroup: item.abcXyzGroup,
        wape: skuMetrics.wape,
        mape: skuMetrics.mape,
        mae: skuMetrics.mae,
        bias: skuMetrics.bias,
        totalPredicted: skuMetrics.totalPredicted,
        totalActual: skuMetrics.totalActual,
        qualityRating: skuMetrics.qualityRating,
        dailyTimeline: timeline,
      });
    }

    // 5. Tính toán KPI tổng hợp toàn phiên qua Domain Engine
    const overallMetrics =
      AccuracyEvaluationCalculator.calculateOverallMetrics(skuMetricsList);

    const dailyAggregateTimeline: DailyEvaluationItemDto[] = evaluatedDates.map(
      (d) => {
        const agg = dailyAggMap.get(d)!;
        return {
          date: d,
          predicted: Number(agg.predicted.toFixed(2)),
          actual: Math.round(agg.actual),
        };
      },
    );

    const summary: OverallEvaluationSummaryDto = {
      overallWape: overallMetrics.overallWape,
      overallMape: overallMetrics.overallMape,
      overallMae: overallMetrics.overallMae,
      overallBias: overallMetrics.overallBias,
      totalPredicted: overallMetrics.totalPredicted,
      totalActual: overallMetrics.totalActual,
      qualityRating: overallMetrics.qualityRating,
      evaluatedDaysCount: evaluatedDates.length,
      totalDaysHorizon: sortedDates.length,
      dailyAggregateTimeline,
    };

    return {
      sessionId: session.id.toString(),
      sessionCode: session.sessionCode,
      sessionStatus: session.status,
      approvedAt: session.approvedAt ? session.approvedAt.toISOString() : null,
      hasActualData: true,
      message: `Đã hoàn tất đối soát với ${evaluatedDates.length}/${sortedDates.length} ngày bán hàng thực tế.`,
      evaluationWindow,
      summary,
      skuEvaluations,
    };
  }
}
