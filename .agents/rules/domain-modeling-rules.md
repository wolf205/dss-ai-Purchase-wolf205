---
trigger: model_decision
description: Quy tắc mô hình hóa Domain Model nghiệp vụ, phân định rạch ròi giữa Domain Model và Data Model CSDL
---

# Quy Tắc Mô Hình Hóa Domain Model (Domain Modeling Rules)

## 1. Mục Đích & Vị Trí Trong Chuỗi Phân Tích

Trong chuỗi phân tách các tầng của hệ thống:
```text
Business Problem → Scope → Use Cases → Business Rules → [Domain Model] → Data Model → Architecture → Implementation
```

**Domain Model (Mô hình Miền nghiệp vụ)** là cầu nối trực tiếp chuyển hóa các chính sách và quy tắc tính toán (`Business Rules`) cùng các tương tác của Actor (`Use Cases`) thành một bức tranh cấu trúc khái niệm rõ ràng, logic và nhất quán.

Mục tiêu chính:
* Định danh các thực thể nghiệp vụ cốt lõi (**Domain Entities**) và thuộc tính khái niệm (**Attributes**).
* Xác lập các mối quan hệ nghiệp vụ (**Relationships**) và bản số (**Multiplicity**).
* Đóng gói các bất biến nghiệp vụ (**Business Invariants**) đảm bảo dữ liệu luôn hợp lệ theo quy tắc kinh doanh.

---

## 2. Ranh Giới Cốt Lõi: Domain Model vs Data Model

Để đảm bảo nguyên tắc phân tách các tầng tại `GEMINI.md`, Agent bắt buộc phải tuân thủ phân định rạch ròi:

| Tiêu chí | Domain Model (Tầng hiện tại) | Data Model (Tầng tiếp theo) |
| :--- | :--- | :--- |
| **Góc nhìn (Perspective)** | Nghiệp vụ thuần túy (Conceptual / Business) | Kỹ thuật lưu trữ CSDL (Logical / Physical Schema) |
| **Đối tượng mô tả** | Các khái niệm kinh doanh thực tế trong cửa hàng | Cấu trúc bảng (Tables) trong hệ quản trị CSDL |
| **Thuộc tính** | Ý nghĩa nghiệp vụ, đơn vị đo thực tế (ví dụ: ngày, VNĐ, số lượng) | Tên cột (Column name), Kiểu dữ liệu SQL (`INT`, `VARCHAR(50)`, `DECIMAL(12,2)`) |
| **Mối quan hệ** | Khái niệm liên kết nghiệp vụ (ví dụ: Đơn hàng thuộc về Nhà cung cấp) | Cơ chế kỹ thuật: Khóa chính (`PK`), Khóa ngoại (`FK`), Bảng liên kết (`Junction Table`) |
| **Toàn vẹn dữ liệu** | Business Invariants (Quy tắc nghiệp vụ không bao giờ bị vi phạm) | Database Constraints (`NOT NULL`, `CHECK`, `UNIQUE`, `CASCADE DELETE`) |
| **Chỉ mục & Tối ưu** | Không đề cập | `INDEX`, Partitioning, Sharding, B-Tree |

---

## 3. Quy Tắc Ngôn Ngữ Nghiệp Vụ Thống Nhất (Ubiquitous Language)

1. **Sử dụng thuật ngữ tiếng Anh chuẩn mực:**
   * Tên Entity: Danh từ số ít, viết hoa chữ cái đầu (PascalCase), ví dụ: `Product`, `Supplier`, `PurchaseOrder`, `GoodsReceipt`, `RecommendationSession`.
   * Tên Thuộc tính: Viết rõ nghĩa theo ngôn ngữ kinh doanh (camelCase hoặc Snake_case có chú thích rõ), ví dụ: `purchasePrice`, `committedLeadTime`, `reorderPoint`.
2. **Không thay đổi tùy tiện terminology:**
   * Giữ vững các thuật ngữ đã thống nhất từ Use Cases và Business Rules (`SKU`, `MOQ`, `Lead Time`, `Safety Stock`, `On-order`, `OTIF`).

---

## 4. Tuyệt Đối Cấm Các Yếu Tố Kỹ Thuật (No Technical Bloat)

Khi đặc tả hoặc thảo luận về Domain Model, **tuyệt đối không được chứa**:
* Cú pháp SQL (`CREATE TABLE`, `ALTER TABLE`, `SELECT...`).
* Kiểu dữ liệu lập trình hoặc CSDL cụ thể (`VARCHAR`, `BIGINT`, `TIMESTAMP WITH TIME ZONE`, `FLOAT8`, `boolean`).
* Khái niệm lưu trữ kỹ thuật: `Foreign Key`, `Primary Key`, `Auto-increment ID`, `Index`, `ORM Annotation` (`@Entity`, `@Column`).
* Chi tiết giao diện hoặc API: DTO, Request/Response payload, HTTP status, UI Component.

---

## 5. Bảo Vệ Tính Toàn Vẹn & Bất Biến Nghiệp Vụ (Business Invariants)

Mỗi Domain Entity không chỉ là một cấu trúc dữ liệu bị động mà phải gắn liền với các **Bất biến nghiệp vụ (Business Invariants)** kế thừa từ 28 Business Rules (`BR-01` đến `BR-28`):
* *Ví dụ Product:* Mã SKU là bất biến sau khi tạo (`BR-17`); không thể Inactive khi On-order > 0 (`BR-18`).
* *Ví dụ PurchaseOrder:* Vòng đời trạng thái chỉ chuyển dịch 1 chiều `Approved` $\rightarrow$ `Completed` / `Cancelled`, không thể đảo ngược (`BR-06`).
* *Ví dụ GoodsReceipt:* Chỉ phát sinh đúng 1 lần cho một PO `Approved` (`BR-11`); số lượng thực nhận cập nhật tồn kho và giải phóng đúng số lượng đặt On-order (`BR-12`).

---

## 6. Mối Quan Hệ Nghiệp Vụ & Bản Số (Multiplicity)

Khi xác định mối quan hệ giữa các thực thể:
* Chỉ mô tả quan hệ tự nhiên trong đời thực của cửa hàng bán lẻ:
  * Một `PurchaseOrder` thuộc về đúng một `Supplier` ($1..1$), và chứa một hoặc nhiều `POLineItem` ($1..*$).
  * Một `Product` có thể được cung ứng bởi một hoặc nhiều `Supplier` thông qua điều kiện `SupplyCondition` ($1..*$).
* Không tự ý tạo thêm các "Bảng nối kỹ thuật" thuần túy nếu không đại diện cho một khái niệm nghiệp vụ có thuộc tính thực tế (như `SupplyCondition` đại diện cho Báo giá / Điều kiện thương mại giữa NCC và SKU).
