---
name: ai-service
description: >-
  Hướng dẫn lập trình Python FastAPI AI Forecasting Service: Pydantic v2 schemas (CamelModel,
  TimeSeriesPayload, ForecastResponse, SeriesMetrics), tiền xử lý (zero-demand padding, stockout uncensoring,
  MAD winsorization), profiling (Syntetos-Boylan ADI & CV), Batch Hybrid Ensemble (MSTL, AutoETS, DOT, HoltWinters, CrostonSBA, TSB)
  kết hợp Global Cross-SKU Ridge, hậu xử lý (DoW seasonality shrinkage, momentum boost, empirical asymmetric CI 95%),
  fallback (AutoARIMA, SMA), FastAPI router, error handling và health check. Sử dụng khi implement hoặc debug bất kỳ file nào trong ai-service/src/.
---

# AI Service Skill — Python FastAPI Forecasting

## 1. Directory Map (5-Stage Modular Pipeline)

```
ai-service/
├── main.py                                  # Entrypoint shim (re-export src.main:app)
├── src/
│   ├── api/                                 # [TẦNG GIAO TIẾP HTTP]
│   │   └── v1/
│   │       └── forecast.py                  # POST /api/v1/forecast + GET /api/v1/health
│   ├── models/                              # [TẦNG DATA CONTRACTS & SCHEMAS]
│   │   ├── base.py                          # CamelModel (camelCase <-> snake_case)
│   │   ├── request.py                       # Pydantic v2: TimeSeriesPayload, SkuSeries, DailySalesPoint
│   │   ├── response.py                      # Pydantic v2: ForecastResponse, SkuForecastResult, DailyForecast
│   │   └── metrics.py                       # ForecastModel enum, SeriesMetrics, AlgorithmSelectionResult
│   ├── preprocessing/                       # [BƯỚC 1: TIỀN XỬ LÝ DỮ LIỆU]
│   │   ├── zero_padding.py                  # Zero-demand padding (pad_zero_demand, pad_zero_demand_series)
│   │   ├── uncensoring.py                   # Stockout Uncensoring (nội suy trung vị theo thứ)
│   │   ├── outlier.py                       # Outlier Winsorization (MAD robust 3.0 sigma)
│   │   ├── adapter.py                       # Chuyển đổi pandas DataFrame cho StatsForecast
│   │   └── pipeline.py                      # preprocess_sku_series (gộp quy trình chuẩn 1 SKU)
│   ├── profiling/                           # [BƯỚC 2: PHÂN TÍCH ĐẶC TRƯNG & ĐỊNH TUYẾN]
│   │   ├── metrics.py                       # Tính toán mean, std, CV, ADI, non_zero_ratio
│   │   └── selector.py                      # Heuristic rules chọn mô hình theo Syntetos-Boylan
│   ├── engines/                             # [BƯỚC 3: CÁC ĐỘNG CƠ DỰ BÁO ĐƠN LẺ]
│   │   ├── baseline.py                      # SMA 7 ngày & Zero Forecast
│   │   ├── intermittent.py                  # Croston Classic, CrostonSBA, TSB
│   │   ├── continuous.py                    # MSTL, AutoETS, DynamicOptimizedTheta, HoltWinters, AutoARIMA fallback
│   │   └── global_ridge.py                  # Global Cross-SKU Ridge (Huber-damped, Lags, Payday, DoW)
│   ├── postprocessing/                      # [BƯỚC 4: HẬU XỬ LÝ HIỆU CHỈNH & RỦI RO]
│   │   ├── seasonality.py                   # Day-of-Week Seasonality Shrinkage & Store/Category Pooled Factors
│   │   ├── momentum.py                      # Dual-Window Adaptive Momentum Boost
│   │   ├── confidence_interval.py           # Empirical Asymmetric CI 95% (mở rộng √(1 + step/14))
│   │   └── blending.py                      # Trộn trọng số kết quả dự báo
│   ├── pipelines/                           # [BƯỚC 5: ĐIỀU PHỐI TỔ HỢP DỰ BÁO]
│   │   ├── single_sku.py                    # run_forecast_for_sku + Graceful Fallback
│   │   ├── batch_hybrid.py                  # run_batch_hybrid_forecast (Vectorized StatsForecast + Global Ridge)
│   │   └── coordinator.py                   # ThreadPoolExecutor & async run_forecast
│   ├── services/                            # [SHIM LAYER] Backward compatibility re-exports
│   │   ├── preprocessor.py                  # Re-export từ src.preprocessing
│   │   ├── selector.py                      # Re-export từ src.models.metrics & src.profiling
│   │   ├── forecaster.py                    # Re-export từ src.pipelines & src.engines
│   │   └── global_model.py                  # Re-export từ src.engines & src.postprocessing
│   └── main.py                              # FastAPI app + Settings + CORS
├── tests/                                   # Unit & Integration Tests (72 passed)
│   ├── test_forecast_api.py
│   ├── test_models.py
│   ├── test_preprocessor.py
│   ├── test_selector.py
│   ├── test_preprocessing_pipeline.py
│   ├── test_profiling_pipeline.py
│   ├── test_engines_and_postprocessing.py
│   └── test_pipelines.py
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

## 3. Pipeline 5 Giai Đoạn

1. **Tiền xử lý (`src/preprocessing/`):**
   * `pad_zero_demand_series`: điền `0.0` cho ngày thiếu, cộng dồn nếu trùng ngày.
   * `uncensor_stockout_series`: nội suy ngày hết hàng (`stockout_dates`, `quantity <= 0`) bằng trung vị cùng thứ hoặc trung vị toàn cục.
   * `clean_and_winsorize_series`: cắt ngọn ngoại lai bằng `median + 3.0 * (1.4826 * MAD)` (áp dụng khi `len >= 14` và `>= 5` ngày bán > 0).
2. **Phân tích đặc trưng & Định tuyến (`src/profiling/`):**
   * `calculate_series_metrics`: tính $\bar{d}$, $\sigma_d$, $CV$, $ADI$, $\text{non\_zero\_ratio}$.
   * `select_algorithm_with_metrics`: phân loại Syntetos-Boylan (SMA vs Croston vs Continuous).
3. **Động cơ dự báo (`src/engines/`):**
   * `baseline.py`: SMA 7 ngày, Zero Forecast.
   * `intermittent.py`: CrostonSBA, TSB, DOT, MSTL.
   * `continuous.py`: MSTL, AutoETS, DOT, HoltWinters, fallback AutoARIMA.
   * `global_ridge.py`: Huber-damped Global Cross-SKU Ridge (lags 1, 7, 14, 28, payday, DoW).
4. **Hậu xử lý (`src/postprocessing/`):**
   * `seasonality.py`: Day-of-Week Seasonality Shrinkage & Store/Category pooled factors.
   * `momentum.py`: Dual-Window Adaptive Momentum Boost [0.85, 1.30].
   * `confidence_interval.py`: Empirical Asymmetric CI 95% mở rộng $\sqrt{1 + \text{step}/14}$.
5. **Điều phối tổ hợp (`src/pipelines/`):**
   * `single_sku.py`: `run_forecast_for_sku` (chạy đơn SKU kèm 3-tier fallback).
   * `batch_hybrid.py`: `run_batch_hybrid_forecast` (vectorized StatsForecast + Global Ridge + Adaptive Blending).
   * `coordinator.py`: `run_forecast` (async wrapper qua ThreadPoolExecutor).

## 4. FastAPI Router Template

```python
# src/api/v1/forecast.py
from fastapi import APIRouter, HTTPException
from src.models.request import TimeSeriesPayload
from src.models.response import ForecastResponse
from src.pipelines import run_forecast

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

## 5. Common Commands

```bash
# Trong thư mục ai-service/
uvicorn src.main:app --reload --port 8000   # Dev server
pytest -v                                    # Tests (72 passed)
pytest --cov=src --cov-report=term-missing   # Coverage
pip install -r requirements.txt              # Cài dependencies
```
