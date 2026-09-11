---
name: business-rules-analysis
description: >-
  Hướng dẫn phân tích, đặc tả và chuẩn hóa các Business Rules (công thức tính toán, logic phân loại rủi ro, chính sách mua hàng và kiểm soát tồn kho) cho hệ thống DSS.
  Sử dụng khi phân tích, xác định, đánh giá hoặc viết tài liệu Business Rules.
---

# Business Rules Analysis Skill

## 1. Mục Đích

Tài liệu này định hướng cho Agent trong việc phân tích, đặc tả và chuẩn hóa **Business Rules (Quy tắc Nghiệp vụ)** cho hệ thống AI-Powered Purchase Decision Support System.

Business Rules là tầng trung gian tối quan trọng trong chuỗi phân tích:
```text
Business Problem → Scope → Use Cases → [Business Rules] → Domain Model → Data Model → Architecture → Implementation
```

Mục tiêu chính:
* Chuyển hóa các phát biểu tương tác từ Use Cases thành **công thức tính toán toán học**, **bảng ma trận quyết định**, **ngưỡng tham số** và **chính sách vận hành cụ thể**.
* Cung cấp cơ sở nghiệp vụ tất định cho tầng Domain Model và Data Model tiếp theo.
* Đảm bảo tính minh bạch giải thích được (Explainability) cho mọi khuyến nghị mà hệ thống đưa ra.

---

## 2. Nguyên Tắc Cốt Lõi

### A. Tách bạch 3 Tầng Xử Lý (AI vs Business Calculation vs Human Decision)
Mỗi Business Rule phải xác định rõ phạm vi trách nhiệm:
1. **AI Prediction:** Dự báo nhu cầu bán hàng (Demand Forecast) mang tính xác suất.
2. **Business Calculation:** Công thức tính toán toán học tất định (Safety Stock, ROP, SOQ, Supplier Score) dựa trên đầu vào dự báo và dữ liệu tồn kho.
3. **Human Decision:** Quyền phê duyệt, điều chỉnh số lượng mua hoặc chọn nhà cung cấp thuộc về con người.

### B. Business Logic, Không Phải Technical Implementation
* **Được phép chứa:** Công thức toán học ($\Sigma, \sqrt{}$, max, min), logic điều kiện if/else, ngưỡng tham số nghiệp vụ (thresholds), đơn vị tính.
* **Tuyệt đối không chứa:** Tên bảng CSDL, câu lệnh SQL, tên hàm code, HTTP status code, API endpoints, UI component.

### C. Tính Minh Bạch & Khả Năng Giải Thích (Explainability)
Mỗi quy tắc tính toán sinh ra khuyến nghị mua hàng phải có khả năng giải thích rõ:
* *Tại sao lại gợi ý mua mặt hàng này vào lúc này?* (Do tồn kho khả dụng $\le ROP$).
* *Tại sao số lượng đề xuất lại là con số này?* (Do tính bù đến Max Inventory và làm tròn theo MOQ).
* *Tại sao chọn Nhà cung cấp này?* (Do điểm WSM cao nhất, giá tốt nhất và lead time ngắn).

---

## 3. Phân Loại 5 Nhóm Business Rules Trong DSS

Hệ thống quản lý mua hàng tập trung vào 5 nhóm quy tắc nghiệp vụ:

### Nhóm 1: Nhu cầu & Tồn kho (Demand & Inventory Rules)
* **BR-01:** Tính toán nhu cầu mua & tồn kho an toàn (Safety Stock, Reorder Point, Suggested Order Quantity).
* **BR-05:** Phân loại mặt hàng ABC-XYZ (theo doanh số tích lũy và hệ số biến thiên nhu cầu $CV$).

### Nhóm 2: Đánh giá & Xếp hạng Nhà cung cấp (Supplier Evaluation Rules)
* **BR-02:** Mô hình chấm điểm và xếp hạng Nhà cung cấp đa tiêu chí (Weighted Sum Model - WSM: Đơn giá, Lead Time, MOQ, Lịch sử giao hàng OTIF).
* **BR-13:** Đánh giá và cập nhật hiệu suất giao hàng của Nhà cung cấp sau khi nhận hàng.

