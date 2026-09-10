# System Scope

## Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI

---

## 1. Business Objective & Context

* **Mô hình:** `Single Retail Store` (Cửa hàng bán lẻ đơn lẻ).
* **Mục tiêu:** Hỗ trợ người quản lý giải quyết 5 câu hỏi cốt lõi trong mua hàng:
  * `What to Buy` (Mua mặt hàng nào)
  * `When to Buy` (Khi nào mua)
  * `How Much to Buy` (Mua bao nhiêu)
  * `Which Supplier` (Mua từ ai)
  * `Why Buy` (Vì sao nên mua)
* **Nguyên tắc cốt lõi:** `AI recommends. Human decides.`

---

## 2. Main Actors

* **Purchasing Staff (Nhân viên mua hàng):**
  * Nhập dữ liệu vận hành (bán hàng, tồn kho).
  * Kích hoạt đợt phân tích mua hàng theo nhu cầu (`On-demand`).
  * Xem xét, điều chỉnh và trực tiếp phê duyệt phương án mua hàng.
  * Theo dõi, in/xuất đơn mua hàng (`Purchase Order`).
  * Ghi nhận nhận hàng thực tế từ nhà cung cấp (`Goods Receipt`).
* **Store Manager (Quản lý cửa hàng / Admin):**
  * Quản lý danh mục sản phẩm (`SKU`) và nhà cung cấp (`Supplier`).
  * Thiết lập điều kiện cung ứng (giá nhập, lead time, MOQ).
  * Cấu hình các tham số phân tích DSS (trọng số đánh giá NCC, mức dịch vụ tồn kho).
  * Toàn quyền thực hiện các nghiệp vụ của `Purchasing Staff` khi cần thiết.

---

## 3. Core Capabilities

Các năng lực cốt lõi bắt buộc để giải quyết `Business Problem`:

### 3.1. Quản lý dữ liệu mua hàng nền tảng
* Quản lý danh mục `SKU` và `Supplier`.
* Tiếp nhận và lưu trữ `Sales History` và `Current Inventory`.
* Hỗ trợ cập nhật hoặc import dữ liệu (CSV/Excel) phục vụ phân tích.

### 3.2. Dự báo nhu cầu bán lẻ (`Demand Forecast`)
* Phân tích dữ liệu bán hàng lịch sử theo từng mặt hàng.
* Dự báo lượng tiêu thụ tương lai trong chu kỳ mua hàng.

### 3.3. Phân tích tồn kho & Tính toán nhu cầu bổ sung
* Xác định rủi ro `Stockout` và `Overstock`.
* Tính toán các chỉ số tồn kho: `Safety Stock`, `Reorder Point`.
* Tính toán số lượng mua đề xuất (`Suggested Order Quantity`) dựa trên tồn kho, dự báo bán và `Lead Time`.

### 3.4. Đánh giá & Xếp hạng nhà cung cấp (`Supplier Evaluation`)
* So sánh và chấm điểm các `Supplier` cung cấp cùng `SKU`.
* Xếp hạng dựa trên bộ tiêu chí nghiệp vụ:
  * `Purchase Price`
  * Cam kết `Lead Time`
  * `MOQ` (Số lượng đặt hàng tối thiểu)
  * Lịch sử thực hiện giao hàng (`Historical Performance`)

### 3.5. Đề xuất mua hàng & Giải thích khuyến nghị (`Recommendation & Explainability`)
* Tổng hợp phương án mua hàng hoàn chỉnh cho từng đợt phân tích.
* Cung cấp tóm tắt giải thích lý do đề xuất bằng ngôn ngữ tự nhiên (`Natural Language Explanation`) hỗ trợ bởi mô hình ngôn ngữ dựa trên dữ liệu tính toán thực tế.

### 3.6. Xem xét & Phê duyệt quyết định mua (`Human Review & Decision`)
* Cho phép người dùng kiểm tra chi tiết từng dòng khuyến nghị.
* Cho phép điều chỉnh số lượng mua hoặc chọn lại `Supplier`.
* Phê duyệt đề xuất để chuyển thành đơn mua hàng.

