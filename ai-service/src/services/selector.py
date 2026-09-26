from enum import Enum
import math
from typing import Sequence, Union
from pydantic import Field

from src.models.base import CamelModel
from src.models.request import DailySalesPoint


class ForecastModel(str, Enum):
    """
    Các mô hình dự báo nhu cầu được hỗ trợ trong hệ thống DSS.
    Khớp với thuộc tính model_used trong SkuForecastResult (response.py).
    """
    AUTO_ARIMA = "AutoARIMA"
    CROSTON = "Croston"
    HOLT_WINTERS = "HoltWinters"
    SMA = "SMA"
    TSB = "TSB"


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


def _extract_values(history: Sequence[Union[float, int, DailySalesPoint]]) -> list[float]:
    """
    Trích xuất danh sách giá trị số float từ history (List[float] hoặc List[DailySalesPoint]).
    """
    values: list[float] = []
    for item in history:
        if isinstance(item, DailySalesPoint):
            values.append(float(item.quantity))
        else:
            values.append(float(item))
    return values


def calculate_series_metrics(
    history: Sequence[Union[float, int, DailySalesPoint]]
) -> SeriesMetrics:
    """
    Tính toán các chỉ số thống kê của chuỗi thời gian bán hàng.
    Yêu cầu chuỗi đã được bù đắp zero-demand trước đó.

    Raises:
        ValueError: Nếu chuỗi rỗng.
    """
    values = _extract_values(history)
    n = len(values)
    if n == 0:
        raise ValueError("Time series history cannot be empty")

    non_zero_count = sum(1 for v in values if v > 0)
    non_zero_ratio = non_zero_count / n
    mean = sum(values) / n

    variance = sum((x - mean) ** 2 for x in values) / n
    std = math.sqrt(variance)

    # Nếu chuỗi toàn số 0, tránh ZeroDivisionError: cv = 0.0
    cv = (std / mean) if mean > 0.0 else 0.0

    is_short_series = (n < 30)
    is_intermittent = (cv > 1.0) or (non_zero_ratio < 0.7)

    return SeriesMetrics(
        length=n,
        mean=round(mean, 6),
        std=round(std, 6),
        cv=round(cv, 6),
        non_zero_ratio=round(non_zero_ratio, 6),
        is_intermittent=is_intermittent,
        is_short_series=is_short_series,
    )


def select_algorithm_with_metrics(
    history: Sequence[Union[float, int, DailySalesPoint]],
    preferred_intermittent: ForecastModel = ForecastModel.CROSTON,
    preferred_stable: ForecastModel = ForecastModel.AUTO_ARIMA,
) -> AlgorithmSelectionResult:
    """
    Lựa chọn thuật toán dự báo dựa trên đặc tính chuỗi thời gian, trả về kết quả
    kèm metrics và giải trình chi tiết.

    Cây quyết định (Decision Rules):
    1. Chuỗi ngắn (N < 30 ngày): Simple Moving Average (7 ngày).
    2. Nhu cầu ngắt quãng (CV > 1.0 hoặc non_zero_ratio < 0.7): Croston hoặc TSB.
    3. Nhu cầu đều, biến động thấp (CV <= 0.5 và N >= 30): AutoARIMA hoặc Holt-Winters ETS.
    4. Nhu cầu trung bình (0.5 < CV <= 1.0 và non_zero_ratio >= 0.7): AutoARIMA.

    Raises:
        ValueError: Nếu chuỗi rỗng.
    """
    metrics = calculate_series_metrics(history)

    # 1. Chuỗi ngắn < 30 ngày
    if metrics.is_short_series:
        return AlgorithmSelectionResult(
            model=ForecastModel.SMA,
            metrics=metrics,
            reason=(
                f"Chuỗi dữ liệu ngắn ({metrics.length} ngày < 30 ngày) -> "
                f"Sử dụng Simple Moving Average (7 ngày)"
            ),
        )

    # 2. Nhu cầu ngắt quãng (intermittent demand)
    if metrics.is_intermittent:
        selected_model = (
            preferred_intermittent
            if preferred_intermittent in (ForecastModel.CROSTON, ForecastModel.TSB)
            else ForecastModel.CROSTON
        )
        return AlgorithmSelectionResult(
            model=selected_model,
            metrics=metrics,
            reason=(
                f"Nhu cầu ngắt quãng (CV={metrics.cv:.2f}, "
                f"tỷ lệ ngày có bán={metrics.non_zero_ratio * 100:.1f}%) -> "
                f"Sử dụng mô hình {selected_model.value}"
            ),
        )

    # 3. Nhu cầu đều, biến động thấp
    if metrics.cv <= 0.5:
        selected_model = (
            preferred_stable
            if preferred_stable in (ForecastModel.AUTO_ARIMA, ForecastModel.HOLT_WINTERS)
            else ForecastModel.AUTO_ARIMA
        )
        return AlgorithmSelectionResult(
            model=selected_model,
            metrics=metrics,
            reason=(
                f"Nhu cầu đều, biến động thấp (CV={metrics.cv:.2f} <= 0.5, N={metrics.length}) -> "
                f"Sử dụng mô hình {selected_model.value}"
            ),
        )

    # 4. Biến động trung bình (0.5 < CV <= 1.0 và non_zero_ratio >= 0.7)
    return AlgorithmSelectionResult(
        model=ForecastModel.AUTO_ARIMA,
        metrics=metrics,
        reason=(
            f"Nhu cầu ổn định mức trung bình (CV={metrics.cv:.2f}, "
            f"tỷ lệ ngày có bán={metrics.non_zero_ratio * 100:.1f}%) -> "
            f"Sử dụng mô hình AutoARIMA"
        ),
    )


def select_algorithm(
    history: Sequence[Union[float, int, DailySalesPoint]],
    preferred_intermittent: ForecastModel = ForecastModel.CROSTON,
    preferred_stable: ForecastModel = ForecastModel.AUTO_ARIMA,
) -> str:
    """
    Lựa chọn thuật toán dựa trên đặc tính chuỗi thời gian.
    Trả về tên chuỗi mô hình: 'SMA' | 'Croston' | 'TSB' | 'AutoARIMA' | 'HoltWinters'.
    Hàm chuẩn khớp với docs/technical/architecture.md Mục 5.1 và ai-service SKILL.md.
    """
    result = select_algorithm_with_metrics(
        history,
        preferred_intermittent=preferred_intermittent,
        preferred_stable=preferred_stable,
    )
    return result.model.value
