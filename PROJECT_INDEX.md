# DSS AI-Purchase: Project Index & Implementation Compass

> **Tên dự án:** AI-Powered Purchase Decision Support System for a Single Retail Store  
> **Nguyên tắc cốt lõi:** **AI recommends. Human decides.**  
> **Giai đoạn hiện tại:** Giai đoạn Triển khai Kỹ thuật (Implementation Phase)  
> **Cập nhật gần nhất:** 17/09/2026

---

## 1. Bản Đồ Tài Liệu Nguồn Của Sự Thật (Source of Truth Index)

Toàn bộ tài liệu phân tích nghiệp vụ và thiết kế kỹ thuật đã được người dùng phê duyệt chính thức (`Status: Confirmed`), đóng vai trò là **Hợp đồng Kỹ thuật (Technical Contract)** bắt buộc tuân thủ khi viết mã nguồn.

| Nhóm Tài Liệu | Tài Liệu & Đường Dẫn | Trạng Thái | Vai Trò & Mô Tả Trong Quá Trình Code |
| :--- | :--- | :---: | :--- |
| **Định Hướng** | [GEMINI.md](GEMINI.md) | `Confirmed` | Quy tắc làm việc cốt lõi, vai trò Agent và quy trình `Spec-Driven & Plan-Before-Code`. |
| **Quyết Định** | [docs/project-decisions.md](docs/project-decisions.md) | `Confirmed` | Nhật ký ghi nhận toàn bộ 32+ quyết định quan trọng đã chốt. |
| **Bài Toán** | [docs/business/business-problem.md](docs/business/business-problem.md) | `Confirmed` | Bối cảnh cửa hàng bán lẻ đơn lẻ và 5 bài toán mua hàng cốt lõi (*What, When, How Much, Which Supplier, Why*). |
| **Phạm Vi** | [docs/business/scope.md](docs/business/scope.md) | `Confirmed` | Ranh giới In-Scope / Out-of-Scope và phân định 2 Actors (`STORE_MANAGER`, `PURCHASING_STAFF`). |
| **Use Cases** | [docs/business/use-case-overview.md](docs/business/use-case-overview.md)<br>[docs/business/use-cases/](docs/business/use-cases/) | `Confirmed` | Đặc tả chi tiết 7 Use Cases chuẩn Actor-Goal (từ UC-01 đến UC-07). |
| **Quy Tắc Nghiệp Vụ**| [docs/business/business-rules.md](docs/business/business-rules.md) | `Confirmed` | 28 Quy tắc toán học tất định (BR-01 đến BR-28): Forecast, SS, ROP, SOQ, WSM, ABC-XYZ, OTIF decay. |
| **Domain Model** | [docs/business/domain-model.md](docs/business/domain-model.md) | `Confirmed` | 9 Thực thể nghiệp vụ thuần túy, sơ đồ liên kết và toàn bộ Business Invariants. |
| **Cơ Sở Dữ Liệu** | [docs/technical/data-model.md](docs/technical/data-model.md) | `Confirmed` | **Technical Contract CSDL:** Schema vật lý PostgreSQL 16+ với 16 bảng, constraints, triggers, indexes, seed data. |
| **Kiến Trúc** | [docs/technical/architecture.md](docs/technical/architecture.md) | `Confirmed` | **Technical Contract Kiến trúc (Hub):** Mô hình C4, Polyglot Decoupled Modular Monolith, phân lập 3 động cơ DSS, bảo mật JWT/RBAC. |
| **Hợp Đồng API** | [docs/technical/api-specification.md](docs/technical/api-specification.md) | `Confirmed` | **Technical Contract API (Spoke):** 100% Endpoints, Request/Response DTOs, Standard API Envelope, Error Taxonomy. |
| **Quy Chuẩn Code**| [.agents/rules/implementation-rules.md](.agents/rules/implementation-rules.md)<br>[.agents/workflows/implement-task.md](.agents/workflows/implement-task.md)<br>[.agents/skills/fullstack-implementation/SKILL.md](.agents/skills/fullstack-implementation/SKILL.md) | `Active` | Kỷ luật lập trình Full-stack, quy trình 5 bước `implement-task` và code templates chuẩn. |

---

## 2. Kim Chỉ Nam Triển Khai (Master Implementation Tracker)

Tiến độ mã nguồn được theo dõi chi tiết qua 8 giai đoạn tuần tự. Mỗi giai đoạn chỉ được đánh dấu hoàn thành khi đã qua kiểm thử xác minh (Verification).

