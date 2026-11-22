from datetime import timedelta
import logging
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from statsforecast import StatsForecast
from statsforecast.models import (
    AutoETS,
    CrostonSBA,
    DynamicOptimizedTheta,
    HoltWinters,
    MSTL,
    TSB,
)

from src.engines.baseline import build_sma_forecasts, build_zero_forecasts
from src.engines.global_ridge import fit_and_predict_global_cross_sku
from src.models.metrics import ForecastModel, SeriesMetrics
from src.models.request import DailySalesPoint, SkuSeries, TimeSeriesPayload
from src.models.response import DailyForecast, ForecastResponse, SkuForecastResult
from src.pipelines.single_sku import run_forecast_for_sku
from src.postprocessing.confidence_interval import compute_empirical_ci_bounds
from src.postprocessing.seasonality import (
    calculate_day_of_week_factors,
    compute_pooled_dow_factors,
)
from src.preprocessing.pipeline import preprocess_sku_series
from src.profiling.metrics import calculate_series_metrics

logger = logging.getLogger(__name__)


def run_batch_hybrid_forecast(payload: TimeSeriesPayload) -> ForecastResponse:
    """
    Pipeline dự báo theo lô (Batch Hybrid Pipeline):
    1. Tiền xử lý đồng bộ toàn bộ SKU (Zero-padding + Stockout Uncensoring + MAD Winsorization).
    2. Vectorized StatsForecast trên 6 thuật toán (MSTL, AutoETS, DOT, HoltWinters, CrostonSBA, TSB).
    3. Global Cross-SKU Huber-Damped Regressor học chéo toàn cửa hàng / ngành hàng.
    4. Định tuyến kết hợp thích ứng theo đặc tính nhu cầu + Empirical Asymmetric CI 95%.
    5. Graceful Fallback từng SKU về run_forecast_for_sku -> SMA nếu có sự cố cục bộ.
    """
    if not payload.series:
        return ForecastResponse(success=True, results=[])

    if len(payload.series) == 1:
        return ForecastResponse(
            success=True,
            results=[run_forecast_for_sku(payload.series[0], payload.horizon_days)],
        )

    horizon = payload.horizon_days
    padded_by_sku: Dict[int, List[DailySalesPoint]] = {}
    metrics_by_sku: Dict[int, SeriesMetrics] = {}
    category_by_sku: Dict[int, Optional[str]] = {}
    series_by_sku: Dict[int, SkuSeries] = {}

    sf_rows: List[dict] = []
    batch_eligible_skus: set[int] = set()

    for item in payload.series:
        if not item.history:
            raise ValueError(f"SKU {item.sku_id} has empty sales history")
        series_by_sku[item.sku_id] = item
        category_by_sku[item.sku_id] = item.category_code
        padded = preprocess_sku_series(item)
        padded_by_sku[item.sku_id] = padded
        metrics = calculate_series_metrics(padded)
        metrics_by_sku[item.sku_id] = metrics

        if not metrics.is_short_series and metrics.mean > 0.0:
            batch_eligible_skus.add(item.sku_id)
            for pt in padded:
                sf_rows.append(
                    {
                        "unique_id": item.sku_id,
                        "ds": pd.to_datetime(pt.date),
                        "y": float(pt.quantity),
                    }
                )

    store_dow, cat_dow = compute_pooled_dow_factors(padded_by_sku, category_by_sku)

    # 1. Batch StatsForecast
    sf_fcst_df: Optional[pd.DataFrame] = None
    if sf_rows:
        try:
            sf_df = pd.DataFrame(sf_rows, columns=["unique_id", "ds", "y"])
            sf_models = [
                MSTL(season_length=7),
                AutoETS(season_length=7),
                DynamicOptimizedTheta(season_length=7),
                HoltWinters(season_length=7),
                CrostonSBA(),
                TSB(alpha_d=0.15, alpha_p=0.15),
            ]
            sf = StatsForecast(models=sf_models, freq="D", n_jobs=1)
            sf_fcst_df = sf.forecast(df=sf_df, h=horizon)
        except Exception as err:
            logger.warning("Batch StatsForecast failed (%s); falling back per SKU", err)
            sf_fcst_df = None

    # 2. Global Cross-SKU Regressor
    global_preds: Dict[int, List[float]] = {}
    try:
        global_preds = fit_and_predict_global_cross_sku(
            padded_by_sku,
            horizon_days=horizon,
            category_by_sku=category_by_sku,
        )
    except Exception as err:
        logger.warning("Global Cross-SKU model skipped (%s)", err)
        global_preds = {}

    results: List[SkuForecastResult] = []
    for item in payload.series:
        sku_id = item.sku_id
        padded = padded_by_sku[sku_id]
        metrics = metrics_by_sku[sku_id]
        cat = category_by_sku[sku_id]
        pooled_dow = cat_dow.get(cat, store_dow) if cat else store_dow
        last_date = padded[-1].date
        future_dates = [last_date + timedelta(days=i) for i in range(1, horizon + 1)]

        if metrics.mean <= 0.0:
            results.append(
                build_zero_forecasts(
                    sku_id,
                    future_dates,
                    metrics,
                    ForecastModel.SMA.value if metrics.is_short_series else ForecastModel.CROSTON.value,
                )
            )
            continue

        if metrics.is_short_series:
            results.append(
                build_sma_forecasts(
                    sku_id,
                    padded,
                    future_dates,
                    metrics,
                    pooled_dow_factors=pooled_dow,
                )
            )
            continue

        if sf_fcst_df is None or sku_id not in batch_eligible_skus:
            results.append(
                run_forecast_for_sku(item, horizon, pooled_dow_factors=pooled_dow)
            )
            continue

        try:
            sub = sf_fcst_df[sf_fcst_df["unique_id"] == sku_id]
            if len(sub) < horizon:
                raise ValueError(f"Insufficient batch forecast rows for SKU {sku_id}")

            p_mstl = np.maximum(0.0, sub["MSTL"].to_numpy(dtype=float))
            p_ets = np.maximum(0.0, sub["AutoETS"].to_numpy(dtype=float))
            p_dot = np.maximum(0.0, sub["DynamicOptimizedTheta"].to_numpy(dtype=float))
            p_hw = np.maximum(0.0, sub["HoltWinters"].to_numpy(dtype=float))
            p_sba = np.maximum(0.0, sub["CrostonSBA"].to_numpy(dtype=float))

            has_global = sku_id in global_preds and len(global_preds[sku_id]) == horizon
            p_gr = (
                np.maximum(0.0, np.asarray(global_preds[sku_id], dtype=float))
                if has_global
                else None
            )

            day_factors = calculate_day_of_week_factors(padded, pooled_factors=pooled_dow)
            fut_dow = np.asarray([day_factors[d.weekday()] for d in future_dates], dtype=float)
            p_sba_dow = p_sba * fut_dow

            if metrics.is_intermittent:
                if metrics.non_zero_ratio < 0.50:
                    local_mix = 0.35 * p_sba_dow + 0.35 * p_dot + 0.30 * p_mstl
                    combined = (
                        0.80 * local_mix + 0.20 * p_gr if p_gr is not None else local_mix
                    )
                else:
                    local_mix = 0.40 * p_mstl + 0.35 * p_dot + 0.25 * p_ets
                    combined = (
                        0.75 * local_mix + 0.25 * p_gr if p_gr is not None else local_mix
                    )
            elif metrics.cv <= 0.5:
                local_mix = 0.45 * p_ets + 0.35 * p_mstl + 0.20 * p_hw
                combined = 0.80 * local_mix + 0.20 * p_gr if p_gr is not None else local_mix
            else:
                local_mix = 0.45 * p_mstl + 0.30 * p_ets + 0.25 * p_dot
                combined = 0.80 * local_mix + 0.20 * p_gr if p_gr is not None else local_mix

            # Bảo vệ chống NaN/Inf phát sinh từ một thành phần suy biến
            if not np.all(np.isfinite(combined)):
                raise ValueError(f"Non-finite forecast values produced for SKU {sku_id}")

            daily_forecasts: List[DailyForecast] = []
            preds_list: List[float] = []
            for i, d in enumerate(future_dates):
                pred = round(max(0.0, float(combined[i])), 4)
                preds_list.append(pred)
                lower, upper = compute_empirical_ci_bounds(pred, padded, metrics, i)
                daily_forecasts.append(
                    DailyForecast(date=d, predicted=pred, lower=lower, upper=upper)
                )

            daily_avg = round(sum(preds_list) / len(preds_list) if preds_list else 0.0, 4)
            results.append(
                SkuForecastResult(
                    sku_id=sku_id,
                    daily_average=daily_avg,
                    daily_demand_std=round(float(metrics.std), 4),
                    model_used=ForecastModel.HYBRID_ENSEMBLE.value,
                    daily_forecasts=daily_forecasts,
                )
            )
        except Exception as err:
            logger.warning(
                "Batch hybrid routing failed for sku %d (%s); falling back to single-SKU pipeline",
                sku_id,
                err,
            )
            results.append(
                run_forecast_for_sku(item, horizon, pooled_dow_factors=pooled_dow)
            )

    return ForecastResponse(success=True, results=results)
