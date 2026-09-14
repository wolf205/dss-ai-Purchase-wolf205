---
trigger: model_decision
description: Quy tắc thiết kế Mô hình Dữ liệu Kỹ thuật (Data Model), chuẩn hóa CSDL quan hệ và chuyển hóa từ Domain Model sang Data Model
---

# Quy Tắc Thiết Kế Mô Hình Dữ Liệu (Data Modeling Rules)

## 1. Mục Đích & Vị Trí Trong Chuỗi Kỹ Thuật

Trong chuỗi chuyển tiếp một chiều được định nghĩa tại [GEMINI.md](../../GEMINI.md):
```text
Business Problem → Scope → Use Cases → Business Rules → Domain Model → [Data Model] → Architecture → Implementation
```

**Data Model (Mô hình Dữ liệu Kỹ thuật / Database Design)** là bước khởi đầu của **Giai đoạn Kỹ thuật (Technical Phase)**, đóng vai trò hiện thực hóa trực tiếp 13 thực thể khái niệm (`Domain Entities`) và 44 bất biến nghiệp vụ (`Business Invariants`) từ [docs/business/domain-model.md](../../docs/business/domain-model.md) thành cấu trúc cơ sở dữ liệu quan hệ vật lý chặt chẽ.

Mục tiêu cốt lõi:
* Xác lập cấu trúc bảng (`Tables`), cột (`Columns`), kiểu dữ liệu kỹ thuật (`Data Types`), và giá trị mặc định (`Defaults`).
* Thiết lập khóa chính (`Primary Keys`), khóa tự nhiên (`Natural Keys`), khóa ngoại (`Foreign Keys`), và toàn vẹn tham chiếu (`Referential Integrity`).
* Chuyển hóa toàn diện 44 Business Invariants thành các tầng ràng buộc kỹ thuật (`Constraints`, `Triggers`, `Application Transactions`).
* Quy định chính sách lưu thừa có kiểm soát (`Controlled Denormalization`) để bảo lưu tính bất biến lịch sử của giao dịch mua hàng (`Historical Snapshots`).
* Tối ưu hóa chỉ mục (`Indexes`) phục vụ các bài toán truy vấn và tính toán DSS cốt lõi.

---

## 2. Ranh Giới Kỹ Thuật: Domain Model vs Data Model

Agent bắt buộc phải phân định rạch ròi giữa hai tầng phân tích:

| Khía cạnh | Domain Model (Tầng trước - Nghiệp vụ) | Data Model (Tầng này - Kỹ thuật CSDL) |
| :--- | :--- | :--- |
| **Góc nhìn (Perspective)** | Nghiệp vụ thuần túy (Conceptual / Business) | Kỹ thuật lưu trữ CSDL (Logical / Physical Schema) |
| **Đối tượng mô tả** | 13 Khái niệm kinh doanh thực tế trong cửa hàng | Cấu trúc bảng (`Tables`) trong hệ quản trị CSDL quan hệ (PostgreSQL) |
| **Thuộc tính** | Ý nghĩa nghiệp vụ, kèm đơn vị đo (ngày, cái, VNĐ, %) | Tên cột (`snake_case`), Kiểu dữ liệu kỹ thuật (`BIGINT`, `NUMERIC(15,2)`, `TIMESTAMPTZ`, `VARCHAR(50)`) |
| **Định danh** | Mã định danh nghiệp vụ (`skuCode`, `supplierCode`, `poNumber`) | Khóa chính kỹ thuật (`id BIGINT GENERATED ALWAYS AS IDENTITY` hoặc `UUIDv7`) kèm khóa tự nhiên (`UNIQUE`) |
| **Mối quan hệ** | Khái niệm liên kết nghiệp vụ, bản số ($1..1$, $1..*$, $0..1$) | Khóa ngoại (`Foreign Key`), Ràng buộc tham chiếu (`ON DELETE RESTRICT` / `CASCADE`) |
| **Toàn vẹn dữ liệu** | 44 Business Invariants logic | Ràng buộc CSDL (`NOT NULL`, `CHECK`, `UNIQUE`, `EXCLUDE`), Database Triggers |
| **Bảo lưu lịch sử** | Nguyên tắc bất biến giá lịch sử tại thời điểm duyệt | Cột lưu thừa snapshot (`historical_unit_price`, `historical_moq`, `historical_lead_time_days`) |
| **Tối ưu hóa** | Không đề cập | Chiến lược đánh chỉ mục B-Tree (`INDEX`), Composite Index, Partial Index |

