from typing import List

from src.models.request import DailySalesPoint, SkuSeries
from src.preprocessing.zero_padding import pad_zero_demand_series
from src.preprocessing.uncensoring import uncensor_stockout_series
from src.preprocessing.outlier import clean_and_winsorize_series


def preprocess_sku_series(series: SkuSeries) -> List[DailySalesPoint]:
    """
    Chuỗi tiền xử lý chuẩn cho 1 SKU:
    1. Bù đắp zero-demand liên tục theo ngày.
    2. Khử hiệu ứng censored demand tại các ngày hết hàng (nếu có stockout_dates).
    3. Khử nhiễu đột biến bằng MAD Winsorization (3.0 sigma).
    """
    padded = pad_zero_demand_series(series.history)
    if series.stockout_dates:
        padded = uncensor_stockout_series(padded, series.stockout_dates)
    return clean_and_winsorize_series(padded)
