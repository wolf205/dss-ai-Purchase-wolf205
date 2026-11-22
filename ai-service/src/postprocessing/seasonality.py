from datetime import date
from typing import Dict, List, Optional, Tuple

from src.models.request import DailySalesPoint


def calculate_day_of_week_factors(
    padded_series: List[DailySalesPoint],
    pooled_factors: Optional[List[float]] = None,
) -> List[float]:
    """
    Tính hệ số mùa vụ theo ngày trong tuần (0 = Thứ Hai .. 6 = Chủ Nhật).
    Áp dụng shrinkage theo số tuần quan sát được và có thể mượn thông tin gộp
    của cửa hàng/ngành hàng cho chuỗi ngắn (cold-start).
    """
    n = len(padded_series)
    if n < 7:
        return list(pooled_factors) if pooled_factors else [1.0] * 7

    recent_series = padded_series[-56:] if n > 56 else padded_series
    valid_count = len(recent_series)

    day_sums = [0.0] * 7
    day_counts = [0] * 7
    total_qty = 0.0

    for pt in recent_series:
        w = pt.date.weekday()
        q = float(pt.quantity)
        day_sums[w] += q
        day_counts[w] += 1
        total_qty += q

    overall_mean = total_qty / valid_count if valid_count > 0 else 0.0
    if overall_mean <= 0.0001:
        return [1.0] * 7

    n_weeks = max(1.0, valid_count / 7.0)
    shrink = min(1.0, n_weeks / 6.0)
    prior = pooled_factors if pooled_factors else [1.0] * 7

    factors = [1.0] * 7
    for w in range(7):
        if day_counts[w] > 0:
            day_mean = day_sums[w] / day_counts[w]
            raw_ratio = day_mean / overall_mean
            shrunk_ratio = prior[w] + shrink * (raw_ratio - prior[w])
            factors[w] = max(0.4, min(2.2, shrunk_ratio))
        else:
            factors[w] = prior[w]
    return factors


def compute_pooled_dow_factors(
    padded_by_sku: Dict[int, List[DailySalesPoint]],
    category_by_sku: Optional[Dict[int, Optional[str]]] = None,
) -> Tuple[List[float], Dict[str, List[float]]]:
    """
    Tính hệ số mùa vụ theo ngày trong tuần gộp toàn cửa hàng (store-wide)
    và theo từng ngành hàng (category-level) để hỗ trợ các SKU mới/ít dữ liệu (cold-start).
    """
    store_sums = [0.0] * 7
    store_counts = [0] * 7
    cat_sums: Dict[str, List[float]] = {}
    cat_counts: Dict[str, List[int]] = {}

    for sku_id, series in padded_by_sku.items():
        if len(series) < 14:
            continue
        recent = series[-56:] if len(series) > 56 else series
        vals = [float(p.quantity) for p in recent]
        sku_mean = sum(vals) / len(vals)
        if sku_mean <= 1e-4:
            continue

        cat = category_by_sku.get(sku_id) if category_by_sku else None
        if cat and cat not in cat_sums:
            cat_sums[cat] = [0.0] * 7
            cat_counts[cat] = [0] * 7

        for p in recent:
            w = p.date.weekday()
            norm_q = float(p.quantity) / sku_mean
            store_sums[w] += norm_q
            store_counts[w] += 1
            if cat:
                cat_sums[cat][w] += norm_q
                cat_counts[cat][w] += 1

    store_factors = [1.0] * 7
    for w in range(7):
        if store_counts[w] > 0:
            raw = store_sums[w] / store_counts[w]
            store_factors[w] = max(0.5, min(1.8, raw))

    cat_factors: Dict[str, List[float]] = {}
    for cat, sums in cat_sums.items():
        counts = cat_counts[cat]
        cf = [1.0] * 7
        for w in range(7):
            if counts[w] >= 4:
                raw = sums[w] / counts[w]
                blended = 0.65 * raw + 0.35 * store_factors[w]
                cf[w] = max(0.5, min(1.8, blended))
            else:
                cf[w] = store_factors[w]
        cat_factors[cat] = cf

    return store_factors, cat_factors
