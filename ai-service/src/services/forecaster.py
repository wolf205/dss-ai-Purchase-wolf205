import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
import logging
import math
import os
from typing import List, Optional
import pandas as pd

from statsforecast import StatsForecast
from statsforecast.models import AutoARIMA, CrostonClassic, HoltWinters, TSB

from src.models.request import DailySalesPoint, SkuSeries, TimeSeriesPayload
from src.models.response import DailyForecast, ForecastResponse, SkuForecastResult
from src.services.preprocessor import (
    pad_zero_demand_dataframe,
    pad_zero_demand_series,
    clean_and_winsorize_series,
)
from src.services.selector import (
    ForecastModel,
    SeriesMetrics,
    select_algorithm_with_metrics,
)

logger = logging.getLogger(__name__)


def _calculate_day_of_week_factors(padded_series: List[DailySalesPoint]) -> List[float]:
    """
    Tính hệ số mùa vụ theo ngày trong tuần (0 = Thứ Hai .. 6 = Chủ Nhật).
    Ưu tiên chuỗi quan sát gần nhất (tối đa 56 ngày = 8 tuần) để phản ánh đúng
    thói quen tiêu dùng hiện tại của cửa hàng.
    Giới hạn an toàn trong khoảng [0.4, 2.2] để tránh biến dạng chuỗi.
    """
    if len(padded_series) < 7:
        return [1.0] * 7

    recent_series = padded_series[-56:] if len(padded_series) > 56 else padded_series
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

    factors = [1.0] * 7
    for w in range(7):
        if day_counts[w] > 0:
            day_mean = day_sums[w] / day_counts[w]
            ratio = day_mean / overall_mean
            factors[w] = max(0.4, min(2.2, ratio))
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


def _build_sma_forecasts(
    sku_id: int,
    padded_series: List[DailySalesPoint],
    future_dates: List[date],
    metrics: SeriesMetrics,
) -> SkuForecastResult:
    """
    Dự báo bằng Simple Moving Average 7 ngày (hoặc tối đa số ngày có sẵn).
    Áp dụng cho chuỗi ngắn < 30 ngày hoặc khi các mô hình phức tạp cần fallback an toàn.
    """
    n = len(padded_series)
    window = min(7, n)
    recent_values = [p.quantity for p in padded_series[-window:]]
    sma_mean = sum(recent_values) / window if window > 0 else 0.0

    # Độ lệch chuẩn trong cửa sổ quan sát
    if window > 1:
        variance = sum((x - sma_mean) ** 2 for x in recent_values) / window
        std_val = math.sqrt(variance)
    else:
        std_val = metrics.std

    pred = round(max(0.0, float(sma_mean)), 4)
    day_factors = _calculate_day_of_week_factors(padded_series)

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        w = d.weekday()
        factor = day_factors[w]
        momentum_boost = _calculate_recency_momentum_boost(padded_series, step_index=i)
        adjusted_pred = round(max(0.0, pred * factor * momentum_boost), 4)
        preds.append(adjusted_pred)
        lower = round(max(0.0, adjusted_pred - 1.96 * std_val), 4)
        upper = round(max(lower, adjusted_pred + 1.96 * std_val), 4)

        daily_forecasts.append(
            DailyForecast(date=d, predicted=adjusted_pred, lower=lower, upper=upper)
        )

    daily_avg = round(sum(preds) / len(preds) if preds else pred, 4)

    return SkuForecastResult(
        sku_id=sku_id,
        daily_average=daily_avg,
        daily_demand_std=round(float(metrics.std), 4),
        model_used=ForecastModel.SMA.value,
        daily_forecasts=daily_forecasts,
    )



