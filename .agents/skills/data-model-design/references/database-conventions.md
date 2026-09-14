# Tiêu Chuẩn & Quy Ước Thiết Kế Cơ Sở Dữ Liệu (Database Design Conventions)

Tài liệu này quy định các tiêu chuẩn kỹ thuật bắt buộc khi thiết kế cơ sở dữ liệu quan hệ (PostgreSQL) cho hệ thống DSS.

---

## 1. Hệ Quản Trị Cơ Sở Dữ Liệu & Quy Chuẩn Dialect

* **Hệ quản trị CSDL mục tiêu:** PostgreSQL 16+
* **Chuẩn mã hóa:** `UTF-8`
* **Múi giờ lưu trữ:** Chuẩn `UTC` thông qua kiểu dữ liệu `TIMESTAMPTZ`.

---

## 2. Quy Chuẩn Đặt Tên (Naming Conventions)

### 2.1 Bảng (Tables)
* Luôn sử dụng chữ thường nối gạch dưới (`snake_case`).
* Luôn sử dụng danh từ số nhiều tiếng Anh đại diện cho tập hợp dữ liệu:
  * *Ví dụ chuẩn:* `categories`, `products`, `suppliers`, `supply_conditions`, `sales_records`, `inventory_snapshots`, `purchase_orders`, `po_line_items`, `goods_receipts`, `receipt_line_items`, `recommendation_sessions`, `recommendation_items`, `dss_configurations`.
* Cấm dùng tiền tố kiểu cũ: `tbl_`, `tblProduct`, `table_products`.

### 2.2 Cột (Columns)
* Luôn sử dụng chữ thường nối gạch dưới (`snake_case`).
* Sử dụng danh từ số ít tiếng Anh rõ nghĩa:
  * Khóa chính kỹ thuật: luôn đặt tên là `id`.
  * Khóa ngoại: luôn đặt tên theo mẫu `<referenced_singular_table>_id` (ví dụ: `product_id`, `supplier_id`, `po_id`, `category_id`).
  * Cột số lượng: gắn hậu tố `_quantity` hoặc `_count` (ví dụ: `current_inventory`, `on_order_quantity`, `actual_received_quantity`, `quantity_sold`).
  * Cột đơn giá: gắn hậu tố `_price` hoặc `_amount` (ví dụ: `purchase_price`, `historical_unit_price`, `total_line_amount`).
  * Cột thời gian đo bằng ngày: gắn hậu tố `_days` (ví dụ: `committed_lead_time_days`, `review_period_days`).
  * Cột điểm số hoặc trọng số: gắn hậu tố `_score` hoặc tiền tố `weight_` (ví dụ: `otif_score`, `weight_price`).
  * Cột ngày trong lịch kinh doanh: gắn hậu tố `_date` (ví dụ: `sale_date`, `snapshot_date`, `receipt_date`, `expected_delivery_date`).
  * Cột audit timestamps: chuẩn hóa thành `created_at` và `updated_at`.

### 2.3 Ràng Buộc (Constraints) & Chỉ Mục (Indexes)
Tuân thủ nghiêm ngặt bảng tiền tố:

| Loại Đối Tượng | Tiền Tố | Cú Pháp Đặt Tên Chuẩn | Ví Dụ |
| :--- | :--- | :--- | :--- |
| **Primary Key** | `pk_` | `pk_<table>` | `pk_products` |
| **Foreign Key** | `fk_` | `fk_<table>_<referenced_table>` | `fk_po_line_items_purchase_orders` |
| **Unique Constraint** | `uq_` | `uq_<table>_<column(s)>` | `uq_products_sku_code`, `uq_supply_conditions_product_supplier` |
| **Check Constraint** | `chk_` | `chk_<table>_<rule_description>` | `chk_products_inventory_non_negative`, `chk_suppliers_lead_time_positive` |
| **Index** | `idx_` | `idx_<table>_<column(s)>` | `idx_sales_records_product_date` |

---

## 3. Tiêu Chuẩn Kiểu Dữ Liệu (Data Types Standard)

