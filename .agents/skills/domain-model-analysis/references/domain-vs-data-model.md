# Tham Chiếu: Phân Định Ranh Giới Giữa Domain Model Và Data Model

Tài liệu này cung cấp cơ sở phương pháp luận để phân biệt rõ ràng giữa **Domain Model (Mô hình Miền Nghiệp vụ)** và **Data Model (Mô hình Dữ liệu Kỹ thuật)** trong quá trình phân tích và thiết kế hệ thống DSS.

---

## 1. Bản Chất Khác Biệt Giữa Hai Tầng

```text
Business Rules  ──>  [Domain Model]  ──>  [Data Model]  ──>  Architecture / Code
                       (Tầng này)          (Tầng sau)
```

* **Domain Model:** Trả lời câu hỏi *"Hệ thống quản lý những khái niệm và quy luật kinh doanh nào trong thế giới thực?"*
* **Data Model:** Trả lời câu hỏi *"Dữ liệu được lưu trữ, tổ chức và tối ưu như thế nào trong hệ quản trị cơ sở dữ liệu vật lý?"*

---

## 2. Bảng Đối Chiếu Song Song Chi Tiết

| Khía cạnh | Domain Model (Nghiệp vụ Khái niệm) | Data Model (Kỹ thuật CSDL) |
| :--- | :--- | :--- |
| **Đối tượng trung tâm** | **Domain Entity** (Khái niệm thực tế trong kinh doanh) | **Database Table / Collection** (Bảng lưu trữ vật lý) |
| **Thuộc tính** | **Business Attribute**<br>- Diễn đạt bằng ngôn ngữ kinh doanh.<br>- Kèm đơn vị đo thực tế: ngày, cái, VNĐ, tỷ lệ %.<br>- *Ví dụ:* `leadTime: 3 ngày`, `purchasePrice: 15.000 VNĐ`. | **Column / Field**<br>- Kiểu dữ liệu kỹ thuật: `INT`, `DECIMAL(12,2)`, `VARCHAR(50)`.<br>- Thuộc tính CSDL: `NOT NULL`, `DEFAULT 0`. |
| **Định danh đối tượng** | **Business Identifier**<br>- Mã định danh có ý nghĩa nghiệp vụ trong ngành.<br>- *Ví dụ:* `skuCode = 'MILK-001'`, `supplierCode = 'SUP-VINAMILK'`. | **Primary Key / Surrogate Key**<br>- Khóa nhân tạo phục vụ tối ưu chỉ mục CSDL.<br>- *Ví dụ:* `id INT AUTO_INCREMENT`, `id UUID`. |
| **Mối quan hệ** | **Domain Association / Composition**<br>- Bản chất liên kết thực tế: Sở hữu, phụ thuộc.<br>- *Ví dụ:* `PurchaseOrder` *chứa* các `POLineItem`; `Product` *thuộc về* `Category`. | **Foreign Key / Junction Table**<br>- Cơ chế tham chiếu vật lý: Cột `supplier_id FK`, bảng phụ `product_suppliers` nối N-N. |
| **Tính toàn vẹn** | **Business Invariants**<br>- Các quy tắc bất biến logic kinh doanh bảo vệ tính hợp lệ của thực thể.<br>- *Ví dụ:* Không được chuyển SKU sang Inactive khi On-order > 0 (`BR-18`). | **Database Constraints & Triggers**<br>- Ràng buộc CSDL: `CHECK (quantity > 0)`, `UNIQUE (date, sku_id)`, `FOREIGN KEY RESTRICT`. |
| **Snapshot dữ liệu** | **Historical Invariance Concept**<br>- Yêu cầu nghiệp vụ về việc đóng băng giá trị tại thời điểm giao dịch.<br>- *Ví dụ:* Đơn PO bảo lưu giá nhập tại thời điểm duyệt. | **Denormalization / Snapshot Columns**<br>- Lưu thừa dữ liệu có chủ đích trong bảng con: Cột `historical_unit_price` trong bảng `po_items`. |
| **Hành vi / Vòng đời** | **Domain Lifecycle**<br>- Chuỗi chuyển dịch trạng thái nghiệp vụ theo sự kiện đời thực (`Approved` $\rightarrow$ `Completed` / `Cancelled`). | **State Field Persistence**<br>- Cột `status VARCHAR(20)`, các cột audit log kỹ thuật: `created_at`, `updated_at`. |

---

## 3. Các Lỗi Thường Gặp Cần Tuyệt Đối Tránh (Anti-Patterns)

1. **Anti-pattern 1: Biến Domain Model thành bản sao của Database Schema**
   * *Biểu hiện:* Ghi kiểu dữ liệu SQL (`VARCHAR`, `INT`), định nghĩa khóa ngoại (`FK`) hay chỉ mục (`INDEX`) ngay trong tài liệu Domain Model.
   * *Khắc phục:* Chỉ mô tả bản chất nghiệp vụ và đơn vị đo, để dành quyết định chọn kiểu dữ liệu CSDL cho tầng Data Model.

2. **Anti-pattern 2: Tạo "Bảng nối kỹ thuật" không có ý nghĩa nghiệp vụ**
   * *Biểu hiện:* Tạo thực thể `Product_Supplier_Mapping` chỉ gồm 2 ID nối nhau.
   * *Khắc phục:* Trong kinh doanh, mối liên kết này đại diện cho một khái niệm thực tế là **Điều kiện Cung ứng (SupplyCondition)** hoặc **Báo giá (Quote)**, mang theo các thuộc tính quan trọng: Đơn giá nhập, Lead Time cam kết và MOQ.

3. **Anti-pattern 3: Đưa các trường Audit kỹ thuật vào Domain Model**
   * *Biểu hiện:* Ghi `is_deleted: boolean`, `created_by_user_id`, `version_lock` vào mọi Entity.
   * *Khắc phục:* Tầng Domain Model chỉ quan tâm đến trạng thái nghiệp vụ (ví dụ `Active` / `Inactive` của Sản phẩm, `Approved` / `Completed` của PO). Các trường metadata kỹ thuật sẽ được bổ sung ở tầng Data Model.

---

## 4. Cơ Chế Chuyển Tiếp Sang Tầng Data Model (Handoff)

Khi tài liệu `domain-model.md` được chốt:
1. Mỗi **Domain Entity** sẽ được xem xét ánh xạ thành 1 hoặc nhiều **Table** trong CSDL.
2. Mỗi **Business Attribute** sẽ được chọn **Data Type**, độ dài và tính chất `NULL / NOT NULL` tương ứng.
3. Mỗi **Business Invariant** sẽ được chuyển hóa thành các ràng buộc CSDL (`UNIQUE`, `CHECK`, `FOREIGN KEY ON DELETE RESTRICT`) hoặc logic kiểm soát ở tầng Data Access.
