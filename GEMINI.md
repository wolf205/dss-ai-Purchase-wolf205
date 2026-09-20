# Project Context — AI-Powered Purchase DSS

## 1. Định Danh Project & Nguyên Tắc Cốt Lõi

**Tên:** AI-Powered Purchase Decision Support System for a Single Retail Store  
**Loại:** Decision Support System (DSS) — Graduation Project  
**Nguyên tắc bất biến:** > **AI recommends. Human decides.**

**Tech Stack (không thay đổi):**
`NestJS (TypeScript)` · `Python FastAPI` · `React + Vite (TypeScript)` · `PostgreSQL 16` · `Docker Compose`

**5 bài toán mua hàng cốt lõi:** What to Buy · When to Buy · How Much · Which Supplier · Why (Explainability)

---

## 2. Vai Trò Agent — Giai Đoạn Implementation

Agent đóng vai: **Software Engineer + Full-stack Developer**

Kỷ luật bắt buộc: **Plan-Before-Code**
> Không gõ một dòng code nào khi chưa có Implementation Plan được người dùng phê duyệt.

Khi phát hiện mâu thuẫn giữa Spec và thực tế → **dừng ngay**, báo cáo mâu thuẫn, đề xuất phương án, chờ quyết định.

---

## 3. Technical Contracts (Nguồn Sự Thật Bất Biến)

Mọi mã nguồn phải khớp 100% với các tài liệu đã chốt sau:

| Contract | File | Nội dung |
|---|---|---|
| Database Schema | `docs/technical/data-model.md` | 16 tables, DDL constraints, triggers |
| API Endpoints & DTOs | `docs/technical/api-specification.md` | 100% endpoints, request/response, error codes |
| Architecture & Modules | `docs/technical/architecture.md` | Module decomposition, 3-engine isolation, RBAC |
| Business Formulas | `docs/business/business-rules.md` | SS, ROP, SOQ, ABC-XYZ, WSM, OTIF formulas |

**Source of Truth Priority:** User decision (latest chat) > Confirmed docs > `docs/project-decisions.md` > Agent proposal

---

## 4. Agent Routing Guide

Khi nhận task, tra bảng này để xác định rule cần đọc, skill cần nạp và workflow cần chạy:

| Task Type | Đọc Rule | Nạp Skill | Chạy Workflow |
|---|---|---|---|
| Task mới / định hướng chưa rõ | `overview.md` | — | — |
| Backend feature (NestJS/Prisma) | `implement.md` | `backend/` | `/implement-task` |
| Frontend feature (React/Vite) | `implement.md` | `frontend/` | `/implement-task` |
| AI Service (FastAPI/Python) | `implement.md` | `ai-service/` | `/implement-task` |
| Quyết định kiến trúc / module mới | `architecture.md` | — | — |
| Viết / chạy tests | `test.md` | `test/` | `/run-tests` |
| Review code / chuẩn bị bàn giao | `review.md` | `review/` | `/review-code` |

**Tất cả rules nằm tại:** `.agents/rules/`  
**Tất cả skills nằm tại:** `.agents/skills/<name>/SKILL.md`  
**Tất cả workflows nằm tại:** `.agents/workflows/`

---

## 5. Scope Boundaries (Không Vi Phạm)

- Bám sát đúng **7 Use Cases** (UC-01 đến UC-07) — không tự thêm UC mới.
- Không chia microservices, không thêm công nghệ ngoài stack đã chốt.
- Không tự động hóa tầng Human Decision (mọi phê duyệt phải do người dùng bấm).
