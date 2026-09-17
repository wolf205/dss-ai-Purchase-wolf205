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
  - [ ] Khởi tạo 3 thư mục Monorepo (`backend/`, `ai-service/`, `frontend/`).
  - [ ] Cấu hình `docker-compose.yml` (PostgreSQL 16+ container, volume, healthcheck).
  - [ ] Thiết lập Prisma ORM trong `backend/`: Đồng bộ 16 bảng chuẩn khớp `data-model.md`.
  - [ ] Tích hợp Triggers CSDL (tự động cập nhật `current_inventory`, `on_order_quantity`, tính OTIF).
  - [ ] Viết script `seed.ts` (2 tài khoản test, Danh mục ngành hàng mẫu, DSS Configuration singleton).

- [ ] **Giai đoạn 2: Hạ tầng Backend Core & Bảo mật IAM / RBAC**
  - [ ] Thiết lập Global `ValidationPipe` và Global `AllExceptionsFilter` (chuẩn hóa Standard API Envelope).
  - [ ] Triển khai `AuthModule`: Đăng nhập, đăng xuất, cấp Access Token JWT (15m) + Refresh Token HttpOnly Cookie (7d).
  - [ ] Triển khai cơ chế Token Rotation và tự động thu hồi session khi phát hiện Replay Attack.
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
  - [ ] `ConfigurationModule` (UC-07): Quản trị singleton bộ tham số DSS (trọng số WSM, Target Service Level).
  - [ ] `DataImportModule` (UC-04): Nạp file Excel/CSV (doanh số POS và kiểm kê kho); cơ chế All-or-Nothing bọc trong `prisma.$transaction`.

- [ ] **Giai đoạn 5: Động cơ Ra quyết định DSS & Giải thích Gemini On-Demand (Trọng tâm)**
  - [ ] `DssModule` (UC-01): Điều phối gọi Python AI Service (kèm Graceful Fallback sang trung bình lịch sử).
  - [ ] `DssCalculationEngineService` (Domain Layer): Thuật toán tất định ABC-XYZ, SS, ROP, SOQ khớp MOQ, WSM Supplier Ranking.
  - [ ] Lưu kết quả phân tích và toàn bộ snapshot dữ liệu vào `recommendation_sessions` & `recommendation_items`.
  - [ ] `LlmExplanationService`: Tích hợp Google Gemini 1.5 Flash On-demand theo từng SKU, lưu cache CSDL (0ms / 0 token cho các lần sau).

- [ ] **Giai đoạn 6: Vòng đời Đơn hàng & Đóng kín Vòng lặp Phản hồi (PO & Goods Receipt)**
  - [ ] `PurchaseOrderModule` (UC-02): Duyệt đề xuất sinh POs gom theo NCC, cập nhật hàng đang về (`on_order_quantity`), hủy đơn hoàn trả hàng, xuất PDF.
  - [ ] `GoodsReceiptModule` (UC-03): Nhận hàng kho 1:1 với PO, bọc ACID Transaction tăng tồn kệ, giảm hàng về, đóng PO.
  - [ ] Kích hoạt trigger tính tỷ lệ giao đủ hàng (`Fulfillment Rate`), OTIF linear penalty decay, cập nhật rolling 5 đơn của NCC.

- [ ] **Giai đoạn 7: Giao diện Người dùng Web UI (React + Vite)**
  - [ ] Thiết lập layout responsive, Sidebar, Navbar, Toast notifications, Design tokens.
  - [ ] Quản lý trạng thái xác thực và Axios Interceptor tự động Refresh Token.
  - [ ] 7 màn hình tính năng hoàn chỉnh:
    - [ ] Màn hình Đăng nhập (Auth).
    - [ ] Màn hình Bảng đề xuất DSS (UC-01): Badges ABC-XYZ, Modal Explain Gemini, Biểu đồ Recharts kết hợp (Lịch sử + Dự báo 14 ngày + Vùng tin cậy 95%).
    - [ ] Màn hình Quản lý Đơn mua hàng (UC-02): Danh sách PO, In/Xuất PDF.
    - [ ] Màn hình Nhận hàng kho (UC-03): Form nhận hàng, Soft warning giao thừa.
    - [ ] Màn hình Nạp dữ liệu vận hành (UC-04): Kéo thả file, xem trước lỗi chi tiết từng dòng.
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
| 17/09/2026 | Khởi Tạo Project Index | Xuất bản `PROJECT_INDEX.md` làm bản đồ điều hành và kim chỉ nam theo dõi tiến độ mã nguồn. | *Current* |
