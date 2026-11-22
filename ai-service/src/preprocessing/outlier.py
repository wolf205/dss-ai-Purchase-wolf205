import math
from typing import List

from src.models.request import DailySalesPoint


def clean_and_winsorize_values(
    values: List[float],
    std_multiplier: float = 3.0,
) -> List[float]:
    """
    Cắt ngọn các điểm ngoại lai (Outliers) trên danh sách số thực bằng phương pháp
    Median Absolute Deviation (MAD) chuẩn hóa bền vững (Robust Outlier Detection).
    Chỉ áp dụng cho các ngày có phát sinh nhu cầu bán (value > 0.0).
    Giữ nguyên các ngày bán ngắt quãng (value == 0.0).
    """
    if len(values) < 14:
        return values

    active = sorted([float(v) for v in values if float(v) > 0.0])
    n_act = len(active)
    if n_act < 5:
        return values

    # 1. Tính Median của active demand
    med = (
        active[n_act // 2]
        if n_act % 2 == 1
        else (active[n_act // 2 - 1] + active[n_act // 2]) / 2.0
    )

    # 2. Tính MAD (Median Absolute Deviation)
    abs_deviations = sorted([abs(v - med) for v in active])
    mad = (
        abs_deviations[n_act // 2]
        if n_act % 2 == 1
        else (abs_deviations[n_act // 2 - 1] + abs_deviations[n_act // 2]) / 2.0
    )

    # 3. Ước lượng độ lệch chuẩn bền vững (sigma = 1.4826 * MAD)
    robust_std = 1.4826 * mad
    if robust_std <= 0.0001:
        var_act = sum((v - med) ** 2 for v in active) / n_act
        robust_std = math.sqrt(var_act)

    if robust_std <= 0.0001:
        return values

    cap = round(med + std_multiplier * robust_std, 4)
    return [cap if float(v) > cap else float(v) for v in values]


def clean_and_winsorize_series(
    series: List[DailySalesPoint],
    std_multiplier: float = 3.0,
) -> List[DailySalesPoint]:
    """
    Khử nhiễu đột biến (Outlier Winsorization) cho chuỗi bán hàng theo ngày.
    Chỉ áp dụng cắt ngọn cho các ngày có phát sinh nhu cầu bán (quantity > 0)
    khi vượt quá ngưỡng mean + std_multiplier * std của các ngày có phát sinh bán.
    Giữ nguyên các ngày bán ngắt quãng (quantity = 0.0).
    """
    if len(series) < 14:
        return series

    raw_vals = [float(p.quantity) for p in series]
    cleaned_vals = clean_and_winsorize_values(raw_vals, std_multiplier=std_multiplier)

    return [
        DailySalesPoint(date=series[i].date, quantity=cleaned_vals[i])
        for i in range(len(series))
    ]
