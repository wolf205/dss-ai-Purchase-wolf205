from datetime import date, timedelta
import logging
import math
from typing import List, Optional
import pandas as pd

from statsforecast import StatsForecast
from statsforecast.models import AutoARIMA, CrostonClassic, HoltWinters, TSB
from statsforecast.utils import ConformalIntervals

from src.models.request import DailySalesPoint, SkuSeries, TimeSeriesPayload
from src.models.response import DailyForecast, ForecastResponse, SkuForecastResult
from src.services.preprocessor import (
    pad_zero_demand_dataframe,
    pad_zero_demand_series,
)
from src.services.selector import (
    ForecastModel,
    SeriesMetrics,
    select_algorithm_with_metrics,
)

logger = logging.getLogger(__name__)


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
    # Khoảng tin cậy 95%: +- 1.96 * sigma
    lower = round(max(0.0, pred - 1.96 * std_val), 4)
    upper = round(max(lower, pred + 1.96 * std_val), 4)

    daily_forecasts = [
        DailyForecast(date=d, predicted=pred, lower=lower, upper=upper)
        for d in future_dates
    ]

    return SkuForecastResult(
        sku_id=sku_id,
        daily_average=pred,
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
    Dự báo cho chuỗi ngắt quãng (Intermittent Demand) bằng CrostonClassic hoặc TSB qua statsforecast.
    """
    df = pad_zero_demand_dataframe(sku_id, history)

    use_tsb = (model_choice == ForecastModel.TSB)
    model_name = ForecastModel.TSB.value if use_tsb else ForecastModel.CROSTON.value
    col_name = "TSB" if use_tsb else "CrostonClassic"

    try:
        # Thử dự báo kèm ConformalIntervals 95%
        conformal = ConformalIntervals(h=horizon_days)
        m_instance = (
            TSB(alpha_d=0.1, alpha_p=0.1, prediction_intervals=conformal)
            if use_tsb
            else CrostonClassic(prediction_intervals=conformal)
        )
        sf = StatsForecast(models=[m_instance], freq="D", n_jobs=1)
        fcst_df = sf.forecast(df=df, h=horizon_days, level=[95])
        has_intervals = (f"{col_name}-lo-95" in fcst_df.columns and f"{col_name}-hi-95" in fcst_df.columns)
    except Exception as e:
        logger.info("Intermittent with ConformalIntervals failed (%s), running point forecast fallback", e)
        # Chạy dự báo điểm đơn thuần
        m_instance = TSB(alpha_d=0.1, alpha_p=0.1) if use_tsb else CrostonClassic()
        sf = StatsForecast(models=[m_instance], freq="D", n_jobs=1)
        fcst_df = sf.forecast(df=df, h=horizon_days)
        has_intervals = False

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        row = fcst_df.iloc[i]
        raw_pred = float(row[col_name])
        pred = round(max(0.0, raw_pred), 4)
        preds.append(pred)

        if has_intervals:
            raw_lo = float(row[f"{col_name}-lo-95"])
            raw_hi = float(row[f"{col_name}-hi-95"])
            lower = round(max(0.0, raw_lo), 4)
            upper = round(max(lower, raw_hi), 4)
        else:
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
    """
    df = pad_zero_demand_dataframe(sku_id, history)
    is_hw = (model_choice == ForecastModel.HOLT_WINTERS)
    model_name = ForecastModel.HOLT_WINTERS.value if is_hw else ForecastModel.AUTO_ARIMA.value
    col_name = "HoltWinters" if is_hw else "AutoARIMA"

    has_intervals = False
    fcst_df: Optional[pd.DataFrame] = None

    # AutoARIMA hỗ trợ ConformalIntervals trực tiếp
    if not is_hw:
        try:
            conformal = ConformalIntervals(h=horizon_days)
            model_inst = AutoARIMA(season_length=7, prediction_intervals=conformal)
            sf = StatsForecast(models=[model_inst], freq="D", n_jobs=1)
            fcst_df = sf.forecast(df=df, h=horizon_days, level=[95])
            has_intervals = (f"{col_name}-lo-95" in fcst_df.columns and f"{col_name}-hi-95" in fcst_df.columns)
        except Exception as e:
            logger.info("AutoARIMA with ConformalIntervals failed (%s), running point forecast", e)

    # Nếu chưa có kết quả (hoặc HoltWinters), chạy dự báo điểm chuẩn
    if fcst_df is None:
        model_inst = HoltWinters(season_length=7) if is_hw else AutoARIMA(season_length=7)
        sf = StatsForecast(models=[model_inst], freq="D", n_jobs=1)
        fcst_df = sf.forecast(df=df, h=horizon_days)

    daily_forecasts: List[DailyForecast] = []
    preds: List[float] = []

    for i, d in enumerate(future_dates):
        row = fcst_df.iloc[i]
        raw_pred = float(row[col_name])
        pred = round(max(0.0, raw_pred), 4)
        preds.append(pred)

        if has_intervals:
            raw_lo = float(row[f"{col_name}-lo-95"])
            raw_hi = float(row[f"{col_name}-hi-95"])
            lower = round(max(0.0, raw_lo), 4)
            upper = round(max(lower, raw_hi), 4)
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


def run_forecast_for_sku(series: SkuSeries, horizon_days: int) -> SkuForecastResult:
    """
    Thực hiện toàn bộ quy trình tiền xử lý, chọn thuật toán và dự báo cho một SKU.
    Đảm bảo cơ chế Graceful Fallback: không bao giờ để lỗi mô hình làm gián đoạn request.
    """
    if not series.history:
        raise ValueError(f"SKU {series.sku_id} has empty sales history")

    padded_series = pad_zero_demand_series(series.history)
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
        return _forecast_continuous(
            series.sku_id,
            series.history,
            future_dates,
            metrics,
            model_choice,
            horizon_days,
        )
    except Exception as err:
        logger.warning(
            "Continuous forecast (%s) failed for sku %d: %s. Graceful fallback to SMA.",
            model_choice.value,
            series.sku_id,
            err,
        )
        return _build_sma_forecasts(series.sku_id, padded_series, future_dates, metrics)



async def run_forecast(payload: TimeSeriesPayload) -> ForecastResponse:
    """
    Điều phối dự báo theo batch cho toàn bộ danh sách SKU trong TimeSeriesPayload.
    """
    results: List[SkuForecastResult] = []
    for item in payload.series:
        sku_result = run_forecast_for_sku(item, payload.horizon_days)
        results.append(sku_result)

    return ForecastResponse(success=True, results=results)
