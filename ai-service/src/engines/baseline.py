from datetime import date
from typing import List, Optional

from src.models.metrics import ForecastModel, SeriesMetrics
from src.models.request import DailySalesPoint
from src.models.response import DailyForecast, SkuForecastResult
from src.postprocessing.seasonality import calculate_day_of_week_factors
from src.postprocessing.momentum import calculate_recency_momentum_boost
from src.postprocessing.confidence_interval import compute_empirical_ci_bounds


def build_zero_forecasts(
    sku_id: int,
    future_dates: List[date],
    metrics: SeriesMetrics,
    model_used: str = ForecastModel.CROSTON.value,
) -> SkuForecastResult:
    """Trả về dự báo an toàn toàn số 0 cho SKU chưa phát sinh doanh số."""
    daily_forecasts = [
        DailyForecast(date=d, predicted=0.0, lower=0.0, upper=0.0)
        for d in future_dates
    ]
    return SkuForecastResult(
        sku_id=sku_id,
        daily_average=0.0,
        daily_demand_std=round(float(metrics.std), 4),
        model_used=model_used,
        daily_forecasts=daily_forecasts,
    )


def build_sma_forecasts(
    sku_id: int,
    padded_series: List[DailySalesPoint],
    future_dates: List[date],
    metrics: SeriesMetrics,
    pooled_dow_factors: Optional[List[float]] = None,
) -> SkuForecastResult:
    """
    Dự báo bằng Simple Moving Average 7 ngày (hoặc tối đa số ngày có sẵn).
    Áp dụng cho chuỗi ngắn < 30 ngày hoặc khi các mô hình phức tạp cần fallback an toàn.
    """
    n = len(padded_series)
    window = min(7, n)
    recent_values = [p.quantity for p in padded_series[-window:]]
    sma_mean = sum(recent_values) / window if window > 0 else 0.0

    pred_base = round(max(0.0, float(sma_mean)), 4)
    day_factors = calculate_day_of_week_factors(padded_series, pooled_factors=pooled_dow_factors)

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        w = d.weekday()
        factor = day_factors[w]
        momentum_boost = calculate_recency_momentum_boost(padded_series, step_index=i)
        adjusted_pred = round(max(0.0, pred_base * factor * momentum_boost), 4)
        preds.append(adjusted_pred)
        lower, upper = compute_empirical_ci_bounds(adjusted_pred, padded_series, metrics, i)

        daily_forecasts.append(
            DailyForecast(date=d, predicted=adjusted_pred, lower=lower, upper=upper)
        )

    daily_avg = round(sum(preds) / len(preds) if preds else pred_base, 4)

    return SkuForecastResult(
        sku_id=sku_id,
        daily_average=daily_avg,
        daily_demand_std=round(float(metrics.std), 4),
        model_used=ForecastModel.SMA.value,
        daily_forecasts=daily_forecasts,
    )
