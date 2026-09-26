---
name: ai-service
description: >-
  Hướng dẫn lập trình Python FastAPI AI Forecasting Service: Pydantic v2 schemas (TimeSeriesPayload,
  ForecastResponse), lựa chọn thuật toán dự báo theo đặc tính chuỗi (Croston/TSB cho ngắt quãng,
  AutoARIMA/Holt-Winters cho đều, SMA cho chuỗi ngắn <30 ngày), zero-demand padding, FastAPI router
  template, error handling và health check. Sử dụng khi implement hoặc debug bất kỳ file nào
  trong ai-service/src/.
---

# AI Service Skill — Python FastAPI Forecasting

## 1. Directory Map

```
ai-service/
├── src/
│   ├── api/
│   │   └── v1/
│   │       └── forecast.py    # POST /api/v1/forecast + GET /api/v1/health
│   ├── models/
│   │   ├── request.py         # Pydantic v2: TimeSeriesPayload
│   │   └── response.py        # Pydantic v2: ForecastResponse
│   ├── services/
│   │   ├── forecaster.py      # Algorithm selector + orchestrator
│   │   ├── croston.py         # Croston / TSB (intermittent demand, cv > 1.0 hoặc nonzero < 70%)
│   │   ├── autoarima.py       # AutoARIMA (stable demand, cv ≤ 0.5)
│   │   ├── holt_winters.py    # Holt-Winters ETS (seasonal/stable)
│   │   └── moving_average.py  # Simple MA 7-day (fallback cho chuỗi ngắn < 30 ngày)
│   └── main.py                # FastAPI app entry point
├── tests/
│   └── test_forecast.py
├── requirements.txt
└── Dockerfile
```

## 2. API Contract (Khớp với api-specification.md Mục 11)

```python
# src/models/request.py
from pydantic import BaseModel, Field
from typing import List
from datetime import date

class DailySalesPoint(BaseModel):
    date: date
    quantity: float  # đã padding zero cho ngày không bán

class SkuSeries(BaseModel):
    sku_id: int
    history: List[DailySalesPoint]  # Tối thiểu 14 ngày, tốt nhất 30-90 ngày

class TimeSeriesPayload(BaseModel):
    horizon_days: int = Field(default=14, ge=7, le=30)
    series: List[SkuSeries]

# src/models/response.py
class DailyForecast(BaseModel):
    date: date
    predicted: float
    lower: float   # CI 95% lower bound
    upper: float   # CI 95% upper bound

class SkuForecastResult(BaseModel):
    sku_id: int
    daily_average: float       # d_forecast — dùng trong SS, ROP
    daily_demand_std: float    # σd — dùng trong SS = Z × σd × √L
    model_used: str            # "AutoARIMA" | "Croston" | "HoltWinters" | "SMA"
    daily_forecasts: List[DailyForecast]  # 14 items

class ForecastResponse(BaseModel):
    success: bool = True
    results: List[SkuForecastResult]
```

## 3. Algorithm Selection (Theo đặc tính chuỗi — từ architecture.md)

```python
# src/services/forecaster.py
def select_algorithm(history: List[float]) -> str:
    """
    Lựa chọn thuật toán dựa trên đặc tính chuỗi thời gian.
    Nguồn: docs/technical/architecture.md Mục 5.1
    """
    if len(history) < 30:
        return "SMA"  # Chuỗi ngắn < 30 ngày → Simple Moving Average 7 ngày

    non_zero_ratio = sum(1 for x in history if x > 0) / len(history)
    mean = sum(history) / len(history) or 1e-9
    std = (sum((x - mean) ** 2 for x in history) / len(history)) ** 0.5
    cv = std / mean  # Coefficient of Variation

    # Nhu cầu ngắt quãng (intermittent): cv > 1.0 hoặc nonzero < 70%
    if cv > 1.0 or non_zero_ratio < 0.7:
        return "Croston"  # hoặc TSB via statsforecast

    # Nhu cầu đều, biến động thấp
    if cv <= 0.5:
        return "AutoARIMA"  # hoặc HoltWinters ETS

    # Trung bình — AutoARIMA
    return "AutoARIMA"
```

## 4. Zero-Demand Padding (Bắt buộc trước khi forecast)

```python
from datetime import date, timedelta

def pad_zero_demand(
    history: List[DailySalesPoint],
    start_date: date,
    end_date: date
) -> List[float]:
    """Tạo chuỗi liên tục theo ngày, ngày không có dữ liệu = 0.0"""
    sales_map = {r.date: r.quantity for r in history}
    result = []
    current = start_date
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
    return {"status": "ok", "service": "retail-dss-forecasting"}
```

## 6. Common Commands

```bash
# Trong thư mục ai-service/
uvicorn src.main:app --reload --port 8000   # Dev server
pytest -v                                    # Tests
pytest --cov=src --cov-report=term-missing   # Coverage
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
