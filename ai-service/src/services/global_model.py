from datetime import date, timedelta
import math
from typing import Dict, List, Optional, Tuple
import numpy as np

from src.models.request import DailySalesPoint


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
                # Shrinkage nhẹ về store_factors
                blended = 0.65 * raw + 0.35 * store_factors[w]
                cf[w] = max(0.5, min(1.8, blended))
            else:
                cf[w] = store_factors[w]
        cat_factors[cat] = cf

    return store_factors, cat_factors


def _build_feature_row(
    hist: List[float],
    t: int,
    target_date: date,
    sku_mean: float,
    cat_dow_factor: float = 1.0,
) -> List[float]:
    """
    Trích xuất vector đặc trưng chuẩn hóa theo quy mô SKU tại bước thời gian t.
    """
    l1 = hist[t - 1] / sku_mean
    l7 = hist[t - 7] / sku_mean
    l14 = hist[t - 14] / sku_mean
    l28 = hist[t - 28] / sku_mean
    rm7 = sum(hist[t - 7 : t]) / (7.0 * sku_mean)
    rm28 = sum(hist[t - 28 : t]) / (28.0 * sku_mean)
    rm_dow = (hist[t - 7] + hist[t - 14] + hist[t - 21] + hist[t - 28]) / (4.0 * sku_mean)

    dow = [1.0 if target_date.weekday() == k else 0.0 for k in range(7)]
    dom_sin = math.sin(2.0 * math.pi * target_date.day / 30.4)
    dom_cos = math.cos(2.0 * math.pi * target_date.day / 30.4)
    is_payday = 1.0 if (target_date.day <= 5 or target_date.day >= 25) else 0.0

    return [
        1.0,
        rm7,
        rm28,
        rm_dow,
        l1,
        l7,
        l14,
        l28,
        is_payday,
        dom_sin,
        dom_cos,
        cat_dow_factor,
    ] + dow


def fit_and_predict_global_cross_sku(
    padded_by_sku: Dict[int, List[DailySalesPoint]],
    horizon_days: int,
    category_by_sku: Optional[Dict[int, Optional[str]]] = None,
) -> Dict[int, List[float]]:
    """
    Mô hình Global Cross-SKU Ridge với Huber damping nhẹ & hiệu chuẩn thiên kiến (Bias Calibration).
    Học đồng thời trên toàn bộ SKU trong lô để chia sẻ quy luật trễ (lags),
    ngày trong tuần, chu kỳ đầu/cuối tháng (payday) và mùa vụ ngành hàng.
    Chỉ kích hoạt khi có >= 3 SKU đủ lịch sử (>= 35 ngày).
    """
    eligible_skus = [
        sku_id
        for sku_id, series in padded_by_sku.items()
        if len(series) >= 35 and sum(float(p.quantity) for p in series) > 0.0
    ]
    if len(eligible_skus) < 3:
        return {}

    store_factors, cat_factors = compute_pooled_dow_factors(padded_by_sku, category_by_sku)

    X_rows: List[List[float]] = []
    y_rows: List[float] = []
    sample_weights: List[float] = []
    sku_anchors: Dict[int, Tuple[List[float], date, float, List[float]]] = {}

    for sku_id in eligible_skus:
        series = padded_by_sku[sku_id]
        vals = [float(p.quantity) for p in series]
        n = len(vals)
        recent_slice = vals[-42:] if n >= 42 else vals
        sku_mean = max(0.05, sum(recent_slice) / len(recent_slice))

        cat = category_by_sku.get(sku_id) if category_by_sku else None
        dow_vec = cat_factors.get(cat, store_factors) if cat else store_factors
        sku_anchors[sku_id] = (vals, series[-1].date, sku_mean, dow_vec)

        for t in range(28, n):
            d = series[t].date
            feat = _build_feature_row(vals, t, d, sku_mean, dow_vec[d.weekday()])
            X_rows.append(feat)
            y_rows.append(vals[t] / sku_mean)

            recency_w = 0.7 + 0.3 * (t / n)
            vol_w = min(3.0, math.sqrt(sku_mean))
            sample_weights.append(recency_w * vol_w)

    if len(X_rows) < 30:
        return {}

    X = np.asarray(X_rows, dtype=float)
    y = np.asarray(y_rows, dtype=float)
    base_w = np.asarray(sample_weights, dtype=float)

    n_features = X.shape[1]
    lam = 40.0
    reg = lam * np.eye(n_features, dtype=float)
    reg[0, 0] = 0.0

    w_ir = base_w.copy()
    coef = np.zeros(n_features, dtype=float)
    for _ in range(3):
        Xw = (X * w_ir[:, None]).T
        coef = np.linalg.solve(Xw @ X + reg, Xw @ y)
        resid = np.abs(y - X @ coef)
        huber = np.where(resid <= 0.8, 1.0, 0.8 / np.maximum(0.8, resid))
        w_ir = base_w * huber

    # Hiệu chuẩn thiên kiến trên tập train (giữ Bias tổng thể gần 0%)
    train_preds = np.maximum(0.0, X @ coef)
    pred_mean = float(np.average(train_preds, weights=base_w))
    true_mean = float(np.average(y, weights=base_w))
    calib = min(1.06, max(0.97, true_mean / pred_mean)) if pred_mean > 1e-6 else 1.0

    predictions: Dict[int, List[float]] = {}
    for sku_id, (vals, last_date, sku_mean, dow_vec) in sku_anchors.items():
        hist = list(vals)
        sku_preds: List[float] = []
        for step in range(1, horizon_days + 1):
            fut_date = last_date + timedelta(days=step)
            t = len(hist)
            feat = np.asarray(
                _build_feature_row(hist, t, fut_date, sku_mean, dow_vec[fut_date.weekday()]),
                dtype=float,
            )
            yhat = max(0.0, float(feat @ coef) * calib * sku_mean)
            sku_preds.append(yhat)
            hist.append(yhat)
        predictions[sku_id] = sku_preds

    return predictions
