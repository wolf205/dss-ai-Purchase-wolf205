"""
Compatibility shim module for src.engines.global_ridge and src.postprocessing.seasonality.
Giữ nguyên để đảm bảo backward compatibility cho các module hoặc test cũ.
"""
from src.postprocessing.seasonality import compute_pooled_dow_factors
from src.engines.global_ridge import (
    _build_feature_row,
    fit_and_predict_global_cross_sku,
)

__all__ = [
    "compute_pooled_dow_factors",
    "_build_feature_row",
    "fit_and_predict_global_cross_sku",
]