| Ý Nghĩa Nghiệp Vụ | Kiểu Dữ Liệu PostgreSQL | Ràng Buộc Đi Kèm | Lý Do Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| **Khóa chính kỹ thuật** | `BIGINT GENERATED ALWAYS AS IDENTITY` | `PRIMARY KEY` | Khóa số 64-bit tự tăng tuần tự, tối ưu dung lượng B-Tree Index và phép JOIN. |
| **Mã định danh nghiệp vụ** | `VARCHAR(50)` | `NOT NULL UNIQUE` | Độ dài tối ưu cho mã SKU, mã nhà cung cấp, số chứng từ (`MILK-001`, `SUP-VINAMILK`, `PO-20260913-001`). |
| **Tên đối tượng** | `VARCHAR(100)` đến `VARCHAR(255)` | `NOT NULL` | Tên sản phẩm, tên nhà cung cấp, tên ngành hàng. |
| **Đơn vị tính** | `VARCHAR(30)` | `NOT NULL` | Ví dụ: `Hộp`, `Chai`, `Gói`, `Thùng`. |
| **Tiền tệ (VNĐ)** | `NUMERIC(15, 2)` | `NOT NULL CHECK (... > 0)` | Tránh triệt để sai số làm tròn của số thực dấu phẩy động (`FLOAT`). Hỗ trợ giá trị tiền tệ lớn. |
| **Số lượng hàng hóa** | `INTEGER` | `NOT NULL CHECK (... >= 0)` | Hàng hóa bán lẻ đơn lẻ tính theo đơn vị nguyên chiếc/hộp. |
| **Trọng số & Tỷ lệ %** | `NUMERIC(5, 4)` | `NOT NULL CHECK (... >= 0)` | Độ chính xác 4 chữ số thập phân (ví dụ: `0.4000 = 40%`, `0.9500 = 95%`). |
| **Điểm OTIF** | `NUMERIC(5, 4)` | `NOT NULL CHECK (otif_score BETWEEN 0.0 AND 1.0)` | Điểm số chuẩn hóa trong miền $[0.0, 1.0]$. |
| **Trạng thái nghiệp vụ** | `VARCHAR(20)` | `NOT NULL CHECK (status IN (...))` | Dễ đọc trực quan trong DB client, dễ truy vấn mà không bị phụ thuộc phức tạp vào `ENUM` khi migrate. |
| **Ngày lịch nghiệp vụ** | `DATE` | `NOT NULL` | Ngày bán hàng, ngày kiểm kê, ngày nhận hàng (không kèm giờ). |
| **Thời điểm hệ thống** | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Lưu trữ mốc thời gian kèm múi giờ UTC, tự động chuyển đổi theo client. |
| **Văn bản mô tả / Giải thích** | `TEXT` | `NULL` hoặc `NOT NULL` | Giải thích AI (`ai_explanation`), lý do hủy đơn, ghi chú. |

---

## 4. Chính Sách Toàn Vẹn Tham Chiếu (Referential Integrity Policy)

1. **Nguyên tắc mặc định: `ON DELETE RESTRICT`**
   * Mọi quan hệ liên kết đến Master Data (`categories`, `products`, `suppliers`) bắt buộc phải dùng `ON DELETE RESTRICT`.
   * *Mục đích:* Ngăn chặn tuyệt đối việc vô tình xóa một SKU hay NCC đang có ràng buộc dữ liệu lịch sử trên đơn hàng hoặc doanh số bán.
2. **Ngoại lệ duy nhất: `ON DELETE CASCADE`**
   * Chỉ áp dụng cho các bảng con phụ thuộc 100% vào sự tồn tại của bảng cha (quan hệ sở hữu Composition):
     * `po_line_items` $\rightarrow$ `purchase_orders`
     * `receipt_line_items` $\rightarrow$ `goods_receipts`
     * `recommendation_items` $\rightarrow$ `recommendation_sessions`
   * *Mục đích:* Khi hủy/xóa một phiên đề xuất nháp (`recommendation_sessions`), toàn bộ các dòng chi tiết con được tự động dọn dẹp sạch sẽ.

---

## 5. Chiến Lược Đánh Chỉ Mục (Indexing Best Practices)

1. **Khóa ngoại luôn có Index:**
   * Mọi cột khóa ngoại `_id` phải được tạo B-Tree Index riêng biệt:
     ```sql
     CREATE INDEX idx_products_category_id ON products(category_id);
     CREATE INDEX idx_supply_conditions_product_id ON supply_conditions(product_id);
     CREATE INDEX idx_supply_conditions_supplier_id ON supply_conditions(supplier_id);
     CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
     ```
2. **Composite Index cho truy vấn dải thời gian:**
   * Áp dụng quy tắc vàng: Cột đẳng thức (`=`) đứng trước, cột khoảng/sắp xếp (`BETWEEN`, `ORDER BY DESC`) đứng sau:
     ```sql
     CREATE INDEX idx_sales_records_product_date ON sales_records(product_id, sale_date DESC);
     CREATE INDEX idx_inventory_snapshots_product_date ON inventory_snapshots(product_id, snapshot_date DESC);
     ```
3. **Partial Index cho hàng đợi công việc:**
   * Chỉ đánh chỉ mục trên tập dữ liệu nhỏ cần lọc thường xuyên:
     ```sql
     CREATE INDEX idx_purchase_orders_approved ON purchase_orders(supplier_id, created_at)
     WHERE status = 'Approved';
     ```
