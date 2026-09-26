import unittest
from datetime import date
from pydantic import ValidationError

from src.models import (
    CamelModel,
    DailySalesPoint,
    SkuSeries,
    TimeSeriesPayload,
    DailyForecast,
    SkuForecastResult,
    ForecastResponse,
)


class TestModels(unittest.TestCase):
    def test_parse_camel_case_request_payload_from_api_spec(self):
        """Test parsing request payload matching api-specification.md Section 11.1 exactly."""
        payload_data = {
            "horizonDays": 14,
            "series": [
                {
                    "skuId": 12,
                    "history": [
                        {"date": "2026-08-01", "quantity": 10.0},
                        {"date": "2026-08-02", "quantity": 0.0},
                        {"date": "2026-08-31", "quantity": 15.0},
                    ],
                }
            ],
        }

        payload = TimeSeriesPayload.model_validate(payload_data)

        self.assertEqual(payload.horizon_days, 14)
        self.assertEqual(len(payload.series), 1)
        sku_series = payload.series[0]
        self.assertEqual(sku_series.sku_id, 12)
        self.assertEqual(len(sku_series.history), 3)
        self.assertEqual(sku_series.history[0].date, date(2026, 8, 1))
        self.assertEqual(sku_series.history[0].quantity, 10.0)
        self.assertEqual(sku_series.history[1].quantity, 0.0)

    def test_snake_case_instantiation(self):
        """Test instantiating models using Pythonic snake_case arguments."""
        point = DailySalesPoint(date=date(2026, 9, 1), quantity=5.5)
        series = SkuSeries(sku_id=1, history=[point])
        payload = TimeSeriesPayload(horizon_days=21, series=[series])

        self.assertEqual(payload.horizon_days, 21)
        self.assertEqual(payload.series[0].sku_id, 1)
        self.assertEqual(payload.series[0].history[0].quantity, 5.5)

    def test_default_horizon_days(self):
        """Test default horizon_days is 14 if omitted."""
        payload_data = {
            "series": [
                {
                    "skuId": 5,
                    "history": [{"date": "2026-09-01", "quantity": 2.0}],
                }
            ]
        }
        payload = TimeSeriesPayload.model_validate(payload_data)
        self.assertEqual(payload.horizon_days, 14)

    def test_horizon_days_bounds_validation(self):
        """Test horizon_days must be between 7 and 30."""
        valid_series = [
            {"skuId": 1, "history": [{"date": "2026-09-01", "quantity": 1.0}]}
        ]

        # Valid edge cases
        payload_7 = TimeSeriesPayload.model_validate(
            {"horizonDays": 7, "series": valid_series}
        )
        self.assertEqual(payload_7.horizon_days, 7)

        payload_30 = TimeSeriesPayload.model_validate(
            {"horizonDays": 30, "series": valid_series}
        )
        self.assertEqual(payload_30.horizon_days, 30)

        # Invalid: < 7
        with self.assertRaises(ValidationError):
            TimeSeriesPayload.model_validate(
                {"horizonDays": 6, "series": valid_series}
            )

        # Invalid: > 30
        with self.assertRaises(ValidationError):
            TimeSeriesPayload.model_validate(
                {"horizonDays": 31, "series": valid_series}
            )

    def test_quantity_non_negative_validation(self):
        """Test sales quantity cannot be negative."""
        with self.assertRaises(ValidationError):
            DailySalesPoint(date=date(2026, 9, 1), quantity=-0.01)

    def test_sku_id_positive_validation(self):
        """Test sku_id must be strictly positive (> 0)."""
        valid_point = DailySalesPoint(date=date(2026, 9, 1), quantity=1.0)

        with self.assertRaises(ValidationError):
            SkuSeries(sku_id=0, history=[valid_point])

        with self.assertRaises(ValidationError):
            SkuSeries(sku_id=-10, history=[valid_point])

    def test_empty_series_and_history_validation(self):
        """Test series and history arrays cannot be empty."""
        with self.assertRaises(ValidationError):
            SkuSeries(sku_id=1, history=[])

        with self.assertRaises(ValidationError):
            TimeSeriesPayload(horizon_days=14, series=[])

    def test_daily_forecast_ci_validation(self):
        """Test DailyForecast requires upper >= lower and non-negative bounds."""
        # Valid
        df = DailyForecast(
            date=date(2026, 9, 1),
            predicted=12.0,
            lower=10.0,
            upper=14.0,
        )
        self.assertEqual(df.predicted, 12.0)
        self.assertEqual(df.lower, 10.0)
        self.assertEqual(df.upper, 14.0)

        # Upper < Lower raises ValidationError
        with self.assertRaises(ValidationError):
            DailyForecast(
                date=date(2026, 9, 1),
                predicted=12.0,
                lower=15.0,
                upper=10.0,
            )

        # Negative lower raises ValidationError
        with self.assertRaises(ValidationError):
            DailyForecast(
                date=date(2026, 9, 1),
                predicted=5.0,
                lower=-1.0,
                upper=10.0,
            )

        # Negative predicted raises ValidationError
        with self.assertRaises(ValidationError):
            DailyForecast(
                date=date(2026, 9, 1),
                predicted=-1.0,
                lower=0.0,
                upper=5.0,
            )

    def test_sku_forecast_result_non_negative_validation(self):
        """Test daily_average and daily_demand_std must be non-negative."""
        with self.assertRaises(ValidationError):
            SkuForecastResult(
                sku_id=1,
                daily_average=-1.0,
                daily_demand_std=1.0,
                model_used="AutoARIMA",
            )

        with self.assertRaises(ValidationError):
            SkuForecastResult(
                sku_id=1,
                daily_average=1.0,
                daily_demand_std=-0.5,
                model_used="AutoARIMA",
            )

    def test_forecast_response_serialization_matches_api_spec(self):
        """Test ForecastResponse serializes to camelCase matching api-specification.md Section 11.1."""
        response = ForecastResponse(
            success=True,
            results=[
                SkuForecastResult(
                    sku_id=12,
                    daily_average=11.5,
                    daily_demand_std=2.8,
                    model_used="AutoARIMA",
                    daily_forecasts=[
                        DailyForecast(
                            date=date(2026, 9, 1),
                            predicted=12.0,
                            lower=10.0,
                            upper=14.0,
                        ),
                        DailyForecast(
                            date=date(2026, 9, 2),
                            predicted=11.5,
                            lower=9.5,
                            upper=13.5,
                        ),
                    ],
                )
            ],
        )

        dumped = response.model_dump(by_alias=True, mode="json")

        self.assertTrue(dumped["success"])
        self.assertEqual(len(dumped["results"]), 1)

        result_0 = dumped["results"][0]
        # Check camelCase keys
        self.assertIn("skuId", result_0)
        self.assertIn("dailyAverage", result_0)
        self.assertIn("dailyDemandStd", result_0)
        self.assertIn("modelUsed", result_0)
        self.assertIn("dailyForecasts", result_0)

        self.assertEqual(result_0["skuId"], 12)
        self.assertEqual(result_0["dailyAverage"], 11.5)
        self.assertEqual(result_0["dailyDemandStd"], 2.8)
        self.assertEqual(result_0["modelUsed"], "AutoARIMA")

        forecast_0 = result_0["dailyForecasts"][0]
        self.assertEqual(forecast_0["date"], "2026-09-01")
        self.assertEqual(forecast_0["predicted"], 12.0)
        self.assertEqual(forecast_0["lower"], 10.0)
        self.assertEqual(forecast_0["upper"], 14.0)


if __name__ == "__main__":
    unittest.main()
