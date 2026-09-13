---
description: Finalize Domain Model Workflow
---

# Finalize Domain Model Workflow

## 1. Điều Kiện Bắt Đầu

Chỉ chạy workflow này khi:
* Tài liệu Use Cases ([use-case-overview.md](../../docs/business/use-case-overview.md) và các file chi tiết từ [uc-01](../../docs/business/use-cases/uc-01-review-approve-recommendations.md) đến [uc-07](../../docs/business/use-cases/uc-07-configure-dss-parameters.md)) đã hoàn thành.
* Tài liệu Quy tắc nghiệp vụ ([business-rules.md](../../docs/business/business-rules.md) với 28 BRs) đã được hoàn thiện và chốt.
* Các thực thể nghiệp vụ (Entities), thuộc tính khái niệm (Attributes), mối quan hệ (Relationships) và bất biến nghiệp vụ (Business Invariants) đã được thảo luận và làm rõ.


Không dùng workflow này để thay thế quá trình phân tích và trao đổi cấu trúc miền nghiệp vụ.

---

## 2. Đọc Context

Đọc các tài liệu bắt buộc:

```text
docs/business/business-problem.md
docs/business/scope.md
docs/business/use-case-overview.md
docs/business/use-cases/uc-01-review-approve-recommendations.md
docs/business/use-cases/uc-02-manage-purchase-orders.md
docs/business/use-cases/uc-03-record-goods-receipt.md
docs/business/use-cases/uc-04-import-operational-data.md
docs/business/use-cases/uc-05-manage-products.md
docs/business/use-cases/uc-06-manage-suppliers.md
docs/business/use-cases/uc-07-configure-dss-parameters.md
docs/business/business-rules.md
docs/project-decisions.md
.agents/rules/domain-modeling-rules.md
.agents/skills/domain-model-analysis/references/domain-specification-template.md
.agents/skills/domain-model-analysis/references/domain-vs-data-model.md
.agents/skills/domain-model-analysis/references/core-retail-entities.md
```

---

## 3. Tóm Tắt Final Understanding Về Domain Model

Tổng hợp và xác nhận các nội dung sau khi đã thảo luận và thống nhất cùng người dùng:
* **Danh sách các Domain Entities chính thức:** Được phân bổ theo các nhóm nghiệp vụ (Dữ liệu nền tảng, Giao dịch/Vòng đời, Vận hành/Cấu hình) do người dùng và Agent cùng xác định.
* **Sơ đồ cấu trúc quan hệ nghiệp vụ:** Biểu diễn bằng Mermaid Class Diagram kèm bản số ($1..1$, $1..*$, $0..1$, $*$) và bản chất quan hệ (Composition vs Association).
* **Thuộc tính khái niệm & Trách nhiệm:** Thuộc tính nghiệp vụ của từng thực thể được hai bên thống nhất.
* **Bảng Bất biến nghiệp vụ (Business Invariants):** Ánh xạ truy vết đầy đủ từ 28 Business Rules (`BR-01` đến `BR-28`).
* **Các quyết định mô hình hóa quan trọng:** Lý do gộp, tách hoặc trừu tượng hóa các thực thể từ Use Cases và BRs.


---

## 4. Kiểm Tra Tính Nhất Quán (Consistency & Feedback Loop)

Kiểm tra:
* Có mâu thuẫn với Business Rules hoặc Use Cases không?
* Có chi tiết kỹ thuật CSDL (tên bảng SQL, kiểu dữ liệu CSDL như `VARCHAR`, `INT`, khóa ngoại `FK`, indexing) bị lẫn vào Domain Model không?
* Các thực thể có phản ánh đúng thực tế vận hành kinh doanh của một cửa hàng bán lẻ không?
* Các mối quan hệ nhiều-nhiều đã được chuyển hóa thành các khái niệm nghiệp vụ có ý nghĩa thực tế (ví dụ: `SupplyCondition`) chưa?

---

## 5. User Validation (Confirmation Gate)

Trình bày bản tóm tắt Final Understanding cho người dùng theo mẫu:

```text
Proposed Final Understanding for Domain Model:
1. Danh sách các Domain Entities phân bổ theo 3 nhóm cốt lõi.
2. Sơ đồ cấu trúc quan hệ nghiệp vụ và bản số (Multiplicity).
3. Bảng thuộc tính khái niệm và trách nhiệm của từng Entity.
4. Danh mục Business Invariants kế thừa từ 28 Business Rules.

Remaining Uncertainty:
None
```

**Chưa tạo hoặc cập nhật tài liệu chính thức nếu người dùng chưa xác nhận chốt.**

---

## 6. Tạo Tài Liệu Chính Thức

Sau khi được người dùng xác nhận:

Tạo hoặc cập nhật tài liệu duy nhất:

```text
docs/business/domain-model.md
```

Tài liệu phải tuân thủ chuẩn cấu trúc đặc tả tại [domain-specification-template.md](../skills/domain-model-analysis/references/domain-specification-template.md).

---

## 7. Cập Nhật Project Decisions

Nếu quá trình chuẩn hóa Domain Model tạo ra các quyết định quan trọng (như việc lựa chọn ranh giới thực thể, mô hình hóa vòng đời đơn hàng, hay cấu trúc phân tách Recommendation Item), cập nhật ngay:

```text
docs/project-decisions.md
```

Chỉ ghi các quyết định đã được người dùng xác nhận chính thức.