---

## 4. Supporting Capabilities

Các năng lực hỗ trợ vận hành quy trình mua hàng khép kín:

### 4.1. Quản lý đơn mua hàng (`Purchase Order Management`)
* Tạo `Purchase Order (PO)` từ các đề xuất đã được phê duyệt.
* Theo dõi trạng thái đơn mua hàng (`Draft`, `Approved`, `Completed`).
* Xuất hoặc in đơn mua hàng để gửi cho nhà cung cấp.

### 4.2. Ghi nhận nhận hàng đơn giản (`Simple Goods Receipt`)
* Ghi nhận ngày giao hàng thực tế và số lượng thực nhận từ `Supplier`.
* Cập nhật số lượng vào `Current Inventory`.
* Hoàn tất trạng thái của `Purchase Order`.

### 4.3. Theo dõi hiệu suất nhà cung cấp (`Supplier Performance Tracking`)
* Ghi nhận lịch sử giao hàng: tỷ lệ giao đúng hạn (`On-time Rate`) và tỷ lệ giao đủ hàng (`Fulfillment Rate`).
* Cung cấp dữ liệu thực tế để cập nhật điểm đánh giá `Supplier` trong các đợt mua tiếp theo.

---

## 5. Out-of-Scope

Các nội dung cố ý không đưa vào project để kiểm soát độ phức tạp:

* **Bán hàng tại quầy (POS / Cashier) & E-commerce:** Hệ thống chỉ tiếp nhận dữ liệu bán hàng, không đảm nhận giao dịch bán lẻ.
* **Quản lý kho vật lý chuyên sâu (WMS):** Không quản lý vị trí ô kệ (bin/rack), không quét mã vạch (Barcode/RFID), không kiểm kê kho vật lý.
* **Quản lý hạn sử dụng chi tiết theo lô (`Batch / Expiry Tracking`):** Không phân lô hạn sử dụng chi tiết cho từng mặt hàng trong giai đoạn này.
* **Kế toán, Tài chính & Thanh toán:** Không quản lý công nợ chi tiết, hóa đơn thuế VAT và thanh toán trực tuyến cho nhà cung cấp.
* **Mô hình chuỗi đa cửa hàng (`Multi-store`):** Không xử lý bài toán điều chuyển hàng giữa các chi nhánh hay quản lý kho tổng trung tâm.
* **Mua hàng tự động hoàn toàn (`Autonomous Purchasing`):** Hệ thống không tự ý gửi đơn hay giao dịch mà không có sự xác nhận của người dùng.
* **Phân bổ đơn hàng đa nhà cung cấp phức tạp:** Một mặt hàng trong một lần đặt chỉ chọn một `Supplier` phù hợp nhất, không chia nhỏ đơn hàng cho nhiều bên cùng lúc.

---

## 6. System Boundary

| System Responsibility (DSS) | Human Responsibility (Store Manager / Purchasing Staff) |
| :--- | :--- |
| Thu thập & tổng hợp dữ liệu mua hàng | Chủ động kích hoạt đợt phân tích mua hàng |
| Dự báo nhu cầu bán lẻ (`Demand Forecast`) | Xem xét và đánh giá mức độ hợp lý của dự báo |
| Tính toán ngưỡng tồn kho & số lượng đề xuất | Tùy chỉnh số lượng đặt hàng nếu cần |
| Đánh giá & xếp hạng nhà cung cấp | Lựa chọn hoặc thay đổi nhà cung cấp |
| Tóm tắt lý do đề xuất (`Why Buy`) bằng ngôn ngữ tự nhiên | Phê duyệt tạo `Purchase Order` |
| Cập nhật tồn kho & chỉ số nhà cung cấp khi nhận hàng | Thực hiện kiểm đếm và ghi nhận nhận hàng |
