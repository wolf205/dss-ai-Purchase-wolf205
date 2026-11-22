---
name: ai-service
description: >-
  Hướng dẫn lập trình Python FastAPI AI Forecasting Service: Pydantic v2 schemas (CamelModel,
  TimeSeriesPayload, ForecastResponse), tiền xử lý (zero-demand padding, stockout uncensoring,
  MAD winsorization), Batch Hybrid Ensemble (MSTL, AutoETS, DOT, HoltWinters, CrostonSBA, TSB)
  kết hợp Global Cross-SKU Ridge, fallback (AutoARIMA, SMA), FastAPI router, error handling và
  health check. Sử dụng khi implement hoặc debug bất kỳ file nào trong ai-service/src/.
---

# AI Service Skill — Python FastAPI Forecasting

## 1. Directory Map

```
ai-service/
├── main.py                      # Entrypoint shim (re-export src.main:app)
├── src/
│   ├── api/
│   │   └── v1/
│   │       └── forecast.py      # POST /api/v1/forecast + GET /api/v1/health
│   ├── models/
│   │   ├── base.py              # CamelModel (camelCase <-> snake_case)
│   │   ├── request.py           # Pydantic v2: TimeSeriesPayload, SkuSeries, DailySalesPoint
│   │   └── response.py          # Pydantic v2: ForecastResponse, SkuForecastResult, DailyForecast
│   ├── services/
│   │   ├── preprocessor.py      # Zero-demand padding, Stockout Uncensoring, MAD Winsorization
│   │   ├── selector.py          # SeriesMetrics & AlgorithmSelectionResult (ForecastModel enum)
│   │   ├── global_model.py      # Global Cross-SKU Ridge (Huber-damped) + pooled DoW factors
│   │   └── forecaster.py        # Batch Hybrid Pipeline + single-SKU/SMA/AutoARIMA fallback
│   └── main.py                  # FastAPI app + Settings + CORS
├── tests/
│   ├── test_forecast_api.py
│   ├── test_models.py
│   ├── test_preprocessor.py
│   └── test_selector.py
├── requirements.txt
└── Dockerfile
```

## 2. API Contract (Khớp với api-specification.md Mục 11)

```python
# src/models/request.py (kế thừa CamelModel từ src/models/base.py)
class DailySalesPoint(CamelModel):
    date: date
    quantity: float = Field(..., ge=0.0)

class SkuSeries(CamelModel):
    sku_id: int = Field(..., gt=0)
    history: List[DailySalesPoint] = Field(..., min_length=1)
    category_code: Optional[str] = None
    stockout_dates: Optional[List[date]] = None

class TimeSeriesPayload(CamelModel):
    horizon_days: int = Field(default=14, ge=7, le=30)
    series: List[SkuSeries] = Field(..., min_length=1)

# src/models/response.py
class DailyForecast(CamelModel):
    date: date
    predicted: float = Field(..., ge=0.0)
    lower: float = Field(..., ge=0.0)
    upper: float = Field(..., ge=0.0)  # model_validator: upper >= lower

class SkuForecastResult(CamelModel):
    sku_id: int = Field(..., gt=0)
    daily_average: float = Field(..., ge=0.0)
    daily_demand_std: float = Field(..., ge=0.0)
    model_used: str  # HybridEnsemble | AutoETS | MSTL | DynamicOptimizedTheta | AutoARIMA | HoltWinters | Croston | CrostonSBA | TSB | SMA
    daily_forecasts: List[DailyForecast]

class ForecastResponse(CamelModel):
    success: bool = True
    results: List[SkuForecastResult]
```

## 3. Pipeline & Algorithm Routing (Thực tế trong `src/services/`)

1. **Tiền xử lý (`preprocessor.py`):**
   * `pad_zero_demand_series`: điền `0.0` cho ngày thiếu, cộng dồn nếu trùng ngày.
   * `uncensor_stockout_series`: nội suy ngày hết hàng (`stockout_dates`, `quantity <= 0`) bằng trung vị cùng thứ hoặc trung vị toàn cục.
   * `clean_and_winsorize_series`: cắt ngọn ngoại lai bằng `median + 3.0 * (1.4826 * MAD)` (áp dụng khi `len >= 14` và `>= 5` ngày bán > 0).
2. **Batch Hybrid Pipeline (`forecaster.py` → `_run_batch_hybrid_forecast`):**
   * Chạy trên `ThreadPoolExecutor` (tối đa 4 workers) qua `run_forecast`.
   * Vectorized `StatsForecast` 1 lần cho SKU `length >= 30` và `mean > 0`: `MSTL(7)`, `AutoETS(7)`, `DynamicOptimizedTheta(7)`, `HoltWinters(7)`, `CrostonSBA()`, `TSB(0.15, 0.15)`.
   * `fit_and_predict_global_cross_sku` (`global_model.py`): kích hoạt khi có `>= 3` SKU đạt `>= 35` ngày lịch sử.
   * Định tuyến trộn trọng số theo `SeriesMetrics` (`is_short_series`, `is_intermittent`, `cv`, `non_zero_ratio`) → trả về `HybridEnsemble` (hoặc `SMA` cho chuỗi ngắn `< 30` ngày).
   * CI 95% bất đối xứng thực nghiệm (`_compute_empirical_ci_bounds`), mở rộng theo `sqrt(1 + step / 14)`.
3. **Graceful Fallback:**
   * Lỗi batch hoặc lô 1 SKU → `run_forecast_for_sku` (dùng `select_algorithm_with_metrics` từ `selector.py`).
   * Lỗi nhánh liên tục → fallback `AutoARIMA(level=[95])`; vẫn lỗi (hoặc nhánh ngắt quãng lỗi) → fallback `_build_sma_forecasts`.

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
fastapi==0.115.0
uvicorn[standard]==0.31.0
pydantic==2.9.2
pydantic-settings==2.5.2
statsforecast>=2.1.0    # MSTL, AutoETS, DOT, HoltWinters, CrostonSBA, TSB, AutoARIMA
numpy>=2.0.0
pandas>=2.2.0
scipy>=1.14.0
httpx>=0.28.0           # FastAPI TestClient
```
