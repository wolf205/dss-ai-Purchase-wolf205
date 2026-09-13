# Mẫu Đặc Tả Domain Model (Domain Specification Template)

Tài liệu này cung cấp khung mẫu chuẩn mực để biên soạn tài liệu **Domain Model** (`docs/business/domain-model.md`) cho hệ thống DSS. Mọi tài liệu mô hình hóa miền nghiệp vụ chính thức đều phải tuân thủ cấu trúc này.

---

## Cấu Trúc Khung Mẫu Chuẩn

```markdown
# Mô Hình Miền Nghiệp Vụ (Domain Model Specification)

## AI-Powered Purchase Decision Support System for a Single Retail Store

---

## 1. Nguyên Tắc Thiết Kế Mô Hình Miền

* **Góc nhìn nghiệp vụ thuần túy (Conceptual Perspective):** Mô tả thực tế vận hành kinh doanh của cửa hàng bán lẻ, không chứa chi tiết lưu trữ kỹ thuật của CSDL.
* **Ngôn ngữ nghiệp vụ thống nhất (Ubiquitous Language):** Sử dụng các thuật ngữ đã chuẩn hóa từ Use Cases và Business Rules.
* **Bảo vệ tính toàn vẹn thông qua Business Invariants:** Mỗi thực thể đóng gói các quy tắc kinh doanh bất biến kế thừa từ 28 Business Rules.

---

## 2. Sơ Đồ Toàn Cảnh Mô Hình Miền (Domain Model Overview)

```mermaid
classDiagram
    %% Biểu diễn cấu trúc trực quan giữa các nhóm thực thể
    %% Sử dụng ký hiệu nghiệp vụ: Composition (*--), Association (-->)
    %% Ghi rõ Multiplicity: 1, 1..*, 0..1, *
```

---

## 3. Đặc Tả Chi Tiết Các Thực Thể Nghiệp Vụ (Domain Entities)

### 3.1. Nhóm Master Data (Dữ liệu Nền tảng)

#### Entity: [Tên Thực Thể, ví dụ: Product]
* **Tên thực thể:** [PascalCase, ví dụ: Product]
* **Khái niệm nghiệp vụ:** [Mô tả thực thể này đại diện cho cái gì trong đời thực của cửa hàng?]
* **Bảng Thuộc tính Khái niệm (Conceptual Attributes):**
  | Tên thuộc tính | Ý nghĩa nghiệp vụ | Đơn vị / Dạng dữ liệu khái niệm | Bắt buộc |
  | :--- | :--- | :--- | :---: |
  | `skuCode` | Mã định danh sản phẩm duy nhất | Chuỗi ký tự (Chữ, số, '-', '_') | Có |
  | `productName`| Tên thương mại của sản phẩm | Chuỗi văn bản | Có |
  | ... | ... | ... | ... |
* **Mối quan hệ nghiệp vụ (Relationships):**
  * Thuộc về `Category` (Bản số: `1..1`)
  * Được cung ứng bởi một hoặc nhiều `Supplier` thông qua `SupplyCondition` (Bản số: `1..*`)
* **Bất biến nghiệp vụ (Business Invariants):**
  * `INV-[Tên]-01`: [Mô tả quy tắc bất biến, ví dụ: Mã SKU bất biến sau khi tạo (kế thừa BR-17)].
  * `INV-[Tên]-02`: [Mô tả quy tắc, ví dụ: Không thể chuyển Inactive khi On-order > 0 (kế thừa BR-18)].
* **Vòng đời trạng thái (Lifecycle / Status):** (Nếu có, ví dụ `Active` / `Inactive`).

---

### 3.2. Nhóm Transactional & Lifecycle (Giao dịch & Vòng đời Mua hàng)
[Tương tự cấu trúc trên cho RecommendationSession, PurchaseOrder, POLineItem, GoodsReceipt...]

---

### 3.3. Nhóm Operational & Configuration (Vận hành & Cấu hình)
[Tương tự cấu trúc trên cho SalesRecord, InventorySnapshot, DSSConfiguration...]

---

## 4. Ma Trận Mối Quan Hệ & Bản Số (Relationship Matrix)

| Thực thể nguồn (Source) | Quan hệ (Relationship) | Thực thể đích (Target) | Bản số (Multiplicity) | Ý nghĩa nghiệp vụ |
| :--- | :---: | :--- | :---: | :--- |
| `Product` | Thuộc về | `Category` | $N : 1$ | Mỗi sản phẩm bắt buộc thuộc đúng 1 ngành hàng |
| `PurchaseOrder` | Chứa | `POLineItem` | $1 : N$ | Một đơn hàng gồm nhiều mặt hàng chi tiết |
| `PurchaseOrder` | Đặt tới | `Supplier` | $N : 1$ | Toàn bộ mặt hàng trong 1 PO đều thuộc về 1 NCC |
| ... | ... | ... | ... | ... |

---

## 5. Bảng Truy Vết Bất Biến Nghiệp Vụ (Invariants Traceability Matrix)

| Thực thể (Entity) | Mã Invariant | Nội dung quy tắc bảo vệ | Nguồn Business Rule kế thừa |
| :--- | :--- | :--- | :--- |
| `Product` | `INV-PROD-01` | Mã SKU bất biến toàn cục sau khi tạo | `BR-17` |
| `Product` | `INV-PROD-02` | Chặn Deactivate khi còn On-order > 0 | `BR-18` |
| `PurchaseOrder` | `INV-PO-01` | Vòng đời 3 trạng thái một chiều | `BR-06` |
| `GoodsReceipt` | `INV-GR-01` | Chỉ nhận PO Approved, nhận 1 lần duy nhất | `BR-11` |
| ... | ... | ... | ... |

---

## 6. Ranh Giới Chuyển Tiếp Sang Data Model (Handoff to Data Model)

* Tóm tắt các yêu cầu và lưu ý quan trọng mà kỹ sư thiết kế CSDL (Data Model) phải hiện thực hóa:
  * Cách biểu diễn các mối quan hệ nhiều-nhiều (thông qua thực thể nghiệp vụ hay bảng liên kết).
  * Các trường snapshot cần lưu giữ để bảo đảm tính toàn vẹn lịch sử (Snapshot giá, Lead Time, ngày giao dự kiến).
  * Các chỉ mục và ràng buộc CSDL cần thiết để bảo vệ Invariants.
```

---

## Tiêu Chí Đánh Giá Chất Lượng Domain Model (Quality Checklist)

1. **Tính hoàn chỉnh:** Toàn bộ 7 Use Cases và 28 Business Rules đều tìm thấy thực thể hoặc thuộc tính tương ứng phản ánh trong Domain Model.
2. **Không lẫn kỹ thuật CSDL:** Tuyệt đối không có kiểu dữ liệu SQL, không có khóa ngoại hay indexing.
3. **Bản số chính xác:** Bản số giữa các thực thể phản ánh đúng thực tế vận hành (ví dụ: 1 PO chỉ có 1 NCC, 1 PO nhận hàng 1 lần).
4. **Tính nhất quán của Invariants:** Các Invariants không mâu thuẫn với Business Rules và có thể kiểm chứng được.
