import unittest
from datetime import date, timedelta

from src.models.request import DailySalesPoint
from src.profiling.metrics import calculate_series_metrics
from src.profiling.selector import select_algorithm_with_metrics, ForecastModel


class TestProfilingModules(unittest.TestCase):
    def test_calculate_metrics_continuous_smooth(self):
        pts = [DailySalesPoint(date=date(2026, 8, 1) + timedelta(days=i), quantity=10.0 + (i % 2)) for i in range(35)]
        metrics = calculate_series_metrics(pts)
        self.assertFalse(metrics.is_short_series)
        self.assertFalse(metrics.is_intermittent)
        self.assertLessEqual(metrics.cv, 0.5)

    def test_selector_routing_intermittent(self):
        # 35 ngày, nhiều ngày 0
        pts = [DailySalesPoint(date=date(2026, 8, 1) + timedelta(days=i), quantity=15.0 if i % 4 == 0 else 0.0) for i in range(35)]
        res = select_algorithm_with_metrics(pts)
        self.assertIn(res.model, [ForecastModel.CROSTON, ForecastModel.TSB])
