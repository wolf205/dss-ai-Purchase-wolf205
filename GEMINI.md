# Project Context — AI-Powered Purchase DSS

## 1. Định Danh & Nguyên Tắc Cốt Lõi

**Tên:** AI-Powered Purchase Decision Support System for a Single Retail Store
**Loại:** Decision Support System (DSS) — Đồ án tốt nghiệp
**Nguyên tắc bất biến:** > **AI recommends. Human decides.**

**Tech Stack (không thay đổi):**
`NestJS (TypeScript)` · `Python FastAPI` · `React + Vite (TypeScript)` · `PostgreSQL 16` · `Docker Compose`

**5 câu hỏi mua hàng cốt lõi:**
`What to Buy` · `When to Buy` · `How Much` · `Which Supplier` · `Why` (Explainability via LLM)

---

## 2. Vai Trò & Kỷ Luật Agent

**Agent đóng vai:** Software Engineer + Full-stack Developer

**Kỷ luật bắt buộc: Plan-Before-Code**
> Không gõ một dòng code nào khi chưa có Implementation Plan được người dùng phê duyệt.

**Khi phát hiện mâu thuẫn giữa Spec và thực tế:**
→ Dừng coding → Báo cáo mâu thuẫn ở đâu → Đề xuất Option A vs B → Chờ quyết định

---

## 3. Technical Contracts (Nguồn Sự Thật Bất Biến)

Mọi mã nguồn phải khớp 100% với các tài liệu đã chốt:

| Contract | File | Nội dung chính |
|---|---|---|
| Use Case Details | `docs/business/use-cases/uc-<N>.md` | 7 UCs, actor, main flow, post-conditions |
| Business Rules | `docs/business/business-rules.md` | 28 BRs: SS, ROP, SOQ, ABC-XYZ, WSM, OTIF |
| Database Schema | `docs/technical/data-model.md` | 16 tables, DDL, constraints, 44 Invariants |
| API Endpoints & DTOs | `docs/technical/api-specification.md` | 30+ endpoints, request/response, error codes |
| Architecture | `docs/technical/architecture.md` | 9 modules, 3-engine isolation, RBAC, Triggers |

**Source of Truth Priority:** User decision (latest chat) > Confirmed docs > `docs/project-decisions.md` > Agent proposal

---

## 4. Agent Routing Guide

Khi nhận task, tra bảng này để xác định rule cần đọc, skill cần nạp, workflow cần chạy:

| Task Type | Đọc Rule | Nạp Skill | Chạy Workflow |
|---|---|---|---|
| Task mới / định hướng chưa rõ | `overview.md` | — | — |
| Backend feature (NestJS/Prisma) | `implement.md` | `backend` | `/implement` |
| Frontend feature (React/Vite) | `implement.md` | `frontend` | `/implement` |
| AI Service (FastAPI/Python) | `implement.md` | `ai-service` | `/implement` |
| Prisma migration / Schema change | `implement.md` + `architecture.md` | `backend` | `/implement` |
| Quyết định kiến trúc / module mới | `architecture.md` | `architecture` | `/architecture` |
| Viết / chạy tests | `test.md` | `test` | `/test` |
| Review code / chuẩn bị bàn giao | `review.md` | `review` | `/review` |

**Tất cả rules nằm tại:** `.agents/rules/`
**Tất cả skills nằm tại:** `.agents/skills/<name>/SKILL.md`
**Tất cả workflows nằm tại:** `.agents/workflows/`

---

## 5. Module Map (UC → Backend Module → Frontend Feature)

| UC | Phân loại | Backend Module | Frontend Feature | Bảng DB chính |
|---|---|---|---|---|
| UC-01 | Core DSS | `DssModule` | `dss-review/` | `recommendation_sessions`, `recommendation_items` |
| UC-02 | Supporting | `PurchaseOrderModule` | `orders/` | `purchase_orders`, `po_line_items` |
| UC-03 | Supporting (Feedback) | `GoodsReceiptModule` | `receipts/` | `goods_receipts`, `receipt_line_items` |
| UC-04 | Foundation | `DataImportModule` | `data-import/` | `sales_records`, `inventory_snapshots` |
| UC-05 | Foundation | `CatalogModule` | `catalog/` | `categories`, `products` |
| UC-06 | Foundation | `SupplierModule` | `suppliers/` | `suppliers`, `supply_conditions` |
| UC-07 | Core Config | `ConfigurationModule` | `configuration/` | `dss_configurations` |
| Auth | Infrastructure | `AuthModule` | `auth/` | `users`, `refresh_tokens` |
| Audit | Infrastructure | `AuditModule` | — | `activity_logs` |

---

## 6. Scope Boundaries (Không Vi Phạm)

- Bám sát đúng **7 Use Cases** (UC-01 đến UC-07) — không tự thêm UC mới.
- Không chia microservices, không thêm công nghệ ngoài stack đã chốt.
- **LLM (Gemini Flash) tuyệt đối không được gọi trong luồng `POST /dss/sessions/analyze`** — chỉ kích hoạt On-demand qua `POST /dss/items/{id}/explain`.
- Không tự động hóa tầng Human Decision (mọi phê duyệt phải do người dùng bấm).
- Không Hard Delete SKU/NCC đang có liên kết lịch sử — chỉ Soft Deactivate.
- Không dùng `FLOAT`/`REAL` cho tiền tệ và tỷ lệ — chỉ dùng `NUMERIC(15,2)` / `NUMERIC(5,4)`.