- [ ] **Giai đoạn 1: Nền tảng Khởi tạo (Scaffolding, Docker & Database Setup)**
  - [x] **Task 1.1: Hạ tầng CSDL Docker** — Cấu hình `docker-compose.yml` (PostgreSQL 16+ Alpine, healthcheck, volume `pgdata`, port 5432, network `dss_network`), cập nhật `.gitignore` và `.env.example`.
  - [x] **Task 1.2: Scaffolding Backend Core (NestJS)** — Khởi tạo `backend/` với NestJS 10, TypeScript Strict Mode, Global Prefix `/api/v1`, CORS, Cookie-parser, Swagger setup và Health check endpoint `GET /api/v1/health`.
  - [ ] **Task 1.3: Thiết lập Prisma ORM & 16 Bảng CSDL** — Viết `backend/prisma/schema.prisma` khớp 100% `data-model.md` (chốt tên cột `why_buy_explanation` trên `recommendation_items`), chạy initial migration tạo 16 bảng vật lý trong PostgreSQL.
  - [ ] **Task 1.4: Tích hợp 8 Triggers CSDL Phòng Thủ** — Viết Prisma Custom SQL Migration triển khai đầy đủ 8 Trigger Functions + 8 CREATE TRIGGER từ Section DDL `PHÂN VÙNG TRIGGERS` trong `data-model.md` (đồng bộ tồn kho kệ, hàng đang về, tính OTIF, chặn sửa PO/Line bất biến).
  - [ ] **Task 1.5: Script Seed Data Ban Đầu** — Viết `backend/prisma/seed.ts` nạp 2 tài khoản test (`admin` - STORE_MANAGER, `staff` - PURCHASING_STAFF đã hash bcrypt), bản ghi singleton `DSSConfiguration` (`id = 1`), và danh mục ngành hàng mẫu.
  - [ ] **Task 1.6: Scaffolding AI Service & Frontend** — Khởi tạo `ai-service/` (Python 3.12 FastAPI, requirements.txt, Pydantic config, `GET /health`) và `frontend/` (React 18+ Vite, TypeScript Strict, cấu hình TailwindCSS, proxy `/api`, layout shell).

- [ ] **Giai đoạn 2: Hạ tầng Backend Core, Bảo mật IAM / RBAC & Swagger API Docs**
  - [ ] Cấu hình Swagger UI (`@nestjs/swagger`) tại `/api/docs` phục vụ nghiệm thu sớm từng endpoint.
  - [ ] Thiết lập Global `ValidationPipe` và Global `AllExceptionsFilter` (chuẩn hóa Standard API Envelope `{ success, data, meta }` / `{ success, error }` và Error Code Taxonomy 12 mã lỗi).
  - [ ] Triển khai `AuthModule`: Đăng nhập (`POST /auth/login`), đăng xuất (`POST /auth/logout`), lấy thông tin (`GET /auth/me`), cấp Access Token JWT (15m) + Refresh Token HttpOnly Cookie (7d).
  - [ ] Triển khai cơ chế Token Rotation (`POST /auth/refresh`) và tự động thu hồi session khi phát hiện Replay Attack.
  - [ ] Triển khai `JwtAuthGuard` và `RolesGuard` phân quyền 2 vai trò (`STORE_MANAGER` vs `PURCHASING_STAFF`).
  - [ ] Triển khai `AuditLogInterceptor` ghi nhận vết hoạt động vào bảng `activity_logs`.

- [ ] **Giai đoạn 3: Phân hệ Dự báo Nhu cầu AI (Python FastAPI)**
  - [ ] Khởi tạo FastAPI service tại port 8000, cấu hình Pydantic schemas.
  - [ ] Xây dựng module tiền xử lý: Bù đắp Zero-Demand cho các ngày không có đơn bán hàng.
  - [ ] Triển khai các thuật toán chuỗi thời gian: Croston/TSB (ngắt quãng), AutoARIMA/Holt-Winters (nhu cầu đều), SMA 7 ngày (chuỗi ngắn).
  - [ ] Triển khai endpoint `POST /api/v1/forecast` và viết Dockerfile cho AI service.

- [ ] **Giai đoạn 4: Danh mục Nền tảng & Nạp Dữ liệu Vận hành (Master Data & Data Import)**
  - [ ] `CatalogModule` (UC-05): CRUD Categories, Products, quản lý trạng thái Active/Inactive, theo dõi tồn kho kệ.
  - [ ] `SupplierModule` (UC-06): Hồ sơ NCC, Supply Conditions (giá nhập, MOQ), theo dõi điểm OTIF 5 đơn gần nhất.
  - [ ] `ConfigurationModule` (UC-07): Quản trị singleton bộ tham số DSS (trọng số WSM, Target Service Level, Z-factor mapping, Review period).
  - [ ] `DataImportModule` (UC-04): Cung cấp endpoint tải tệp biểu mẫu chuẩn `GET /api/v1/data-imports/templates/{type}` (sales/inventory); Nạp file Excel/CSV; cơ chế All-or-Nothing bọc trong `prisma.$transaction`; ghi đè doanh số theo cặp (Date, SKU).

