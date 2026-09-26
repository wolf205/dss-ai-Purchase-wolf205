import math
import unittest
from datetime import date, timedelta

from src.models.request import DailySalesPoint
from src.services.selector import (
    ForecastModel,
    SeriesMetrics,
    AlgorithmSelectionResult,
    calculate_series_metrics,
    select_algorithm_with_metrics,
    select_algorithm,
)


class TestAlgorithmSelector(unittest.TestCase):
    def test_empty_series_raises_error(self):
        """Chuỗi rỗng kích hoạt ValueError."""
        with self.assertRaises(ValueError) as ctx:
            calculate_series_metrics([])
        self.assertIn("Time series history cannot be empty", str(ctx.exception))

        with self.assertRaises(ValueError):
            select_algorithm([])

        with self.assertRaises(ValueError):
            select_algorithm_with_metrics([])

    def test_short_series_selects_sma(self):
        """Chuỗi có chiều dài < 30 ngày luôn chọn Simple Moving Average (SMA)."""
        short_lengths = [1, 7, 14, 20, 29]
        for length in short_lengths:
            # Ngay cả khi dữ liệu có CV cao hay ngắt quãng, nếu < 30 ngày đều fallback về SMA
            history = [10.0 if i % 2 == 0 else 0.0 for i in range(length)]
            result = select_algorithm_with_metrics(history)
            self.assertEqual(result.model, ForecastModel.SMA)
            self.assertTrue(result.metrics.is_short_series)
            self.assertIn("Chuỗi dữ liệu ngắn", result.reason)
            self.assertEqual(select_algorithm(history), "SMA")

    def test_boundary_30_days(self):
        """Tại mốc 30 ngày (boundary), hệ thống không còn phân loại là chuỗi ngắn."""
        history_30 = [10.0] * 30
        metrics = calculate_series_metrics(history_30)
        self.assertEqual(metrics.length, 30)
        self.assertFalse(metrics.is_short_series)

        # Với chuỗi 30 ngày hằng số, CV = 0.0 <= 0.5 -> AutoARIMA
        model = select_algorithm(history_30)
        self.assertEqual(model, "AutoARIMA")

    def test_constant_series(self):
        """Chuỗi hằng số (variance=0, CV=0.0) phân loại là nhu cầu đều -> AutoARIMA."""
        history = [15.0] * 35
        metrics = calculate_series_metrics(history)
        self.assertEqual(metrics.mean, 15.0)
        self.assertEqual(metrics.std, 0.0)
        self.assertEqual(metrics.cv, 0.0)
        self.assertEqual(metrics.non_zero_ratio, 1.0)
        self.assertFalse(metrics.is_intermittent)

        result = select_algorithm_with_metrics(history)
        self.assertEqual(result.model, ForecastModel.AUTO_ARIMA)
        self.assertIn("biến động thấp", result.reason)

    def test_stable_demand_low_cv(self):
        """Chuỗi đều, biến động thấp (CV <= 0.5, non_zero_ratio >= 70%, N >= 30) chọn AutoARIMA."""
        # Dao động nhỏ quanh 20: [19, 21, 20, 20, 19, 21, ...]
        history = [20.0 + (1.0 if i % 2 == 0 else -1.0) for i in range(40)]
        metrics = calculate_series_metrics(history)
        self.assertEqual(metrics.mean, 20.0)
        self.assertEqual(metrics.std, 1.0)
        self.assertEqual(metrics.cv, 0.05)  # 1.0 / 20.0 = 0.05 <= 0.5
        self.assertEqual(metrics.non_zero_ratio, 1.0)
        self.assertFalse(metrics.is_intermittent)

        result = select_algorithm_with_metrics(history)
        self.assertEqual(result.model, ForecastModel.AUTO_ARIMA)
        self.assertEqual(select_algorithm(history), "AutoARIMA")

    def test_stable_demand_preferred_holt_winters(self):
        """Tùy chọn mô hình ưu tiên Holt-Winters cho chuỗi ổn định."""
        history = [20.0 + (1.0 if i % 2 == 0 else -1.0) for i in range(40)]
        result = select_algorithm_with_metrics(
            history,
            preferred_stable=ForecastModel.HOLT_WINTERS,
        )
        self.assertEqual(result.model, ForecastModel.HOLT_WINTERS)
        self.assertEqual(
            select_algorithm(history, preferred_stable=ForecastModel.HOLT_WINTERS),
            "HoltWinters",
        )

    def test_intermittent_high_cv(self):
        """Chuỗi có CV > 1.0 (nhu cầu biến động cực lớn, có đột biến) chọn Croston."""
        # 30 ngày: 29 ngày bán 1 đơn vị, 1 ngày đột biến 100 đơn vị
        history = [1.0] * 34 + [100.0]
        metrics = calculate_series_metrics(history)
        self.assertGreater(metrics.cv, 1.0)
        self.assertTrue(metrics.is_intermittent)

        result = select_algorithm_with_metrics(history)
        self.assertEqual(result.model, ForecastModel.CROSTON)
        self.assertIn("Nhu cầu ngắt quãng", result.reason)
        self.assertEqual(select_algorithm(history), "Croston")

    def test_intermittent_low_non_zero_ratio(self):
        """Chuỗi có non_zero_ratio < 70% (nhiều ngày không bán) chọn Croston."""
        # 35 ngày: 15 ngày bán 10 đơn vị, 20 ngày bán 0 đơn vị -> non_zero_ratio = 15/35 = 42.8% < 70%
        history = [10.0 if i < 15 else 0.0 for i in range(35)]
        metrics = calculate_series_metrics(history)
        self.assertLess(metrics.non_zero_ratio, 0.7)
        self.assertTrue(metrics.is_intermittent)

        result = select_algorithm_with_metrics(history)
        self.assertEqual(result.model, ForecastModel.CROSTON)
        self.assertEqual(select_algorithm(history), "Croston")

    def test_intermittent_preferred_tsb(self):
        """Tùy chọn mô hình ưu tiên TSB cho nhu cầu ngắt quãng."""
        history = [10.0 if i < 15 else 0.0 for i in range(35)]
        result = select_algorithm_with_metrics(
            history,
            preferred_intermittent=ForecastModel.TSB,
        )
        self.assertEqual(result.model, ForecastModel.TSB)
        self.assertEqual(
            select_algorithm(history, preferred_intermittent=ForecastModel.TSB),
            "TSB",
        )

    def test_all_zeros_series(self):
        """Chuỗi toàn số 0 không bị lỗi ZeroDivisionError và chọn Croston."""
        history = [0.0] * 35
        metrics = calculate_series_metrics(history)
        self.assertEqual(metrics.mean, 0.0)
        self.assertEqual(metrics.std, 0.0)
        self.assertEqual(metrics.cv, 0.0)
        self.assertEqual(metrics.non_zero_ratio, 0.0)
        self.assertTrue(metrics.is_intermittent)

        result = select_algorithm_with_metrics(history)
        self.assertEqual(result.model, ForecastModel.CROSTON)
        self.assertEqual(select_algorithm(history), "Croston")

    def test_moderate_demand(self):
        """Chuỗi có biến động trung bình (0.5 < CV <= 1.0 và non_zero_ratio >= 70%) chọn AutoARIMA."""
        # Thiết kế chuỗi sao cho 0.5 < CV <= 1.0 và non_zero >= 70%
        # Ví dụ: 30 ngày bán, trong đó 25 ngày bán (83% >= 70%), các giá trị:
        # [2, 10, 2, 10, ...]
        history = [2.0 if i % 2 == 0 else 10.0 for i in range(30)]
        metrics = calculate_series_metrics(history)
        # mean = 6.0, std = 4.0, cv = 4.0 / 6.0 = 0.6667
        self.assertAlmostEqual(metrics.mean, 6.0, places=4)
        self.assertAlmostEqual(metrics.std, 4.0, places=4)
        self.assertAlmostEqual(metrics.cv, 4.0 / 6.0, places=4)
        self.assertGreater(metrics.cv, 0.5)
        self.assertLessEqual(metrics.cv, 1.0)
        self.assertEqual(metrics.non_zero_ratio, 1.0)
        self.assertFalse(metrics.is_intermittent)

        result = select_algorithm_with_metrics(history)
        self.assertEqual(result.model, ForecastModel.AUTO_ARIMA)
        self.assertIn("Nhu cầu ổn định mức trung bình", result.reason)
        self.assertEqual(select_algorithm(history), "AutoARIMA")

    def test_with_daily_sales_point_objects(self):
        """Hỗ trợ trực tiếp danh sách đối tượng DailySalesPoint."""
        base_date = date(2026, 8, 1)
        history_points = [
            DailySalesPoint(date=base_date + timedelta(days=i), quantity=20.0)
            for i in range(35)
        ]
        result = select_algorithm_with_metrics(history_points)
        self.assertEqual(result.model, ForecastModel.AUTO_ARIMA)
        self.assertEqual(result.metrics.length, 35)
        self.assertEqual(result.metrics.mean, 20.0)

    def test_metrics_accuracy(self):
        """Kiểm tra độ chính xác số học của các công thức thống kê."""
        values = [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]
        # n = 8, sum = 40, mean = 5.0
        # deviations: [-3, -1, -1, -1, 0, 0, 2, 4]
        # sq deviations: [9, 1, 1, 1, 0, 0, 4, 16] -> sum = 32
        # variance = 32 / 8 = 4.0 -> std = 2.0
        # cv = 2.0 / 5.0 = 0.4
        # non_zero_ratio = 8 / 8 = 1.0
        metrics = calculate_series_metrics(values)
        self.assertEqual(metrics.length, 8)
        self.assertEqual(metrics.mean, 5.0)
        self.assertEqual(metrics.std, 2.0)
        self.assertEqual(metrics.cv, 0.4)
        self.assertEqual(metrics.non_zero_ratio, 1.0)
        self.assertTrue(metrics.is_short_series)  # 8 < 30
