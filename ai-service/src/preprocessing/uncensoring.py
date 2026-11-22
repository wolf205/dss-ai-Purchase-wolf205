from datetime import date
from typing import Dict, List, Optional

from src.models.request import DailySalesPoint


def uncensor_stockout_series(
    series: List[DailySalesPoint],
    stockout_dates: Optional[List[date]] = None,
) -> List[DailySalesPoint]:
    """
    Khử hiệu ứng nhu cầu bị kiểm duyệt (Stockout Uncensoring):
    Nếu một ngày nằm trong danh sách stockout_dates (tồn kho cuối ngày = 0) và có quantity == 0,
    nội suy bằng trung vị các ngày có bán gần nhất (ưu tiên cùng thứ trong tuần nếu đủ mẫu)
    để tránh mô hình học nhầm ngày hết hàng là nhu cầu thật bằng 0.
    """
    if not series or not stockout_dates:
        return series

    stockout_set = set(stockout_dates)
    active_non_stockout = [
        float(p.quantity)
        for p in series
        if float(p.quantity) > 0.0 and p.date not in stockout_set
    ]
    if not active_non_stockout:
        return series

    sorted_active = sorted(active_non_stockout)
    n_act = len(sorted_active)
    global_med = (
        sorted_active[n_act // 2]
        if n_act % 2 == 1
        else (sorted_active[n_act // 2 - 1] + sorted_active[n_act // 2]) / 2.0
    )

    by_weekday: Dict[int, List[float]] = {w: [] for w in range(7)}
    for p in series:
        if float(p.quantity) > 0.0 and p.date not in stockout_set:
            by_weekday[p.date.weekday()].append(float(p.quantity))

    result: List[DailySalesPoint] = []
    for p in series:
        if p.date in stockout_set and float(p.quantity) <= 0.0:
            w_vals = sorted(by_weekday[p.date.weekday()])
            if len(w_vals) >= 2:
                nw = len(w_vals)
                w_med = (
                    w_vals[nw // 2]
                    if nw % 2 == 1
                    else (w_vals[nw // 2 - 1] + w_vals[nw // 2]) / 2.0
                )
                imputed = round(max(0.0, w_med), 4)
            else:
                imputed = round(max(0.0, global_med), 4)
            result.append(DailySalesPoint(date=p.date, quantity=imputed))
        else:
            result.append(p)
    return result
