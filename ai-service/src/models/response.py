from datetime import date
from typing import List
from pydantic import Field, model_validator
from src.models.base import CamelModel


class DailyForecast(CamelModel):
    date: date
    predicted: float = Field(
        ...,
        ge=0.0,
        description="Nhu cầu dự báo trung bình ngày (>= 0)"
    )
    lower: float = Field(
        ...,
        ge=0.0,
        description="Khoảng tin cậy dưới CI 95% (>= 0)"
    )
    upper: float = Field(
        ...,
        ge=0.0,
        description="Khoảng tin cậy trên CI 95% (>= lower)"
    )

    @model_validator(mode="after")
    def validate_confidence_interval(self) -> "DailyForecast":
        if self.upper < self.lower:
            raise ValueError(
                f"upper bound ({self.upper}) must be >= lower bound ({self.lower})"
            )
        return self


class SkuForecastResult(CamelModel):
    sku_id: int = Field(
        ...,
        gt=0,
        description="ID định danh SKU"
    )
    daily_average: float = Field(
        ...,
        ge=0.0,
        description="d_forecast — dùng trong SS, ROP"
    )
    daily_demand_std: float = Field(
        ...,
        ge=0.0,
        description="σd — độ lệch chuẩn nhu cầu ngày, dùng trong SS = Z * σd * sqrt(L)"
    )
    model_used: str = Field(
        ...,
        description="Thuật toán sử dụng: AutoARIMA | Croston | HoltWinters | SMA | TSB"
    )
    daily_forecasts: List[DailyForecast] = Field(
        default_factory=list,
        description="Danh sách dự báo theo ngày tương lai"
    )


class ForecastResponse(CamelModel):
    success: bool = True
    results: List[SkuForecastResult] = Field(
        default_factory=list,
        description="Kết quả dự báo cho từng SKU"
    )
