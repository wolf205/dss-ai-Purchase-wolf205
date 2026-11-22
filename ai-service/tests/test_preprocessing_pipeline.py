import unittest
from datetime import date, timedelta

from src.models.request import DailySalesPoint, SkuSeries
from src.preprocessing.zero_padding import pad_zero_demand, pad_zero_demand_series
from src.preprocessing.uncensoring import uncensor_stockout_series
from src.preprocessing.outlier import clean_and_winsorize_values, clean_and_winsorize_series
from src.preprocessing.adapter import pad_zero_demand_dataframe
from src.preprocessing.pipeline import preprocess_sku_series


class TestPreprocessingModules(unittest.TestCase):
    def test_zero_padding_isolated(self):
        pts = [
            DailySalesPoint(date=date(2026, 9, 1), quantity=10.0),
            DailySalesPoint(date=date(2026, 9, 3), quantity=20.0),
        ]
        padded = pad_zero_demand_series(pts)
        self.assertEqual(len(padded), 3)
        self.assertEqual(padded[0].quantity, 10.0)
        self.assertEqual(padded[1].quantity, 0.0)
        self.assertEqual(padded[2].quantity, 20.0)

    def test_uncensoring_isolated(self):
        pts = [
            DailySalesPoint(date=date(2026, 9, 1), quantity=10.0),
            DailySalesPoint(date=date(2026, 9, 2), quantity=0.0),
            DailySalesPoint(date=date(2026, 9, 3), quantity=14.0),
        ]
        # Day 2 là stockout date
        uncensored = uncensor_stockout_series(pts, stockout_dates=[date(2026, 9, 2)])
        self.assertGreater(uncensored[1].quantity, 0.0)

    def test_outlier_winsorization_isolated(self):
        # 14 ngày bán bình thường 5-7, với 1 đột biến 100.0
        normal_series = [5.0, 6.0, 7.0, 5.0, 6.0, 0.0, 0.0, 5.0, 6.0, 7.0, 6.0, 5.0, 6.0, 100.0]
        cleaned = clean_and_winsorize_values(normal_series, std_multiplier=3.0)
        self.assertLess(cleaned[-1], 50.0)
        self.assertGreater(cleaned[-1], 6.0)

    def test_adapter_dataframe(self):
        pts = [DailySalesPoint(date=date(2026, 9, 1), quantity=5.0)]
        df = pad_zero_demand_dataframe(sku_id=1, history=pts)
        self.assertListEqual(list(df.columns), ["unique_id", "ds", "y"])
        self.assertEqual(df["unique_id"].iloc[0], 1)

    def test_pipeline_integration(self):
        series = SkuSeries(
            sku_id=1,
            history=[
                DailySalesPoint(date=date(2026, 9, 1), quantity=10.0),
                DailySalesPoint(date=date(2026, 9, 3), quantity=10.0),
            ],
            stockout_dates=[date(2026, 9, 2)],
        )
        res = preprocess_sku_series(series)
        self.assertEqual(len(res), 3)
