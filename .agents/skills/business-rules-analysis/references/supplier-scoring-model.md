# Tham Chiếu: Mô Hình Chấm Điểm & Xếp Hạng Nhà Cung Cấp (Supplier Scoring Model)

Tài liệu này cung cấp cơ sở phương pháp luận cho việc so sánh, đánh giá và xếp hạng đa tiêu chí Nhà cung cấp (Multi-Criteria Supplier Evaluation) trong hệ thống DSS.

---

## 1. Phương Pháp Mô Hình Tổng Trọng Số (Weighted Sum Model - WSM)

Để hỗ trợ nhân viên mua hàng chọn được Nhà cung cấp tối ưu nhất cho từng mặt hàng (hoặc nhóm mặt hàng), hệ thống sử dụng phương pháp **WSM (Weighted Sum Model)** kết hợp chuẩn hóa điểm số:

$$\text{Total Score} = \sum_{i=1}^{n} w_i \times S_i$$

*Trong đó:*
* $w_i$: Trọng số của tiêu chí thứ $i$, với điều kiện $\sum_{i=1}^{n} w_i = 1.0$ (hoặc $100\%$).
* $S_i$: Điểm số đã chuẩn hóa của tiêu chí thứ $i$ trên thang điểm 100 (hoặc thang 0–1).

---

## 2. 4 Tiêu Chí Đánh Giá Cốt Lõi

| Tiêu chí | Bản chất | Đơn vị tính | Ý nghĩa nghiệp vụ | Trọng số khuyến nghị ($w_i$) |
| :--- | :--- | :--- | :--- | :--- |
| **1. Đơn giá (Price)** | Càng thấp càng tốt (Cost) | VNĐ / đơn vị | Tối ưu hóa chi phí mua hàng trực tiếp | **35%** ($w_1 = 0.35$) |
| **2. Thời gian giao hàng (Lead Time)** | Càng thấp càng tốt (Cost) | Ngày | Giảm thời gian chờ, giảm nhu cầu Safety Stock | **25%** ($w_2 = 0.25$) |
| **3. Lịch sử giao hàng (Delivery Reliability)** | Càng cao càng tốt (Benefit) | Tỷ lệ % (0–100%) | Đảm bảo độ tin cậy giao hàng đúng hạn, đủ số lượng | **25%** ($w_3 = 0.25$) |
| **4. Số lượng đặt tối thiểu (MOQ)** | Càng thấp càng tốt (Cost) | Đơn vị SP | Linh hoạt vốn, tránh chôn vốn tồn kho quá nhiều | **15%** ($w_4 = 0.15$) |

*Tổng trọng số:* $0.35 + 0.25 + 0.25 + 0.15 = 1.0$ (100%).

---

## 3. Quy Tắc Chuẩn Hóa Điểm Số (Normalization)

Do các tiêu chí có đơn vị đo khác nhau (VNĐ, Ngày, Số lượng, %), ta phải chuẩn hóa về cùng thang điểm $[0, 100]$.

### A. Đối với Tiêu chí càng thấp càng tốt (Đơn giá, Lead Time, MOQ)
Áp dụng công thức nghịch đảo tương đối giữa các Nhà cung cấp cùng chào bán SKU đó:

$$S_{\text{Cost}} = \frac{\min(X)}{X} \times 100$$

*Trong đó:*
* $\min(X)$: Giá trị tốt nhất (thấp nhất) trong số các NCC chào bán SKU đó.
* $X$: Giá trị thực tế của NCC đang được chấm.
* *Ví dụ:* NCC A chào giá 10.000đ (thấp nhất), NCC B chào 12.500đ.
  * $S_{\text{Price}}(A) = (10.000 / 10.000) \times 100 = 100$ điểm.
  * $S_{\text{Price}}(B) = (10.000 / 12.500) \times 100 = 80$ điểm.

### B. Đối với Tiêu chí càng cao càng tốt (Lịch sử giao hàng - Delivery Reliability)
Được đo lường bằng tỷ lệ giao hàng đạt chuẩn **OTIF (On-Time In-Full)** trong lịch sử nhập hàng (tính trên các đơn PO đã hoàn thành gần nhất):

$$\text{OTIF Rate} = \frac{\text{Số đơn giao Đúng hạn \& Đủ số lượng}}{\text{Tổng số đơn đã giao}} \times 100\%$$

$$S_{\text{Delivery}} = \text{OTIF Rate} \times 100$$

---

## 4. Cơ Chế Xử Lý Ngoại Lệ (Fallback Logic)

### Trường hợp Nhà cung cấp mới (Chưa có lịch sử giao hàng)
* **Vấn đề:** NCC mới ký hợp đồng hoặc chưa từng phát sinh đơn nhận hàng, không có dữ liệu để tính OTIF.
* **Quy tắc Fallback:**
  1. Gán điểm tin cậy mặc định ở mức trung tính (Neutral Baseline): $S_{\text{Delivery}} = 70$ điểm (mức trung bình khá).
  2. Gắn kèm nhãn cảnh báo minh bạch (Explainable Insight): `[NCC Mới - Điểm uy tín tạm tính 70%]`.
  3. Sau khi phát sinh tối thiểu 3 đơn giao hàng thành công, hệ thống tự động chuyển sang tính theo điểm OTIF thực tế.

---

## 5. Tính Minh Bạch Của Quyết Định (Explainability)

Hệ thống không chỉ đưa ra con số tổng (ví dụ: `87.5 điểm - Xếp hạng 1`), mà phải hiển thị bảng phân rã điểm số chi tiết (Score Breakdown):
* *"Giá tốt nhất thị trường (100đ, tỷ trọng 35%)"*
* *"Lead time 2 ngày (chậm hơn NCC A 1 ngày, tỷ trọng 25%)"*
* *"Lịch sử giao hàng xuất sắc: 96% đơn đúng hạn đủ hàng"*
Nhờ đó, nhân viên mua hàng hiểu rõ lý do tại sao hệ thống khuyến nghị NCC này và tự tin phê duyệt.
