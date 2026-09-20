---
name: ai-service
description: >-
  Hướng dẫn lập trình Python FastAPI AI Forecasting Service: Pydantic schemas (TimeSeriesPayload,
  ForecastResponse), lựa chọn thuật toán dự báo (Croston/TSB, AutoARIMA, Holt-Winters, Moving Average),
  zero-demand padding, FastAPI router template, error handling và health check.
  Sử dụng khi implement hoặc debug bất kỳ file nào trong ai-service/src/.
---

# AI Service Skill — Python FastAPI Forecasting

## 1. Directory Map

```
ai-service/
├── src/
│   ├── api/
│   │   ├── router.py          # APIRouter — mount vào main.py
│   │   └── v1/
│   │       └── forecast.py    # POST /api/v1/forecast
│   ├── models/
│   │   ├── request.py         # Pydantic: TimeSeriesPayload
│   │   └── response.py        # Pydantic: ForecastResponse, ForecastItem
│   ├── services/
│   │   ├── forecaster.py      # Algorithm selector + orchestrator
│   │   ├── croston.py         # Croston / TSB (intermittent demand)
│   │   ├── autoarima.py       # AutoARIMA (stable demand)
│   │   ├── holt_winters.py    # Holt-Winters (seasonal demand)
│   │   └── moving_average.py  # SMA fallback
│   └── main.py                # FastAPI app entry point
├── tests/
│   └── test_forecast.py
├── requirements.txt
└── Dockerfile
```

## 2. Pydantic Schema Templates

```python
# src/models/request.py
from pydantic import BaseModel, Field
from typing import List
from datetime import date

class DailySalesPoint(BaseModel):
    sale_date: date
    quantity_sold: float  # Đã padding zero cho ngày không bán

class SkuTimeSeriesPayload(BaseModel):
    sku_id: str
    sales_history: List[DailySalesPoint]  # Tối thiểu 30 ngày, tối đa 365 ngày
    forecast_horizon_days: int = Field(default=14, ge=7, le=30)
    lead_time_days: int = Field(ge=1)

class TimeSeriesPayload(BaseModel):
    items: List[SkuTimeSeriesPayload]
    requested_at: date

# src/models/response.py
class DailyForecast(BaseModel):
    forecast_date: date
    predicted_quantity: float
    lower_ci_95: float
    upper_ci_95: float

class ForecastItem(BaseModel):
    sku_id: str
    algorithm_used: str   # "CROSTON" | "AUTOARIMA" | "HOLT_WINTERS" | "SMA"
    daily_forecasts: List[DailyForecast]
    forecast_period_days: int
    is_intermittent: bool

class ForecastResponse(BaseModel):
    items: List[ForecastItem]
    processed_at: date
    is_fallback: bool = False
```

## 3. Algorithm Selection Decision Tree

```python
# src/services/forecaster.py
def select_algorithm(sales_history: List[float]) -> str:
    """
    Lựa chọn thuật toán dựa trên đặc tính chuỗi thời gian.
    """
    non_zero_ratio = sum(1 for x in sales_history if x > 0) / len(sales_history)
    mean = sum(sales_history) / len(sales_history) or 1
    std = (sum((x - mean) ** 2 for x in sales_history) / len(sales_history)) ** 0.5
    cv = std / mean  # Coefficient of Variation

    # Dữ liệu ngắt quãng (intermittent demand)
    if cv > 1.0 or non_zero_ratio < 0.7:  # Hơn 30% ngày không bán
        return "CROSTON"

    # Dữ liệu ổn định, ít biến động
    if cv <= 0.5:
        return "HOLT_WINTERS"  # Hoặc AUTOARIMA

    # Trung bình — dùng AutoARIMA
    return "AUTOARIMA"
```

## 4. Zero-Demand Padding

```python
# Bổ sung ngày 0 vào chuỗi thời gian trước khi forecast
def pad_zero_demand(
    sales_records: List[DailySalesPoint],
    start_date: date,
    end_date: date
) -> List[float]:
    """Tạo chuỗi liên tục theo ngày, ngày không có dữ liệu = 0."""
    sales_map = {r.sale_date: r.quantity_sold for r in sales_records}
    current = start_date
    result = []
    while current <= end_date:
        result.append(sales_map.get(current, 0.0))
        current += timedelta(days=1)
    return result
```

## 5. FastAPI Router Template

```python
# src/api/v1/forecast.py
from fastapi import APIRouter, HTTPException
from src.models.request import TimeSeriesPayload
from src.models.response import ForecastResponse
from src.services.forecaster import run_forecast

router = APIRouter(prefix="/api/v1", tags=["Forecast"])

@router.post("/forecast", response_model=ForecastResponse)
async def forecast(payload: TimeSeriesPayload) -> ForecastResponse:
    try:
        return await run_forecast(payload)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

@router.get("/health")
async def health():
    return {"status": "ok"}
```

## 6. Common Commands

```bash
# Trong thư mục ai-service/
uvicorn src.main:app --reload --port 8000   # Dev server
pytest -v                                    # Chạy tests
pytest --cov=src --cov-report=term-missing   # Tests + coverage
mypy src/                                    # Type checking
pip install -r requirements.txt              # Cài dependencies
```

## 7. Requirements Cốt Lõi

```
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
pydantic>=2.6.0
statsforecast>=1.7.0    # Croston, AutoARIMA, Holt-Winters
numpy>=1.26.0
pandas>=2.2.0
httpx>=0.27.0           # FastAPI TestClient
pytest>=8.0.0
pytest-cov
mypy
```
