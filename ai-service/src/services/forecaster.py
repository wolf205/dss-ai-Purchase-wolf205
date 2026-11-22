import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
import logging
import math
import os
from typing import Dict, List, Optional
import numpy as np
import pandas as pd

from statsforecast import StatsForecast
from statsforecast.models import (
    AutoARIMA,
    AutoETS,
    CrostonClassic,
    CrostonSBA,
    DynamicOptimizedTheta,
    HoltWinters,
    MSTL,
    TSB,
)

from src.models.request import DailySalesPoint, SkuSeries, TimeSeriesPayload
from src.models.response import DailyForecast, ForecastResponse, SkuForecastResult
from src.services.global_model import (
    compute_pooled_dow_factors,
    fit_and_predict_global_cross_sku,
)
from src.services.preprocessor import (
    clean_and_winsorize_series,
    pad_zero_demand_dataframe,
    pad_zero_demand_series,
    uncensor_stockout_series,
)
from src.services.selector import (
    ForecastModel,
    SeriesMetrics,
    calculate_series_metrics,
    select_algorithm_with_metrics,
)

logger = logging.getLogger(__name__)


def _preprocess_sku_series(series: SkuSeries) -> List[DailySalesPoint]:
    """
    Chuỗi tiền xử lý chuẩn cho 1 SKU:
    1. Bù đắp zero-demand liên tục theo ngày.
    2. Khử hiệu ứng censored demand tại các ngày hết hàng (nếu có stockout_dates).
    3. Khử nhiễu đột biến bằng MAD Winsorization (3.0 sigma).
    """
    padded = pad_zero_demand_series(series.history)
    if series.stockout_dates:
        padded = uncensor_stockout_series(padded, series.stockout_dates)
    return clean_and_winsorize_series(padded)


def _calculate_day_of_week_factors(
    padded_series: List[DailySalesPoint],
    pooled_factors: Optional[List[float]] = None,
) -> List[float]:
    """
    Tính hệ số mùa vụ theo ngày trong tuần (0 = Thứ Hai .. 6 = Chủ Nhật).
    Áp dụng shrinkage theo số tuần quan sát được và có thể mượn thông tin gộp
    của cửa hàng/ngành hàng cho chuỗi ngắn (cold-start).
    """
    n = len(padded_series)
    if n < 7:
        return list(pooled_factors) if pooled_factors else [1.0] * 7

    recent_series = padded_series[-56:] if n > 56 else padded_series
    valid_count = len(recent_series)

    day_sums = [0.0] * 7
    day_counts = [0] * 7
    total_qty = 0.0

    for pt in recent_series:
        w = pt.date.weekday()
        q = float(pt.quantity)
        day_sums[w] += q
        day_counts[w] += 1
        total_qty += q

    overall_mean = total_qty / valid_count if valid_count > 0 else 0.0
    if overall_mean <= 0.0001:
        return [1.0] * 7

    n_weeks = max(1.0, valid_count / 7.0)
    shrink = min(1.0, n_weeks / 6.0)
    prior = pooled_factors if pooled_factors else [1.0] * 7

    factors = [1.0] * 7
    for w in range(7):
        if day_counts[w] > 0:
            day_mean = day_sums[w] / day_counts[w]
            raw_ratio = day_mean / overall_mean
            shrunk_ratio = prior[w] + shrink * (raw_ratio - prior[w])
            factors[w] = max(0.4, min(2.2, shrunk_ratio))
        else:
            factors[w] = prior[w]
    return factors


