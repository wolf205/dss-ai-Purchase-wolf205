# Mẫu Đặc Tả Mô Hình Dữ Liệu Kỹ Thuật (Data Model Specification Template)

> [!NOTE]
> Mẫu này là khung chuẩn mực bắt buộc để xây dựng tài liệu chính thức `docs/technical/data-model.md`. Mọi bảng, cột, khóa, ràng buộc và chỉ mục phải tuân thủ nghiêm ngặt cấu trúc dưới đây.

---

```markdown
# Đặc Tả Mô Hình Dữ Liệu Kỹ Thuật (Data Model Specification)

## AI-Powered Purchase Decision Support System for a Single Retail Store

* **Dự án:** Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Ứng Dụng Trí Tuệ Nhân Tạo Cho Cửa Hàng Bán Lẻ Đơn Lẻ
* **Hệ quản trị CSDL mục tiêu:** PostgreSQL 16+
* **Trạng thái:** Status: Proposed / Confirmed
* **Phiên bản:** 1.0 (Official Technical Specification)
* **Nguồn sự thật kế thừa:** [docs/business/domain-model.md](../business/domain-model.md), [docs/business/business-rules.md](../business/business-rules.md), và [docs/project-decisions.md](../project-decisions.md).

---

## 1. Nguyên Tắc Thiết Kế Cơ Sở Dữ Liệu

1. **Chuẩn hóa quan hệ & Lưu thừa có kiểm soát:**
   - Đạt chuẩn 3NF trên Master Data để đảm bảo tính toàn vẹn.
   - Áp dụng Denormalization có kiểm soát tại các bảng chi tiết giao dịch (`po_line_items`, `purchase_orders`) để lưu vết snapshot giá, MOQ và Lead Time tại thời điểm chốt.
2. **Kiểu dữ liệu kỹ thuật chuẩn xác:**
   - Tiền tệ và điểm số dùng `NUMERIC(p, s)` (tuyệt đối không dùng float).
   - Mốc thời gian dùng `TIMESTAMPTZ` (UTC).
   - Khóa chính kỹ thuật dùng `BIGINT GENERATED ALWAYS AS IDENTITY`.
3. **Phòng thủ dữ liệu đa tầng (Defense-in-Depth):**
   - Chuyển hóa tối đa 44 Business Invariants thành các ràng buộc DDL native (`NOT NULL`, `CHECK`, `UNIQUE`, `FOREIGN KEY RESTRICT`).

---

## 2. Sơ Đồ Thực Thể Liên Kết Toàn Cảnh (Database ERD)

[Chèn sơ đồ Mermaid erDiagram đầy đủ 13 tables và các quan hệ 1-1, 1-N, N-N]

---

## 3. Đặc Tả Chi Tiết Các Bảng CSDL (Schema Data Dictionary)

### 3.1 Phân Vùng 1: Dữ Liệu Nền Tảng (Master Data)

#### 3.1.1 Bảng `categories`
* **Mô tả nghiệp vụ:** Lưu trữ các ngành hàng phân loại sản phẩm.
* **Kế thừa:** `Category` Entity, `BR-20`, `INV-01`, `INV-02`.

| Tên Cột | Kiểu Dữ Liệu | Nullable | Mặc Định | Ràng Buộc / Khóa | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `NOT NULL` | `IDENTITY` | `PK` | Khóa chính kỹ thuật |
| `category_code` | `VARCHAR(50)` | `NOT NULL` | | `UNIQUE` | Mã ngành hàng nghiệp vụ |
| `category_name` | `VARCHAR(100)` | `NOT NULL` | | | Tên gọi ngành hàng |
| `description` | `TEXT` | `NULL` | | | Mô tả chi tiết |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | | Thời điểm tạo bản ghi |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `NOW()` | | Thời điểm cập nhật cuối |

* **Danh sách Ràng buộc (Constraints):**
  - `pk_categories`: `PRIMARY KEY (id)`
  - `uq_categories_code`: `UNIQUE (category_code)`
* **Chỉ mục (Indexes):**
  - `idx_categories_code`: B-Tree trên `(category_code)`

[Tiếp tục đặc tả chi tiết cho products, suppliers, supply_conditions]

---

### 3.2 Phân Vùng 2: Dữ Liệu Vận Hành & Cấu Hình (Operational & Configuration)

[Đặc tả chi tiết cho sales_records, inventory_snapshots, dss_configurations]

---

### 3.3 Phân Vùng 3: Vòng Đời Mua Hàng & Khép Kín (Procurement Lifecycle & Decision Core)

[Đặc tả chi tiết cho recommendation_sessions, recommendation_items, purchase_orders, po_line_items, goods_receipts, receipt_line_items]

---

## 4. Ma Trận Ánh Xạ & Thực Thi 44 Business Invariants

| Mã Invariant | Bảng CSDL Liên Quan | Cột / Thuộc Tính | Tầng Kỹ Thuật | Chi Tiết Cú Pháp Ràng Buộc / Cơ Chế |
| :--- | :--- | :--- | :--- | :--- |
| `INV-01` | `categories` | `category_code` | Tier 1 (DB Constraint) | `UNIQUE NOT NULL` |
| ... | ... | ... | ... | ... |
| `INV-44` | `suppliers` | `otif_score` | Tier 2/3 (Trigger/App) | Trung bình trượt 5 đơn `goods_receipts` gần nhất |

---

## 5. Kế Hoạch Đánh Chỉ Mục & Tối Ưu Hiệu Năng (Indexing Strategy)

### 5.1 Chỉ Mục Khóa Ngoại (Foreign Key Indexes)
* Tự động tạo B-Tree Index cho toàn bộ các cột FK để tối ưu các thao tác JOIN dữ liệu.

### 5.2 Chỉ Mục Chuỗi Thời Gian (Time-series Indexes)
* Bảng `sales_records`: `idx_sales_records_sku_date` trên `(product_id, sale_date DESC)`.
* Bảng `inventory_snapshots`: `idx_inventory_snapshots_sku_date` trên `(product_id, snapshot_date DESC)`.

### 5.3 Chỉ Mục Lọc Trạng Thái Một Phần (Partial Indexes)
* Bảng `purchase_orders`: `idx_po_approved_orders` trên `(supplier_id, created_at)` WHERE `status = 'Approved'`.

---

## 6. Tập Lệnh Khởi Tạo DDL Tham Chiếu (Reference Schema DDL Script)

```sql
-- DDL Schema khởi tạo hoàn chỉnh cho PostgreSQL
```
```
