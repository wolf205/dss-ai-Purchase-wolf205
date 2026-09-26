import unittest
from datetime import date
import pandas as pd

from src.models.request import DailySalesPoint
from src.services.preprocessor import (
    pad_zero_demand,
    pad_zero_demand_series,
    pad_zero_demand_dataframe,
)


class TestPreprocessor(unittest.TestCase):
    def setUp(self):
        self.sample_history = [
            DailySalesPoint(date=date(2026, 8, 1), quantity=10.0),
            DailySalesPoint(date=date(2026, 8, 4), quantity=15.0),
        ]

    def test_pad_zero_demand_with_gaps(self):
        """Test zero padding on gap days between sales records."""
        result = pad_zero_demand(self.sample_history)
        # Aug 1: 10.0, Aug 2: 0.0, Aug 3: 0.0, Aug 4: 15.0
        self.assertEqual(result, [10.0, 0.0, 0.0, 15.0])

    def test_pad_zero_demand_auto_inference_dates(self):
        """Test inferring start_date and end_date from history bounds."""
        result = pad_zero_demand(self.sample_history, start_date=None, end_date=None)
        self.assertEqual(len(result), 4)
        self.assertEqual(result[0], 10.0)
        self.assertEqual(result[-1], 15.0)

    def test_pad_zero_demand_with_leading_zeros(self):
        """Test padding leading days with 0.0 when start_date is before first sale."""
        result = pad_zero_demand(
            self.sample_history,
            start_date=date(2026, 7, 30),
            end_date=date(2026, 8, 4),
        )
        # Jul 30: 0.0, Jul 31: 0.0, Aug 1: 10.0, Aug 2: 0.0, Aug 3: 0.0, Aug 4: 15.0
        self.assertEqual(result, [0.0, 0.0, 10.0, 0.0, 0.0, 15.0])

    def test_pad_zero_demand_with_trailing_zeros(self):
        """Test padding trailing days with 0.0 when end_date is after last sale."""
        result = pad_zero_demand(
            self.sample_history,
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 6),
        )
        # Aug 1: 10.0, Aug 2: 0.0, Aug 3: 0.0, Aug 4: 15.0, Aug 5: 0.0, Aug 6: 0.0
        self.assertEqual(result, [10.0, 0.0, 0.0, 15.0, 0.0, 0.0])

    def test_pad_zero_demand_consecutive_days(self):
        """Test continuous sales days where no gap padding is needed."""
        consecutive = [
            DailySalesPoint(date=date(2026, 8, 1), quantity=5.0),
            DailySalesPoint(date=date(2026, 8, 2), quantity=8.0),
            DailySalesPoint(date=date(2026, 8, 3), quantity=12.0),
        ]
        result = pad_zero_demand(consecutive)
        self.assertEqual(result, [5.0, 8.0, 12.0])

    def test_pad_zero_demand_duplicate_dates_aggregated(self):
        """Test multiple sales records on the same day are safely summed."""
        duplicates = [
            DailySalesPoint(date=date(2026, 8, 1), quantity=5.0),
            DailySalesPoint(date=date(2026, 8, 1), quantity=7.5),
            DailySalesPoint(date=date(2026, 8, 2), quantity=3.0),
        ]
        result = pad_zero_demand(duplicates)
        self.assertEqual(result, [12.5, 3.0])

    def test_pad_zero_demand_empty_history_with_valid_dates(self):
        """Test empty history with explicit range produces all zeros."""
        result = pad_zero_demand(
            history=[],
            start_date=date(2026, 8, 1),
            end_date=date(2026, 8, 3),
        )
        self.assertEqual(result, [0.0, 0.0, 0.0])

    def test_pad_zero_demand_empty_history_without_dates(self):
        """Test empty history without date bounds returns empty list."""
        result = pad_zero_demand([], start_date=None, end_date=None)
        self.assertEqual(result, [])

    def test_pad_zero_demand_empty_history_with_missing_one_bound_raises(self):
        """Test empty history with only start_date or only end_date raises ValueError."""
        with self.assertRaises(ValueError):
            pad_zero_demand([], start_date=date(2026, 8, 1), end_date=None)

        with self.assertRaises(ValueError):
            pad_zero_demand([], start_date=None, end_date=date(2026, 8, 1))

    def test_pad_zero_demand_invalid_date_range_raises(self):
        """Test start_date > end_date raises ValueError."""
        with self.assertRaises(ValueError):
            pad_zero_demand(
                self.sample_history,
                start_date=date(2026, 8, 10),
                end_date=date(2026, 8, 1),
            )

    def test_pad_zero_demand_series(self):
        """Test pad_zero_demand_series returns DailySalesPoint objects with continuous dates."""
        series = pad_zero_demand_series(self.sample_history)
        self.assertEqual(len(series), 4)

        expected_dates = [
            date(2026, 8, 1),
            date(2026, 8, 2),
            date(2026, 8, 3),
            date(2026, 8, 4),
        ]
        expected_quantities = [10.0, 0.0, 0.0, 15.0]

        for i, item in enumerate(series):
            self.assertIsInstance(item, DailySalesPoint)
            self.assertEqual(item.date, expected_dates[i])
            self.assertEqual(item.quantity, expected_quantities[i])

    def test_pad_zero_demand_series_empty(self):
        """Test pad_zero_demand_series with empty history and no bounds returns []."""
        result = pad_zero_demand_series([])
        self.assertEqual(result, [])

    def test_pad_zero_demand_dataframe(self):
        """Test pad_zero_demand_dataframe produces statsforecast compatible DataFrame."""
        df = pad_zero_demand_dataframe(sku_id=42, history=self.sample_history)

        self.assertIsInstance(df, pd.DataFrame)
        self.assertListEqual(list(df.columns), ["unique_id", "ds", "y"])
        self.assertEqual(len(df), 4)

        # Check unique_id
        self.assertTrue((df["unique_id"] == 42).all())

        # Check y values
        self.assertListEqual(list(df["y"]), [10.0, 0.0, 0.0, 15.0])

        # Check ds timestamp values
        expected_timestamps = [
            pd.Timestamp("2026-08-01"),
            pd.Timestamp("2026-08-02"),
            pd.Timestamp("2026-08-03"),
            pd.Timestamp("2026-08-04"),
        ]
        self.assertListEqual(list(df["ds"]), expected_timestamps)


if __name__ == "__main__":
    unittest.main()
