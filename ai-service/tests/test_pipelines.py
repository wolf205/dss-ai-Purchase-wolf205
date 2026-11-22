import unittest
from datetime import date, timedelta
import pytest

from src.models.request import DailySalesPoint, SkuSeries, TimeSeriesPayload
from src.pipelines.single_sku import run_forecast_for_sku
from src.pipelines.batch_hybrid import run_batch_hybrid_forecast
from src.pipelines.coordinator import run_forecast


class TestPipelines(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.base_date = date(2026, 8, 1)
        self.sku_1 = SkuSeries(
            sku_id=1,
            history=[
                DailySalesPoint(date=self.base_date + timedelta(days=i), quantity=10.0 + (i % 2))
                for i in range(14)
            ],
        )

    def test_single_sku_pipeline(self):
        res = run_forecast_for_sku(self.sku_1, horizon_days=7)
        self.assertEqual(res.sku_id, 1)
        self.assertEqual(len(res.daily_forecasts), 7)
        self.assertEqual(res.model_used, "SMA")

    def test_batch_hybrid_pipeline(self):
        payload = TimeSeriesPayload(horizon_days=7, series=[self.sku_1])
        res = run_batch_hybrid_forecast(payload)
        self.assertTrue(res.success)
        self.assertEqual(len(res.results), 1)
        self.assertEqual(res.results[0].sku_id, 1)

    async def test_coordinator_async_forecast(self):
        payload = TimeSeriesPayload(horizon_days=7, series=[self.sku_1])
        res = await run_forecast(payload)
        self.assertTrue(res.success)
        self.assertEqual(len(res.results), 1)
