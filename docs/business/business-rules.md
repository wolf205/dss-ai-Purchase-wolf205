# Đặc Tả Quy Tắc Nghiệp Vụ (Business Rules Specification)

## AI-Powered Purchase Decision Support System for a Single Retail Store

---

## 1. Nguyên Tắc Thiết Kế & Vận Hành Cốt Lõi

1. **AI recommends. Human decides:**
   * Mọi quy tắc tính toán (AI Demand Forecast, Safety Stock, Reorder Point, WSM Supplier Score, ABC-XYZ) đóng vai trò hỗ trợ phân tích ngầm và đề xuất.
   * Con người (Purchasing Staff / Store Manager) là chủ thể duy nhất có quyền thẩm định, điều chỉnh và ra quyết định phê duyệt cuối cùng.
2. **Tách bạch 3 Tầng Xử Lý:**
   * *Tầng AI:* Dự báo chuỗi thời gian mang tính xác suất.
   * *Tầng Business Calculation:* Công thức toán học và bảng quyết định tất định, minh bạch.
   * *Tầng Human Decision:* Quyết định điều chỉnh và phê duyệt mua hàng.
3. **Logic nghiệp vụ thuần túy (No Technical Bloat):**
   * Các quy tắc chỉ đặc tả công thức toán học, logic điều kiện, ngưỡng tham số và quy tắc kinh doanh. Tuyệt đối không chứa chi tiết kỹ thuật CSDL, mã code, hay HTTP/API.
4. **Khả năng giải thích minh bạch (Explainability):**
   * Mọi con số đề xuất (Số lượng mua, Nhà cung cấp gợi ý) đều phải phân rã được lý do định lượng rõ ràng phục vụ tính năng giải thích.

---

## 2. Tổng Quan Danh Mục 28 Quy Tắc Nghiệp Vụ

| Mã BR | Tên quy tắc nghiệp vụ | Nhóm nghiệp vụ | Use Cases liên quan |
| :--- | :--- | :--- | :--- |
| **BR-01** | Tính toán Nhu cầu mua, Tồn kho an toàn & Điểm đặt hàng | Nhu cầu & Tồn kho | UC-01, UC-07 |
| **BR-02** | Đánh giá & Xếp hạng Nhà cung cấp đa tiêu chí (WSM) | Đánh giá NCC | UC-01, UC-06, UC-07 |
| **BR-03** | Ràng buộc Đặt hàng & Làm tròn theo MOQ | Ràng buộc Mua hàng | UC-01 |
| **BR-04** | Gom nhóm Đơn mua hàng theo Nhà cung cấp | Ràng buộc Mua hàng | UC-01 |
| **BR-05** | Phân loại Mặt hàng theo Ma trận ABC - XYZ | Nhu cầu & Tồn kho | UC-01 |
| **BR-06** | Vòng đời Trạng thái Đơn mua hàng (PO Lifecycle) | Vòng đời PO | UC-01, UC-02, UC-03 |
| **BR-07** | Đồng bộ Biến Tồn kho Đang về (On-order Synchronization) | Vòng đời PO | UC-01, UC-02, UC-03 |
| **BR-08** | Xác định Ngày giao hàng dự kiến (Expected Delivery Date) | Vòng đời PO | UC-02, UC-03, UC-06 |
| **BR-09** | Tự động Nhận diện & Cảnh báo Đơn hàng Quá hạn (Overdue) | Vòng đời PO | UC-02 |
| **BR-10** | Ràng buộc Lý do khi Hủy Đơn mua hàng | Vòng đời PO | UC-02 |
| **BR-11** | Ràng buộc Thực thi & Điền trước Dữ liệu khi Nhận hàng | Nhận hàng & Feedback | UC-03 |
| **BR-12** | Đồng bộ Tồn kho & Tất toán On-order khi Nhận hàng | Nhận hàng & Feedback | UC-03 |
| **BR-13** | Tính toán Hiệu suất Giao hàng Thực tế của NCC (OTIF) | Đánh giá NCC | UC-03, UC-06 |
| **BR-14** | Cấu trúc Dữ liệu Vận hành & Cơ chế All-or-Nothing | Toàn vẹn Dữ liệu | UC-04 |
| **BR-15** | Khử trùng lặp & Ghi đè Doanh số Bán hàng theo Ngày | Toàn vẹn Dữ liệu | UC-04 |
| **BR-16** | Cập nhật Thay thế Snapshot Tồn kho Kiểm kê Thực tế | Toàn vẹn Dữ liệu | UC-04 |
| **BR-17** | Tính Bất biến & Duy nhất Toàn cục của Mã SKU | Dữ liệu Nền tảng | UC-05 |
| **BR-18** | Ngừng kinh doanh & Bảo vệ Toàn vẹn Tham chiếu SKU | Dữ liệu Nền tảng | UC-01, UC-04, UC-05 |
| **BR-19** | Trạng thái Mặc định & Tồn kho Ban đầu của SKU Mới | Dữ liệu Nền tảng | UC-05 |
| **BR-20** | Phân loại Ngành hàng Bắt buộc của SKU | Dữ liệu Nền tảng | UC-01, UC-05 |
| **BR-21** | Tính Bất biến & Duy nhất Toàn cục của Mã NCC | Dữ liệu Nền tảng | UC-06 |
| **BR-22** | Snapshot Điều kiện Cung ứng & Giá Mua Tiến về trước | Dữ liệu Nền tảng | UC-01, UC-02, UC-06 |
| **BR-23** | Ràng buộc Ngừng Cung ứng & Cảnh báo Đối tác Độc quyền | Dữ liệu Nền tảng | UC-01, UC-02, UC-06 |
| **BR-24** | Cơ chế Đánh giá NCC Mới & Cửa sổ Trượt 5 Đơn Gần Nhất | Đánh giá NCC | UC-01, UC-03, UC-06 |
| **BR-25** | Ràng buộc Chuẩn hóa Bộ Trọng số Đánh giá NCC | Đánh giá NCC | UC-01, UC-07 |
| **BR-26** | Ánh xạ Mức độ Phục vụ sang Hệ số An toàn Z | Nhu cầu & Tồn kho | UC-01, UC-07 |
| **BR-27** | Ràng buộc Phạm vi Chu kỳ Rà soát Mua hàng (Review Period)| Nhu cầu & Tồn kho | UC-01, UC-07 |
| **BR-28** | Bộ Tham số Cấu hình DSS Mặc định & Quy tắc Áp dụng | Cấu hình DSS | UC-01, UC-07 |

---

## 3. Nhóm 1: Nhu Cầu & Kiểm Soát Tồn Kho (Demand & Inventory Rules)

### BR-01: Tính Toán Nhu Cầu Mua, Tồn Kho An Toàn & Điểm Đặt Hàng

* **Mã quy tắc:** `BR-01`
* **Tên quy tắc:** Tính toán Nhu cầu mua, Tồn kho an toàn & Điểm đặt hàng (*Inventory & Demand Calculation Rule*)
* **Nhóm quy tắc:** Nhu cầu & Tồn kho.
* **Ý nghĩa nghiệp vụ:**
  * Xác định chính xác mặt hàng nào có nguy cơ thiếu hàng (`Stockout`) và lượng hàng cần mua tối ưu nhằm cân bằng giữa chi phí tồn trữ và tính sẵn sàng của hàng hóa.
* **Thời điểm kích hoạt:** Khi người dùng bấm kích hoạt đợt phân tích mua hàng on-demand tại `UC-01`.
* **Dữ liệu đầu vào:**
  * $d_{\text{forecast}}$: Nhu cầu bán hàng trung bình ngày trong tương lai (đơn vị: sản phẩm/ngày), sinh ra từ mô hình AI Demand Forecast.
  * $\sigma_d$: Độ lệch chuẩn của nhu cầu bán hàng lịch sử hàng ngày (đo lường biến động).
  * $L$: Thời gian chờ hàng về (`Lead Time`) cam kết của Nhà cung cấp đã chọn (ngày), từ `UC-06`.
  * $R$: Chu kỳ rà soát mua hàng (`Review Period`, ngày), cấu hình từ `UC-07` (mặc định: 7 ngày).
  * $Z$: Hệ số mức phục vụ an toàn (`Service Level Z-score`), ánh xạ từ `BR-26` (mặc định: $Z = 1.65$).
  * $I_{\text{on\_hand}}$: Tồn kho thực tế hiện tại trên kệ của SKU, từ `UC-04` hoặc `UC-03`.
  * $I_{\text{on\_order}}$: Tổng lượng hàng của SKU đang trên đường về từ các đơn PO `Approved`, từ `BR-07`.
  * $\text{MOQ}$: Số lượng đặt tối thiểu do Nhà cung cấp quy định, từ `UC-06`.
