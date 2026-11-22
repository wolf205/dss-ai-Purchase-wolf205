from datetime import date
import logging
from typing import List, Optional
import pandas as pd

from statsforecast import StatsForecast
from statsforecast.models import (
    AutoARIMA,
    AutoETS,
    DynamicOptimizedTheta,
    HoltWinters,
    MSTL,
)

from src.engines.baseline import build_zero_forecasts
from src.models.metrics import ForecastModel, SeriesMetrics
from src.models.request import DailySalesPoint
from src.models.response import DailyForecast, SkuForecastResult
from src.postprocessing.confidence_interval import compute_empirical_ci_bounds
from src.preprocessing.adapter import pad_zero_demand_dataframe
from src.preprocessing.outlier import clean_and_winsorize_series
from src.preprocessing.uncensoring import uncensor_stockout_series
from src.preprocessing.zero_padding import pad_zero_demand_series

logger = logging.getLogger(__name__)


def forecast_continuous(
    sku_id: int,
    history: List[DailySalesPoint],
    future_dates: List[date],
    metrics: SeriesMetrics,
    model_choice: ForecastModel,
    horizon_days: int,
    stockout_dates: Optional[List[date]] = None,
) -> SkuForecastResult:
    """
    Dự báo cho chuỗi liên tục (Smooth / Variable Moderate) bằng tổ hợp đa mô hình
    (MSTL + AutoETS + DynamicOptimizedTheta + HoltWinters) qua statsforecast.
    Tự động rút lui an toàn về AutoARIMA nếu có mô hình gặp chuỗi suy biến.
    """
    df = pad_zero_demand_dataframe(sku_id, history, stockout_dates=stockout_dates)
    padded = clean_and_winsorize_series(
        uncensor_stockout_series(pad_zero_demand_series(history), stockout_dates)
        if stockout_dates
        else pad_zero_demand_series(history)
    )

    if metrics.mean <= 0.0:
        return build_zero_forecasts(sku_id, future_dates, metrics, model_choice.value)

    sf_models = [
        MSTL(season_length=7),
        AutoETS(season_length=7),
        DynamicOptimizedTheta(season_length=7),
        HoltWinters(season_length=7),
    ]

    fcst_df: Optional[pd.DataFrame] = None
    use_arima_only = False
    try:
        sf = StatsForecast(models=sf_models, freq="D", n_jobs=1)
        fcst_df = sf.forecast(df=df, h=horizon_days)
    except Exception as e:
        logger.info("Continuous ensemble failed (%s), falling back to AutoARIMA", e)
        use_arima_only = True
        sf = StatsForecast(
            models=[AutoARIMA(season_length=7, max_p=2, max_q=2, max_P=1, max_Q=1)],
            freq="D",
            n_jobs=1,
        )
        fcst_df = sf.forecast(df=df, h=horizon_days, level=[95])

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        row = fcst_df.iloc[i]
        if use_arima_only:
            raw_pred = max(0.0, float(row["AutoARIMA"]))
            pred = round(raw_pred, 4)
            if "AutoARIMA-lo-95" in fcst_df.columns and "AutoARIMA-hi-95" in fcst_df.columns:
                lower = round(max(0.0, float(row["AutoARIMA-lo-95"])), 4)
                upper = round(max(lower, float(row["AutoARIMA-hi-95"])), 4)
            else:
                lower, upper = compute_empirical_ci_bounds(pred, padded, metrics, i)
        else:
            p_mstl = max(0.0, float(row["MSTL"]))
            p_ets = max(0.0, float(row["AutoETS"]))
            p_dot = max(0.0, float(row["DynamicOptimizedTheta"]))
            p_hw = max(0.0, float(row["HoltWinters"]))

            if metrics.cv <= 0.5:
                raw_pred = 0.40 * p_ets + 0.35 * p_mstl + 0.15 * p_hw + 0.10 * p_dot
            else:
                raw_pred = 0.40 * p_mstl + 0.30 * p_ets + 0.30 * p_dot

            pred = round(max(0.0, raw_pred), 4)
            lower, upper = compute_empirical_ci_bounds(pred, padded, metrics, i)

        preds.append(pred)
        daily_forecasts.append(
            DailyForecast(date=d, predicted=pred, lower=lower, upper=upper)
        )

    daily_avg = round(sum(preds) / len(preds) if preds else 0.0, 4)
    model_used = (
        ForecastModel.AUTO_ARIMA.value
        if use_arima_only
        else ForecastModel.HYBRID_ENSEMBLE.value
    )

    return SkuForecastResult(
        sku_id=sku_id,
        daily_average=daily_avg,
        daily_demand_std=round(float(metrics.std), 4),
        model_used=model_used,
        daily_forecasts=daily_forecasts,
    )
