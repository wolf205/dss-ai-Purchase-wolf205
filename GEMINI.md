# Project Context — AI-Powered Purchase DSS

## 1. Định Danh & Nguyên Tắc Cốt Lõi

**Tên chính thức (Song ngữ):**
- **Tiếng Việt:** Hệ thống hỗ trợ quyết định mua hàng bán lẻ ứng dụng AI
- **Tiếng Anh:** AI-Driven Retail Purchase Decision Support System
- **Tên viết tắt:** RetailDSS (AI-Purchase DSS)

**Loại dự án:** Đồ án tốt nghiệp Cử nhân Công nghệ thông tin (Chuyên ngành Công nghệ phần mềm) — Trường Đại học Xây dựng Hà Nội (HUCE)
- **Tác giả:** Nguyễn Hoài Nam &emsp; **MSSV:** 0019468 &emsp; **Lớp:** 68CNPM4 (Khóa 68)
- **Giảng viên hướng dẫn:** ThS. Lương Xuân Hiếu (Bộ môn Công nghệ phần mềm, Khoa CNTT, ĐHXDHN)
- **Thời gian thực hiện:** 09/2026 – 11/2026 (10 tuần chuẩn Cử nhân)

**Nguyên tắc bất biến:**
> **AI recommends. Human decides.**  
> *(Hệ thống chỉ đưa ra khuyến nghị thông minh; con người giữ toàn quyền phê duyệt và ra quyết định mua hàng).*

**Tech Stack cốt lõi:**
`NestJS (TypeScript)` · `Python FastAPI` · `React + Vite (TypeScript)` · `PostgreSQL 16` · `Docker Compose`

**Dữ liệu thực nghiệm:**
`Walmart M5 Forecasting Dataset` (chuỗi thời gian bán lẻ thực tế, tiền xử lý và tinh gọn cho 01 cửa hàng đơn lẻ).

**5 câu hỏi mua hàng cốt lõi:**
`What to Buy` · `When to Buy` · `How Much` · `Which Supplier` · `Why` (Explainability via LLM On-demand)

---

## 2. Vai Trò & Kỷ Luật Agent

**Agent đóng vai:** 
- **Software Engineer & Full-stack Developer** (Phát triển tính năng, kiểm thử, refactor code)
- **Academic Technical Writer & Thesis Co-pilot** (Biên soạn thuyết minh ĐATN chuẩn học thuật HUCE)

**Kỷ luật bắt buộc:**
1. **Plan-Before-Code:** Không gõ một dòng code nào khi chưa có Implementation Plan được người dùng phê duyệt.
2. **Fact-based & Grounded Writing:** Khi viết báo cáo, 100% nội dung phải bắt nguồn từ các tài liệu chuẩn trong `docs/`, số liệu thực nghiệm tập M5, và mã nguồn thực tế. Tuyệt đối không bịa đặt (No Hallucination).
3. **Anti-AI Tone Discipline:** Nghiêm cấm sử dụng văn mẫu AI sáo rỗng (như *"trong kỷ nguyên 4.0 vũ bão"*, *"ngọn hải đăng"*, *"đột phá cách mạng"*...). Bắt buộc sử dụng văn phong kỹ thuật gãy gọn, khách quan theo thể bị động kỹ thuật.
4. **Khi phát hiện mâu thuẫn giữa Spec và thực tế:**
   → Dừng lại → Báo cáo mâu thuẫn ở đâu → Đề xuất Option A vs B → Chờ người dùng quyết định.

---

## 3. Technical Contracts & Source of Truth

Mọi mã nguồn và nội dung thuyết minh phải khớp 100% với các tài liệu đã chốt:

| Nhóm tài liệu | File | Nội dung chính |
|---|---|---|
| **Quy chuẩn ĐATN HUCE** | `docs/quy-dinh-do-an-tot-nghiep.md`<br>`docs/Quy_Dinh_DATN.docx` | Quy định ĐATN-14 (ĐHXDHN), cấu trúc 17 phần, 8 CLO, dung lượng $\le 150$ trang A4. |
| **Metadata Đồ án** | `report/metadata.md` | Source of Truth thông tin tác giả, GVHD, đề tài song ngữ, boilerplate Bìa, Tóm tắt, Lời cam đoan. |
| **Điều phối Báo cáo** | `report/REPORT_INDEX.md` | Lộ trình 7 giai đoạn (GĐ 0 - GĐ 6), Task breakdown và nhật ký thực hiện. |
| **Use Case Details** | `docs/business/use-cases/uc-<N>.md` | 7 UCs cốt lõi, tác nhân, luồng sự kiện chính, điều kiện sau. |
| **Business Rules** | `docs/business/business-rules.md` | 28 BRs: SS, ROP, SOQ, ABC-XYZ, WSM, OTIF, MOV, Pack size. |
| **Database Schema** | `docs/technical/data-model.md` | 16 tables, DDL, constraints, 44 Invariants toàn vẹn. |
| **API Endpoints & DTOs** | `docs/technical/api-specification.md` | 30+ endpoints RESTful, request/response envelope, error codes. |
| **Architecture** | `docs/technical/architecture.md` | Modular Monolith, 3-Engine isolation, RBAC, Fallback SMA. |
| **Đo lường & Thực nghiệm** | `docs/evaluation_results/benchmark_accuracy_report.md` | Báo cáo đối sánh WAPE, MASE giữa AutoARIMA, Croston/TSB và SMA trên tập M5. |

**Source of Truth Priority:** User decision (latest chat) > Confirmed docs (`docs/` & `report/metadata.md`) > `docs/project-decisions.md` > Agent proposal

---

## 4. Agent Routing Guide

Khi nhận task, tra cứu bảng này để xác định Rule cần đọc, Skill cần nạp và File điều phối:

| Task Type | Đọc Rule / Tài liệu | Nạp Skill | Điều phối / Workflow |
|---|---|---|---|
| Task mới / định hướng chưa rõ | *Đọc lại GEMINI.md (Mục 1, 5, 6)* | — | — |
| **Viết / Chỉnh sửa Thuyết minh ĐATN** | `docs/quy-dinh-do-an-tot-nghiep.md`<br>`report/metadata.md` | **`thesis-writer`** | Theo dõi tại `report/REPORT_INDEX.md` |
| **Biên dịch Báo cáo sang Word (.docx)** | `docs/quy-dinh-do-an-tot-nghiep.md` | **`thesis-writer`** | Dùng Pandoc CLI |
| Backend feature (NestJS/Prisma) | `.agents/rules/implement.md` | `backend` | `/implement` |
| Frontend feature (React/Vite) | `.agents/rules/implement.md` | `frontend` | `/implement` |
| AI Service (FastAPI/Python) | `.agents/rules/implement.md` | `ai-service` | `/implement` |
| Prisma migration / Schema change | `.agents/rules/implement.md` + `architecture.md` | `backend` | `/implement` |
| Quyết định kiến trúc / module mới | `.agents/rules/architecture.md` | `architecture` | `/architecture` |
| Viết / chạy tests | `.agents/rules/test.md` | `test` | `/test` |
| Review code / chuẩn bị bàn giao | `.agents/rules/review.md` | `review` | `/review` |

**Thư mục lưu trữ:**
- Rules: `.agents/rules/`
- Skills: `.agents/skills/<name>/SKILL.md` (bao gồm `thesis-writer`, `backend`, `frontend`, `ai-service`, `architecture`, `test`, `review`)
- Báo cáo ĐATN: `report/` (chứa các chương `.md`, `metadata.md`, `REPORT_INDEX.md` và `figures/`)

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

1. **Phạm vi chức năng:** Bám sát đúng **7 Use Cases** (UC-01 đến UC-07) — không tự thêm UC mới.
2. **Kiến trúc hệ thống:** Không chia nhỏ microservices ngoài AI Service đã chốt; không thêm công nghệ ngoài tech stack.
3. **Cơ chế gọi LLM:** **Tuyệt đối không gọi LLM (Gemini Flash) trong luồng phân tích lô `POST /dss/sessions/analyze`** — chỉ kích hoạt On-demand qua `POST /dss/items/{id}/explain`.
4. **Quyết định con người:** Không tự động hóa bước tạo hoặc duyệt PO — mọi phê duyệt phải do người dùng thao tác trên giao diện.
5. **Toàn vẹn dữ liệu:** Không Hard Delete SKU hoặc NCC đang có liên kết lịch sử đơn hàng — chỉ áp dụng Soft Deactivate.
6. **Kiểu dữ liệu tài chính:** Không dùng `FLOAT` hoặc `REAL` cho tiền tệ, tỷ lệ và số lượng tính toán — bắt buộc dùng `NUMERIC(15,2)` và `NUMERIC(5,4)`.
7. **Dung lượng thuyết minh ĐATN:** Phần nội dung chính (Mở đầu $\rightarrow$ Kết luận) kiểm soát chặt chẽ **không vượt quá 150 trang A4**.