* **Logic / Công thức chi tiết:**
  1. **Tồn kho an toàn (Safety Stock - SS):**
     $$SS = Z \times \sigma_d \times \sqrt{L}$$
  2. **Điểm đặt hàng lại (Reorder Point - ROP):**
     $$ROP = (d_{\text{forecast}} \times L) + SS$$
  3. **Vị thế tồn kho khả dụng (Inventory Position - IP):**
     $$IP = I_{\text{on\_hand}} + I_{\text{on\_order}}$$
  4. **Nhu cầu thiếu hụt cơ sở (Net Requirement):**
     $$\text{Net Need} = ROP - IP$$
  5. **Số lượng đặt hàng đề xuất cơ sở (Base SOQ):**
     * Nếu $\text{Net Need} \le 0$: Không cần đặt hàng ($\text{Base SOQ} = 0$).
     * Nếu $\text{Net Need} > 0$: Bù đắp lượng hàng đủ tiêu thụ trong khoảng thời gian bảo vệ $(L + R)$ cộng lượng đệm an toàn:
       $$\text{Base SOQ} = \left( d_{\text{forecast}} \times (L + R) \right) + SS - IP$$
  6. **Số lượng đặt hàng đề xuất cuối cùng (Final SOQ):**
     * Tự động áp dụng ràng buộc `MOQ` và làm tròn số nguyên theo `BR-03`:
       $$\text{Final SOQ} = \begin{cases} 0 & \text{khi } \text{Base SOQ} \le 0 \\ \max(\text{MOQ}, \lceil \text{Base SOQ} \rceil) & \text{khi } \text{Base SOQ} > 0 \end{cases}$$
* **Dữ liệu đầu ra:**
  * `SafetyStock`: Số lượng tồn kho an toàn khuyến nghị.
  * `ReorderPoint`: Ngưỡng tồn kho kích hoạt đặt hàng.
  * `SuggestedOrderQuantity`: Số lượng hàng đề xuất mua ($\text{Final SOQ}$).
  * `StockRiskStatus`: Phân loại trạng thái sức khỏe tồn kho:
    * `🔴 Cần mua gấp`: Khi $I_{\text{on\_hand}} = 0$ và $IP \le ROP$.
    * `🟠 Sắp hết / Chạm ROP`: Khi $0 < I_{\text{on\_hand}} \le ROP$.
    * `🟢 An toàn`: Khi $ROP < IP \le ROP + (d_{\text{forecast}} \times R)$.
    * `⚪ Dư thừa / Overstock`: Khi $IP > ROP + (d_{\text{forecast}} \times 2R)$.
* **Cơ chế dự phòng (Fallback):**
  * Khi SKU mới kinh doanh có lịch sử bán $< 14$ ngày (chưa đủ mẫu tính $\sigma_d$ tin cậy):
    $$SS_{\text{fallback}} = \bar{d} \times \text{Safety Days}$$
    *(Với `Safety Days` mặc định gán bằng 5 ngày).*
* **Tính minh bạch & Giải thích:**
  * Hiển thị bảng đối chiếu chi tiết: `Tồn kho khả dụng (IP = On-hand + On-order) vs Ngưỡng ROP (Nhu cầu Lead Time + Safety Stock)`.
* **Use Cases liên quan:** `UC-01` (Bước 2b, 2c), `UC-07` (Tham số đầu vào).

---

### BR-05: Phân Loại Mặt Hàng Theo Ma Trận ABC - XYZ

* **Mã quy tắc:** `BR-05`
* **Tên quy tắc:** Phân loại Mặt hàng theo Ma trận ABC - XYZ (*ABC-XYZ Inventory Classification Rule*)
* **Nhóm quy tắc:** Nhu cầu & Tồn kho.
* **Ý nghĩa nghiệp vụ:**
  * Tự động phân cấp độ ưu tiên quản trị cho từng SKU theo giá trị đóng góp doanh thu (Pareto ABC) và độ biến động khó dự báo của nhu cầu (XYZ), cung cấp ngữ cảnh nghiệp vụ sâu sắc cho gợi ý của DSS và LLM.
* **Thời điểm kích hoạt:** Chạy tự động ngầm khi bắt đầu chu trình phân tích tại `UC-01`.
* **Dữ liệu đầu vào:**
  * Lịch sử bán hàng của từng SKU trong khoảng thời gian phân tích (tối thiểu 30–90 ngày gần nhất từ `UC-04`).
* **Logic / Công thức chi tiết:**
  1. **Phân loại ABC (Theo Doanh thu tích lũy - Nguyên lý Pareto):**
     * Tính tổng doanh thu của từng SKU trong kỳ: $Revenue_{\text{SKU}} = \sum (Quantity \times Price)$.
     * Sắp xếp danh sách SKU giảm dần theo $Revenue_{\text{SKU}}$ và tính tỷ lệ doanh thu tích lũy:
       $$CumRevenue\% = \frac{\sum_{k=1}^{i} Revenue_k}{\text{Total Store Revenue}} \times 100\%$$
     * Tiêu chí phân nhóm ABC:
       * **Nhóm A (High Value):** Các SKU nằm trong nhóm đóng góp đến $80\%$ tổng doanh thu tích lũy đầu tiên.
       * **Nhóm B (Medium Value):** Các SKU kế tiếp đóng góp từ trên $80\%$ đến $95\%$ tổng doanh thu tích lũy (chiếm $15\%$).
       * **Nhóm C (Low Value):** Các SKU còn lại đóng góp $5\%$ doanh thu tích lũy cuối cùng.
  2. **Phân loại XYZ (Theo Độ ổn định của Nhu cầu - Hệ số biến thiên CV):**
     * Tính hệ số biến thiên nhu cầu bán hàng ngày:
       $$CV = \frac{\sigma_d}{\bar{d}}$$
     * Tiêu chí phân nhóm XYZ:
       * **Nhóm X (Rất ổn định, dễ dự báo):** $CV \le 0.5$.
       * **Nhóm Y (Biến động vừa phải):** $0.5 < CV \le 1.0$.
       * **Nhóm Z (Biến động mạnh, ngắt quãng, khó dự báo):** $CV > 1.0$.
  3. **Kết hợp Ma trận 9 nhóm:** Ghép cặp tạo thành 9 phân lớp tồn kho: `AX`, `AY`, `AZ`, `BX`, `BY`, `BZ`, `CX`, `CY`, `CZ`.
* **Dữ liệu đầu ra:**
  * `ABCGroup`: Giá trị `A`, `B`, hoặc `C`.
  * `XYZGroup`: Giá trị `X`, `Y`, hoặc `Z`.
  * `ABCXYZBadge`: Nhãn ma trận hiển thị trực quan (ví dụ: `AX`, `BY`, `CZ`).
* **Cơ chế dự phòng:**
  * Nếu SKU mới có doanh thu bằng 0 hoặc bán dưới 7 ngày: Mặc định xếp vào nhóm `CZ` (giá trị thấp, biến động chưa xác định).
* **Tính minh bạch & Giải thích:**
  * Hiển thị nhãn Badge phân loại trên bảng đề xuất tại `UC-01`; truyền nhãn vào prompt của LLM để giải thích (ví dụ: *"Mặt hàng AX có doanh thu cao và nhu cầu ổn định, cần ưu tiên giữ hàng"*).
* **Use Cases liên quan:** `UC-01` (Bước 2b, 3, 5).

---

### BR-26: Ánh Xạ Mức Độ Phục Vụ Sang Hệ Số An Toàn Z

* **Mã quy tắc:** `BR-26`
* **Tên quy tắc:** Ánh xạ Mức độ Phục vụ sang Hệ số An toàn Z (*Service Level to Safety Factor Mapping Rule*)
* **Nhóm quy tắc:** Nhu cầu & Tồn kho.
* **Ý nghĩa nghiệp vụ:**
  * Chuyển hóa mục tiêu kinh doanh dễ hiểu của Quản lý cửa hàng (Tỷ lệ đáp ứng khách hàng mong muốn) thành hệ số toán học chính xác mà không đòi hỏi nhân viên phải có kiến thức thống kê chuyên sâu.
* **Thời điểm kích hoạt:** Khi Quản lý chọn tham số tại `UC-07` hoặc khi `BR-01` truy xuất hệ số tính toán.
* **Logic ánh xạ chuẩn:**

  | Target Service Level | Rủi ro đứt hàng chấp nhận | Hệ số an toàn ($Z$) | Ý nghĩa nghiệp vụ |
  | :---: | :---: | :---: | :--- |
  | **90%** | 10% | **$1.28$** | Tối ưu vốn, chấp nhận rủi ro thiếu hàng nhỏ, tồn kho tinh gọn |
  | **95%** *(Mặc định)* | 5% | **$1.65$** | Cân bằng chuẩn công nghiệp giữa chi phí và dịch vụ |
  | **98%** | 2% | **$2.05$** | Bảo vệ cao, hạn chế tối đa nguy cơ stockout cho hàng thiết yếu |
  | **99%** | 1% | **$2.33$** | Bảo vệ tối đa, tồn kho đệm an toàn cao nhất |