- [ ] **Giai đoạn 5: Động cơ Ra quyết định DSS & Giải thích Gemini On-Demand (Trọng tâm)**
  - [ ] `DssModule` (UC-01): Endpoint `POST /api/v1/dss/sessions/analyze` hỗ trợ lọc theo phạm vi toàn cửa hàng (`categoryId = null`) hoặc theo ngành hàng cụ thể (`categoryId`); tự động chuyển phiên `Draft` cũ sang `Discarded` (INV-REC-03); điều phối gọi Python AI Service (kèm Graceful Fallback sang trung bình lịch sử).
  - [ ] `DssCalculationEngineService` (Domain Layer Pure Functions): Thuật toán tất định ABC-XYZ, SS, ROP, SOQ khớp MOQ, WSM Supplier Ranking.
  - [ ] Lưu kết quả phân tích và toàn bộ snapshot dữ liệu vào `recommendation_sessions` (trạng thái ban đầu `Draft`) & `recommendation_items`.
  - [ ] `LlmExplanationService`: Tích hợp Google Gemini 1.5 Flash On-demand theo từng SKU (`POST /api/v1/dss/items/{itemId}/explain`), lưu cache vào cột CSDL `why_buy_explanation` (0ms / 0 token cho các lần sau; fallback mẫu khi timeout 3s).

- [ ] **Giai đoạn 6: Vòng đời Đơn hàng & Đóng kín Vòng lặp Phản hồi (PO & Goods Receipt)**
  - [ ] `PurchaseOrderModule` (UC-02): Duyệt đề xuất (`POST /dss/sessions/{id}/approve`) sinh các đơn PO gom theo NCC ở trạng thái `Approved` trong Database Transaction; cập nhật hàng đang về (`on_order_quantity`); logic tính toán runtime `isOverdue` (BR-09) và query filter `isOverdue` trên `GET /purchase-orders`; hủy đơn hoàn trả hàng; xuất PDF.
  - [ ] `GoodsReceiptModule` (UC-03): Nhận hàng kho 1:1 với PO, bọc ACID Transaction tăng tồn kệ, giải phóng hàng đang về, chuyển PO sang `Completed`.
  - [ ] Kích hoạt trigger tính tỷ lệ giao đủ hàng (`Fulfillment Rate`), OTIF linear penalty decay, cập nhật rolling 5 đơn của NCC.

- [ ] **Giai đoạn 7: Giao diện Người dùng Web UI (React + Vite)**
  - [ ] Thiết lập layout responsive, Sidebar, Navbar, Toast notifications, Design tokens.
  - [ ] Quản lý trạng thái xác thực và Axios Interceptor tự động Refresh Token.
  - [ ] 7 màn hình tính năng hoàn chỉnh:
    - [ ] Màn hình Đăng nhập (Auth).
    - [ ] Màn hình Bảng đề xuất DSS (UC-01): Bộ lọc ngành hàng, Badges ABC-XYZ, Modal Explain Gemini, Biểu đồ Recharts kết hợp (Lịch sử + Dự báo 14 ngày + Vùng tin cậy 95%).
    - [ ] Màn hình Quản lý Đơn mua hàng (UC-02): Danh sách PO, Cảnh báo Overdue (BR-09), In/Xuất PDF.
    - [ ] Màn hình Nhận hàng kho (UC-03): Form nhận hàng, Soft warning giao thừa.
    - [ ] Màn hình Nạp dữ liệu vận hành (UC-04): Nút tải file mẫu chuẩn, Kéo thả file, xem trước lỗi chi tiết từng dòng.
    - [ ] Màn hình Danh mục sản phẩm (UC-05), Nhà cung cấp (UC-06), Cấu hình tham số DSS (UC-07).

- [ ] **Giai đoạn 8: Tích hợp Toàn diện E2E, Kiểm thử & Đóng gói Docker 1-Click**
  - [ ] Kiểm thử E2E trọn vòng lặp mua hàng thực tế (Import $\to$ DSS $\to$ PO $\to$ Goods Receipt $\to$ OTIF Update).
  - [ ] Đóng gói hoàn chỉnh `docker-compose.yml` gồm 4 services (`postgres`, `backend`, `ai-service`, `frontend`).
  - [ ] Viết tài liệu hướng dẫn khởi chạy 1-click và vận hành (`README.md`).

---

## 3. Nhật Ký Thực Thi (Milestone Execution Log)

| Thời Gian | Milestone / Tác Vụ | Nội Dung Thực Hiện & Kết Quả | Mã Git Commit |
| :--- | :--- | :--- | :---: |
| 17/09/2026 | Chốt Tài Liệu & Chuyển Phase | Hoàn tất 100% Phase Phân tích & Thiết kế; chuyển vai trò sang Implementation; cấu hình quy trình `implement-task` 5 bước. | `077aa59` |
| 17/09/2026 | Khởi Tạo & Chuẩn Hóa Project Index | Hoàn thiện Master Implementation Tracker 8 giai đoạn sau khi đối chiếu chuyên sâu 6 Technical Contracts. | `1d44232` |
| 17/09/2026 | Phân Rã Giai Đoạn 1 | Phân rã Giai đoạn 1 thành 6 task nguyên tử (Task 1.1 $\to$ 1.6) độc lập, kiểm chứng được từng bước. | `b0698ec` |
| 17/09/2026 | Task 1.1: Hạ Tầng CSDL Docker | Cấu hình docker-compose.yml (PostgreSQL 16+ Alpine), .env.example, .gitignore; container dss_postgres chạy healthy trên port 5432. | `9426481` |
