"""
Compatibility shim module for src.models.metrics and src.profiling.
Giữ nguyên để đảm bảo backward compatibility cho các module hoặc test cũ.
"""
from src.models.metrics import (
    AlgorithmSelectionResult,
    ForecastModel,
    SeriesMetrics,
)
from src.profiling.metrics import (
    _extract_values,
    calculate_series_metrics,
)
from src.profiling.selector import (
    select_algorithm,
    select_algorithm_with_metrics,
)

__all__ = [
    "ForecastModel",
    "SeriesMetrics",
    "AlgorithmSelectionResult",
    "_extract_values",
    "calculate_series_metrics",
    "select_algorithm_with_metrics",
    "select_algorithm",
]