* **Ràng buộc:** Chỉ chấp nhận 1 trong 4 giá trị rời rạc trên, không nhận số tùy ý ngoài bảng.
* **Use Cases liên quan:** `UC-01` (Tính toán `SS`), `UC-07` (Lưu cấu hình).

---

### BR-27: Ràng Buộc Phạm Vi Chu Kỳ Rà Soát Mua Hàng (Review Period)

* **Mã quy tắc:** `BR-27`
* **Tên quy tắc:** Ràng buộc Phạm vi Chu kỳ Rà soát Mua hàng (*Review Period Operational Bounds Rule*)
* **Nhóm quy tắc:** Nhu cầu & Tồn kho.
* **Ý nghĩa nghiệp vụ:**
  * Giữ nhịp độ đặt hàng của cửa hàng trong giới hạn vận hành thực tế, tránh trường hợp đặt chu kỳ quá ngắn gây quá tải đơn hoặc quá dài gây ứ đọng vốn.
* **Logic & Ràng buộc:**
  * Chu kỳ rà soát mua hàng ($R$, đơn vị: ngày) phải là số nguyên thỏa mãn:
    $$1 \le R \le 30 \text{ (ngày)}$$
  * Giá trị mặc định của hệ thống: $R = 7$ ngày (đặt hàng theo chu kỳ tuần).
  * Khoảng thời gian bảo vệ nhu cầu hàng hóa của mỗi lần đặt hàng luôn được xác định là:
    $$T_{\text{protection}} = L + R \text{ (ngày)}$$
* **Use Cases liên quan:** `UC-01` (Bước 2), `UC-07` (Kiểm tra dữ liệu nhập).

---

## 4. Nhóm 2: Đánh Giá & Xếp Hạng Nhà Cung Cấp (Supplier Evaluation Rules)

### BR-02: Đánh Giá & Xếp Hạng Nhà Cung Cấp Đa Tiêu Chí (WSM)

* **Mã quy tắc:** `BR-02`
* **Tên quy tắc:** Đánh giá & Xếp hạng Nhà cung cấp Đa tiêu chí (*Multi-Criteria Supplier Scoring & Ranking Rule*)
* **Nhóm quy tắc:** Đánh giá & Xếp hạng Nhà cung cấp.
* **Ý nghĩa nghiệp vụ:**
  * Tự động chấm điểm khách quan và xếp hạng các Nhà cung cấp cùng chào bán một mặt hàng, giúp nhân viên mua hàng chọn được đối tác có sự cân bằng tối ưu giữa giá cả, tốc độ, tính linh hoạt và độ tin cậy.
* **Thời điểm kích hoạt:** Tự động thực thi ngầm trong chu trình phân tích tại `UC-01`.
* **Dữ liệu đầu vào:**
  * Danh sách các Nhà cung cấp đang `Active` có cung ứng SKU tương ứng, kèm:
    * `Purchase Price` ($P$): Đơn giá nhập (VNĐ) từ điều kiện cung ứng của SKU.
    * `Committed Lead Time` ($L$): Thời gian giao cam kết (ngày) của Nhà cung cấp (lấy từ `Supplier.committedLeadTime`).
    * `MOQ` ($M$): Số lượng đặt tối thiểu từ điều kiện cung ứng của SKU.
    * `Historical Performance Score` ($H$): Điểm hiệu suất giao hàng thực tế (thang 0–100), tính từ `BR-24` và `BR-13`.
  * Bộ 4 trọng số hệ thống từ `UC-07`: $w_{\text{Price}}, w_{\text{LeadTime}}, w_{\text{MOQ}}, w_{\text{History}}$ (thỏa mãn $\sum w_i = 100\%$).
* **Logic / Công thức chi tiết:**
  1. **Chuẩn hóa điểm số các tiêu chí chi phí (Cost Criteria - Càng thấp càng tốt):**
     * Điểm Đơn giá:
       $$S_{\text{Price}} = \frac{\min(P)}{P} \times 100$$
     * Điểm Thời gian giao hàng:
       $$S_{\text{LeadTime}} = \frac{\min(L)}{L} \times 100$$
     * Điểm Số lượng đặt tối thiểu:
       $$S_{\text{MOQ}} = \frac{\min(M)}{M} \times 100$$
       *(Trong đó $\min(X)$ là giá trị thấp nhất/tốt nhất trong số các NCC khả dụng cùng bán SKU đó).*
  2. **Chuẩn hóa tiêu chí lợi ích (Benefit Criterion - Càng cao càng tốt):**
     * Điểm Lịch sử giao hàng:
       $$S_{\text{History}} = H \text{ (thang điểm 100, lấy từ BR-24)}$$
  3. **Tính Tổng điểm WSM (Weighted Sum Model):**
     $$\text{Total Score} = \left( \frac{w_{\text{Price}}}{100} \times S_{\text{Price}} \right) + \left( \frac{w_{\text{LeadTime}}}{100} \times S_{\text{LeadTime}} \right) + \left( \frac{w_{\text{MOQ}}}{100} \times S_{\text{MOQ}} \right) + \left( \frac{w_{\text{History}}}{100} \times S_{\text{History}} \right)$$
  4. **Xếp hạng & Gợi ý:**
     * Nhà cung cấp có $\text{Total Score}$ cao nhất được gắn cờ `Suggested Supplier`.
* **Dữ liệu đầu ra:**
  * Bảng điểm chi tiết từng tiêu chí ($S_{\text{Price}}, S_{\text{LeadTime}}, S_{\text{MOQ}}, S_{\text{History}}$).
  * `TotalScore` (0–100) và Thứ hạng xếp hạng (`Rank 1, 2, 3...`).
* **Trường hợp hòa điểm (Tie-breaking):**
  * Nếu hai NCC có tổng điểm bằng nhau: Ưu tiên NCC có $S_{\text{Price}}$ cao hơn; nếu vẫn bằng nhau thì ưu tiên NCC có $S_{\text{History}}$ cao hơn.
* **Tính minh bạch & Giải thích:**
  * Hiển thị bảng phân rã điểm số (Score Breakdown) khi người dùng mở pop-up chọn lại NCC tại `UC-01`.
* **Use Cases liên quan:** `UC-01` (Bước 2d, 4, 5), `UC-06`, `UC-07`.

---

### BR-13: Tính Toán Chỉ Số Hiệu Suất Giao Hàng Khi Nhận Hàng

* **Mã quy tắc:** `BR-13`
* **Tên quy tắc:** Tính toán Chỉ số Hiệu suất Giao hàng khi Nhận hàng (*Supplier Performance Calculation on Receipt Rule*)
* **Nhóm quy tắc:** Đánh giá Nhà cung cấp (Closed-Loop Feedback).
* **Ý nghĩa nghiệp vụ:**
  * Ghi nhận chính xác mức độ sai lệch giữa cam kết trên PO và thực tế giao hàng của đối tác (về số lượng và thời gian), đóng kín vòng lặp dữ liệu thực tế cho DSS. Áp dụng cơ chế phạt trễ hạn giảm dần để phản ánh sát thực tế mức độ rủi ro đứt hàng của cửa hàng.
* **Thời điểm kích hoạt:** Khi người dùng bấm "Xác nhận nhận hàng" tại `UC-03`.
* **Dữ liệu đầu vào:**
  * $Qty_{\text{ordered}}$: Số lượng đặt ban đầu trên PO.
  * $Qty_{\text{received}}$: Số lượng thực nhận được ghi nhận tại kho.
  * $Date_{\text{actual}}$: Ngày nhận hàng thực tế tại kho.
  * $Date_{\text{expected}}$: Ngày giao hàng dự kiến ban đầu, tính từ `BR-08`.
