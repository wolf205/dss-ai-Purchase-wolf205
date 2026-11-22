from datetime import timedelta
import logging
from typing import Callable, List, Optional

from src.engines.baseline import build_sma_forecasts
from src.engines.continuous import forecast_continuous as default_forecast_continuous
from src.engines.intermittent import forecast_intermittent as default_forecast_intermittent
from src.models.metrics import ForecastModel
from src.models.request import SkuSeries
from src.models.response import SkuForecastResult
from src.preprocessing.pipeline import preprocess_sku_series
from src.profiling.selector import select_algorithm_with_metrics

logger = logging.getLogger(__name__)


def run_forecast_for_sku(
    series: SkuSeries,
    horizon_days: int,
    pooled_dow_factors: Optional[List[float]] = None,
    intermittent_fn: Optional[Callable] = None,
    continuous_fn: Optional[Callable] = None,
) -> SkuForecastResult:
    """
    Thực hiện toàn bộ quy trình tiền xử lý, chọn thuật toán và dự báo cho một SKU.
    Đảm bảo cơ chế Graceful Fallback: không bao giờ để lỗi mô hình làm gián đoạn request.
    """
    if not series.history:
        raise ValueError(f"SKU {series.sku_id} has empty sales history")

    fc_intermittent = intermittent_fn or default_forecast_intermittent
    fc_continuous = continuous_fn or default_forecast_continuous

    padded_series = preprocess_sku_series(series)
    last_date = padded_series[-1].date
    future_dates = [last_date + timedelta(days=i) for i in range(1, horizon_days + 1)]

    selection = select_algorithm_with_metrics(
        padded_series,
        preferred_stable=ForecastModel.HOLT_WINTERS,
    )
    model_choice = selection.model
    metrics = selection.metrics

    if model_choice == ForecastModel.SMA:
        return build_sma_forecasts(
            series.sku_id,
            padded_series,
            future_dates,
            metrics,
            pooled_dow_factors=pooled_dow_factors,
        )

    if model_choice in (ForecastModel.CROSTON, ForecastModel.TSB):
        try:
            return fc_intermittent(
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
            return build_sma_forecasts(
                series.sku_id,
                padded_series,
                future_dates,
                metrics,
                pooled_dow_factors=pooled_dow_factors,
            )

    try:
        return fc_continuous(
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
        return build_sma_forecasts(
            series.sku_id,
            padded_series,
            future_dates,
            metrics,
            pooled_dow_factors=pooled_dow_factors,
        )
