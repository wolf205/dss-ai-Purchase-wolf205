import unittest
from datetime import date, timedelta
from fastapi.testclient import TestClient

from src.main import app


class TestForecastApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        """Kiểm tra GET /api/v1/health theo đúng api-specification.md Mục 11.2."""
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["service"], "retail-dss-forecasting")

    def test_forecast_single_sku_short_series_sma(self):
        """SKU chuỗi ngắn (< 30 ngày) được dự báo bằng SMA 7 ngày cho 14 ngày tới."""
        base_date = date(2026, 8, 1)
        history = [
            {"date": (base_date + timedelta(days=i)).isoformat(), "quantity": 10.0 + (i % 2)}
            for i in range(14)
        ]
        payload = {
            "horizonDays": 14,
            "series": [
                {
                    "skuId": 101,
                    "history": history,
                }
            ],
        }

        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["results"]), 1)

        sku_result = data["results"][0]
        self.assertEqual(sku_result["skuId"], 101)
        self.assertEqual(sku_result["modelUsed"], "SMA")
        self.assertGreater(sku_result["dailyAverage"], 0.0)
        self.assertGreaterEqual(sku_result["dailyDemandStd"], 0.0)

        forecasts = sku_result["dailyForecasts"]
        self.assertEqual(len(forecasts), 14)

        # Kiểm tra tính liên tục của ngày tương lai
        last_hist_date = base_date + timedelta(days=13)
        first_fcst_date = date.fromisoformat(forecasts[0]["date"])
        self.assertEqual(first_fcst_date, last_hist_date + timedelta(days=1))

        # Kiểm tra khoảng tin cậy CI 95%
        for item in forecasts:
            self.assertGreaterEqual(item["predicted"], 0.0)
            self.assertGreaterEqual(item["lower"], 0.0)
            self.assertGreaterEqual(item["upper"], item["lower"])

    def test_forecast_intermittent_series_croston(self):
        """SKU nhu cầu ngắt quãng (>30 ngày, nhiều ngày 0) được dự báo bằng Croston."""
        base_date = date(2026, 7, 1)
        history = [
            {
                "date": (base_date + timedelta(days=i)).isoformat(),
                "quantity": 15.0 if i % 4 == 0 else 0.0,
            }
            for i in range(36)
        ]
        payload = {
            "horizonDays": 14,
            "series": [
                {
                    "skuId": 102,
                    "history": history,
                }
            ],
        }

        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        sku_result = data["results"][0]

        self.assertEqual(sku_result["skuId"], 102)
        self.assertIn(sku_result["modelUsed"], ["Croston", "TSB"])
        self.assertGreater(sku_result["dailyAverage"], 0.0)
        self.assertEqual(len(sku_result["dailyForecasts"]), 14)

        for fc in sku_result["dailyForecasts"]:
            self.assertGreaterEqual(fc["predicted"], 0.0)
            self.assertGreaterEqual(fc["lower"], 0.0)
            self.assertGreaterEqual(fc["upper"], fc["lower"])

    def test_forecast_stable_series_auto_arima(self):
        """SKU nhu cầu đều, ổn định (>30 ngày, CV <= 0.5) được dự báo bằng AutoARIMA."""
        base_date = date(2026, 7, 1)
        # Nhu cầu dao động đều quanh 25
        history = [
            {
                "date": (base_date + timedelta(days=i)).isoformat(),
                "quantity": 25.0 + (i % 3),
            }
            for i in range(35)
        ]
        payload = {
            "horizonDays": 14,
            "series": [
                {
                    "skuId": 103,
                    "history": history,
                }
            ],
        }

        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        sku_result = data["results"][0]

        self.assertEqual(sku_result["skuId"], 103)
        self.assertIn(sku_result["modelUsed"], ["AutoARIMA", "HoltWinters"])
        self.assertGreater(sku_result["dailyAverage"], 0.0)
        self.assertEqual(len(sku_result["dailyForecasts"]), 14)

        for fc in sku_result["dailyForecasts"]:
            self.assertGreaterEqual(fc["predicted"], 0.0)
            self.assertGreaterEqual(fc["lower"], 0.0)
            self.assertGreaterEqual(fc["upper"], fc["lower"])

    def test_forecast_multiple_skus_mixed(self):
        """Gửi đồng thời batch nhiều SKU với các mẫu hình khác nhau trong một request."""
        base_date = date(2026, 7, 1)
        sku1_history = [
            {"date": (base_date + timedelta(days=i)).isoformat(), "quantity": 5.0}
            for i in range(10)  # chuỗi ngắn -> SMA
        ]
        sku2_history = [
            {"date": (base_date + timedelta(days=i)).isoformat(), "quantity": 20.0 if i % 5 == 0 else 0.0}
            for i in range(35)  # ngắt quãng -> Croston
        ]
        sku3_history = [
            {"date": (base_date + timedelta(days=i)).isoformat(), "quantity": 30.0 + (i % 2)}
            for i in range(35)  # đều -> AutoARIMA
        ]

        payload = {
            "horizonDays": 7,
            "series": [
                {"skuId": 1, "history": sku1_history},
                {"skuId": 2, "history": sku2_history},
                {"skuId": 3, "history": sku3_history},
            ],
        }

        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["results"]), 3)

        results_by_id = {r["skuId"]: r for r in data["results"]}
        self.assertEqual(results_by_id[1]["modelUsed"], "SMA")
        self.assertIn(results_by_id[2]["modelUsed"], ["Croston", "TSB"])
        self.assertIn(results_by_id[3]["modelUsed"], ["AutoARIMA", "HoltWinters"])

        # Mỗi SKU có đúng 7 ngày dự báo theo horizonDays=7
        for sid in [1, 2, 3]:
            self.assertEqual(len(results_by_id[sid]["dailyForecasts"]), 7)

    def test_forecast_all_zeros_sku(self):
        """SKU không bán được đơn nào (35 ngày liên tục 0.0) vẫn xử lý an toàn không văng lỗi."""
        base_date = date(2026, 7, 1)
        history = [
            {"date": (base_date + timedelta(days=i)).isoformat(), "quantity": 0.0}
            for i in range(35)
        ]
        payload = {
            "horizonDays": 14,
            "series": [{"skuId": 999, "history": history}],
        }

        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        sku_result = data["results"][0]
        self.assertEqual(sku_result["skuId"], 999)
        self.assertEqual(sku_result["dailyAverage"], 0.0)

    def test_forecast_validation_error_horizon_too_short(self):
        """horizonDays < 7 trả về 422 Unprocessable Entity."""
        payload = {
            "horizonDays": 5,
            "series": [
                {"skuId": 1, "history": [{"date": "2026-08-01", "quantity": 10.0}]}
            ],
        }
        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_forecast_validation_error_horizon_too_long(self):
        """horizonDays > 30 trả về 422 Unprocessable Entity."""
        payload = {
            "horizonDays": 45,
            "series": [
                {"skuId": 1, "history": [{"date": "2026-08-01", "quantity": 10.0}]}
            ],
        }
        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_forecast_validation_error_empty_series(self):
        """series rỗng trả về 422 Unprocessable Entity."""
        payload = {
            "horizonDays": 14,
            "series": [],
        }
        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_forecast_validation_error_empty_history(self):
        """history rỗng cho 1 SKU trả về 422 Unprocessable Entity."""
        payload = {
            "horizonDays": 14,
            "series": [{"skuId": 1, "history": []}],
        }
        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_forecast_validation_error_negative_quantity(self):
        """quantity < 0 trả về 422 Unprocessable Entity."""
        payload = {
            "horizonDays": 14,
            "series": [{"skuId": 1, "history": [{"date": "2026-08-01", "quantity": -5.0}]}],
        }
        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 422)

    def test_forecast_single_day_history_window_one(self):
        """SKU chỉ có 1 ngày dữ liệu (window=1) vẫn tính toán an toàn với std = metrics.std."""
        payload = {
            "horizonDays": 7,
            "series": [{"skuId": 88, "history": [{"date": "2026-08-01", "quantity": 12.0}]}],
        }
        response = self.client.post("/api/v1/forecast", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        res = data["results"][0]
        self.assertEqual(res["skuId"], 88)
        self.assertEqual(res["modelUsed"], "SMA")
        self.assertEqual(res["dailyAverage"], 12.0)
        self.assertEqual(len(res["dailyForecasts"]), 7)

    def test_forecast_graceful_fallback_intermittent(self):
        """Khi mô hình ngắt quãng ném ngoại lệ bất ngờ, hệ thống tự động fallback sang SMA."""
        from unittest.mock import patch
        from src.services.forecaster import run_forecast_for_sku
        from src.models.request import SkuSeries, DailySalesPoint

        series = SkuSeries(
            sku_id=99,
            history=[
                DailySalesPoint(date=date(2026, 7, 1) + timedelta(days=i), quantity=10.0 if i % 4 == 0 else 0.0)
                for i in range(35)
            ],
        )

        with patch("src.services.forecaster._forecast_intermittent", side_effect=RuntimeError("StatsForecast boom")):
            result = run_forecast_for_sku(series, horizon_days=14)
            self.assertEqual(result.sku_id, 99)
            self.assertEqual(result.model_used, "SMA")
            self.assertEqual(len(result.daily_forecasts), 14)

    def test_forecast_graceful_fallback_continuous(self):
        """Khi mô hình liên tục (AutoARIMA) ném ngoại lệ bất ngờ, hệ thống tự động fallback sang SMA."""
        from unittest.mock import patch
        from src.services.forecaster import run_forecast_for_sku
        from src.models.request import SkuSeries, DailySalesPoint

        series = SkuSeries(
            sku_id=77,
            history=[
                DailySalesPoint(date=date(2026, 7, 1) + timedelta(days=i), quantity=20.0 + (i % 2))
                for i in range(35)
            ],
        )

        with patch("src.services.forecaster._forecast_continuous", side_effect=RuntimeError("ARIMA singular matrix")):
            result = run_forecast_for_sku(series, horizon_days=14)
            self.assertEqual(result.sku_id, 77)
            self.assertEqual(result.model_used, "SMA")
            self.assertEqual(len(result.daily_forecasts), 14)


    def test_forecast_endpoint_internal_server_error_500(self):
        """Khi có ngoại lệ không lường trước trong router, trả về 500 kèm thông điệp chuẩn."""
        from unittest.mock import patch

        payload = {
            "horizonDays": 14,
            "series": [{"skuId": 1, "history": [{"date": "2026-08-01", "quantity": 10.0}]}],
        }
        with patch("src.api.v1.forecast.run_forecast", side_effect=RuntimeError("Compute engine crash")):
            response = self.client.post("/api/v1/forecast", json=payload)
            self.assertEqual(response.status_code, 500)
            self.assertIn("Forecast error: Compute engine crash", response.json()["detail"])

    def test_forecast_endpoint_value_error_422(self):
        """Khi service ném ValueError nghiệp vụ, router chuyển thành 422."""
        from unittest.mock import patch

        payload = {
            "horizonDays": 14,
            "series": [{"skuId": 1, "history": [{"date": "2026-08-01", "quantity": 10.0}]}],
        }
        with patch("src.api.v1.forecast.run_forecast", side_effect=ValueError("Invalid SKU configuration")):
            response = self.client.post("/api/v1/forecast", json=payload)
            self.assertEqual(response.status_code, 422)
            self.assertEqual(response.json()["detail"], "Invalid SKU configuration")

    def test_run_forecast_for_sku_empty_history(self):
        """run_forecast_for_sku ném ValueError nếu history rỗng."""
        from src.services.forecaster import run_forecast_for_sku
        from unittest.mock import MagicMock

        mock_series = MagicMock()
        mock_series.sku_id = 123
        mock_series.history = []

        with self.assertRaises(ValueError) as ctx:
            run_forecast_for_sku(mock_series, horizon_days=14)
        self.assertIn("has empty sales history", str(ctx.exception))