def _calculate_recency_momentum_boost(
    padded_series: List[DailySalesPoint],
    step_index: int = 0,
) -> float:
    """
    Tính hệ số bù thiên kiến đà tăng trưởng và triệt tiêu Under-forecasting Bias (Dual-Window Adaptive Momentum).
    So sánh nhu cầu ngắn hạn (14 ngày gần nhất) với trung hạn (42 ngày gần nhất)
    để kịp thời bắt nhịp các đợt tăng tốc tiêu thụ mà mô hình làm mịn mũ bị trễ.
    Hỗ trợ Damping Factor theo bước dự báo tương lai (step_index: 0..h-1).
    Giới hạn an toàn trong khoảng [0.85, 1.30].
    """
    n = len(padded_series)
    if n < 28:
        return 1.0

    short_window = min(14, n // 2)
    mid_window = min(42, n)

    short_vals = [float(p.quantity) for p in padded_series[-short_window:]]
    short_mean = sum(short_vals) / short_window

    mid_vals = [float(p.quantity) for p in padded_series[-mid_window:]]
    mid_mean = sum(mid_vals) / mid_window

    all_vals = [float(p.quantity) for p in padded_series]
    all_mean = sum(all_vals) / n

    baseline = max(mid_mean, all_mean)
    if baseline <= 0.0001:
        return 1.0

    momentum_ratio = short_mean / baseline

    if momentum_ratio > 1.03:
        raw_boost = 1.0 + (momentum_ratio - 1.0) * 0.75
        base_boost = min(1.30, raw_boost)
    elif momentum_ratio < 0.95:
        raw_reduction = 1.0 - (1.0 - momentum_ratio) * 0.5
        base_boost = max(0.88, raw_reduction)
    else:
        base_boost = 1.0

    # Damping factor: suy giảm nhẹ dần về 1.0 theo chân trời dự báo
    damping = 0.98 ** step_index
    final_boost = 1.0 + (base_boost - 1.0) * damping

    return round(final_boost, 4)


def _compute_empirical_ci_bounds(
    pred: float,
    padded_series: List[DailySalesPoint],
    metrics: SeriesMetrics,
    step_index: int,
) -> tuple[float, float]:
    """
    Ước lượng khoảng tin cậy 95% thích ứng theo phân phối lệch phải của bán lẻ:
    - Với chuỗi có lịch sử >= 14 ngày: sử dụng phân vị lệch thực nghiệm (empirical asymmetry)
      từ độ lệch so với trung bình trượt tuần cùng yếu tố mở rộng theo chân trời √(1 + step/14).
    - Fallback an toàn về 1.96 * metrics.std cho chuỗi cực ngắn.
    """
    n = len(padded_series)
    horizon_scale = math.sqrt(1.0 + step_index / 14.0)

    if n >= 14 and metrics.mean > 0.0:
        vals = [float(p.quantity) for p in padded_series[-56:]]
        window_mean = sum(vals[-7:]) / min(7, len(vals))
        neg_devs = [max(0.0, window_mean - v) for v in vals]
        pos_devs = [max(0.0, v - window_mean) for v in vals]

        rms_lo = math.sqrt(sum(d * d for d in neg_devs) / len(neg_devs))
        rms_hi = math.sqrt(sum(d * d for d in pos_devs) / len(pos_devs))

        # Kết hợp giữa empirical RMS và std chuẩn hóa
        lo_spread = (0.5 * rms_lo + 0.5 * metrics.std) * 1.96 * horizon_scale
        hi_spread = (0.5 * rms_hi + 0.5 * metrics.std) * 1.96 * horizon_scale
    else:
        lo_spread = 1.96 * metrics.std * horizon_scale
        hi_spread = 1.96 * metrics.std * horizon_scale

    lower = round(max(0.0, pred - lo_spread), 4)
    upper = round(max(lower, pred + hi_spread), 4)
    return lower, upper


def _build_sma_forecasts(
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
    day_factors = _calculate_day_of_week_factors(padded_series, pooled_factors=pooled_dow_factors)

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        w = d.weekday()
        factor = day_factors[w]
        momentum_boost = _calculate_recency_momentum_boost(padded_series, step_index=i)
        adjusted_pred = round(max(0.0, pred_base * factor * momentum_boost), 4)
        preds.append(adjusted_pred)
        lower, upper = _compute_empirical_ci_bounds(adjusted_pred, padded_series, metrics, i)

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


def _build_zero_forecasts(
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


def _forecast_intermittent(
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
        return _build_zero_forecasts(sku_id, future_dates, metrics, ForecastModel.CROSTON.value)

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

    day_factors = _calculate_day_of_week_factors(padded, pooled_factors=pooled_dow_factors)

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
        lower, upper = _compute_empirical_ci_bounds(pred, padded, metrics, i)

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


def _forecast_continuous(
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
        return _build_zero_forecasts(sku_id, future_dates, metrics, model_choice.value)

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
                lower, upper = _compute_empirical_ci_bounds(pred, padded, metrics, i)
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
            lower, upper = _compute_empirical_ci_bounds(pred, padded, metrics, i)

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


def _blend_forecasts(
    res_primary: SkuForecastResult,
    res_secondary: SkuForecastResult,
    primary_weight: float = 0.65,
) -> SkuForecastResult:
    """
    Kết hợp trọng số (Ensemble Blending) giữa 2 mô hình nhằm làm mịn phương sai và sai số.
    """
    sec_weight = 1.0 - primary_weight
    blended: List[DailyForecast] = []
    preds: List[float] = []

    for i in range(len(res_primary.daily_forecasts)):
        p1 = res_primary.daily_forecasts[i]
        p2 = res_secondary.daily_forecasts[i]
        pred = round(primary_weight * p1.predicted + sec_weight * p2.predicted, 4)
        preds.append(pred)
        lower = round(primary_weight * p1.lower + sec_weight * p2.lower, 4)
        upper = round(max(lower, primary_weight * p1.upper + sec_weight * p2.upper), 4)
        blended.append(DailyForecast(date=p1.date, predicted=pred, lower=lower, upper=upper))

    daily_avg = round(sum(preds) / len(preds) if preds else res_primary.daily_average, 4)
    return SkuForecastResult(
        sku_id=res_primary.sku_id,
        daily_average=daily_avg,
        daily_demand_std=res_primary.daily_demand_std,
        model_used=res_primary.model_used,
        daily_forecasts=blended,
    )


def run_forecast_for_sku(
    series: SkuSeries,
    horizon_days: int,
    pooled_dow_factors: Optional[List[float]] = None,
) -> SkuForecastResult:
    """
    Thực hiện toàn bộ quy trình tiền xử lý, chọn thuật toán và dự báo cho một SKU.
    Đảm bảo cơ chế Graceful Fallback: không bao giờ để lỗi mô hình làm gián đoạn request.
    """
    if not series.history:
        raise ValueError(f"SKU {series.sku_id} has empty sales history")

    padded_series = _preprocess_sku_series(series)
    last_date = padded_series[-1].date
    future_dates = [last_date + timedelta(days=i) for i in range(1, horizon_days + 1)]

    selection = select_algorithm_with_metrics(
        padded_series,
        preferred_stable=ForecastModel.HOLT_WINTERS,
    )
    model_choice = selection.model
    metrics = selection.metrics

    if model_choice == ForecastModel.SMA:
        return _build_sma_forecasts(
            series.sku_id,
            padded_series,
            future_dates,
            metrics,
            pooled_dow_factors=pooled_dow_factors,
        )

    if model_choice in (ForecastModel.CROSTON, ForecastModel.TSB):
        try:
            return _forecast_intermittent(
                series.sku_id,
                series.history,
                future_dates,
                metrics,
                model_choice,
                horizon_days,
                stockout_dates=series.stockout_dates,
                pooled_dow_factors=pooled_dow_factors,
            )
        except Exception as err:
            logger.warning(
                "Intermittent forecast failed for sku %d: %s. Graceful fallback to SMA.",
                series.sku_id,
                err,
            )
            return _build_sma_forecasts(
                series.sku_id,
                padded_series,
                future_dates,
                metrics,
                pooled_dow_factors=pooled_dow_factors,
            )

    try:
        return _forecast_continuous(
            series.sku_id,
            series.history,
            future_dates,
            metrics,
            model_choice,
            horizon_days,
            stockout_dates=series.stockout_dates,
        )
    except Exception as err:
        logger.warning(
            "Continuous forecast (%s) failed for sku %d: %s. Graceful fallback to SMA.",
            model_choice.value,
            series.sku_id,
            err,
        )
        return _build_sma_forecasts(
            series.sku_id,
            padded_series,
            future_dates,
            metrics,
            pooled_dow_factors=pooled_dow_factors,
        )


def _run_batch_hybrid_forecast(payload: TimeSeriesPayload) -> ForecastResponse:
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
        padded = _preprocess_sku_series(item)
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
                _build_zero_forecasts(
                    sku_id,
                    future_dates,
                    metrics,
                    ForecastModel.SMA.value if metrics.is_short_series else ForecastModel.CROSTON.value,
                )
            )
            continue

        if metrics.is_short_series:
            results.append(
                _build_sma_forecasts(
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

            day_factors = _calculate_day_of_week_factors(padded, pooled_factors=pooled_dow)
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
                lower, upper = _compute_empirical_ci_bounds(pred, padded, metrics, i)
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


_executor = ThreadPoolExecutor(max_workers=min(4, (os.cpu_count() or 2)))


async def run_forecast(payload: TimeSeriesPayload) -> ForecastResponse:
    """
    Điều phối dự báo toàn bộ danh sách SKU trong TimeSeriesPayload thông qua Batch Hybrid Pipeline.
    """
    if not payload.series:
        return ForecastResponse(success=True, results=[])

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, _run_batch_hybrid_forecast, payload)