---

## 3. Quy Chuẩn Đặt Tên & Cấu Trúc (Naming Conventions)

1. **Quy tắc chữ viết:** Toàn bộ bảng, cột, khóa và chỉ mục phải sử dụng chữ thường nối gạch dưới (`snake_case`).
2. **Tên bảng:** Sử dụng danh từ số nhiều tiếng Anh phản ánh tập hợp dữ liệu:
   * *Đúng:* `products`, `suppliers`, `purchase_orders`, `sales_records`.
   * *Sai:* `product`, `tblProduct`, `Purchase_Order`, `dss_order_table`.
3. **Tên cột:** Sử dụng danh từ số ít tiếng Anh rõ nghĩa:
   * *Đúng:* `unit_price`, `committed_lead_time_days`, `reorder_point`, `current_inventory`.
   * *Sai:* `gia`, `price1`, `leadtime`, `curr_inv`.
4. **Tiền tố chuẩn hóa cho Constraints & Indexes:**
   * Khóa chính: `pk_<table>` (ví dụ: `pk_products`).
   * Khóa ngoại: `fk_<table>_<referenced_table>` (ví dụ: `fk_purchase_orders_suppliers`).
   * Ràng buộc duy nhất: `uq_<table>_<columns>` (ví dụ: `uq_products_sku_code`).
   * Ràng buộc kiểm tra: `chk_<table>_<description>` (ví dụ: `chk_products_current_inventory_non_negative`).
   * Chỉ mục tìm kiếm: `idx_<table>_<columns>` (ví dụ: `idx_sales_records_sku_id_sale_date`).

---

## 4. Quản Lý Khóa & Toàn Vẹn Tham Chiếu (Keys & Referential Integrity)

1. **Khóa chính kỹ thuật (Surrogate Primary Key):**
   * Mọi bảng bắt buộc có cột khóa chính kỹ thuật vô nghĩa `id` (`BIGINT GENERATED ALWAYS AS IDENTITY` hoặc `UUIDv7`) để tối ưu hóa hiệu năng index, quan hệ FK và phân trang.
2. **Khóa tự nhiên có ý nghĩa nghiệp vụ (Natural Business Key):**
   * Các mã nghiệp vụ (`sku_code`, `supplier_code`, `po_number`, `receipt_number`) vẫn được lưu trữ và bảo vệ nghiêm ngặt bằng ràng buộc `UNIQUE NOT NULL`.
3. **Chính sách khóa ngoại (`ON DELETE` Policy):**
   * **CẤM `ON DELETE CASCADE` trên các thực thể độc lập hoặc dữ liệu giao dịch:** Đối với `categories`, `products`, `suppliers`, `purchase_orders`, `goods_receipts` bắt buộc dùng `ON DELETE RESTRICT` để ngăn chặn việc xóa nhầm làm đứt gãy lịch sử kiểm toán và đối soát.
   * **CHỈ CHO PHÉP `ON DELETE CASCADE` trên bảng chi tiết phụ thuộc vòng đời cha:** Ví dụ `po_line_items` gắn liền với `purchase_orders`, `recommendation_items` gắn liền với `recommendation_sessions`.

---

## 5. Chuyển Hóa 44 Business Invariants Sang Cơ Chế Kỹ Thuật (3-Tier Enforcement)

Toàn bộ 44 Bất biến nghiệp vụ phải được phân bổ chính xác vào 3 tầng phòng thủ kỹ thuật:

```text
[Tier 1: Database Constraints] (Ưu tiên cao nhất, cản lỗi ngay tại tầng lưu trữ)
      ↓
[Tier 2: Database Triggers] (Dành cho logic đồng bộ trạng thái liên bảng)
      ↓
[Tier 3: Application Transaction Layer] (Dành cho xử lý nguyên tử Batch hoặc logic phức hợp)
```

