# Project Decisions

File này lưu các quyết định quan trọng đã được người dùng xác nhận.

Chỉ ghi:

* Quyết định đã Confirmed.
* Các nguyên tắc ảnh hưởng đến nhiều tài liệu.
* Các quyết định cần được duy trì xuyên suốt project.

Không ghi:

* Ý tưởng tạm thời.
* Proposal chưa được xác nhận.
* Trao đổi chưa kết luận.

---

## Decision Template

```text
## [Decision Name]

Status: Confirmed

Decision:
...

Reason:
...

Impact:
...
```

---

## Current Decisions

### Project Type

Status: Confirmed

Decision:

Hệ thống là **Decision Support System (DSS)** cho một cửa hàng bán lẻ đơn lẻ.

---

### AI Decision Principle

Status: Confirmed

Decision:

> AI recommends. Human decides.

AI hỗ trợ dự báo, phân tích và khuyến nghị.

Người dùng nghiệp vụ đưa ra quyết định cuối cùng.

---

### Simple Goods Receipt & Closed-Loop Feedback

Status: Confirmed

Decision:

Hệ thống bổ sung bước ghi nhận Nhận hàng đơn giản (`Simple Goods Receipt`) sau khi tạo `Purchase Order` để ghi nhận ngày giao thực tế và số lượng thực nhận.

Reason:

Đóng kín vòng lặp dữ liệu thực tế giúp hệ thống đo lường hiệu suất giao hàng thực tế của nhà cung cấp (`Supplier Performance`), từ đó phục vụ đánh giá nhà cung cấp cho các đợt mua tiếp theo.

Impact:

Không mở rộng thành WMS chuyên sâu; chỉ ghi nhận các trường thông tin tối thiểu phục vụ cập nhật tồn kho và chỉ số nhà cung cấp.

---

### Supplier Evaluation Approach

Status: Confirmed

Decision:

Đánh giá và xếp hạng nhà cung cấp dựa trên bộ tiêu chí nghiệp vụ (Đơn giá, `Lead Time`, `MOQ`, Lịch sử giao hàng). Không áp dụng thuật toán tối ưu chia nhỏ đơn hàng cho nhiều nhà cung cấp.

Reason:

Minh bạch, dễ giải thích, phù hợp với quy mô vận hành của một cửa hàng bán lẻ đơn lẻ.

Impact:

Hệ thống gợi ý một nhà cung cấp có điểm số phù hợp nhất cho mỗi mặt hàng, đồng thời cho phép người dùng tùy chọn lại.

---

### Expiry Tracking Exclusion

Status: Confirmed

Decision:

Quản lý hạn sử dụng và phân lô chi tiết (`Batch / Expiry Tracking`) thuộc `Out-of-Scope` của đồ án.

Reason:

Kiểm soát độ phức tạp của đồ án tốt nghiệp, tập trung giải quyết bài toán cốt lõi về cân bằng giữa thiếu hàng (`Stockout`) và dư thừa (`Overstock`).

Impact:

Cấu trúc dữ liệu sản phẩm và tồn kho không cần quản lý thông tin lô hàng phức tạp.

---

### Explainability with LLM Summary

Status: Confirmed

Decision:

Sử dụng mô hình ngôn ngữ (LLM) để tổng hợp thành đoạn tóm tắt giải thích tự nhiên lý do đề xuất (`Why Buy`) dựa trên các kết quả tính toán định lượng của hệ thống.

Reason:

Hỗ trợ người dùng nắm bắt nhanh chóng và trực quan cơ sở khuyến nghị của DSS.

Impact:

LLM đóng vai trò tổng hợp và diễn đạt (`Synthesizer/Explainer`), không tự tính toán số lượng mua để loại bỏ rủi ro sai lệch dữ liệu (`hallucination`).

---

### On-Demand Purchase Review Trigger

Status: Confirmed

Decision:

Đợt phân tích mua hàng được kích hoạt theo nhu cầu (`On-demand`) bởi người dùng, thay vì hệ thống tự động quét nền liên tục.

Reason:

Phù hợp với chu kỳ làm việc thực tế định kỳ của người quản trị cửa hàng bán lẻ.

Impact:

Giao diện cung cấp chức năng cho người dùng chủ động khởi tạo phiên phân tích và đề xuất mua hàng.

---

### Actors & Role Separation

Status: Confirmed

Decision:

Hệ thống phân định 2 Actor nghiệp vụ: `Purchasing Staff` (chuyên trách vận hành mua hàng hàng ngày) và `Store Manager` (quản trị danh mục, chính sách cung ứng, cấu hình tham số DSS). `Store Manager` có quyền kế thừa và thực hiện toàn bộ nghiệp vụ của `Purchasing Staff`.

Reason:

