import logging
from fastapi import APIRouter, HTTPException
from src.models.request import TimeSeriesPayload
from src.models.response import ForecastResponse
from src.services.forecaster import run_forecast

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Forecast"])


@router.post("/forecast", response_model=ForecastResponse)
async def forecast(payload: TimeSeriesPayload) -> ForecastResponse:
    """
    Dự báo nhu cầu chuỗi thời gian cho danh sách Active SKUs.
    Đầu ra bao gồm dailyAverage, dailyDemandStd, modelUsed, và dailyForecasts (CI 95%).
    Khớp với api-specification.md Mục 11.1 và architecture.md Mục 5.1.
    """
    try:
        return await run_forecast(payload)
    except ValueError as e:
        logger.warning("Validation error in forecast: %s", e)
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.error("Internal forecasting engine error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")


@router.get("/health")
async def health():
    """
    Health check endpoint kiểm tra tình trạng sống của AI Forecasting Service.
    Khớp với api-specification.md Mục 11.2.
    """
    return {
        "status": "ok",
        "service": "retail-dss-forecasting",
    }
