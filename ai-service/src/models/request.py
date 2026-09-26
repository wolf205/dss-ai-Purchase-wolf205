from datetime import date
from typing import List
from pydantic import Field
from src.models.base import CamelModel


class DailySalesPoint(CamelModel):
    date: date
    quantity: float = Field(
        ...,
        ge=0.0,
        description="Số lượng bán trong ngày (>= 0, đã bù đắp zero-demand nếu không bán)"
    )


class SkuSeries(CamelModel):
    sku_id: int = Field(
        ...,
        gt=0,
        description="ID định danh SKU (> 0)"
    )
    history: List[DailySalesPoint] = Field(
        ...,
        min_length=1,
        description="Lịch sử chuỗi thời gian bán hàng hàng ngày (tối thiểu 1 ngày)"
    )


class TimeSeriesPayload(CamelModel):
    horizon_days: int = Field(
        default=14,
        ge=7,
        le=30,
        description="Số ngày dự báo tương lai, mặc định 14 ngày (trong khoảng 7-30 ngày)"
    )
    series: List[SkuSeries] = Field(
        ...,
        min_length=1,
        description="Danh sách chuỗi bán hàng của các SKU cần dự báo"
    )