* **Logic / Công thức chi tiết:**
  1. **Tỷ lệ giao đủ số lượng (Fulfillment Rate):**
     $$\text{Fulfillment Rate} = \min\left(100\%, \frac{Qty_{\text{received}}}{Qty_{\text{ordered}}} \times 100\%\right)$$
     *(Khóa tối đa ở mức 100%, không thưởng điểm cho việc giao dư).*
  2. **Xác định số ngày trễ ($Days_{\text{late}}$) và trạng thái đúng hạn (Is On-Time):**
     $$Days_{\text{late}} = \max\left(0, Date_{\text{actual}} - Date_{\text{expected}}\right)$$
     $$\text{Is On-Time} = \begin{cases} \text{True (Đúng hạn)} & \text{khi } Days_{\text{late}} = 0 \\ \text{False (Trễ hạn)} & \text{khi } Days_{\text{late}} > 0 \end{cases}$$
     *(Lưu ý: Nếu đơn hàng từng bị từ chối 100% và giao lại, mốc $Date_{\text{expected}}$ vẫn giữ nguyên ban đầu để phản ánh chính xác sự trễ hạn).*
  3. **Hệ số giao đúng hạn suy giảm theo số ngày trễ (On-Time Factor):**
     * Thiết lập ngưỡng trễ tối đa cho phép là $T_{\text{grace}} = 3$ ngày (khoảng 50% mức tồn kho an toàn bảo vệ của cửa hàng). Quá 3 ngày được xem là rủi ro đứt hàng nghiêm trọng.
     * Công thức suy giảm tuyến tính (Linear Penalty Decay):
       $$\text{On-Time Factor} = \begin{cases} 1.0 & \text{khi } Days_{\text{late}} = 0 \text{ (Đúng hạn hoặc sớm)} \\ \max\left(0, 1 - \frac{Days_{\text{late}}}{3}\right) & \text{khi } Days_{\text{late}} > 0 \text{ (Giao trễ hạn)} \end{cases}$$
     * Bảng quy đổi điểm thành phần thời gian ($\text{Time Points} = \text{round}(\text{On-Time Factor} \times 50)$):
       * $Days_{\text{late}} = 0$: $\text{On-Time Factor} = 1.0 \rightarrow \mathbf{50 \text{ điểm}}$ (Tối đa).
       * $Days_{\text{late}} = 1$: $\text{On-Time Factor} \approx 0.67 \rightarrow \mathbf{33 \text{ điểm}}$ (Trễ nhẹ, tồn kho an toàn gánh được).
       * $Days_{\text{late}} = 2$: $\text{On-Time Factor} \approx 0.33 \rightarrow \mathbf{17 \text{ điểm}}$ (Trễ trung bình, nguy cơ chạm đáy tồn kho).
       * $Days_{\text{late}} \ge 3$: $\text{On-Time Factor} = 0.0 \rightarrow \mathbf{0 \text{ điểm}}$ (Trễ nghiêm trọng, mất toàn bộ điểm thời gian).
* **Dữ liệu đầu ra:**
  * Bản ghi hiệu suất giao hàng của đơn PO: `FulfillmentRate` (%), `IsOnTime` (Boolean), `DaysLate` (ngày), và `OnTimeFactor` ($0.0 - 1.0$).
* **Use Cases liên quan:** `UC-03` (Bước 5), `UC-06` (Lịch sử giao hàng).

---

### BR-24: Cơ Chế Đánh Giá Nhà Cung Cấp Mới & Cửa Sổ Trượt 5 Đơn Gần Nhất

* **Mã quy tắc:** `BR-24`
* **Tên quy tắc:** Cơ chế Đánh giá NCC Mới & Cửa sổ Trượt 5 Đơn Gần Nhất (*Supplier Cold Start, Rolling 5-Order Window & Deactivation Rule*)
* **Nhóm quy tắc:** Đánh giá Nhà cung cấp.
* **Ý nghĩa nghiệp vụ:**
  * Giải quyết bài toán khởi động lạnh (Cold Start) giúp đối tác mới có cơ hội cạnh tranh sòng phẳng, đồng thời áp dụng cửa sổ trượt 5 đơn gần nhất để phản ánh phong độ giao hàng nhạy bén của NCC, loại bỏ quán tính lịch sử sai lệch.
* **Thời điểm kích hoạt:** Khi tính điểm $S_{\text{History}}$ cho thuật toán `BR-02`.
* **Logic / Bảng quyết định:**

  | Giai đoạn lịch sử của NCC | Điều kiện số đơn PO Completed | Công thức tính $S_{\text{History}}$ | Nhãn nhận diện trên giao diện |
  | :--- | :--- | :--- | :--- |
  | **1. Cold Start (NCC Mới)** | Dưới 3 đơn ($N < 3$) | Gán mặc định: $S_{\text{History}} = 80$ (Mức Khá) | `[NCC Mới - Điểm khởi tạo: 80%]` |
  | **2. Chuyển tiếp** | Từ 3 đến 4 đơn ($3 \le N < 5$) | Trung bình cộng điểm của toàn bộ $N$ đơn đã giao | `[Lịch sử: N đơn]` |
  | **3. Cửa sổ trượt chuẩn** | Từ 5 đơn trở lên ($N \ge 5$) | Điểm trung bình cộng tính trên **đúng 5 đơn PO Completed gần nhất** | `[Phong độ 5 đơn gần nhất]` |

* **Công thức điểm của 1 đơn hàng thành phần:**
  $$\text{Order Score} = (\text{On-Time Factor} \times 50) + (\text{Fulfillment Rate} \times 0.5)$$
  *(Trong đó: On-Time Factor $\in [0, 1]$ suy giảm theo số ngày trễ từ BR-13; Fulfillment Rate từ 0–100%).*
* **Ràng buộc ngừng hoạt động (Deactivation Guard):**
  * NCC ở trạng thái `Inactive` tự động bị loại trừ 100% khỏi danh sách chấm điểm và đề xuất tại `UC-01`.
* **Use Cases liên quan:** `UC-01` (Tính điểm DSS), `UC-03`, `UC-06`.

---

### BR-25: Ràng Buộc Chuẩn Hóa Bộ Trọng Số Đánh Giá Nhà Cung Cấp

* **Mã quy tắc:** `BR-25`
* **Tên quy tắc:** Ràng buộc Chuẩn hóa Bộ Trọng số Đánh giá Nhà cung cấp (*Supplier Evaluation Weight Normalization & Integrity Rule*)
* **Nhóm quy tắc:** Đánh giá Nhà cung cấp.
* **Ý nghĩa nghiệp vụ:**
  * Bảo đảm tính toàn vẹn toán học của mô hình WSM, ngăn chặn cấu hình sai lệch làm méo mó kết quả xếp hạng.
* **Logic & Ràng buộc:**
  * Bộ 4 trọng số: $w_{\text{Price}}$ (Đơn giá), $w_{\text{LeadTime}}$ (Lead Time), $w_{\text{MOQ}}$ (MOQ), $w_{\text{History}}$ (Lịch sử).
  * Mỗi trọng số thành phần phải là số nguyên không âm: $w_i \in \mathbb{Z}, w_i \ge 0\%$.
  * Tổng 4 trọng số bắt buộc phải bằng đúng 100%:
    $$\sum_{i=1}^{4} w_i = w_{\text{Price}} + w_{\text{LeadTime}} + w_{\text{MOQ}} + w_{\text{History}} = 100\%$$
  * Hệ thống khóa nút Lưu và từ chối cập nhật nếu tổng khác 100%.
* **Use Cases liên quan:** `UC-01`, `UC-07`.

---

## 5. Nhóm 3: Ràng Buộc Mua Hàng & Phát Sinh Đơn (Order Generation Rules)

### BR-03: Kiểm Tra Ràng Buộc Đặt Hàng & Làm Tròn Theo MOQ

* **Mã quy tắc:** `BR-03`
* **Tên quy tắc:** Kiểm tra Ràng buộc Đặt hàng & Làm tròn theo MOQ (*Order Constraints & MOQ Check Rule*)
* **Nhóm quy tắc:** Ràng buộc Mua hàng.
* **Ý nghĩa nghiệp vụ:**
  * Đảm bảo mọi số lượng đề xuất đều khả thi ngoài thực tế theo đúng hợp đồng mua bán của Nhà cung cấp, ngăn ngừa phát sinh đơn hàng bị nhà cung cấp từ chối.
* **Thời điểm kích hoạt:**
  * Tự động áp dụng khi DSS tính số lượng gợi ý tại `UC-01`.
  * Kiểm tra ngay lập tức khi người dùng tự tay chỉnh sửa số lượng mua trên bảng đề xuất tại `UC-01`.
