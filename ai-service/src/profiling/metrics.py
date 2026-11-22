import math
from typing import Sequence, Union

from src.models.metrics import SeriesMetrics
from src.models.request import DailySalesPoint


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
    adi = round(n / non_zero_count, 4) if non_zero_count > 0 else 999.0

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
        adi=adi,
    )
