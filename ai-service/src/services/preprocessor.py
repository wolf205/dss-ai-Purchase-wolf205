from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple
import pandas as pd

from src.models.request import DailySalesPoint


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
) -> pd.DataFrame:
    """
    Tạo pandas DataFrame với các cột chuẩn ['unique_id', 'ds', 'y']
    tương thích trực tiếp với thư viện statsforecast.
    """
    series = pad_zero_demand_series(history, start_date, end_date)
    data = [
        {
            "unique_id": sku_id,
            "ds": pd.to_datetime(item.date),
            "y": float(item.quantity),
        }
        for item in series
    ]
    return pd.DataFrame(data, columns=["unique_id", "ds", "y"])