def _forecast_intermittent(
    sku_id: int,
    history: List[DailySalesPoint],
    future_dates: List[date],
    metrics: SeriesMetrics,
    model_choice: ForecastModel,
    horizon_days: int,
) -> SkuForecastResult:
    """
    Dự báo cho chuỗi ngắt quãng (Intermittent Demand) bằng CrostonClassic hoặc TSB qua statsforecast
    kết hợp Day-of-Week Seasonality Overlay và Dual-Window Adaptive Momentum Boost.
    """
    df = pad_zero_demand_dataframe(sku_id, history)
    padded = clean_and_winsorize_series(pad_zero_demand_series(history))

    use_tsb = (model_choice == ForecastModel.TSB)
    model_name = ForecastModel.TSB.value if use_tsb else ForecastModel.CROSTON.value
    col_name = "TSB" if use_tsb else "CrostonClassic"

    # Chạy dự báo điểm đơn thuần (nhanh < 30ms)
    # TSB adaptive alpha: phản ứng nhạy hơn với nhịp mua mới của cửa hàng
    if use_tsb:
        alpha_d = 0.2 if metrics.non_zero_ratio > 0.4 else 0.1
        alpha_p = 0.15 if metrics.non_zero_ratio > 0.4 else 0.1
        m_instance = TSB(alpha_d=alpha_d, alpha_p=alpha_p)
    else:
        m_instance = CrostonClassic()

    sf = StatsForecast(models=[m_instance], freq="D", n_jobs=1)
    fcst_df = sf.forecast(df=df, h=horizon_days)

    day_factors = _calculate_day_of_week_factors(padded)

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        row = fcst_df.iloc[i]
        raw_pred = float(row[col_name])
        w = d.weekday()
        factor = day_factors[w]
        momentum_boost = _calculate_recency_momentum_boost(padded, step_index=i)
        pred = round(max(0.0, raw_pred * factor * momentum_boost), 4)
        preds.append(pred)

        # Khoảng tin cậy cho chuỗi ngắt quãng dựa trên độ lệch chuẩn nhu cầu
        lower = round(max(0.0, pred - 1.96 * metrics.std), 4)
        upper = round(max(lower, pred + 1.96 * metrics.std), 4)

        daily_forecasts.append(
            DailyForecast(date=d, predicted=pred, lower=lower, upper=upper)
        )

    daily_avg = round(sum(preds) / len(preds) if preds else pred, 4)

    return SkuForecastResult(
        sku_id=sku_id,
        daily_average=daily_avg,
        daily_demand_std=round(float(metrics.std), 4),
        model_used=model_name,
        daily_forecasts=daily_forecasts,
    )


