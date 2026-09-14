# Tham Chiếu Ánh Xạ: Từ Domain Model Sang Data Model (Domain-to-Data Mapping Guide)

Tài liệu này hướng dẫn chi tiết cách chuyển hóa 13 Domain Entities và 44 Business Invariants từ [docs/business/domain-model.md](../../../../docs/business/domain-model.md) sang cấu trúc cơ sở dữ liệu quan hệ (PostgreSQL).

---

## 1. Bản Đồ Ánh Xạ 13 Domain Entities Sang Database Tables

### Nhóm 1: Master Data (Dữ liệu Nền tảng)

| Domain Entity | Database Table | Khóa Chính (PK) | Khóa Tự Nhiên (Natural Key) | Khóa Ngoại (FK) | Ghi Chú Kiến Trúc |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Category** | `categories` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `category_code VARCHAR(50) UNIQUE` | Không có | Ngành hàng cơ sở (`BR-20`, `INV-01`, `INV-02`). |
| **Product** | `products` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `sku_code VARCHAR(50) UNIQUE` | `category_id FK -> categories(id)` | Lưu `current_inventory`, `on_order_quantity`, `barcode UNIQUE` (`INV-03` đến `INV-08`). |
| **Supplier** | `suppliers` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `supplier_code VARCHAR(50) UNIQUE` | Không có | Quản lý `committed_lead_time_days` thống nhất và `otif_score` (`INV-09` đến `INV-11`). |
| **SupplyCondition** | `supply_conditions` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `UNIQUE (product_id, supplier_id)` | `product_id FK -> products(id)`<br>`supplier_id FK -> suppliers(id)` | Mối quan hệ N-N mang thuộc tính: `purchase_price`, `moq`, `status` (`INV-12`, `INV-13`). |

### Nhóm 2: Operational & Configuration (Vận hành & Cấu hình)

| Domain Entity | Database Table | Khóa Chính (PK) | Khóa Tự Nhiên (Natural Key) | Khóa Ngoại (FK) | Ghi Chú Kiến Trúc |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SalesRecord** | `sales_records` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `UNIQUE (product_id, sale_date)` | `product_id FK -> products(id)` | Dữ liệu bán hàng theo ngày; ghi đè khi import sửa sai (`INV-14` đến `INV-16`). |
| **InventorySnapshot** | `inventory_snapshots` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `UNIQUE (product_id, snapshot_date)` | `product_id FK -> products(id)` | Mốc kiểm kê thay thế tồn kho kệ; lưu `counted_quantity` (`INV-17` đến `INV-19`). |
| **DSSConfiguration** | `dss_configurations` | `id INT CHECK (id = 1)` | Singleton ID | Không có | Bảng 1 dòng duy nhất lưu bộ trọng số WSM (tổng 100%), Service Level, Review Period (`INV-20` đến `INV-22`). |

### Nhóm 3: Decision Core & Procurement Lifecycle (Động cơ Ra Quyết Định & Vòng Đời Mua Hàng)

| Domain Entity | Database Table | Khóa Chính (PK) | Khóa Tự Nhiên (Natural Key) | Khóa Ngoại (FK) | Ghi Chú Kiến Trúc |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RecommendationSession** | `recommendation_sessions` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `session_code VARCHAR(50) UNIQUE` | Không có | Phiên gợi ý mua hàng; lưu `status` (`Draft`, `Approved`, `Dismissed`), tổng ngân sách (`INV-23` đến `INV-24`). |
| **RecommendationItem** | `recommendation_items` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `UNIQUE (session_id, product_id)` | `session_id FK -> recommendation_sessions(id) ON DELETE CASCADE`<br>`product_id FK -> products(id)`<br>`selected_supplier_id FK -> suppliers(id)` | Chi tiết từng SKU gợi ý; lưu vết song song số liệu gốc vs số liệu chốt (`INV-25`, `INV-26`). |
| **PurchaseOrder** | `purchase_orders` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `po_number VARCHAR(50) UNIQUE` | `supplier_id FK -> suppliers(id) ON DELETE RESTRICT`<br>`session_id FK -> recommendation_sessions(id) NULL` | Đơn mua hàng; trạng thái 1 chiều (`Approved` $\rightarrow$ `Completed`/`Cancelled`), snapshot lead time (`INV-27` đến `INV-31`). |
| **POLineItem** | `po_line_items` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `UNIQUE (po_id, product_id)` | `po_id FK -> purchase_orders(id) ON DELETE CASCADE`<br>`product_id FK -> products(id) ON DELETE RESTRICT` | Dòng sản phẩm trên PO; lưu `historical_unit_price`, `historical_moq` snapshot (`INV-32` đến `INV-34`). |
| **GoodsReceipt** | `goods_receipts` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `receipt_number VARCHAR(50) UNIQUE` | `po_id FK UNIQUE -> purchase_orders(id) ON DELETE RESTRICT` | Phiếu nhận hàng đối soát 1:1 với PO; ghi nhận ngày nhận thực tế (`INV-35` đến `INV-40`). |
| **ReceiptLineItem** | `receipt_line_items` | `id BIGINT GENERATED ALWAYS AS IDENTITY` | `UNIQUE (receipt_id, product_id)` | `receipt_id FK -> goods_receipts(id) ON DELETE CASCADE`<br>`product_id FK -> products(id) ON DELETE RESTRICT` | Dòng chi tiết nhận; lưu `ordered_quantity`, `actual_received_quantity` (`INV-41` đến `INV-44`). |

