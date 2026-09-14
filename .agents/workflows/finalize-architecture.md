---
description: Finalize System Architecture Workflow
---

# Finalize System Architecture Workflow

## 1. Điều Kiện Bắt Đầu

Chỉ chạy workflow này khi:
* Tài liệu Mô hình Dữ liệu ([data-model.md](../../docs/technical/data-model.md) với 16 bảng PostgreSQL 16+ và 44 bất biến) đã được xác nhận chốt (`Status: Confirmed`).
* Mô hình công nghệ (Polyglot Decoupled Architecture: NestJS Backend, Python AI Service, React+Vite Frontend, PostgreSQL 16+) đã được người dùng đồng thuận.
* Các sơ đồ kiến trúc C4, phân rã Module, phân lập 3 động cơ DSS, hợp đồng API cho 7 Use Cases và cơ chế bảo mật RBAC/Audit đã được thảo luận và làm rõ cùng người dùng.

Không dùng workflow này để thay thế quá trình trao đổi, phân tích và phản biện thiết kế kỹ thuật kiến trúc.

---

## 2. Đọc Context

Đọc các tài liệu bắt buộc:

```text
docs/technical/data-model.md
docs/project-decisions.md
docs/business/business-rules.md
docs/business/use-case-overview.md
.agents/rules/architecture-rules.md
.agents/skills/architecture-design/SKILL.md
.agents/skills/architecture-design/references/architecture-specification-template.md
.agents/skills/architecture-design/references/api-design-guidelines.md
.agents/skills/architecture-design/references/dss-subsystem-patterns.md
```

---

## 3. Tóm Tắt Final Understanding Về Architecture

Tổng hợp và xác nhận các nội dung kỹ thuật sau khi đã thảo luận và thống nhất cùng người dùng:
* **Tech Stack Rationale:** Lý do và vai trò của NestJS (Modular Monolith), Python FastAPI (AI Forecasting), React+Vite (Frontend SPA), PostgreSQL 16+ (Database) và Docker Compose.
* **Cấu Trúc Tài Liệu Hub & Spoke:** Phân tách rõ ràng giữa `docs/technical/architecture.md` (Bản thiết kế toàn cảnh) và `docs/technical/api-specification.md` (Hợp đồng giao tiếp DTO chi tiết phục vụ trực tiếp bước Implementation).
* **Sơ đồ Kiến trúc C4 Model (Level 1, 2, 3):** System Context, Container Topology và Backend Component Modules.
* **Phân Lập 3 Động Cơ DSS:** Phân định rạch ròi AI Forecasting (chuỗi thời gian), Deterministic Business Calculations (SS, ROP, SOQ, ABC-XYZ, WSM) và On-demand LLM Explainability (Gemini Flash ngoài critical path).
* **Chu Trình Phản Hồi Khép Kín (Closed-Loop Feedback):** Cơ chế đồng bộ từ Nhận hàng kho $\rightarrow$ OTIF Linear Penalty Decay $\rightarrow$ Phong độ 5 đơn gần nhất $\rightarrow$ Chấm điểm NCC lần chạy DSS kế tiếp.
* **Bảo Mật & RBAC:** Cơ chế JWT Token Rotation với SHA-256 hash trên bảng `refresh_tokens`, phân quyền 2 roles (`STORE_MANAGER` vs `PURCHASING_STAFF`) qua Guards, và lưu vết kiểm toán Append-Only vào `activity_logs`.
* **Quản Lý Giao Dịch Tier 3:** Ranh giới ACID Transaction cho UC-01 Approve, UC-03 Goods Receipt và UC-04 All-or-Nothing Import.

---

## 4. Kiểm Tra Tính Nhất Quán (Consistency & Feedback Loop)

Kiểm tra:
* Có thành phần kiến trúc nào mâu thuẫn với 16 bảng CSDL và 44 Invariants trong [data-model.md](../../docs/technical/data-model.md) không?
* Các trường Snapshot lịch sử (`historical_unit_price`, `historical_moq`, `historical_lead_time_days`, `daily_forecasts`, `supplier_rankings`) đã được phản ánh đúng trong luồng xử lý Backend chưa?
* Tách biệt LLM ra khỏi critical path đã được đảm bảo tuyệt đối trong thiết kế luồng UC-01 chưa?
* Các ràng buộc Tier 3 (như All-or-Nothing Import, Date Validation) đã có Service Layer / Transaction bảo đảm chưa?
* API Endpoints có bao phủ trọn vẹn 100% 7 Use Cases và các thao tác của cả 2 Actor không?

---

## 5. User Validation (Confirmation Gate)

Trình bày bản tóm tắt Final Understanding cho người dùng theo mẫu:

```text
Proposed Final Understanding for System Architecture:
1. Mô hình kiến trúc Polyglot Decoupled (NestJS + Python AI Service + React+Vite + PostgreSQL 16+).
2. Tổ chức tài liệu Hub & Spoke: architecture.md (Toàn cảnh) + api-specification.md (Chi tiết hợp đồng DTO).
3. Sơ đồ C4 Model và phân rã Backend Modular Monolith 1:1 Bounded Contexts.
4. Cơ chế phân lập 3 động cơ DSS và khép kín vòng lặp hiệu suất nhà cung cấp OTIF.
5. Thiết kế Bảo mật JWT Token Rotation, RBAC 2 roles, Audit Trail và ACID Transactions cho Tier 3.

Remaining Uncertainty:
None
```

**Chưa tạo hoặc cập nhật tài liệu chính thức nếu người dùng chưa xác nhận chốt.**

---

## 6. Tạo Tài Liệu Chính Thức

Sau khi được người dùng xác nhận qua Confirmation Gate:

Tạo và xuất bản bộ đôi tài liệu kỹ thuật:

```text
docs/technical/architecture.md
docs/technical/api-specification.md
```

* `architecture.md` tuân thủ chuẩn cấu trúc tại [architecture-specification-template.md](../skills/architecture-design/references/architecture-specification-template.md).
* `api-specification.md` tuân thủ quy chuẩn tại [api-design-guidelines.md](../skills/architecture-design/references/api-design-guidelines.md).

---

## 7. Cập Nhật Project Decisions

Cập nhật các quyết định kỹ thuật quan trọng vào:

```text
docs/project-decisions.md
```

* Mô hình kiến trúc Polyglot Decoupled và lựa chọn Tech Stack (NestJS, Python, React+Vite, PostgreSQL 16+).
* Mô hình Hub & Spoke trong đặc tả kiến trúc và API.
* Kiến trúc phân lập 3 động cơ DSS và cơ chế Caching LLM On-demand.
* Cơ chế bảo mật JWT Token Rotation, RBAC và quản lý giao dịch Tier 3.

Chỉ ghi các quyết định đã được người dùng xác nhận chính thức.