### Nhóm 3: Ràng buộc Mua hàng & Đề xuất (Order Generation Rules)
* **BR-03:** Kiểm tra ràng buộc đặt hàng và làm tròn theo MOQ / Quy cách đóng gói.
* **BR-04:** Gom các mặt hàng cùng Nhà cung cấp vào một Đơn mua hàng (Purchase Order Grouping).

### Nhóm 4: Vòng đời Đơn Mua Hàng (PO Lifecycle & Management Rules)
* **BR-06:** Vòng đời trạng thái Đơn mua hàng (PO Status Lifecycle: Draft $\rightarrow$ Approved $\rightarrow$ Sent $\rightarrow$ Received / Cancelled).
* **BR-07:** Đồng bộ hàng đang trên đường về (On-order Inventory Synchronization).
* **BR-08:** Xác định ngày giao hàng dự kiến (Expected Delivery Date).
* **BR-09:** Cảnh báo đơn hàng quá hạn giao (Overdue PO Identification).
* **BR-10:** Ràng buộc lý do hủy đơn hàng (PO Cancellation Reason).
* **BR-11:** Quy tắc điền trước dữ liệu khi nhận hàng (Goods Receipt Pre-fill).
* **BR-12:** Đồng bộ tồn kho thực tế và tất toán lượng On-order khi nhận hàng.

### Nhóm 5: Tính Toàn Vẹn Dữ Liệu Vận Hành (Operational Data Integrity Rules)
* **BR-14:** Toàn vẹn dữ liệu nhập file theo cơ chế All-or-Nothing.
* **BR-15:** Khử trùng lặp và ghi đè doanh số theo ngày khi nhập liệu.
* **BR-16:** Cập nhật thay thế snapshot tồn kho thực tế định kỳ.

---

## 4. Chiến Lược Kết Hợp Học Thuật & Thực Tế (Hybrid Approach)

Hệ thống áp dụng công thức chuẩn mực học thuật làm nòng cốt, đồng thời có cơ chế dự phòng (Fallback) khi dữ liệu thực tế bị thiếu hụt:

1. **Safety Stock:**
   * **Công thức chính:** $SS = Z \times \sigma_d \times \sqrt{L}$ (chuẩn chuỗi cung ứng).
   * **Fallback:** $SS = \bar{d} \times \text{Safety Days}$ (khi SKU mới bán dưới 14 ngày, chưa đủ dữ liệu tính $\sigma_d$).
2. **Supplier Reliability:**
   * **Công thức chính:** Tỷ lệ OTIF tính từ lịch sử các đơn PO đã hoàn thành.
   * **Fallback:** Gán điểm uy tín mặc định 70% kèm nhãn minh bạch `[NCC Mới]` khi chưa có lịch sử giao hàng.

---

## 5. Quy Trình Phân Tích & Xác Nhận

```text
Rà soát Use Cases (BR-01 đến BR-16)
       ↓
Đặc tả chi tiết từng Rule (Input, Formula, Output, Fallback)
       ↓
Kiểm tra tính nhất quán (Feedback Loop với Use Cases)
       ↓
Confirmation Gate với Người dùng
       ↓
Ghi vào tài liệu chính thức: docs/business/business-rules.md
```

### Cơ chế Feedback Loop:
Nếu trong quá trình đặc tả chi tiết công thức hoặc điều kiện rẽ nhánh mà phát hiện:
* Use Case còn thiếu trường hợp ngoại lệ (ví dụ: giao thiếu hàng thì PO đóng hay mở?).
* Xung đột ranh giới với Scope đã chốt.

$\rightarrow$ **Không tự ý sửa Use Case cũ**. Phải nêu rõ xung đột, phân tích tác động và chờ người dùng xác nhận.

---

## 6. Tài Liệu Tham Chiếu

Khi đặc tả chi tiết công thức toán học và mô hình đánh giá, hãy tham khảo:

* [rule-specification-template.md](references/rule-specification-template.md): Khung mẫu đặc tả chi tiết cho từng Business Rule.
* [inventory-formulas.md](references/inventory-formulas.md): Cơ sở học thuật và công thức toán học chuẩn về Safety Stock, ROP, SOQ, ABC-XYZ.
* [supplier-scoring-model.md](references/supplier-scoring-model.md): Mô hình tổng trọng số (WSM) và chuẩn hóa điểm số chấm điểm Nhà cung cấp.