* **Logic chi tiết:**
  1. **Quy tắc làm tròn tự động trong đề xuất ban đầu:**
     * Nếu $\text{Base SOQ} > 0$ và $\text{Base SOQ} < \text{MOQ}$: Hệ thống tự động nâng số lượng đề xuất lên bằng $\text{MOQ}$.
     * Nếu SKU có quy cách đóng gói (`Pack Size`):
       $$\text{Suggested Qty} = \max\left(\text{MOQ}, \lceil \frac{\text{Base SOQ}}{\text{Pack Size}} \rceil \times \text{Pack Size}\right)$$
  2. **Quy tắc kiểm tra khi con người chỉnh sửa (Human Override Guard):**
     * Nếu người dùng nhập số lượng mua $Qty_{\text{user}} > 0$ nhưng $Qty_{\text{user}} < \text{MOQ}$:
       * Hệ thống hiển thị cảnh báo vi phạm ràng buộc (Warning Alert).
       * Gợi ý người dùng: (a) Nâng lên bằng `MOQ`, hoặc (b) Chọn NCC khác có MOQ nhỏ hơn phù hợp với nhu cầu.
* **Use Cases liên quan:** `UC-01` (Bước 2c, 5).

---

### BR-04: Gom Nhóm Mặt Hàng Theo Nhà Cung Cấp Khi Khởi Tạo Đơn Hàng

* **Mã quy tắc:** `BR-04`
* **Tên quy tắc:** Gom nhóm Mặt hàng theo Nhà cung cấp khi Khởi tạo Đơn hàng (*Purchase Order Grouping Rule*)
* **Nhóm quy tắc:** Ràng buộc Mua hàng.
* **Ý nghĩa nghiệp vụ:**
  * Tự động tổng hợp danh sách các SKU được duyệt thành các Đơn mua hàng hoàn chỉnh theo từng Nhà cung cấp, tối ưu chi phí vận chuyển và giảm thiểu số lượng đơn vụn vặt.
* **Thời điểm kích hoạt:** Khi người dùng bấm "Phê duyệt mua hàng" tại `UC-01`.
* **Logic gom nhóm:**
  1. Lọc toàn bộ các dòng mặt hàng có $ApprovedQuantity > 0$.
  2. Nhóm các dòng này theo mã Nhà cung cấp đã chọn (`ApprovedSupplierCode`).
  3. Với mỗi nhóm Nhà cung cấp duy nhất:
     * Khởi tạo **duy nhất 1 Đơn mua hàng (`Purchase Order`)** ở trạng thái `Approved`.
     * Gắn toàn bộ các dòng SKU thuộc nhóm đó vào chi tiết đơn (`PO Line Items`).
     * Tính tổng giá trị đơn hàng: $\text{Total Amount} = \sum (ApprovedQuantity_i \times PurchasePrice_i)$.
* **Dữ liệu đầu ra:** Tập hợp các mã Đơn mua hàng mới sinh ra (ví dụ: `PO-20261025-001`, `PO-20261025-002`).
* **Use Cases liên quan:** `UC-01` (Bước 7b), `UC-02`.

---

## 6. Nhóm 4: Vòng Đời Đơn Mua Hàng & Nhận Hàng (PO Lifecycle & Goods Receipt Rules)

### BR-06: Vòng Đời Trạng Thái Đơn Mua Hàng (PO Status Lifecycle)

* **Mã quy tắc:** `BR-06`
* **Tên quy tắc:** Vòng đời Trạng thái Đơn mua hàng (*PO Status Lifecycle Rule*)
* **Nhóm quy tắc:** Vòng đời Đơn Mua Hàng.
* **Ý nghĩa nghiệp vụ:**
  * Thiết lập chu trình chuyển dịch trạng thái đơn hàng một chiều, chặt chẽ, loại bỏ tình trạng duyệt hai lần hoặc đảo ngược trạng thái gây sai lệch tồn kho.
* **Sơ đồ chuyển dịch trạng thái:**
  ```text
  [UC-01 Phê duyệt] ──────> Approved
                              │
              ┌───────────────┴───────────────┐
              │                               │
        (Hủy đơn tại UC-02)         (Nhận hàng tại UC-03)
              │                               │
              ▼                               ▼
          Cancelled                       Completed
  ```
* **Bảng quy tắc chuyển trạng thái:**

  | Trạng thái hiện tại | Sự kiện / Hành động | Trạng thái tiếp theo | Ràng buộc nghiệp vụ |
  | :--- | :--- | :--- | :--- |
  | *Chưa có* | Phê duyệt tại `UC-01` | `Approved` | Đơn mua hàng sinh ra ở trạng thái đã được duyệt, sẵn sàng gửi đối tác |
  | `Approved` | Xác nhận nhận hàng tại `UC-03` | `Completed` | Đóng đơn thành công, giải phóng toàn bộ On-order |
  | `Approved` | Xác nhận hủy đơn tại `UC-02` | `Cancelled` | Bắt buộc nhập lý do hủy, hoàn trả lại On-order |
  | `Completed` | Mọi hành động | *Không đổi* | **Bất biến:** Tuyệt đối không cho phép hủy hoặc mở lại đơn đã hoàn tất |
  | `Cancelled` | Mọi hành động | *Không đổi* | **Bất biến:** Tuyệt đối không cho phép khôi phục lại đơn đã bị hủy |

* **Use Cases liên quan:** `UC-01`, `UC-02`, `UC-03`.

---

### BR-07: Đồng Bộ Biến Tồn Kho Đang Trên Đường Về (On-Order Synchronization)

* **Mã quy tắc:** `BR-07`
* **Tên quy tắc:** Đồng bộ Biến Tồn kho Đang trên đường về (*On-Order Inventory Synchronization Rule*)
* **Nhóm quy tắc:** Vòng đời Đơn Mua Hàng.
* **Ý nghĩa nghiệp vụ:**
  * Bảo đảm biến $I_{\text{on\_order}}$ luôn phản ánh chính xác số lượng hàng đang chờ về kho, ngăn chặn thuật toán DSS ở `UC-01` đề xuất mua trùng lặp ở các đợt chạy tiếp theo.
* **Logic đồng bộ theo sự kiện:**
  1. **Khi PO được tạo ở trạng thái `Approved` (`UC-01`):**
     $$I_{\text{on\_order(new)}} = I_{\text{on\_order(old)}} + Qty_{\text{ordered}}$$
  2. **Khi PO chuyển sang `Completed` (`UC-03`):**
     $$I_{\text{on\_order(new)}} = I_{\text{on\_order(old)}} - Qty_{\text{ordered}}$$
  3. **Khi PO chuyển sang `Cancelled` (`UC-02`):**
     $$I_{\text{on\_order(new)}} = I_{\text{on\_order(old)}} - Qty_{\text{ordered}}$$
* **Ràng buộc an toàn:** $I_{\text{on\_order}} \ge 0$ (không bao giờ nhận giá trị âm).
* **Use Cases liên quan:** `UC-01`, `UC-02`, `UC-03`.

---

### BR-08: Xác Định Ngày Giao Hàng Dự Kiến (Expected Delivery Date)

* **Mã quy tắc:** `BR-08`
* **Tên quy tắc:** Xác định Ngày Giao Hàng Dự Kiến (*Expected Delivery Date Rule*)
* **Nhóm quy tắc:** Vòng đời Đơn Mua Hàng.
* **Ý nghĩa nghiệp vụ:**
  * Xác lập mốc thời gian cam kết chính thức làm căn cứ giám sát tiến độ và phát hiện giao hàng quá hạn.
* **Công thức toán học:**
  $$\text{Expected Delivery Date} = \text{Approval Date} + \text{Supplier.committedLeadTime (ngày)}$$
  *(Trong đó `Supplier.committedLeadTime` là thời gian giao hàng cam kết chuẩn lấy theo hồ sơ của NCC tại thời điểm duyệt PO).*
* **Quy tắc cố định:** Ngày giao dự kiến được lưu cố định vào PO và **không bao giờ bị reset** (kể cả khi bị từ chối nhận hàng và giao lại).
* **Use Cases liên quan:** `UC-01`, `UC-02`, `UC-03`, `UC-06`.

---

### BR-09: Tự Động Nhận Diện & Cảnh Báo Đơn Hàng Quá Hạn (PO Overdue)

* **Mã quy tắc:** `BR-09`
* **Tên quy tắc:** Tự động Nhận diện & Cảnh báo Đơn hàng Quá hạn (*PO Overdue Identification Rule*)
* **Nhóm quy tắc:** Vòng đời Đơn Mua Hàng.
* **Ý nghĩa nghiệp vụ:**
  * Tự động phát hiện các đơn hàng bị giao trễ so với cam kết để nhân viên kịp thời liên hệ hối thúc đối tác.
* **Điều kiện kích hoạt cảnh báo:**
  $$\text{Current Date} > \text{Expected Delivery Date} \quad \text{AND} \quad \text{PO Status} = \text{'Approved'}$$
* **Hành động của hệ thống:**
  * Tự động gắn nhãn cờ `Overdue` (màu đỏ) kèm số ngày quá hạn trên giao diện quản lý `UC-02`.
* **Use Cases liên quan:** `UC-02` (Mục 3, 5).

