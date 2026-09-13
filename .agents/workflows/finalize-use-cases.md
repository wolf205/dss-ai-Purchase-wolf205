---
description: Finalize Use Cases Workflow
---

# Finalize Use Cases Workflow

## 1. Điều Kiện Bắt Đầu

Chỉ chạy workflow này khi:
* Tài liệu Scope ([docs/business/scope.md](../../docs/business/scope.md)) đã được hoàn thiện và xác nhận chốt.
* Danh mục 7 Use Cases cốt lõi (`UC-01` đến `UC-07`) đã được thảo luận, xác định rõ Actor, Goal, Main Scenario, và Exception Flows.

Không dùng workflow này để thay thế quá trình phân tích và trao đổi chi tiết các ca sử dụng.

---

## 2. Đọc Context

Đọc các tài liệu bắt buộc:

```text
docs/business/business-problem.md
docs/business/scope.md
docs/project-decisions.md
docs/business/use-case-overview.md
docs/business/use-cases/uc-01-review-approve-recommendations.md
docs/business/use-cases/uc-02-manage-purchase-orders.md
docs/business/use-cases/uc-03-record-goods-receipt.md
docs/business/use-cases/uc-04-import-operational-data.md
docs/business/use-cases/uc-05-manage-products.md
docs/business/use-cases/uc-06-manage-suppliers.md
docs/business/use-cases/uc-07-configure-dss-parameters.md
.agents/skills/use-case-analysis/SKILL.md
.agents/skills/use-case-analysis/references/actor-and-goal.md
.agents/skills/use-case-analysis/references/use-case-boundary.md
```

---

## 3. Tóm Tắt Final Understanding Về Use Cases

Tổng hợp và xác nhận các nội dung chính:
* **Danh sách Actor chính:** Purchasing Staff, Store Manager, System Administrator (kèm vai trò và quyền hạn).
* **Danh mục 7 Use Cases theo chuẩn Actor-Goal:**
  * `UC-01`: Thẩm định & Phê duyệt Khuyến nghị Mua hàng (Core DSS Workflow).
  * `UC-02`: Quản lý & Theo dõi Vòng đời Đơn mua hàng (PO Tracking & Management).
  * `UC-03`: Ghi nhận Nhận hàng & Phản hồi Thực tế NCC (Goods Receipt & Feedback Loop).
  * `UC-04`: Nạp Dữ liệu Vận hành Ngoại vi (Import Sales & Inventory Snapshots).
  * `UC-05`: Quản lý Danh mục Hàng hóa & Ràng buộc SKU (Product Catalog Management).
  * `UC-06`: Quản lý Hồ sơ & Điều kiện Cung ứng của NCC (Supplier Profile & Sourcing).
  * `UC-07`: Cấu hình Tham số Vận hành DSS (System Thresholds & Scoring Weights).
* **Luồng tương tác chính (Main Flow) & Luồng ngoại lệ (Exception Flows):** Đảm bảo tính khả thi và bao quát.
* **Nguyên tắc "AI recommends. Human decides.":** Khẳng định không có bước nào hệ thống tự ý phê duyệt PO mà không qua con người.

---

## 4. Kiểm Tra Tính Nhất Quán (Consistency & Feedback Loop)

Kiểm tra:
* Mọi Use Case có nằm trong phạm vi đã chốt tại `docs/business/scope.md` không? Có phát sinh Scope Creep không?
* Có chi tiết kỹ thuật CSDL (tên bảng SQL, kiểu dữ liệu, khóa ngoại) hoặc chi tiết API/UI bị lẫn vào Use Cases không?
* Các Use Case có gắn liền với mục tiêu nghiệp vụ thực tế (Actor-Goal) hay bị biến thành CRUD đơn thuần?
* Đã sẵn sàng làm đầu vào cho tầng Business Rules (`docs/business/business-rules.md`) chưa?

---

## 5. User Validation (Confirmation Gate)

Trình bày bản tóm tắt Final Understanding cho người dùng theo mẫu:

```text
Proposed Final Understanding for Use Cases:
1. Danh sách đầy đủ 7 Use Cases theo chuẩn Actor-Goal (UC-01 đến UC-07).
2. Ma trận phân quyền Actor và ranh giới trách nhiệm.
3. Luồng nghiệp vụ cốt lõi xuyên suốt từ Dự báo → Khuyến nghị → PO → Nhận hàng.
4. Cơ chế giải thích khuyến nghị (Explainability) trong UC-01.

Remaining Uncertainty:
None
```

**Chưa tạo hoặc cập nhật tài liệu chính thức nếu người dùng chưa xác nhận chốt.**

---

## 6. Tạo / Cập Nhật Tài Liệu Chính Thức

Sau khi được người dùng xác nhận:

Cập nhật tài liệu tổng quan:
```text
docs/business/use-case-overview.md
```

Và rà soát các tài liệu chi tiết:
```text
docs/business/use-cases/uc-*.md
```

Tài liệu phải tuân thủ chuẩn cấu trúc Actor-Goal được quy định tại [.agents/skills/use-case-analysis/SKILL.md](../skills/use-case-analysis/SKILL.md).

---

## 7. Cập Nhật Project Decisions

Nếu quá trình chuẩn hóa Use Cases tạo ra các quyết định quan trọng (như phân chia vai trò Actor, quyền phê duyệt đơn hàng, cơ chế nạp dữ liệu vận hành), cập nhật ngay:

```text
docs/project-decisions.md
```

Chỉ ghi các quyết định đã được người dùng xác nhận chính thức.
