"""
Compatibility shim module for src.pipelines and src.engines.
Giữ nguyên để đảm bảo backward compatibility cho các module hoặc test cũ.
"""
from typing import Callable, List, Optional
import sys

from src.preprocessing.pipeline import preprocess_sku_series as _preprocess_sku_series
from src.postprocessing.seasonality import (
    calculate_day_of_week_factors as _calculate_day_of_week_factors,
)
from src.postprocessing.momentum import (
    calculate_recency_momentum_boost as _calculate_recency_momentum_boost,
)
from src.postprocessing.confidence_interval import (
    compute_empirical_ci_bounds as _compute_empirical_ci_bounds,
)
from src.postprocessing.blending import blend_forecasts as _blend_forecasts
from src.engines.baseline import (
    build_sma_forecasts as _build_sma_forecasts,
    build_zero_forecasts as _build_zero_forecasts,
)
from src.engines.intermittent import (
    forecast_intermittent as _forecast_intermittent,
)
from src.engines.continuous import (
    forecast_continuous as _forecast_continuous,
)
from src.pipelines.single_sku import run_forecast_for_sku as _base_run_forecast_for_sku
from src.pipelines.batch_hybrid import (
    run_batch_hybrid_forecast as _run_batch_hybrid_forecast,
)
from src.pipelines.coordinator import run_forecast
from src.models.request import SkuSeries
from src.models.response import SkuForecastResult


def run_forecast_for_sku(
    series: SkuSeries,
    horizon_days: int,
    pooled_dow_factors: Optional[List[float]] = None,
    intermittent_fn: Optional[Callable] = None,
    continuous_fn: Optional[Callable] = None,
) -> SkuForecastResult:
    """
    Shim wrapper chuyển tiếp sang src.pipelines.single_sku.run_forecast_for_sku.
    Lấy hàm _forecast_intermittent và _forecast_continuous từ namespace hiện tại của module
    để hỗ trợ unittest.mock.patch("src.services.forecaster._forecast_continuous").
    """
    current_module = sys.modules[__name__]
    int_fn = intermittent_fn or getattr(current_module, "_forecast_intermittent", _forecast_intermittent)
    cont_fn = continuous_fn or getattr(current_module, "_forecast_continuous", _forecast_continuous)

    return _base_run_forecast_for_sku(
        series,
        horizon_days,
        pooled_dow_factors=pooled_dow_factors,
        intermittent_fn=int_fn,
        continuous_fn=cont_fn,
    )


__all__ = [
    "_preprocess_sku_series",
    "_calculate_day_of_week_factors",
    "_calculate_recency_momentum_boost",
    "_compute_empirical_ci_bounds",
    "_build_sma_forecasts",
    "_build_zero_forecasts",
    "_forecast_intermittent",
    "_forecast_continuous",
    "_blend_forecasts",
    "run_forecast_for_sku",
    "_run_batch_hybrid_forecast",
    "run_forecast",
]