---

### BR-10: Ràng Buộc Lý Do Khi Hủy Đơn Mua Hàng

* **Mã quy tắc:** `BR-10`
* **Tên quy tắc:** Ràng buộc Lý do khi Hủy Đơn Mua Hàng (*PO Cancellation Reason Rule*)
* **Nhóm quy tắc:** Vòng đời Đơn Mua Hàng.
* **Ý nghĩa nghiệp vụ:**
  * Ngăn ngừa việc tùy tiện hủy đơn, lưu vết lịch sử phục vụ đối soát và phân tích nguyên nhân gián đoạn chuỗi cung ứng.
* **Logic & Ràng buộc:**
  * Chỉ cho phép hủy đơn khi PO đang ở trạng thái `Approved`.
  * Thao tác hủy **bắt buộc phải chọn hoặc nhập lý do hủy** (`Cancellation Reason`):
    * Danh mục lý do chuẩn: `NCC báo hết hàng`, `NCC không liên lạc được`, `Cửa hàng thay đổi kế hoạch`, `Lỗi nhập sai số lượng`, `Khác (nhập văn bản)`.
  * Sau khi hủy, hệ thống tự động kích hoạt `BR-07` để giảm trừ `On-order`.
* **Use Cases liên quan:** `UC-02` (Luồng AF-1).

---

### BR-11: Ràng Buộc Thực Thi & Điền Trước Dữ Liệu Khi Nhận Hàng

* **Mã quy tắc:** `BR-11`
* **Tên quy tắc:** Ràng buộc Thực thi & Điền trước Dữ liệu khi Nhận hàng (*Goods Receipt Execution & Pre-fill Rule*)
* **Nhóm quy tắc:** Nhận hàng & Feedback.
* **Ý nghĩa nghiệp vụ:**
  * Giữ quy trình nhận hàng ở mức tinh giản (Simple Goods Receipt), tối ưu tốc độ nhập liệu tại kho và ngăn ngừa lỗi vô tình đóng đơn sai sót.
* **Logic & Ràng buộc:**
  1. **Điều kiện thực thi:** Chỉ các đơn PO có trạng thái `Approved` mới được phép thực hiện nhận hàng.
  2. **Giới hạn 1 lần duy nhất:** Mỗi PO chỉ được ghi nhận nhận hàng duy nhất 1 lần trong toàn bộ vòng đời (không hỗ trợ nhận hàng nhiều đợt - No Partial Delivery).
  3. **Tự động điền trước (Pre-fill):** Giao diện nhận hàng tự động điền sẵn số lượng thực nhận bằng số lượng đặt:
     $$Qty_{\text{received(mặc định)}} = Qty_{\text{ordered}}$$
  4. **Chặn xác nhận khi toàn bộ bằng 0:** Hệ thống từ chối hoàn tất nhận hàng nếu toàn bộ các dòng mặt hàng đều có $Qty_{\text{received}} = 0$. (Trường hợp từ chối nhận 100% hàng lỗi, nhân viên phải giữ nguyên PO ở trạng thái `Approved` để NCC giao lại ngoài thực tế).
* **Use Cases liên quan:** `UC-03` (Bước 2, 4, Luồng EF-2).

---

### BR-12: Đồng Bộ Tồn Kho & Tất Toán On-Order Khi Nhận Hàng

* **Mã quy tắc:** `BR-12`
* **Tên quy tắc:** Đồng bộ Tồn kho & Tất toán On-order khi Nhận hàng (*Inventory & On-Order Synchronization on Receipt Rule*)
* **Nhóm quy tắc:** Nhận hàng & Feedback.
* **Ý nghĩa nghiệp vụ:**
  * Bảo đảm tồn kho thực tế phản ánh đúng số lượng thực nhập, đồng thời tất toán hoàn toàn lượng hàng đang về để tránh treo số liệu On-order khi giao thiếu.
* **Logic toán học khi xác nhận nhận hàng:**
  1. **Cập nhật tồn kho thực tế tại cửa hàng:**
     $$I_{\text{on\_hand(new)}} = I_{\text{on\_hand(old)}} + Qty_{\text{received}}$$
     *(Chấp nhận cả trường hợp giao thừa $Qty_{\text{received}} > Qty_{\text{ordered}}$ kèm cảnh báo mềm để phản ánh đúng thực tế hàng trên kệ).*
  2. **Tất toán lượng hàng đang về (On-order):**
     $$I_{\text{on\_order(new)}} = I_{\text{on\_order(old)}} - Qty_{\text{ordered}}$$
     *(Quan trọng: Luôn trừ theo đúng số lượng đặt ban đầu $Qty_{\text{ordered}}$ để đưa On-order của đơn hàng này về chính xác 0).*
* **Cơ chế xử lý giao thiếu hàng:**
  * Phần hàng thiếu hụt không được treo lại. DSS ở đợt phân tích tiếp theo (`UC-01`) sẽ căn cứ vào $I_{\text{on\_hand}}$ thực tế để tự động tính bù nhu cầu.
* **Use Cases liên quan:** `UC-03` (Bước 5), `UC-01`.

---

## 7. Nhóm 5: Dữ Liệu Nền Tảng & Toàn Vẹn Vận Hành (Master Data & Data Integrity Rules)

### BR-14: Cấu Trúc Dữ Liệu Vận Hành & Cơ Chế All-or-Nothing

* **Mã quy tắc:** `BR-14`
* **Tên quy tắc:** Cấu trúc Dữ liệu Vận hành & Cơ chế All-or-Nothing (*Operational Data Schema & All-or-Nothing Integrity Rule*)
* **Nhóm quy tắc:** Toàn vẹn Dữ liệu.
* **Ý nghĩa nghiệp vụ:**
  * Đảm bảo nguyên tắc "Garbage In, Garbage Out", bảo vệ mô hình AI và các thuật toán DSS không bị méo mó do nạp dữ liệu sai lệch hoặc nạp dở dang.
* **Cấu trúc dữ liệu chuẩn:**
  * **Tệp Doanh số bán hàng (`Sales Data`):**
    * `Date`: Định dạng `YYYY-MM-DD`, $\le$ Ngày hiện tại.
    * `SKU`: Bắt buộc tồn tại trong danh mục hệ thống (`UC-05`, chấp nhận cả SKU `Active` và SKU `Inactive` đang xả hàng).
    * `Quantity`: Số nguyên dương $> 0$.
    * `Revenue`: Số tiền $\ge 0$.
  * **Tệp Kiểm kê tồn kho (`Inventory Data`):**
    * `SKU`: Bắt buộc tồn tại trong danh mục hệ thống (`UC-05`, chấp nhận cả SKU `Active` và SKU `Inactive` đang xả hàng).
    * `StockQuantity`: Số nguyên $\ge 0$.
* **Cơ chế All-or-Nothing:**
  * Tệp dữ liệu chỉ được ghi vào hệ thống khi **100% các dòng đều hợp lệ** (hệ thống tự động loại bỏ các dòng hoàn toàn trống trước khi kiểm tra).
  * Nếu có dù chỉ 1 dòng vi phạm (mã SKU không tồn tại trong hệ thống, ô trống khuyết thiếu giá trị, số lượng âm, sai định dạng ngày, trùng lặp nội bộ tệp) $\rightarrow$ Hệ thống từ chối toàn bộ tệp, hiển thị bảng chi tiết lỗi từng dòng để người dùng sửa triệt để.
* **Use Cases liên quan:** `UC-04` (Bước 3, Luồng EF-1, EF-2).

---

### BR-15: Khử Trùng Lặp & Ghi Đè Doanh Số Bán Hàng Theo Ngày

* **Mã quy tắc:** `BR-15`
* **Tên quy tắc:** Khử trùng lặp & Ghi đè Doanh số Bán hàng theo Ngày (*Sales De-duplication & Date Overwrite Rule*)
* **Nhóm quy tắc:** Toàn vẹn Dữ liệu.
* **Ý nghĩa nghiệp vụ:**
  * Ngăn ngừa tình trạng nạp lặp tệp bán hàng làm nhân đôi, nhân ba doanh số, phá hủy tính chính xác của mô hình dự báo nhu cầu.
* **Logic khử trùng lặp:**
  * Khóa xác định duy nhất của bản ghi bán hàng: Cặp `(Date, SKU)`.
  * Nếu tệp tải lên chứa các mốc ngày đã tồn tại dữ liệu trong hệ thống:
    * Hệ thống hiển thị cảnh báo trùng lặp ngày bán hàng.
    * Khi người dùng xác nhận nạp: Hệ thống thực hiện **ghi đè (Overwrite)** toàn bộ dữ liệu bán hàng của các ngày đó. Tuyệt đối không cộng dồn doanh số.
