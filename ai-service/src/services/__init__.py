"""
Services shim package re-exporting compatibility interfaces.
"""
from src.services.preprocessor import (
    pad_zero_demand,
    pad_zero_demand_series,
    pad_zero_demand_dataframe,
    clean_and_winsorize_series,
    clean_and_winsorize_values,
    uncensor_stockout_series,
)
from src.services.selector import (
    ForecastModel,
    SeriesMetrics,
    AlgorithmSelectionResult,
    calculate_series_metrics,
    select_algorithm,
    select_algorithm_with_metrics,
)
from src.services.forecaster import (
    run_forecast,
    run_forecast_for_sku,
)
from src.services.global_model import (
    compute_pooled_dow_factors,
    fit_and_predict_global_cross_sku,
)

__all__ = [
    "pad_zero_demand",
    "pad_zero_demand_series",
    "pad_zero_demand_dataframe",
    "clean_and_winsorize_series",
    "clean_and_winsorize_values",
    "uncensor_stockout_series",
    "ForecastModel",
    "SeriesMetrics",
    "AlgorithmSelectionResult",
    "calculate_series_metrics",
    "select_algorithm",
    "select_algorithm_with_metrics",
    "run_forecast",
    "run_forecast_for_sku",
    "compute_pooled_dow_factors",
    "fit_and_predict_global_cross_sku",
]