---

## 2. Chiến Lược Xử Lý Các Mẫu Thiết Kế CSDL Đặc Thù

### 1. Bảng Singleton Toàn Hệ Thống (`dss_configurations`)
Để đảm bảo toàn bộ cửa hàng chỉ có duy nhất một bộ tham số cấu hình đang hoạt động mà không bị tạo trùng:
```sql
CREATE TABLE dss_configurations (
    id INT PRIMARY KEY DEFAULT 1,
    weight_price NUMERIC(5, 4) NOT NULL DEFAULT 0.4000,
    weight_lead_time NUMERIC(5, 4) NOT NULL DEFAULT 0.2500,
    weight_otif NUMERIC(5, 4) NOT NULL DEFAULT 0.2500,
    weight_moq NUMERIC(5, 4) NOT NULL DEFAULT 0.1000,
    default_service_level NUMERIC(5, 4) NOT NULL DEFAULT 0.9500,
    review_period_days INT NOT NULL DEFAULT 7,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_singleton_id CHECK (id = 1),
    CONSTRAINT chk_weights_sum CHECK (weight_price + weight_lead_time + weight_otif + weight_moq = 1.0000),
    CONSTRAINT chk_weights_positive CHECK (
        weight_price > 0 AND weight_lead_time > 0 AND weight_otif > 0 AND weight_moq > 0
    )
);
```

### 2. Snapshot Bất Biến Lịch Sử (Historical Immutability Pattern)
Để bảo toàn tính toàn vẹn của báo cáo chi phí và phân tích hiệu suất mua hàng, dòng đơn hàng `po_line_items` phải sao chép giá trị tại thời điểm duyệt:
```sql
CREATE TABLE po_line_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    po_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    historical_unit_price NUMERIC(15, 2) NOT NULL, -- Snapshot giá tại thời điểm chốt đơn
    historical_moq INT NOT NULL,                   -- Snapshot MOQ tại thời điểm chốt đơn
    total_line_amount NUMERIC(15, 2) GENERATED ALWAYS AS (quantity * historical_unit_price) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_po_line_items_po_product UNIQUE (po_id, product_id),
    CONSTRAINT chk_po_line_items_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_po_line_items_historical_price_positive CHECK (historical_unit_price > 0),
    CONSTRAINT chk_po_line_items_moq_satisfied CHECK (quantity >= historical_moq)
);
```

### 3. Đối Chiếu Khép Kín 1:1 Giữa PO Và Goods Receipt
Mỗi đơn PO đã `Approved` chỉ được nhận hàng duy nhất một lần (No Partial Delivery). Điều này được bảo vệ vật lý bằng ràng buộc `UNIQUE` trên khóa ngoại `po_id` của bảng `goods_receipts`:
```sql
CREATE TABLE goods_receipts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    po_id BIGINT NOT NULL UNIQUE REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    receipt_date DATE NOT NULL,
    delivery_status VARCHAR(20) NOT NULL, -- 'On-Time', 'Late'
    otif_score NUMERIC(5, 4) NOT NULL,    -- Điểm OTIF tính theo BR-13 [0.0000, 1.0000]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_delivery_status CHECK (delivery_status IN ('On-Time', 'Late')),
    CONSTRAINT chk_otif_score_range CHECK (otif_score >= 0.0000 AND otif_score <= 1.0000)
);
```

---

