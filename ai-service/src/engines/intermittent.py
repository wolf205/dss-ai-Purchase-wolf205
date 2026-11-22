from datetime import date
from typing import List, Optional

from statsforecast import StatsForecast
from statsforecast.models import (
    CrostonSBA,
    DynamicOptimizedTheta,
    MSTL,
    TSB,
)

from src.engines.baseline import build_zero_forecasts
from src.models.metrics import ForecastModel, SeriesMetrics
from src.models.request import DailySalesPoint
from src.models.response import DailyForecast, SkuForecastResult
from src.postprocessing.confidence_interval import compute_empirical_ci_bounds
from src.postprocessing.seasonality import calculate_day_of_week_factors
from src.preprocessing.adapter import pad_zero_demand_dataframe
from src.preprocessing.outlier import clean_and_winsorize_series
from src.preprocessing.uncensoring import uncensor_stockout_series
from src.preprocessing.zero_padding import pad_zero_demand_series


def forecast_intermittent(
    sku_id: int,
    history: List[DailySalesPoint],
    future_dates: List[date],
    metrics: SeriesMetrics,
    model_choice: ForecastModel,
    horizon_days: int,
    stockout_dates: Optional[List[date]] = None,
    pooled_dow_factors: Optional[List[float]] = None,
) -> SkuForecastResult:
    """
    Dự báo cho chuỗi ngắt quãng (Intermittent Demand) kết hợp CrostonSBA / TSB
    cùng MSTL/DynamicOptimizedTheta khi mật độ bán đủ lớn,
    kết hợp Day-of-Week Seasonality Shrinkage Overlay.
    """
    df = pad_zero_demand_dataframe(sku_id, history, stockout_dates=stockout_dates)
    padded = clean_and_winsorize_series(
        uncensor_stockout_series(pad_zero_demand_series(history), stockout_dates)
        if stockout_dates
        else pad_zero_demand_series(history)
    )

    if metrics.mean <= 0.0:
        return build_zero_forecasts(sku_id, future_dates, metrics, ForecastModel.CROSTON.value)

    use_tsb = model_choice == ForecastModel.TSB
    alpha_d = 0.2 if metrics.non_zero_ratio > 0.4 else 0.1
    alpha_p = 0.15 if metrics.non_zero_ratio > 0.4 else 0.1
    sf_models = [
        CrostonSBA(),
        TSB(alpha_d=alpha_d, alpha_p=alpha_p),
        DynamicOptimizedTheta(season_length=7),
        MSTL(season_length=7),
    ]
    sf = StatsForecast(models=sf_models, freq="D", n_jobs=1)
    fcst_df = sf.forecast(df=df, h=horizon_days)

    day_factors = calculate_day_of_week_factors(padded, pooled_factors=pooled_dow_factors)

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        row = fcst_df.iloc[i]
        factor = day_factors[d.weekday()]
        p_sba = max(0.0, float(row["CrostonSBA"])) * factor
        p_tsb = max(0.0, float(row["TSB"])) * factor
        p_dot = max(0.0, float(row["DynamicOptimizedTheta"]))
        p_mstl = max(0.0, float(row["MSTL"]))

        if use_tsb:
            raw_pred = 0.50 * p_tsb + 0.30 * p_sba + 0.20 * p_dot
        elif metrics.non_zero_ratio < 0.50:
            raw_pred = 0.45 * p_sba + 0.30 * p_dot + 0.25 * p_mstl
        else:
            raw_pred = 0.40 * p_mstl + 0.35 * p_dot + 0.25 * p_sba

        pred = round(max(0.0, raw_pred), 4)
        preds.append(pred)
        lower, upper = compute_empirical_ci_bounds(pred, padded, metrics, i)

        daily_forecasts.append(
            DailyForecast(date=d, predicted=pred, lower=lower, upper=upper)
        )

    daily_avg = round(sum(preds) / len(preds) if preds else 0.0, 4)
    model_used = ForecastModel.TSB.value if use_tsb else ForecastModel.CROSTON.value

    return SkuForecastResult(
        sku_id=sku_id,
        daily_average=daily_avg,
        daily_demand_std=round(float(metrics.std), 4),
        model_used=model_used,
        daily_forecasts=daily_forecasts,
    )
