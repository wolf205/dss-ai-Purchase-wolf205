---
description: Finalize Data Model Workflow
---

# Finalize Data Model Workflow

## 1. Điều Kiện Bắt Đầu

Chỉ chạy workflow này khi:
* Tài liệu Mô hình Miền ([domain-model.md](../../docs/business/domain-model.md) với 13 thực thể và 44 bất biến) đã được xác nhận chốt (`Status: Confirmed`).
* Tài liệu Quy tắc nghiệp vụ ([business-rules.md](../../docs/business/business-rules.md) với 28 BRs) đã hoàn thiện.
* Cấu trúc bảng CSDL (`Tables`), các cột (`Columns`), kiểu dữ liệu (`Data Types`), các khóa (`PK`, `FK`, `Unique`), và cơ chế chuyển hóa Invariants sang Constraints đã được thảo luận và làm rõ cùng người dùng.

Không dùng workflow này để thay thế quá trình phân tích và trao đổi thiết kế kỹ thuật cơ sở dữ liệu.

---

## 2. Đọc Context

Đọc các tài liệu bắt buộc:

```text
docs/business/domain-model.md
docs/business/business-rules.md
docs/project-decisions.md
.agents/rules/data-modeling-rules.md
.agents/skills/data-model-design/references/domain-to-data-mapping.md
.agents/skills/data-model-design/references/database-conventions.md
.agents/skills/data-model-design/references/data-model-specification-template.md
```

---

## 3. Tóm Tắt Final Understanding Về Data Model

Tổng hợp và xác nhận các nội dung kỹ thuật sau khi đã thảo luận và thống nhất cùng người dùng:
* **Danh sách 13 Tables chính thức:** Phân bổ đồng bộ theo 3 Bounded Contexts (Master Data: 4 bảng; Operational & Config: 3 bảng; Procurement Lifecycle & Decision Core: 6 bảng).
* **Sơ đồ Thực thể Liên kết (Mermaid erDiagram):** Biểu diễn toàn cảnh các quan hệ, khóa chính `PK`, khóa ngoại `FK` và bản số liên kết.
* **Đặc tả chi tiết từng bảng (Data Dictionary):** Tên cột, kiểu dữ liệu PostgreSQL chuẩn xác, nullability, default values và ý nghĩa nghiệp vụ.
* **Ma trận truy vết 44 Business Invariants:** Phân bổ rõ ràng từng invariant thành DB Constraints (`CHECK`, `UNIQUE`, `NOT NULL`), DB Triggers hoặc Application Transaction checks.
* **Chiến lược Đánh chỉ mục (Indexing Strategy):** Danh mục các chỉ mục khóa ngoại, chỉ mục chuỗi thời gian composite và chỉ mục lọc trạng thái một phần (partial indexes).
* **Script DDL khởi tạo (Reference DDL Script):** Mã SQL khởi tạo cấu trúc CSDL hoàn chỉnh.

---

## 4. Kiểm Tra Tính Nhất Quán (Consistency & Feedback Loop)

Kiểm tra:
* Có bảng hoặc cột nào mâu thuẫn với 13 thực thể và thuộc tính trong [domain-model.md](../../docs/business/domain-model.md) không?
* Có bất kỳ Business Invariant nào trong số 44 Invariants bị bỏ sót hoặc chưa có cơ chế thực thi kỹ thuật không?
* Các trường Snapshot giá và điều kiện lịch sử (`historical_unit_price`, `historical_moq`, `historical_lead_time_days`) đã được đưa vào bảng giao dịch chưa?
* Khóa ngoại đã tuân thủ đúng chính sách `ON DELETE RESTRICT` (mặc định) và `CASCADE` (chỉ cho bảng con phụ thuộc vòng đời) chưa?
* Kiểu dữ liệu tiền tệ và điểm số có đảm bảo không dùng số thực dấu phẩy động (`FLOAT`) không?

---

## 5. User Validation (Confirmation Gate)

Trình bày bản tóm tắt Final Understanding cho người dùng theo mẫu:

```text
Proposed Final Understanding for Data Model:
1. Danh sách 13 Tables phân bổ theo 3 Bounded Contexts.
2. Sơ đồ Mermaid erDiagram quan hệ CSDL và toàn vẹn tham chiếu.
3. Bảng đặc tả chi tiết Schema (Columns, Types, Defaults, Constraints).
4. Ma trận chuyển hóa 44 Business Invariants sang 3 tầng phòng thủ kỹ thuật.
5. Kế hoạch đánh chỉ mục tối ưu hiệu năng cho AI forecast và DSS engine.

Remaining Uncertainty:
None
```

**Chưa tạo hoặc cập nhật tài liệu chính thức nếu người dùng chưa xác nhận chốt.**

---

## 6. Tạo Tài Liệu Chính Thức

Sau khi được người dùng xác nhận:

Tạo hoặc cập nhật tài liệu duy nhất:

```text
docs/technical/data-model.md
```

Tài liệu phải tuân thủ chuẩn cấu trúc đặc tả tại [data-model-specification-template.md](../skills/data-model-design/references/data-model-specification-template.md).

---

## 7. Cập Nhật Project Decisions

Nếu quá trình thiết kế Data Model tạo ra các quyết định kỹ thuật quan trọng (ví dụ: công nghệ CSDL PostgreSQL, chuẩn Surrogate PK `BIGINT IDENTITY`, chính sách snapshot bất biến lịch sử, chiến lược index), cập nhật ngay:

```text
docs/project-decisions.md
```

Chỉ ghi các quyết định đã được người dùng xác nhận chính thức.