* **Use Cases liên quan:** `UC-04` (Bước 3, Luồng AF-1).

---

### BR-16: Cập Nhật Thay Thế Snapshot Tồn Kho Kiểm Kê Thực Tế

* **Mã quy tắc:** `BR-16`
* **Tên quy tắc:** Cập nhật Thay thế Snapshot Tồn kho Kiểm kê Thực tế (*Physical Inventory Snapshot Replacement Rule*)
* **Nhóm quy tắc:** Toàn vẹn Dữ liệu.
* **Ý nghĩa nghiệp vụ:**
  * Đưa số liệu kiểm kê thực tế mới nhất vào hệ thống để căn chỉnh tồn kho, hỗ trợ kiểm kê luân phiên từng phần, đồng thời bảo vệ biến On-order của các đơn hàng đang chờ giao.
* **Logic cập nhật khi nạp file tồn kho:**
  1. **Thay thế tồn kho hiện tại (Hỗ trợ kiểm kê từng phần):**
     * Với các SKU có mặt trong tệp kiểm kê:
       $$I_{\text{on\_hand(SKU)}} = StockQuantity_{\text{mới}}$$
     * Với các SKU vắng mặt trong tệp: Giữ nguyên tồn kho hiện tại (không bị gán về 0).
  2. **Bảo lưu nguyên vẹn lượng hàng đang về:**
     $$I_{\text{on\_order(SKU)}} = I_{\text{on\_order(SKU hiện tại)}} \quad (\text{Không thay đổi})$$
* **Use Cases liên quan:** `UC-04` (Bước 4, Luồng AF-2).

---

### BR-17: Tính Bất Biến & Duy Nhất Toàn Cục Của Mã SKU

* **Mã quy tắc:** `BR-17`
* **Tên quy tắc:** Tính Bất biến & Duy nhất Toàn cục của Mã SKU (*SKU Code Immutability & Global Uniqueness Rule*)
* **Nhóm quy tắc:** Dữ liệu Nền tảng.
* **Ý nghĩa nghiệp vụ:**
  * Đảm bảo tính nhất quán của chuỗi dữ liệu lịch sử bán hàng và đơn hàng xuyên suốt vòng đời hệ thống.
* **Logic & Ràng buộc:**
  * Mỗi mặt hàng phải có mã SKU duy nhất toàn hệ thống, không phân biệt hoa/thường (`MILK-01` tương đương `milk-01`).
  * Ký tự hợp lệ: Chỉ gồm chữ cái, chữ số, dấu gạch ngang (`-`), gạch dưới (`_`). Cấm ký tự dấu phẩy hoặc khoảng trắng.
  * **Bất biến (Immutable):** Sau khi đã tạo thành công, mã SKU bị khóa vĩnh viễn, không thể chỉnh sửa trong bất kỳ tình huống nào.
* **Use Cases liên quan:** `UC-05` (Bước 3, Luồng EF-1).

---

### BR-18: Ngừng Kinh Doanh & Bảo Vệ Toàn Vẹn Tham Chiếu SKU

* **Mã quy tắc:** `BR-18`
* **Tên quy tắc:** Ngừng kinh doanh & Bảo vệ Toàn vẹn Tham chiếu SKU (*Product Deactivation & Referential Integrity Protection Rule*)
* **Nhóm quy tắc:** Dữ liệu Nền tảng.
* **Ý nghĩa nghiệp vụ:**
  * Bảo vệ tính toàn vẹn của dữ liệu quá khứ phục vụ AI huấn luyện, ngăn chặn lỗi mồ côi dữ liệu khi xóa vật lý, duy trì tính thông suốt cho việc xả nốt hàng tồn của mặt hàng ngừng kinh doanh.
* **Logic & Ràng buộc:**
  1. **Cấm Hard Delete:** Tuyệt đối không xóa vật lý bản ghi SKU nếu đã từng phát sinh bất kỳ liên kết nào (Sales History, Inventory, PO, hoặc Supplier). Chỉ cho phép xóa khi SKU vừa tạo và hoàn toàn chưa có liên kết.
  2. **Chặn Deactivate khi có On-order:** Không cho phép chuyển trạng thái SKU sang `Inactive` nếu sản phẩm vẫn còn hàng đang chờ về ($I_{\text{on\_order}} > 0$).
  3. **Quy tắc đối với SKU Inactive:**
     * **Tại UC-01 (Lõi DSS):** SKU `Inactive` tự động bị **loại trừ 100%** khỏi chu trình gợi ý mua hàng (không phân tích nhu cầu, không tính ROP, không bao giờ sinh đề xuất mua mới).
     * **Tại UC-04 (Dữ liệu vận hành):** Vẫn **tiếp nhận bình thường** các bản ghi bán hàng và kiểm kê tồn kho của SKU `Inactive` để phục vụ theo dõi việc bán nốt số tồn dư và cập nhật chính xác lượng hàng thực tế trên kệ. Hệ thống chỉ từ chối nạp khi mã SKU hoàn toàn không tồn tại trong danh mục hệ thống.
* **Use Cases liên quan:** `UC-01`, `UC-04`, `UC-05` (Luồng AF-2, AF-3, EF-3, EF-4).

---

### BR-19: Trạng Thái Mặc Định & Tồn Kho Ban Đầu Của SKU Mới

* **Mã quy tắc:** `BR-19`
* **Tên quy tắc:** Trạng thái Mặc định & Tồn kho Ban đầu của SKU Mới (*Initial Inventory & Default State Rule*)
* **Nhóm quy tắc:** Dữ liệu Nền tảng.
* **Ý nghĩa nghiệp vụ:**
  * Đảm bảo mọi thay đổi tồn kho đều có nguồn gốc giao dịch rõ ràng (nhập kiểm kê hoặc nhận hàng PO).
* **Logic khởi tạo:**
  * Mọi SKU tạo mới mặc định có `Status = Active`.
  * Các biến tồn kho ban đầu được khởi tạo: $I_{\text{on\_hand}} = 0$, $I_{\text{on\_order}} = 0$.
* **Use Cases liên quan:** `UC-05` (Bước 4).

---

### BR-20: Phân Loại Ngành Hàng Bắt Buộc Của SKU

* **Mã quy tắc:** `BR-20`
* **Tên quy tắc:** Phân loại Ngành hàng Bắt buộc của SKU (*Category Classification & Rapid Entry Rule*)
* **Nhóm quy tắc:** Dữ liệu Nền tảng.
* **Ý nghĩa nghiệp vụ:**
  * Đảm bảo tính toàn vẹn cho chức năng lọc theo ngành hàng trên bảng phân tích đề xuất mua hàng DSS tại `UC-01`.
* **Logic:**
  * Trường Ngành hàng (`Category`) là thuộc tính bắt buộc của mỗi SKU.
  * Hỗ trợ chọn từ danh mục chuẩn hóa hoặc tạo nhanh ngành hàng mới ngay trên form nhập liệu.
* **Use Cases liên quan:** `UC-01` (Bộ lọc ngành hàng), `UC-05` (Bước 3).

---

### BR-21: Tính Bất Biến & Duy Nhất Toàn Cục Của Mã Nhà Cung Cấp

* **Mã quy tắc:** `BR-21`
* **Tên quy tắc:** Tính Bất biến & Duy nhất Toàn cục của Mã NCC (*Supplier Code Immutability & Profile Integrity Rule*)
* **Nhóm quy tắc:** Dữ liệu Nền tảng.
* **Ý nghĩa nghiệp vụ:**
  * Định danh bất biến đối tác thương mại để duy trì tính liên tục của lịch sử giao dịch và đánh giá phong độ giao hàng.
* **Logic & Ràng buộc:**
  * Mỗi Nhà cung cấp có một mã định danh duy nhất toàn hệ thống, không phân biệt hoa/thường (`SUP-01` tương đương `sup-01`).
  * Sau khi tạo thành công, mã Nhà cung cấp bị khóa vĩnh viễn, không thể chỉnh sửa.
* **Use Cases liên quan:** `UC-06` (Bước 3, Luồng EF-1).

---

### BR-22: Snapshot Điều Kiện Cung Ứng & Giá Mua Tiến Về Trước

* **Mã quy tắc:** `BR-22`
* **Tên quy tắc:** Snapshot Điều kiện Cung ứng & Giá Mua Tiến về trước (*Supply Condition Snapshot & Forward-Looking Pricing Rule*)
* **Nhóm quy tắc:** Dữ liệu Nền tảng.
* **Ý nghĩa nghiệp vụ:**
  * Bảo đảm tính bất biến của các hợp đồng mua bán và đơn hàng đã phát hành trong quá khứ khi giá cả thị trường thay đổi.
