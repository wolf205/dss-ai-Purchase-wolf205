from enum import Enum
from typing import Optional
from pydantic import Field

from src.models.base import CamelModel


class ForecastModel(str, Enum):
    """
    Các mô hình dự báo nhu cầu được hỗ trợ trong hệ thống DSS.
    Khớp với thuộc tính model_used trong SkuForecastResult (response.py).
    """
    AUTO_ARIMA = "AutoARIMA"
    AUTO_ETS = "AutoETS"
    MSTL = "MSTL"
    DYNAMIC_OPTIMIZED_THETA = "DynamicOptimizedTheta"
    CROSTON = "Croston"
    CROSTON_SBA = "CrostonSBA"
    HOLT_WINTERS = "HoltWinters"
    SMA = "SMA"
    TSB = "TSB"
    HYBRID_ENSEMBLE = "HybridEnsemble"


class SeriesMetrics(CamelModel):
    """
    Bộ chỉ số thống kê đặc trưng chuỗi thời gian bán hàng.
    """
    length: int = Field(
        ...,
        ge=1,
        description="Số ngày quan sát trong chuỗi dữ liệu (N)"
    )
    mean: float = Field(
        ...,
        ge=0.0,
        description="Nhu cầu tiêu thụ trung bình ngày (d_bar)"
    )
    std: float = Field(
        ...,
        ge=0.0,
        description="Độ lệch chuẩn nhu cầu ngày (sigma_d)"
    )
    cv: float = Field(
        ...,
        ge=0.0,
        description="Hệ số biến thiên nhu cầu CV = sigma_d / mean"
    )
    non_zero_ratio: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Tỷ lệ số ngày có bán hàng phát sinh trên tổng số ngày"
    )
    is_intermittent: bool = Field(
        ...,
        description="Đặc tính ngắt quãng: True nếu CV > 1.0 hoặc non_zero_ratio < 0.7"
    )
    is_short_series: bool = Field(
        ...,
        description="Chuỗi ngắn: True nếu chiều dài N < 30 ngày"
    )
    adi: Optional[float] = Field(
        default=None,
        description="Average Demand Interval: Số ngày trung bình giữa 2 lần phát sinh nhu cầu"
    )


class AlgorithmSelectionResult(CamelModel):
    """
    Kết quả lựa chọn thuật toán kèm chỉ số phân tích và lý do giải trình DSS.
    """
    model: ForecastModel = Field(
        ...,
        description="Thuật toán dự báo được lựa chọn tối ưu"
    )
    metrics: SeriesMetrics = Field(
        ...,
        description="Chỉ số thống kê định lượng của chuỗi"
    )
    reason: str = Field(
        ...,
        description="Lý do chi tiết lựa chọn mô hình phục vụ Explainability"
    )
