from typing import Sequence, Union

from src.models.metrics import AlgorithmSelectionResult, ForecastModel
from src.models.request import DailySalesPoint
from src.profiling.metrics import calculate_series_metrics


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
        selected_model: ForecastModel = (
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
