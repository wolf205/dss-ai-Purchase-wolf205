from typing import List

from src.models.response import DailyForecast, SkuForecastResult


def blend_forecasts(
    res_primary: SkuForecastResult,
    res_secondary: SkuForecastResult,
    primary_weight: float = 0.65,
) -> SkuForecastResult:
    """
    Kết hợp trọng số (Ensemble Blending) giữa 2 mô hình nhằm làm mịn phương sai và sai số.
    """
    sec_weight = 1.0 - primary_weight
    blended: List[DailyForecast] = []
    preds: List[float] = []

    for i in range(len(res_primary.daily_forecasts)):
        p1 = res_primary.daily_forecasts[i]
        p2 = res_secondary.daily_forecasts[i]
        pred = round(primary_weight * p1.predicted + sec_weight * p2.predicted, 4)
        preds.append(pred)
        lower = round(primary_weight * p1.lower + sec_weight * p2.lower, 4)
        upper = round(max(lower, primary_weight * p1.upper + sec_weight * p2.upper), 4)
        blended.append(DailyForecast(date=p1.date, predicted=pred, lower=lower, upper=upper))

    daily_avg = round(sum(preds) / len(preds) if preds else res_primary.daily_average, 4)
    return SkuForecastResult(
        sku_id=res_primary.sku_id,
        daily_average=daily_avg,
        daily_demand_std=res_primary.daily_demand_std,
        model_used=res_primary.model_used,
        daily_forecasts=blended,
    )
