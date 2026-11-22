import asyncio
from concurrent.futures import ThreadPoolExecutor
import os

from src.models.request import TimeSeriesPayload
from src.models.response import ForecastResponse
from src.pipelines.batch_hybrid import run_batch_hybrid_forecast

_executor = ThreadPoolExecutor(max_workers=min(4, (os.cpu_count() or 2)))


async def run_forecast(payload: TimeSeriesPayload) -> ForecastResponse:
    """
    Điều phối dự báo toàn bộ danh sách SKU trong TimeSeriesPayload thông qua Batch Hybrid Pipeline.
    Thực thi trên ThreadPoolExecutor để không làm nghẽn Event Loop của FastAPI.
    """
    if not payload.series:
        return ForecastResponse(success=True, results=[])

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(_executor, run_batch_hybrid_forecast, payload)