def _forecast_continuous(
    sku_id: int,
    history: List[DailySalesPoint],
    future_dates: List[date],
    metrics: SeriesMetrics,
    model_choice: ForecastModel,
    horizon_days: int,
) -> SkuForecastResult:
    """
    Dự báo cho chuỗi liên tục (Smooth / Moderate) bằng AutoARIMA hoặc HoltWinters qua statsforecast.
    Tối ưu hóa không gian siêu tham số với chu kỳ tuần (season_length=7), cho tốc độ xử lý nhanh gấp 5-10 lần.
    """
    df = pad_zero_demand_dataframe(sku_id, history)
    padded = clean_and_winsorize_series(pad_zero_demand_series(history))

    is_hw = (model_choice == ForecastModel.HOLT_WINTERS)
    model_name = ForecastModel.HOLT_WINTERS.value if is_hw else ForecastModel.AUTO_ARIMA.value
    col_name = "HoltWinters" if is_hw else "AutoARIMA"

    has_intervals = False
    fcst_df: Optional[pd.DataFrame] = None

    if not is_hw:
        try:
            # AutoARIMA với search bounded theo chu kỳ tuần (max_p=2, max_q=2, max_P=1, max_Q=1)
            # Tự động tính prediction intervals CI 95% trực tiếp mà không cần cross-validation
            model_inst = AutoARIMA(season_length=7, max_p=2, max_q=2, max_P=1, max_Q=1)
            sf = StatsForecast(models=[model_inst], freq="D", n_jobs=1)
            fcst_df = sf.forecast(df=df, h=horizon_days, level=[95])
            has_intervals = (f"{col_name}-lo-95" in fcst_df.columns and f"{col_name}-hi-95" in fcst_df.columns)
        except Exception as e:
            logger.info("AutoARIMA with level=[95] failed (%s), running point forecast fallback", e)

    # Nếu chưa có kết quả (hoặc HoltWinters), chạy dự báo chuẩn
    if fcst_df is None:
        model_inst = HoltWinters(season_length=7) if is_hw else AutoARIMA(season_length=7, max_p=2, max_q=2, max_P=1, max_Q=1)
        sf = StatsForecast(models=[model_inst], freq="D", n_jobs=1)
        fcst_df = sf.forecast(df=df, h=horizon_days)

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        row = fcst_df.iloc[i]
        raw_pred = float(row[col_name])
        momentum_boost = _calculate_recency_momentum_boost(padded, step_index=i)
        pred = round(max(0.0, raw_pred * momentum_boost), 4)
        preds.append(pred)

        if has_intervals:
            raw_lo = float(row[f"{col_name}-lo-95"])
            raw_hi = float(row[f"{col_name}-hi-95"])
            lower = round(max(0.0, raw_lo * momentum_boost), 4)
            upper = round(max(lower, raw_hi * momentum_boost), 4)
        else:
            lower = round(max(0.0, pred - 1.96 * metrics.std), 4)
            upper = round(max(lower, pred + 1.96 * metrics.std), 4)

        daily_forecasts.append(
            DailyForecast(date=d, predicted=pred, lower=lower, upper=upper)
        )

    daily_avg = round(sum(preds) / len(preds) if preds else 0.0, 4)

    return SkuForecastResult(
        sku_id=sku_id,
        daily_average=daily_avg,
        daily_demand_std=round(float(metrics.std), 4),
        model_used=model_name,
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


def run_forecast_for_sku(series: SkuSeries, horizon_days: int) -> SkuForecastResult:
    """
    Thực hiện toàn bộ quy trình tiền xử lý, chọn thuật toán và dự báo cho một SKU.
    Đảm bảo cơ chế Graceful Fallback: không bao giờ để lỗi mô hình làm gián đoạn request.
    """
    if not series.history:
        raise ValueError(f"SKU {series.sku_id} has empty sales history")

    padded_series = clean_and_winsorize_series(pad_zero_demand_series(series.history))
    last_date = padded_series[-1].date
    future_dates = [last_date + timedelta(days=i) for i in range(1, horizon_days + 1)]

    # 1. Thẩm định đặc tính chuỗi qua selector
    selection = select_algorithm_with_metrics(padded_series)
    model_choice = selection.model
    metrics = selection.metrics

    # 2. Thực thi dự báo theo mô hình đã chọn
    if model_choice == ForecastModel.SMA:
        return _build_sma_forecasts(series.sku_id, padded_series, future_dates, metrics)

    if model_choice in (ForecastModel.CROSTON, ForecastModel.TSB):
        try:
            return _forecast_intermittent(
                series.sku_id,
                series.history,
                future_dates,
                metrics,
                model_choice,
                horizon_days,
            )
        except Exception as err:
            logger.warning(
                "Intermittent forecast failed for sku %d: %s. Graceful fallback to SMA.",
                series.sku_id,
                err,
            )
            return _build_sma_forecasts(series.sku_id, padded_series, future_dates, metrics)

    # model_choice in (ForecastModel.AUTO_ARIMA, ForecastModel.HOLT_WINTERS)
    try:
        cont_res = _forecast_continuous(
            series.sku_id,
            series.history,
            future_dates,
            metrics,
            model_choice,
            horizon_days,
        )
        # Nếu chuỗi có tính chất chuyển tiếp (0.5 < CV <= 1.0 và non_zero_ratio < 0.85) -> Ensemble với TSB
        if 0.5 < metrics.cv <= 1.0 and metrics.non_zero_ratio < 0.85:
            try:
                tsb_res = _forecast_intermittent(
                    series.sku_id,
                    series.history,
                    future_dates,
                    metrics,
                    ForecastModel.TSB,
                    horizon_days,
                )
                return _blend_forecasts(cont_res, tsb_res, primary_weight=0.65)
            except Exception as e:
                logger.info("Ensemble blending skipped (%s), using pure continuous result", e)
                return cont_res
        return cont_res
    except Exception as err:
        logger.warning(
            "Continuous forecast (%s) failed for sku %d: %s. Graceful fallback to SMA.",
            model_choice.value,
            series.sku_id,
            err,
        )
        return _build_sma_forecasts(series.sku_id, padded_series, future_dates, metrics)



_executor = ThreadPoolExecutor(max_workers=min(8, (os.cpu_count() or 2) * 2))


async def run_forecast(payload: TimeSeriesPayload) -> ForecastResponse:
    """
    Điều phối dự báo song song qua ThreadPoolExecutor cho toàn bộ danh sách SKU trong TimeSeriesPayload.
    """
    if not payload.series:
        return ForecastResponse(success=True, results=[])

    loop = asyncio.get_running_loop()
    tasks = [
        loop.run_in_executor(
            _executor,
            run_forecast_for_sku,
            item,
            payload.horizon_days,
        )
        for item in payload.series
    ]
    results = await asyncio.gather(*tasks)

    return ForecastResponse(success=True, results=list(results))
