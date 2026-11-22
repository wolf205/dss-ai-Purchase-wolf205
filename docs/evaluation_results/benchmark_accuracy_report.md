# Báo Cáo Đánh Giá Độ Chính Xác Mô Hình Dự Báo Nhu Cầu (Forecast Accuracy Benchmark Report)

**Dự án:** Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Bán Lẻ (DSS AI-Purchase)  
**Tập dữ liệu kiểm định:** Chuỗi bán hàng thực tế **Walmart M5 Benchmark (Siêu thị CA_1)**  
**Phạm vi:** 25 SKU đại diện thuộc 5 ngành hàng FMCG, 90 ngày huấn luyện Baseline và 28 ngày Backtesting (4 đợt tuần liên tiếp).

---

## 1. Kết Quả Tổng Hợp So Sánh Thuật Toán

So sánh giữa **DSS Hybrid Ensemble** (tổ hợp `MSTL` + `AutoETS` + `DynamicOptimizedTheta` + `HoltWinters` + `CrostonSBA` kết hợp **Global Cross-SKU Regressor**, **MAD Winsorization** và **Day-of-Week Shrinkage**) với từng mô hình đơn lẻ và Baseline trung bình trượt SMA:

| Thuật toán | WAPE (%) | MAPE (%) | MAE | RMSE | Forecast Bias (%) | Nhận xét chuẩn bán lẻ |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **DSS Hybrid Ensemble (Hệ thống)** | **30.12%** | **43.24%** | **3.30** | **5.83** | **-2.01%** | **Tốt nhất toàn hệ thống — Giảm mạnh sai số so với mô hình đơn lẻ** |
| MSTL (Season-Trend LOESS) | 30.90% | 44.64% | 3.39 | 5.99 | -1.44% | Phân rã mùa vụ tuần mượt mà, mạnh trên chuỗi biến động |
| AutoETS | 31.03% | 45.70% | 3.40 | 5.95 | -0.34% | Tối ưu cho chuỗi đều có chu kỳ tuần |
| Holt-Winters ETS | 31.08% | 46.28% | 3.41 | 5.92 | +0.53% | Nhạy với tính chu kỳ tuần nhưng dễ dao động khi có đột biến |
| AutoARIMA | 33.75% | 45.93% | 3.70 | 6.57 | -0.37% | Tốt trên chuỗi đều, kém trên chuỗi ngắt quãng & biến động mạnh |
| Croston Classic | 38.39% | 52.73% | 4.21 | 7.44 | +1.87% | Thiết kế cho sản phẩm bán ngắt quãng (không có mùa vụ tuần) |
| TSB | 38.18% | 50.38% | 4.19 | 7.44 | +1.85% | Ổn định trên hàng tiêu thụ chậm có xu hướng giảm |
| SMA (7-day Baseline) | 37.74% | 49.78% | 4.14 | 7.47 | -3.06% | Bị trễ pha so với biến động thực tế (Baseline) |

> **Kết luận khoa học:** Kiến trúc **DSS Hybrid Ensemble** đạt WAPE **30.12%** (MAE **3.30**, Bias **-2.01%**), giúp giảm sai số WAPE **7.62%** so với phương pháp thủ công SMA (37.74%), giảm **3.63%** so với AutoARIMA đơn lẻ (33.75%), và vượt trội toàn bộ các mô hình đơn lẻ khác trên tập kiểm định.

---

## 2. Phân Tích Độ Chính Xác Theo Nhóm Đặc Tính Nhu Cầu

| Phân nhóm nhu cầu | Số lượng SKU | Tổ hợp mô hình áp dụng | WAPE DSS (%) | WAPE SMA (%) | Mức cải thiện sai số |
|---|:---:|---|:---:|:---:|:---:|
| **STABLE_HIGH (Nhóm AX)** | 6 | Hybrid (`AutoETS` + `MSTL` + `HoltWinters` + `Global Cross-SKU`) | 25.26% | 31.73% | Giảm 6.47% |
| **VARIABLE_MODERATE (Nhóm AY/BY)** | 7 | Hybrid (`MSTL` + `AutoETS` + `DOT` + `Global Cross-SKU`) | 38.46% | 46.44% | Giảm 7.98% |
| **INTERMITTENT (Nhóm BZ/CZ)** | 12 | Hybrid (`CrostonSBA+DoW` / `MSTL` + `DOT` + `Global Cross-SKU`) | 31.62% | 41.19% | Giảm 9.57% |

---

## 3. Danh Mục Biểu Đồ Minh Họa (Sử Dụng Cho Đồ Án Tốt Nghiệp)

1. **Biểu đồ so sánh sai số WAPE tổng quan:** `docs/evaluation_results/model_comparison_wape.png`
2. **Biểu đồ sai số theo nhóm hành vi nhu cầu:** `docs/evaluation_results/wape_by_demand_group.png`
3. **Biểu đồ minh họa chuỗi dự báo theo ngày cho 3 SKU đại diện:** `docs/evaluation_results/sample_skus_forecast.png`
4. **Tệp số liệu chi tiết từng SKU:** `docs/evaluation_results/sku_accuracy_metrics.csv`