* **Logic & Ràng buộc:**
  * Mỗi liên kết giữa Nhà cung cấp và SKU được quy định bởi: `Purchase Price` ($> 0$) và `MOQ` ($\ge 1$). Thời gian giao hàng cam kết được quản lý tập trung ở cấp độ Nhà cung cấp (`Supplier.committedLeadTime \ge 1` ngày) và áp dụng thống nhất cho toàn bộ các SKU do đối tác đó cung ứng.
  * Khi cập nhật giá nhập hoặc MOQ mới tại `UC-06`:
    * Chỉ có hiệu lực cho các lần chạy DSS và phát sinh đơn PO mới tại `UC-01` kể từ thời điểm cập nhật.
    * Toàn bộ các Đơn mua hàng cũ đã tạo ở `UC-02` bảo lưu nguyên vẹn mức giá và điều kiện snapshot tại thời điểm duyệt đơn.
* **Use Cases liên quan:** `UC-01`, `UC-02`, `UC-06` (Luồng AF-2).

---

### BR-23: Ràng Buộc Ngừng Cung Ứng & Cảnh Báo Đối Tác Độc Quyền

* **Mã quy tắc:** `BR-23`
* **Tên quy tắc:** Ràng buộc Ngừng Cung ứng & Cảnh báo Đối tác Độc quyền (*Supply Discontinuation & Sole Supplier / Active PO Guard Rule*)
* **Nhóm quy tắc:** Dữ liệu Nền tảng.
* **Ý nghĩa nghiệp vụ:**
  * Ngăn ngừa việc xóa liên kết cung ứng khi đơn hàng đang trên đường về kho, đồng thời cảnh báo rủi ro gián đoạn nguồn cung tại DSS.
* **Logic & Ràng buộc:**
  1. **Chặn cứng Active PO:** Cấm ngừng cung ứng hoặc gỡ bỏ một SKU của một Nhà cung cấp nếu đang có đơn PO `Approved` của chính đối tác này chứa SKU đó.
  2. **Cảnh báo mềm Sole Supplier:** Nếu Nhà cung cấp này là đối tác duy nhất của SKU, hệ thống bắt buộc phải hiển thị cảnh báo rủi ro gián đoạn nguồn cung tại `UC-01` trước khi người dùng xác nhận ngừng cung ứng.
* **Use Cases liên quan:** `UC-01`, `UC-02`, `UC-06` (Luồng AF-3, EF-5).

---

### BR-28: Bộ Tham Số Cấu Hình DSS Mặc Định & Quy Tắc Áp Dụng

* **Mã quy tắc:** `BR-28`
* **Tên quy tắc:** Bộ Tham số Cấu hình DSS Mặc định & Quy tắc Áp dụng (*DSS Parameter Baseline & Forward-Looking Application Rule*)
* **Nhóm quy tắc:** Cấu hình DSS.
* **Ý nghĩa nghiệp vụ:**
  * Cung cấp điểm tựa vận hành an toàn ngay khi khởi tạo hệ thống và bảo đảm nguyên tắc áp dụng tiến về trước của chính sách cung ứng.
* **Bộ tham số mặc định (Default Baseline):**

  | Tham số | Ký hiệu | Giá trị mặc định | Giải thích nghiệp vụ |
  | :--- | :---: | :---: | :--- |
  | **Trọng số Đơn giá** | $w_{\text{Price}}$ | **$40\%$** | Ưu tiên hàng đầu vào tối ưu chi phí mua hàng |
  | **Trọng số Thời gian giao** | $w_{\text{LeadTime}}$ | **$20\%$** | Rút ngắn thời gian chờ hàng về |
  | **Trọng số MOQ** | $w_{\text{MOQ}}$ | **$15\%$** | Linh hoạt dòng vốn lưu động |
  | **Trọng số Lịch sử giao** | $w_{\text{History}}$ | **$25\%$** | Đảm bảo uy tín thực tế của đối tác |
  | **Mức độ phục vụ mục tiêu** | $SL$ | **$95\%$** ($Z = 1.65$) | Cân bằng giữa tồn kho đệm và rủi ro đứt hàng |
  | **Chu kỳ rà soát mua hàng**| $R$ | **$7$ ngày** | Đặt hàng định kỳ hàng tuần |

* **Nguyên tắc áp dụng tiến về trước:**
  * Cấu hình mới lưu tại `UC-07` chỉ áp dụng cho các phiên phân tích `UC-01` tiếp theo, tuyệt đối không tính toán lại các đơn PO cũ.
* **Use Cases liên quan:** `UC-01`, `UC-07` (Luồng AF-1).

---

## 8. Bảng Ma Trận Tham Số Hệ Thống & Áp Dụng Mặc Định

| Nhóm tham số | Tên tham số | Giá trị mặc định | Giới hạn hợp lệ | Phạm vi tác động |
| :--- | :--- | :---: | :---: | :--- |
| **Đánh giá NCC** | Trọng số Đơn giá ($w_{\text{Price}}$) | 40% | $0 - 100\%$ | Thuật toán xếp hạng NCC (BR-02) |
| **Đánh giá NCC** | Trọng số Lead Time ($w_{\text{LeadTime}}$) | 20% | $0 - 100\%$ | Thuật toán xếp hạng NCC (BR-02) |
| **Đánh giá NCC** | Trọng số MOQ ($w_{\text{MOQ}}$) | 15% | $0 - 100\%$ | Thuật toán xếp hạng NCC (BR-02) |
| **Đánh giá NCC** | Trọng số Lịch sử ($w_{\text{History}}$) | 25% | $0 - 100\%$ | Thuật toán xếp hạng NCC (BR-02) |
| **Ràng buộc NCC**| Tổng 4 trọng số ($\sum w_i$) | 100% | Bắt buộc = 100% | Ràng buộc chuẩn hóa WSM (BR-25) |
| **Đánh giá NCC** | Điểm khởi tạo NCC mới (Cold Start) | 80 điểm | Cố định 80 | NCC có $< 3$ đơn completed (BR-24) |
| **Đánh giá NCC** | Cửa sổ trượt đánh giá NCC | 5 đơn | 5 đơn gần nhất | NCC có $\ge 5$ đơn completed (BR-24) |
| **Đánh giá NCC** | Ngưỡng phạt trễ hạn tối đa ($T_{\text{grace}}$) | 3 ngày | Cố định mã nguồn | Tính hệ số thời gian suy giảm On-Time Factor (BR-13) |
| **Chính sách Tồn kho**| Mức phục vụ ($SL \rightarrow Z$) | 95% ($Z=1.65$) | {90%, 95%, 98%, 99%} | Tính Tồn kho an toàn SS (BR-01, BR-26) |
| **Chính sách Tồn kho**| Chu kỳ rà soát ($R$) | 7 ngày | $1 \le R \le 30$ ngày | Tính Nhu cầu bảo vệ (BR-01, BR-27) |
| **Chính sách Tồn kho**| Safety Days (Fallback SS) | 5 ngày | 5–7 ngày | SKU có lịch sử $< 14$ ngày (BR-01) |
| **Phân loại Tồn kho**| Ngưỡng doanh thu tích lũy ABC | 80% / 15% / 5% | Cố định mã nguồn | Phân loại Pareto ABC (BR-05) |
| **Phân loại Tồn kho**| Ngưỡng hệ số biến thiên XYZ | $CV \le 0.5$ / $1.0$ / $>1.0$ | Cố định mã nguồn | Phân loại độ ổn định XYZ (BR-05) |
| **Dữ liệu Vận hành** | Cơ chế kiểm tra nạp tệp | All-or-Nothing | 100% dòng hợp lệ | Kiểm soát chất lượng dữ liệu (BR-14) |
| **Dữ liệu Bán hàng** | Xử lý trùng lặp ngày | Ghi đè (Overwrite) | Theo cặp (Date, SKU) | Bảo vệ số liệu AI dự báo (BR-15) |
| **Tồn kho Kiểm kê** | Đồng bộ hàng đang về (On-order) | Giữ nguyên | Bảo lưu On-order | Bảo vệ vị thế đơn hàng (BR-16) |

---

## 9. Tổng Kết & Chuyển Tiếp Tầng Thiết Kế Kế Tiếp

Tài liệu này xác lập đầy đủ căn cứ toán học, quy tắc logic và chính sách nghiệp vụ tất định cho toàn bộ hệ thống DSS. 

* Các quy tắc này là tiền đề trực tiếp để xây dựng **Domain Model** (Thực thể, Thuộc tính, Phương thức nghiệp vụ) và **Data Model** (Cấu trúc bảng CSDL, Khóa chính/ngoại, Ràng buộc dữ liệu) ở các bước tiếp theo.