Phản ánh đúng thực tế phân công lao động trong một cửa hàng bán lẻ; vừa bảo đảm tính phân quyền kiểm soát dữ liệu gốc, vừa linh hoạt khi người quản lý cần trực tiếp xử lý đơn hàng.

Impact:

Thiết kế Use Case và phân quyền giao diện được chia rõ ràng theo 2 nhóm vai trò; không gộp chung một Actor mơ hồ.

---

### Use Case Model Scope & Granularity

Status: Confirmed

Decision:

Chốt danh mục 7 Use Cases cốt lõi và bổ trợ; tích hợp toàn bộ quy trình DSS (dự báo, tính tồn kho, chấm điểm NCC, giải thích LLM, điều chỉnh và duyệt) vào 1 Use Case cốt lõi duy nhất (UC-01); không tách nhỏ CRUD/Screen; không mở rộng sang MLOps/AutoML so sánh thuật toán hay hệ thống WMS chuyên sâu.

Reason:

Bảo đảm tính tập trung vào bài toán cốt lõi của DSS (What, When, How much, Which Supplier, Why buy); kiểm soát phạm vi và độ phức tạp phù hợp với đồ án tốt nghiệp.

Impact:

Các tài liệu Use Case và thiết kế hệ thống tiếp theo sẽ bám sát 7 Use Cases này làm khung phân tích chuẩn mực.

---

### Direct PO Creation with Approved Status & Draft Session

Status: Confirmed

Decision:

Khi người dùng phê duyệt phương án mua tại UC-01, hệ thống tự động sinh các Đơn mua hàng (`Purchase Order`) ở trạng thái `Approved`. Đồng thời, UC-01 cung cấp khả năng lưu nháp phiên phân tích (`Draft Session`) nếu người dùng chưa muốn chốt duyệt ngay.

Reason:

Loại bỏ hiện tượng "phê duyệt 2 lần" gây phiền toái cho nhân viên cửa hàng; phân định ranh giới rành mạch giữa Ra quyết định (UC-01) và Thực thi / Gửi đơn hàng (UC-02).

Impact:

UC-02 chỉ tập trung vào việc tra cứu, in/xuất file PO gửi đối tác và theo dõi tiến độ, không lặp lại thao tác duyệt đơn.

---

### Implicit Human Override Tracking

Status: Confirmed

Decision:

Hệ thống tự động ghi nhận song song cả số liệu đề xuất gốc của DSS và số liệu thực tế được con người phê duyệt (`Suggested` vs `Approved`), nhưng không bắt buộc người dùng phải nhập lý do giải thích bằng văn bản (`Override Reason`).

Reason:

Cung cấp đầy đủ dữ liệu định lượng để đánh giá độ chính xác và mức độ chấp thuận của người dùng đối với DSS (rất có giá trị cho đồ án tốt nghiệp) mà không gây cản trở hay tạo gánh nặng thao tác cho nhân viên cửa hàng.

Impact:

Cấu trúc lưu trữ phương án mua hàng sẽ có các trường đối chiếu ngầm; giao diện người dùng duy trì sự tối giản và nhanh gọn.

---

### PO Immutability & Cancellation with On-Order Reversal

Status: Confirmed

Decision:

Đơn mua hàng sau khi sinh ra từ UC-01 là cố định (không cho phép sửa số lượng hay đổi SKU trực tiếp tại UC-02). Cho phép Hủy đơn mua hàng (`Cancel PO`) khi ở trạng thái `Approved`; khi hủy, hệ thống tự động hoàn trả/giảm trừ lượng hàng đang về (`On-order quantity`) của các SKU tương ứng.

Reason:

Bảo vệ tính toàn vẹn của kết quả tối ưu DSS; việc giảm trừ `On-order` khi hủy đơn giúp thuật toán DSS ở UC-01 tự động nhận diện lại nhu cầu thiếu hụt trong đợt phân tích tiếp theo mà không cần xử lý thủ công.

Impact:

Mọi sai lệch giao hàng thực tế sẽ ghi nhận tại UC-03; UC-02 hỗ trợ nút Hủy đơn và tự động kích hoạt logic cập nhật `On-order`.

---

### Exclusion of Manual PO Creation

Status: Confirmed

Decision:

100% Đơn mua hàng trong hệ thống đều phải bắt nguồn từ phương án mua được phê duyệt tại UC-01. Không hỗ trợ tính năng tạo PO thủ công ("nhập chay") ngoài hệ thống.

Reason:

Tập trung tối đa vào bài toán cốt lõi của đồ án tốt nghiệp là Decision Support System (DSS); tránh mở rộng phạm vi sang phần mềm quản lý kho/bán hàng ERP thông thường.

Impact:

Loại bỏ form tạo PO thủ công tại UC-02, giảm thiểu độ phức tạp và nguy cơ dữ liệu không được kiểm soát qua DSS.



