from datetime import date, timedelta
import math
from typing import Dict, List, Optional, Tuple
import pandas as pd

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


def _aggregate_and_resolve_range(
    history: List[DailySalesPoint],
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> Tuple[Dict[date, float], date, date]:
    """
    Tổng hợp sản lượng theo ngày và xác định khoảng ngày quét [actual_start, actual_end].
    Nếu cùng một ngày có nhiều bản ghi, cộng dồn sản lượng an toàn.
    """
    sales_map: Dict[date, float] = {}
    for item in history:
        sales_map[item.date] = sales_map.get(item.date, 0.0) + float(item.quantity)

    if not sales_map:
        if start_date is None or end_date is None:
            raise ValueError(
                "Cannot determine date range from empty history without both start_date and end_date"
            )
        actual_start = start_date
        actual_end = end_date
    else:
        min_history_date = min(sales_map.keys())
        max_history_date = max(sales_map.keys())
        actual_start = start_date if start_date is not None else min_history_date
        actual_end = end_date if end_date is not None else max_history_date

    if actual_start > actual_end:
        raise ValueError(
            f"start_date ({actual_start}) cannot be after end_date ({actual_end})"
        )

    return sales_map, actual_start, actual_end


def pad_zero_demand(
    history: List[DailySalesPoint],
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[float]:
    """
    Tạo chuỗi giá trị bán liên tục theo ngày, ngày không có dữ liệu bán = 0.0.
    Trả về danh sách các giá trị float phục vụ thuật toán thống kê (Croston, ARIMA, SMA,...).
    """
    if not history and start_date is None and end_date is None:
        return []

    sales_map, cur, actual_end = _aggregate_and_resolve_range(
        history, start_date, end_date
    )
    result: List[float] = []
    while cur <= actual_end:
        result.append(sales_map.get(cur, 0.0))
        cur += timedelta(days=1)
    return result


def pad_zero_demand_series(
    history: List[DailySalesPoint],
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[DailySalesPoint]:
    """
    Tạo chuỗi bán liên tục theo ngày dưới dạng danh sách đối tượng DailySalesPoint.
    """
    if not history and start_date is None and end_date is None:
        return []

    sales_map, cur, actual_end = _aggregate_and_resolve_range(
        history, start_date, end_date
    )
    result: List[DailySalesPoint] = []
    while cur <= actual_end:
        result.append(DailySalesPoint(date=cur, quantity=sales_map.get(cur, 0.0)))
        cur += timedelta(days=1)
    return result


def pad_zero_demand_dataframe(
    sku_id: int,
    history: List[DailySalesPoint],
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    clean_outliers: bool = True,
) -> pd.DataFrame:
    """
    Tạo pandas DataFrame với các cột chuẩn ['unique_id', 'ds', 'y']
    tương thích trực tiếp với thư viện statsforecast.
    Mặc định khử nhiễu đột biến (Winsorization) giúp mô hình học mẫu nhu cầu chuẩn xác.
    """
    series = pad_zero_demand_series(history, start_date, end_date)
    if clean_outliers:
        series = clean_and_winsorize_series(series)
    data = [
        {
            "unique_id": sku_id,
            "ds": pd.to_datetime(item.date),
            "y": float(item.quantity),
        }
        for item in series
    ]
    return pd.DataFrame(data, columns=["unique_id", "ds", "y"])
