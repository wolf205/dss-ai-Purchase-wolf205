from typing import List

from src.models.request import DailySalesPoint


def calculate_recency_momentum_boost(
    padded_series: List[DailySalesPoint],
    step_index: int = 0,
) -> float:
    """
    Tính hệ số bù thiên kiến đà tăng trưởng và triệt tiêu Under-forecasting Bias (Dual-Window Adaptive Momentum).
    So sánh nhu cầu ngắn hạn (14 ngày gần nhất) với trung hạn (42 ngày gần nhất)
    để kịp thời bắt nhịp các đợt tăng tốc tiêu thụ mà mô hình làm mịn mũ bị trễ.
    Hỗ trợ Damping Factor theo bước dự báo tương lai (step_index: 0..h-1).
    Giới hạn an toàn trong khoảng [0.85, 1.30].
    """
    n = len(padded_series)
    if n < 28:
        return 1.0

    short_window = min(14, n // 2)
    mid_window = min(42, n)

    short_vals = [float(p.quantity) for p in padded_series[-short_window:]]
    short_mean = sum(short_vals) / short_window

    mid_vals = [float(p.quantity) for p in padded_series[-mid_window:]]
    mid_mean = sum(mid_vals) / mid_window

    all_vals = [float(p.quantity) for p in padded_series]
    all_mean = sum(all_vals) / n

    baseline = max(mid_mean, all_mean)
    if baseline <= 0.0001:
        return 1.0

    momentum_ratio = short_mean / baseline

    if momentum_ratio > 1.03:
        raw_boost = 1.0 + (momentum_ratio - 1.0) * 0.75
        base_boost = min(1.30, raw_boost)
    elif momentum_ratio < 0.95:
        raw_reduction = 1.0 - (1.0 - momentum_ratio) * 0.5
        base_boost = max(0.88, raw_reduction)
    else:
        base_boost = 1.0

    # Damping factor: suy giảm nhẹ dần về 1.0 theo chân trời dự báo
    damping = 0.98 ** step_index
    final_boost = 1.0 + (base_boost - 1.0) * damping

    return round(final_boost, 4)
