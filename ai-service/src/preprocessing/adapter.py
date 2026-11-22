from datetime import date
from typing import List, Optional
import pandas as pd

from src.models.request import DailySalesPoint
from src.preprocessing.zero_padding import pad_zero_demand_series
from src.preprocessing.uncensoring import uncensor_stockout_series
from src.preprocessing.outlier import clean_and_winsorize_series


def pad_zero_demand_dataframe(
    sku_id: int,
    history: List[DailySalesPoint],
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    clean_outliers: bool = True,
    stockout_dates: Optional[List[date]] = None,
) -> pd.DataFrame:
    """
    Tạo pandas DataFrame với các cột chuẩn ['unique_id', 'ds', 'y']
    tương thích trực tiếp với thư viện statsforecast.
    Hỗ trợ khử stockout censored demand và khử nhiễu đột biến (Winsorization).
    """
    series = pad_zero_demand_series(history, start_date, end_date)
    if stockout_dates:
        series = uncensor_stockout_series(series, stockout_dates)
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