1. **Tier 1 - Database Constraints (DDL Native):**
   * Các bất biến về miền giá trị, số dương, tỷ lệ %, tập trạng thái enum: Bắt buộc dùng `NOT NULL`, `CHECK`, `UNIQUE`.
   * *Ví dụ:* `CHECK (current_inventory >= 0)` (INV-05), `CHECK (moq >= 1)` (INV-12), `CHECK (status IN ('Active', 'Inactive'))` (INV-04).
2. **Tier 2 - Database Triggers (State Transition & Automatic Synchronization):**
   * Dành cho các bất biến liên quan đến tính toán và cập nhật chéo giữa các bảng khi có sự kiện ghi dữ liệu:
   * *Ví dụ:* Trigger đồng bộ `products.on_order_quantity` khi PO chuyển sang `Approved` hoặc `Cancelled` (INV-06, INV-27, INV-30); trigger cập nhật `products.current_inventory` và giải phóng `on_order_quantity` khi Goods Receipt được ghi nhận (INV-35, INV-36).
3. **Tier 3 - Application Transaction Layer (Atomic ACID Transactions):**
   * Dành cho các luồng nghiệp vụ phức hợp đa thực thể hoặc nạp dữ liệu hàng loạt:
   * *Ví dụ:* Cơ chế All-or-Nothing khi Import doanh số / kiểm kê hàng loạt (INV-14); kiểm tra điều kiện không còn PO `Approved` đang về trước khi cho phép Inactive SKU (INV-04).

---

## 6. Chính Sách Snapshot Bất Biến Lịch Sử (Historical Immutability)

Để giải quyết bài toán biến động giá, MOQ và Lead Time theo thời gian mà không làm sai lệch các đơn hàng trong quá khứ:

1. **Lưu thừa có kiểm soát (Controlled Denormalization):**
   * Tại thời điểm tạo hoặc phê duyệt giao dịch (`recommendation_items`, `po_line_items`, `purchase_orders`), hệ thống **bắt buộc phải sao chép trực tiếp các thông số hiện hành vào dòng giao dịch**:
     * `po_line_items`: `historical_unit_price`, `historical_moq`.
     * `purchase_orders`: `historical_lead_time_days`, `committed_delivery_date`.
2. **Không join ngược để lấy giá quá khứ:**
   * Tuyệt đối không được tính tổng tiền đơn PO cũ bằng cách `JOIN supply_conditions` hiện hành, vì giá nhà cung cấp có thể đã thay đổi sau thời điểm duyệt đơn.

---

## 7. Audit Trail & Quản Lý Trạng Thái (Auditability & Lifecycle)

1. **Audit Columns bắt buộc:**
   * Mọi bảng dữ liệu nền tảng và vận hành đều phải có 2 trường chuẩn ISO 8601:
     * `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
     * `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
2. **Không xóa vật lý tùy tiện (No Hard Deletes for Business Records):**
   * Dữ liệu danh mục nền tảng (`products`, `suppliers`, `supply_conditions`) sử dụng trường `status` (`Active`, `Inactive`, `Discontinued`) để quản lý vòng đời kinh doanh.
   * Dữ liệu giao dịch lịch sử (`purchase_orders`, `goods_receipts`, `sales_records`, `inventory_snapshots`) là dữ liệu kiểm toán bất biến, tuyệt đối không được xóa vật lý trong vận hành thông thường.

---

## 8. Chiến Lược Đánh Chỉ Mục (Indexing Strategy)

Các bảng trong DSS cần được đánh chỉ mục theo đúng đặc thù truy vấn nghiệp vụ:

1. **Chỉ mục khóa ngoại:** Mọi cột khóa ngoại tham chiếu (`sku_id`, `supplier_id`, `po_id`, `category_id`) bắt buộc phải có B-Tree Index để tối ưu phép JOIN.
2. **Chỉ mục chuỗi thời gian (Time-series Indexes):** Bảng `sales_records` và `inventory_snapshots` có khối lượng dòng lớn và được truy vấn theo dải thời gian nạp cho thuật toán AI dự báo:
   * Khuyến nghị Composite Index: `(sku_id, sale_date DESC)`.
3. **Chỉ mục lọc trạng thái (Status Filter Indexes):** Bảng `purchase_orders` thường xuyên truy vấn các đơn đang chờ nhận (`status = 'Approved'`):
   * Khuyến nghị Partial Index: `CREATE INDEX idx_po_approved ON purchase_orders (supplier_id) WHERE status = 'Approved'`.
