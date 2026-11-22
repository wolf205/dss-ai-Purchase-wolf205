import unittest
from datetime import date, timedelta

from src.models.metrics import SeriesMetrics, ForecastModel
from src.models.request import DailySalesPoint
from src.postprocessing.seasonality import calculate_day_of_week_factors, compute_pooled_dow_factors
from src.postprocessing.momentum import calculate_recency_momentum_boost
from src.postprocessing.confidence_interval import compute_empirical_ci_bounds
from src.engines.baseline import build_sma_forecasts, build_zero_forecasts


class TestEnginesAndPostprocessing(unittest.TestCase):
    def test_seasonality_and_momentum(self):
        pts = [DailySalesPoint(date=date(2026, 8, 1) + timedelta(days=i), quantity=10.0 + (i % 3)) for i in range(35)]
        dow = calculate_day_of_week_factors(pts)
        self.assertEqual(len(dow), 7)
        boost = calculate_recency_momentum_boost(pts, step_index=0)
        self.assertGreater(boost, 0.0)

    def test_confidence_interval_bounds(self):
        pts = [DailySalesPoint(date=date(2026, 8, 1) + timedelta(days=i), quantity=10.0) for i in range(20)]
        metrics = SeriesMetrics(
            length=20,
            mean=10.0,
            std=2.0,
            cv=0.2,
            non_zero_ratio=1.0,
            is_intermittent=False,
            is_short_series=True,
        )
        lower, upper = compute_empirical_ci_bounds(pred=10.0, padded_series=pts, metrics=metrics, step_index=0)
        self.assertGreaterEqual(lower, 0.0)
        self.assertGreaterEqual(upper, lower)

    def test_baseline_sma(self):
        pts = [DailySalesPoint(date=date(2026, 8, 1) + timedelta(days=i), quantity=10.0) for i in range(14)]
        metrics = SeriesMetrics(
            length=14,
            mean=10.0,
            std=1.0,
            cv=0.1,
            non_zero_ratio=1.0,
            is_intermittent=False,
            is_short_series=True,
        )
        future_dates = [date(2026, 8, 15) + timedelta(days=i) for i in range(7)]
        res = build_sma_forecasts(sku_id=1, padded_series=pts, future_dates=future_dates, metrics=metrics)
        self.assertEqual(res.sku_id, 1)
        self.assertEqual(res.model_used, "SMA")
        self.assertEqual(len(res.daily_forecasts), 7)
