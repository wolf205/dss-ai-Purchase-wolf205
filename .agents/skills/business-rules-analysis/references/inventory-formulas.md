# Tham Chiếu: Các Công Thức Tồn Kho Chuẩn Trong Supply Chain (Inventory Formulas)

Tài liệu này cung cấp cơ sở học thuật và công thức toán học chuẩn mực cho việc tính toán tồn kho an toàn, điểm đặt hàng lại, số lượng đặt hàng tối ưu và phân loại mặt hàng trong hệ thống DSS cho bán lẻ.

---

## 1. Tồn Kho An Toàn (Safety Stock - SS)

### Ý nghĩa
Safety Stock là lượng hàng đệm được giữ lại để phòng ngừa rủi ro biến động nhu cầu bán hàng trong suốt khoảng thời gian chờ hàng về (Lead Time).

### Công thức chuẩn (Lead Time cố định, Nhu cầu biến động)

$$SS = Z \times \sigma_d \times \sqrt{L}$$

*Trong đó:*
* $Z$: Hệ số mức độ phục vụ (Service Level $Z$-score).
  * Service Level $95\% \rightarrow Z \approx 1.65$ (Khuyến nghị cho nhóm A).
  * Service Level $90\% \rightarrow Z \approx 1.28$ (Khuyến nghị cho nhóm B).
  * Service Level $85\% \rightarrow Z \approx 1.04$ (Khuyến nghị cho nhóm C).
* $\sigma_d$: Độ lệch chuẩn của nhu cầu bán hàng ngày (Daily Demand Standard Deviation), tính toán từ lịch sử bán hàng trong một cửa sổ trượt (ví dụ: 30 hoặc 60 ngày gần nhất):
  $$\sigma_d = \sqrt{\frac{1}{N-1} \sum_{t=1}^{N} (d_t - \bar{d})^2}$$
* $L$: Thời gian chờ hàng về từ Nhà cung cấp (Lead Time tính theo ngày).

### Cơ chế Fallback (Khi dữ liệu chưa đủ điều kiện)
* **Điều kiện:** SKU mới nhập bán, dữ liệu lịch sử bán hàng $< 14$ ngày (chưa đủ mẫu để tính $\sigma_d$ tin cậy).
* **Công thức Fallback ước lượng:**
  $$SS_{\text{fallback}} = \bar{d} \times \text{Safety Days}$$
  *(Trong đó `Safety Days` được cấu hình mặc định theo danh mục hàng, ví dụ: 5–7 ngày).*

---

## 2. Điểm Đặt Hàng Lại (Reorder Point - ROP)

### Ý nghĩa
ROP là mức tồn kho mà khi lượng tồn kho khả dụng giảm xuống bằng hoặc thấp hơn mức này, hệ thống sẽ kích hoạt khuyến nghị đặt hàng ngay lập tức để tránh đứt gãy tồn kho (Stockout).

### Công thức chuẩn

$$ROP = (d_{\text{forecast}} \times L) + SS$$

*Trong đó:*
* $d_{\text{forecast}}$: Nhu cầu bán hàng trung bình ngày trong tương lai (lấy từ kết quả mô hình AI Dự báo Nhu cầu).
* $L$: Lead Time của nhà cung cấp đã chọn (ngày).
* $SS$: Tồn kho an toàn tính theo Mục 1.

---

## 3. Số Lượng Đề Xuất Đặt Hàng (Suggested Order Quantity - SOQ)

### Ý nghĩa
Số lượng hàng cần mua để đưa mức tồn kho trở lại mức an toàn tối ưu sau khi trừ đi lượng hàng đang có và lượng hàng đã đặt đang trên đường về.

### Công thức tính nhu cầu thiếu hụt cơ sở (Net Requirement)

$$\text{Net Need} = ROP - (I_{\text{on\_hand}} + I_{\text{on\_order}})$$

*Nếu $\text{Net Need} \le 0$: Không cần đặt hàng ($\text{SOQ} = 0$).*

*Nếu $\text{Net Need} > 0$: Số lượng cần đặt được tính bù đến mức tồn kho mục tiêu (Target Stock Level - Max Inventory):*

$$\text{Base SOQ} = (d_{\text{forecast}} \times (L + R)) + SS - (I_{\text{on\_hand}} + I_{\text{on\_order}})$$

*(Trong đó $R$ là Chu kỳ xem xét đơn hàng - Review Period, ví dụ 7 ngày).*

### Ràng buộc làm tròn theo MOQ (Minimum Order Quantity)

Hệ thống bắt buộc điều chỉnh `SOQ` để thỏa mãn ràng buộc của Nhà cung cấp:

$$\text{Final SOQ} = \max(\text{MOQ}, \lceil \frac{\text{Base SOQ}}{\text{Pack Size}} \rceil \times \text{Pack Size})$$

*Nếu Nhà cung cấp chỉ quy định MOQ đơn thuần:*
$$\text{Final SOQ} = \max(\text{MOQ}, \text{Base SOQ})$$

---

## 4. Ma Trận Phân Loại Mặt Hàng ABC-XYZ

### Phân loại ABC (Theo Giá trị Doanh thu - Nguyên lý Pareto 80/20)
* **Nhóm A (High Value):** Chiếm ~70–80% tổng doanh thu của cửa hàng, nhưng chỉ chiếm ~10–20% số lượng SKU. Cần giám sát chặt chẽ, duy trì Service Level cao ($95\%$).
* **Nhóm B (Medium Value):** Chiếm ~15–20% tổng doanh thu, chiếm ~30% số lượng SKU. Giám sát định kỳ, Service Level vừa ($90\%$).
* **Nhóm C (Low Value):** Chiếm ~5% tổng doanh thu, chiếm ~50% số lượng SKU. Giám sát đơn giản, Service Level $80–85\%$.

### Phân loại XYZ (Theo Độ Ổn Định Của Nhu Cầu)
Được đo lường bằng **Hệ số biến thiên (Coefficient of Variation - CV)** của doanh số ngày:

$$CV = \frac{\sigma_d}{\bar{d}}$$

* **Nhóm X ($CV \le 0.5$):** Nhu cầu rất ổn định, dễ dự báo, ít rủi ro sai số.
* **Nhóm Y ($0.5 < CV \le 1.0$):** Nhu cầu có biến động vừa phải (theo mùa vụ hoặc khuyến mãi).
* **Nhóm Z ($CV > 1.0$):** Nhu cầu biến động rất mạnh hoặc ngắt quãng (lumpy/intermittent demand), rất khó dự báo, cần chú ý kiểm soát Safety Stock.
