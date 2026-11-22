import math
from typing import List

from src.models.metrics import SeriesMetrics
from src.models.request import DailySalesPoint


def compute_empirical_ci_bounds(
    pred: float,
    padded_series: List[DailySalesPoint],
    metrics: SeriesMetrics,
    step_index: int,
) -> tuple[float, float]:
    """
    Ước lượng khoảng tin cậy 95% thích ứng theo phân phối lệch phải của bán lẻ:
    - Với chuỗi có lịch sử >= 14 ngày: sử dụng phân vị lệch thực nghiệm (empirical asymmetry)
      từ độ lệch so với trung bình trượt tuần cùng yếu tố mở rộng theo chân trời √(1 + step/14).
    - Fallback an toàn về 1.96 * metrics.std cho chuỗi cực ngắn.
    """
    n = len(padded_series)
    horizon_scale = math.sqrt(1.0 + step_index / 14.0)

    if n >= 14 and metrics.mean > 0.0:
        vals = [float(p.quantity) for p in padded_series[-56:]]
        window_mean = sum(vals[-7:]) / min(7, len(vals))
        neg_devs = [max(0.0, window_mean - v) for v in vals]
        pos_devs = [max(0.0, v - window_mean) for v in vals]

        rms_lo = math.sqrt(sum(d * d for d in neg_devs) / len(neg_devs))
        rms_hi = math.sqrt(sum(d * d for d in pos_devs) / len(pos_devs))

        # Kết hợp giữa empirical RMS và std chuẩn hóa
        lo_spread = (0.5 * rms_lo + 0.5 * metrics.std) * 1.96 * horizon_scale
        hi_spread = (0.5 * rms_hi + 0.5 * metrics.std) * 1.96 * horizon_scale
    else:
        lo_spread = 1.96 * metrics.std * horizon_scale
        hi_spread = 1.96 * metrics.std * horizon_scale

    lower = round(max(0.0, pred - lo_spread), 4)
    upper = round(max(lower, pred + hi_spread), 4)
    return lower, upper