## 3. Ma Trận Phân Bổ 44 Business Invariants Sang 3 Tầng Kỹ Thuật

| Mã Invariant | Nội Dung Bất Biến Nghiệp Vụ | Tầng Thực Thi | Cơ Chế Kỹ Thuật Chi Tiết |
| :--- | :--- | :--- | :--- |
| **INV-01** | Category code duy nhất, không rỗng | Tier 1 (DB Constraint) | `UNIQUE NOT NULL` trên `categories(category_code)` |
| **INV-02** | Category name không rỗng | Tier 1 (DB Constraint) | `NOT NULL` trên `categories(category_name)` |
| **INV-03** | SKU code duy nhất toàn hệ thống | Tier 1 (DB Constraint) | `UNIQUE NOT NULL` trên `products(sku_code)` |
| **INV-04** | Status chỉ nhận 'Active' hoặc 'Inactive' | Tier 1 (DB Constraint) | `CHECK (status IN ('Active', 'Inactive'))` |
| **INV-05** | Tồn kho thực tế không âm ($\ge 0$) | Tier 1 (DB Constraint) | `CHECK (current_inventory >= 0)` |
| **INV-06** | Lượng hàng đang về không âm ($\ge 0$) | Tier 1 (DB Constraint) | `CHECK (on_order_quantity >= 0)` |
| **INV-07** | Ngành hàng bắt buộc tồn tại | Tier 1 (DB Constraint) | `category_id NOT NULL REFERENCES categories(id) ON DELETE RESTRICT` |
| **INV-08** | Cấm chuyển Inactive nếu On-order > 0 | Tier 3 (App/Transaction) | Validate trước khi UPDATE `status = 'Inactive'` |
| **INV-09** | Supplier code duy nhất | Tier 1 (DB Constraint) | `UNIQUE NOT NULL` trên `suppliers(supplier_code)` |
| **INV-10** | Lead Time cam kết là số nguyên dương ($\ge 1$) | Tier 1 (DB Constraint) | `CHECK (committed_lead_time_days >= 1)` |
| **INV-11** | Điểm OTIF nằm trong khoảng $[0.0, 1.0]$ | Tier 1 (DB Constraint) | `CHECK (otif_score >= 0.0000 AND otif_score <= 1.0000)` |
| **INV-12** | Đơn giá nhập và MOQ là số dương | Tier 1 (DB Constraint) | `CHECK (purchase_price > 0 AND moq >= 1)` |
| **INV-13** | Cặp (Product, Supplier) là duy nhất | Tier 1 (DB Constraint) | `UNIQUE (product_id, supplier_id)` trên `supply_conditions` |
| **INV-14** | All-or-Nothing khi Import doanh số | Tier 3 (App/Transaction) | Database Transaction `BEGIN ... COMMIT / ROLLBACK` |
| **INV-15** | Doanh số không âm ($\ge 0$) | Tier 1 (DB Constraint) | `CHECK (quantity_sold >= 0)` |
| **INV-16** | Khử trùng & Ghi đè doanh số theo ngày | Tier 1 (DB Constraint) | `UNIQUE (product_id, sale_date)` kèm `ON CONFLICT DO UPDATE` |
| **INV-17** | Số lượng kiểm đếm kho không âm ($\ge 0$) | Tier 1 (DB Constraint) | `CHECK (counted_quantity >= 0)` |
| **INV-18** | Snapshot kiểm kê duy nhất theo ngày | Tier 1 (DB Constraint) | `UNIQUE (product_id, snapshot_date)` trên `inventory_snapshots` |
| **INV-19** | Cập nhật đè tồn kho kệ khi nạp snapshot | Tier 2 (DB Trigger / App) | UPDATE `products.current_inventory = counted_quantity` |
| **INV-20** | Tổng 4 trọng số WSM bằng chính xác 1.0 | Tier 1 (DB Constraint) | `CHECK (weight_price + weight_lead_time + weight_otif + weight_moq = 1.0)` |
| **INV-21** | Từng trọng số WSM phải dương ($> 0$) | Tier 1 (DB Constraint) | `CHECK (weight_price > 0 AND weight_lead_time > 0 ...)` |
| **INV-22** | Service level thuộc $(0.5, 1.0)$, chu kỳ $\ge 1$ | Tier 1 (DB Constraint) | `CHECK (default_service_level > 0.50 AND review_period_days >= 1)` |
| **INV-23** | Mã phiên đề xuất duy nhất | Tier 1 (DB Constraint) | `UNIQUE NOT NULL` trên `recommendation_sessions(session_code)` |
| **INV-24** | Trạng thái phiên thuộc ('Draft', 'Approved', 'Dismissed') | Tier 1 (DB Constraint) | `CHECK (status IN ('Draft', 'Approved', 'Dismissed'))` |
| **INV-25** | Số lượng mua đề xuất gốc là số dương | Tier 1 (DB Constraint) | `CHECK (suggested_quantity > 0)` |
| **INV-26** | Số lượng chốt phải là bội số MOQ hoặc bằng 0 | Tier 1/3 (Constraint/App) | `CHECK (final_quantity >= 0 AND (final_quantity = 0 OR final_quantity % moq = 0))` |
| **INV-27** | PO sinh ra ở trạng thái 'Approved' | Tier 1 (DB Constraint) | `status VARCHAR(20) NOT NULL DEFAULT 'Approved'` |
| **INV-28** | Trạng thái PO chỉ nhận ('Approved', 'Completed', 'Cancelled') | Tier 1 (DB Constraint) | `CHECK (status IN ('Approved', 'Completed', 'Cancelled'))` |
| **INV-29** | Vòng đời trạng thái PO chuyển dịch 1 chiều | Tier 2/3 (Trigger/App) | Chặn UPDATE khi status hiện tại là `Completed` hoặc `Cancelled` |
| **INV-30** | Tự động đồng bộ On-order khi tạo/hủy PO | Tier 2 (DB Trigger) | Trigger AFTER INSERT/UPDATE trên `purchase_orders` |
| **INV-31** | Ngày giao dự kiến = Ngày duyệt + Lead Time | Tier 1 (DB Constraint/Col) | Cột `expected_delivery_date DATE NOT NULL` |
| **INV-32** | SKU trên PO phải thuộc danh mục cung ứng của NCC | Tier 3 (App Validation) | Kiểm tra `supply_conditions` trước khi lưu dòng PO |
| **INV-33** | Đơn giá và MOQ là giá trị Snapshot tại thời điểm duyệt | Tier 1 (DB Constraint) | Cột `historical_unit_price` và `historical_moq` NOT NULL |
| **INV-34** | Cấm sửa lẻ dòng sản phẩm trên PO | Tier 2/3 (Trigger/App) | Cấm `UPDATE/DELETE` trên `po_line_items` khi PO đã `Approved` |
| **INV-35** | Mỗi PO chỉ có đúng 1 phiếu nhận hàng (1:1) | Tier 1 (DB Constraint) | Khóa ngoại `po_id UNIQUE` trên `goods_receipts` |
| **INV-36** | Cập nhật tồn kho kệ và tất toán On-order khi nhận | Tier 2 (DB Trigger) | Trigger cập nhật `products` khi phát sinh `GoodsReceipt` |
| **INV-37** | Trạng thái PO chuyển sang 'Completed' khi nhận hàng | Tier 2 (DB Trigger) | Trigger đổi `purchase_orders.status = 'Completed'` |
| **INV-38** | Ngày nhận hàng không được nhỏ hơn ngày lập PO | Tier 1 (DB Constraint) | `CHECK (receipt_date >= po_created_date)` |
| **INV-39** | Trạng thái giao hàng chỉ nhận 'On-Time' hoặc 'Late' | Tier 1 (DB Constraint) | `CHECK (delivery_status IN ('On-Time', 'Late'))` |
| **INV-40** | Điểm OTIF phiếu nhận thuộc $[0.0, 1.0]$ | Tier 1 (DB Constraint) | `CHECK (otif_score >= 0.0000 AND otif_score <= 1.0000)` |
| **INV-41** | Danh sách SKU nhận hàng khớp 1:1 với dòng PO | Tier 3 (App Validation) | Đối chiếu tập SKU của `goods_receipt` với `purchase_order` |
| **INV-42** | Số lượng thực nhận là số nguyên không âm ($\ge 0$) | Tier 1 (DB Constraint) | `CHECK (actual_received_quantity >= 0)` |
| **INV-43** | Số lượng đặt được bảo lưu từ đơn PO gốc | Tier 1 (DB Constraint) | Cột `ordered_quantity NOT NULL` |
| **INV-44** | Cập nhật phong độ OTIF 5 đơn gần nhất của NCC | Tier 2/3 (Trigger/App) | Tính lại trung bình trượt 5 đơn `goods_receipts` gần nhất |
