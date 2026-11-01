import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiServiceForecastResponse,
  ForecastDailyItem,
  SkuForecastInput,
  SkuForecastResult,
} from '../interfaces/ai-forecasting.interface';

@Injectable()
export class AiForecastingClient {
  private readonly logger = new Logger(AiForecastingClient.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dự báo nhu cầu 14 ngày cho danh sách SKU qua Python AI Service
   * Kèm cơ chế Graceful Fallback SMA in-memory khi dịch vụ ngoại vi lỗi/timeout > 3s
   */
  async getForecasts(
    inputs: SkuForecastInput[],
    horizonDays = 14,
  ): Promise<Map<string, SkuForecastResult>> {
    const resultMap = new Map<string, SkuForecastResult>();
    const aiServiceUrl =
      this.configService.get<string>('AI_SERVICE_URL') ||
      'http://localhost:8000';

    // Chuẩn bị payload chuẩn TimeSeriesPayload
    const series = inputs.map((item) => {
      const history =
        item.history.length > 0
          ? item.history
          : [
              {
                date: new Date().toISOString().split('T')[0],
                quantity: 0,
              },
            ];

      return {
        skuId: Number(item.productId),
        history,
      };
    });

    let aiSuccess = false;

    try {
      const timeoutMs =
        Number(this.configService.get<string>('AI_SERVICE_TIMEOUT_MS')) ||
        60000;

      const response = await fetch(`${aiServiceUrl}/api/v1/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horizonDays, series }),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) {
        const data = (await response.json()) as AiServiceForecastResponse;
        if (data && Array.isArray(data.results)) {
          for (const item of data.results) {
            resultMap.set(item.skuId.toString(), {
              dailyAverage: item.dailyAverage,
              dailyDemandStd: item.dailyDemandStd,
              modelUsed: item.modelUsed,
              dailyForecasts: item.dailyForecasts || [],
            });
          }
          aiSuccess = true;
        }
      } else {
        this.logger.warn(
          `AI Service returned HTTP status ${response.status}. Kích hoạt Graceful Fallback SMA.`,
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `AI Service unavailable or timed out: ${message}. Kích hoạt Graceful Fallback SMA.`,
      );
    }

    // Graceful Fallback Strategy: Tính toán SMA cho các SKU chưa có kết quả
    if (!aiSuccess || resultMap.size < inputs.length) {
      this.applySmaFallback(inputs, resultMap, horizonDays);
    }

    return resultMap;
  }

  /**
   * Tính toán dự báo dự phòng (SMA Fallback) in-memory kèm hệ số mùa vụ theo ngày trong tuần (Day-of-Week Factor)
   */
  private applySmaFallback(
    inputs: SkuForecastInput[],
    resultMap: Map<string, SkuForecastResult>,
    horizonDays: number,
  ): void {
    for (const item of inputs) {
      const pIdStr = item.productId.toString();
      if (resultMap.has(pIdStr)) {
        continue;
      }

      const history = item.history;
      const count = Math.max(1, history.length);
      const totalQty = history.reduce((sum, h) => sum + h.quantity, 0);
      const avg = totalQty / count;

      // Tính độ lệch chuẩn mẫu (sample standard deviation)
      const variance =
        history.reduce((acc, h) => acc + Math.pow(h.quantity - avg, 2), 0) /
        (count > 1 ? count - 1 : 1);
      const std = Math.sqrt(variance);

      // Tính toán hệ số mùa vụ theo thứ trong tuần (Day-of-Week Seasonality Factor: 0 = Chủ Nhật .. 6 = Thứ Bảy)
      const daySums = new Array<number>(7).fill(0);
      const dayCounts = new Array<number>(7).fill(0);

      for (const h of history) {
        if (h.date) {
          const dObj = new Date(h.date);
          if (!isNaN(dObj.getTime())) {
            const w = dObj.getUTCDay();
            daySums[w] += h.quantity;
            dayCounts[w]++;
          }
        }
      }

      const dayFactors = new Array<number>(7).fill(1.0);
      if (avg > 0 && history.length >= 7) {
        for (let w = 0; w < 7; w++) {
          if (dayCounts[w] > 0) {
            const dayMean = daySums[w] / dayCounts[w];
            // Giới hạn hệ số dao động trong khoảng [0.3, 2.5] để bảo toàn tính ổn định
            dayFactors[w] = Math.max(0.3, Math.min(2.5, dayMean / avg));
          }
        }
      }

      // Chuỗi dự báo horizonDays ngày có dao động tự nhiên theo nhịp bán hàng
      const lastDate =
        history.length > 0 && history[history.length - 1].date
          ? new Date(`${history[history.length - 1].date}T00:00:00.000Z`)
          : new Date();
      const dailyForecasts: ForecastDailyItem[] = [];
      for (let i = 1; i <= horizonDays; i++) {
        const nextDay = new Date(lastDate);
        nextDay.setUTCDate(lastDate.getUTCDate() + i);
        const dStr = nextDay.toISOString().split('T')[0];
        const w = nextDay.getUTCDay();
        const factor = dayFactors[w] ?? 1.0;

        const pred = Number((avg * factor).toFixed(2));
        dailyForecasts.push({
          date: dStr,
          predicted: pred,
          lower: Number(Math.max(0, pred - 1.96 * std).toFixed(2)),
          upper: Number((pred + 1.96 * std).toFixed(2)),
        });
      }

      resultMap.set(pIdStr, {
        dailyAverage: Number(avg.toFixed(2)),
        dailyDemandStd: Number(std.toFixed(2)),
        modelUsed: 'SMA_FALLBACK',
        dailyForecasts,
      });
    }
  }
}
