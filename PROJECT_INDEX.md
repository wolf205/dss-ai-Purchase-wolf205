# DSS AI-Purchase: Project Implementation Tracker

> **Tên dự án:** AI-Powered Purchase Decision Support System for a Single Retail Store
> **Nguyên tắc cốt lõi:** **AI recommends. Human decides.**
> **Giai đoạn hiện tại:** Triển khai Kỹ thuật (Implementation)
> **Cập nhật gần nhất:** 25/09/2026

---

## 1. Bản Đồ Tài Liệu (Source of Truth)

| Loại | File | Vai trò |
| :--- | :--- | :--- |
| Agent config | [GEMINI.md](GEMINI.md) | Routing, constraints, module map |
| Quyết định | [docs/project-decisions.md](docs/project-decisions.md) | 32+ quyết định đã chốt |
| Business Rules | [docs/business/business-rules.md](docs/business/business-rules.md) | 28 BRs: SS, ROP, SOQ, WSM, ABC-XYZ, OTIF |
| Use Cases | [docs/business/use-cases/](docs/business/use-cases/) | UC-01 → UC-07, main flow, post-conditions |
| Database Schema | [docs/technical/data-model.md](docs/technical/data-model.md) | 16 tables, 44 Invariants, DDL |
| API Contract | [docs/technical/api-specification.md](docs/technical/api-specification.md) | 30+ endpoints, DTOs, error codes |
| Architecture | [docs/technical/architecture.md](docs/technical/architecture.md) | 9 modules, 3-engine isolation |

---

## 2. Tiến Độ Triển Khai

### Giai đoạn 1 — Hạ tầng & Scaffolding ✅ HOÀN THÀNH

- [x] **1.1** `docker-compose.yml` — PostgreSQL 16 Alpine, volume `pgdata`, healthcheck, network `dss_network`, 4 service stubs (postgres, backend, ai-service, frontend). `.env.example`, `.gitignore`.
- [x] **1.2** Backend NestJS scaffold — TypeScript Strict, Global Prefix `/api/v1`, CORS, Cookie-parser, Swagger UI `/api/docs`, Standard API Envelope (`{ success, data, meta }`), `GET /api/v1/health`.
- [x] **1.3** Prisma schema & migration — `schema.prisma` 16 bảng khớp `data-model.md`, initial migration apply thành công vào PostgreSQL.
- [x] **1.4** Thin DB — Xóa toàn bộ Database Triggers và CHECK constraints khỏi migration; chuyển 44 Invariants lên Application Layer.
- [x] **1.5** Seed data — `prisma/seed.ts`: 2 users (admin/STORE_MANAGER + staff/PURCHASING_STAFF bcrypt), singleton `dss_configurations` (id=1), categories mẫu.
- [x] **1.6** AI Service & Frontend scaffold — Python 3.12 FastAPI `GET /health`, requirements.txt, Pydantic config. React 18 + Vite + TailwindCSS, proxy `/api`, layout shell.

---

### Giai đoạn 2 — IAM, RBAC & Audit Trail 🔄 ĐANG LÀM

- [x] **2.1** `AuthModule` — `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh` (Token Rotation, HttpOnly Cookie SHA-256), `JwtAuthGuard`.
- [x] **2.2** RBAC — `@Roles()` decorator, `RolesGuard`, 2 roles: `STORE_MANAGER` / `PURCHASING_STAFF`.
- [ ] **2.3** `AuditModule` — `AuditLogInterceptor` tự động ghi `activity_logs` (Append-Only, async, chỉ khi 2xx). `GET /api/v1/audit-logs` (MANAGER only, filter: action, username, fromDate, toDate).

---

### Giai đoạn 3 — AI Forecasting Service (Python FastAPI) ⏳ CHƯA BẮT ĐẦU

- [ ] **3.1** Pydantic v2 schemas — `TimeSeriesPayload` (horizonDays, series[{skuId, history[{date, quantity}]}]) và `ForecastResponse` (results[{skuId, dailyAverage, dailyDemandStd, modelUsed, dailyForecasts}]).
- [ ] **3.2** Zero-Demand padding — Bù đắp ngày không có dữ liệu bán = 0.0 trước khi chạy thuật toán.
- [ ] **3.3** Algorithm selector — Croston/TSB (CV > 1.0 hoặc nonZeroRatio < 70%), AutoARIMA/Holt-Winters (CV ≤ 0.5, chuỗi ≥ 30 ngày), SMA 7 ngày (chuỗi < 30 ngày).
- [ ] **3.4** `POST /api/v1/forecast` endpoint — Trả về `dailyAverage`, `dailyDemandStd`, `dailyForecasts` 14 ngày với CI 95% (lower/upper).
- [ ] **3.5** `GET /api/v1/health` đầy đủ — `{ status: "ok", service: "retail-dss-forecasting" }`.
- [ ] **3.6** Dockerfile + unit tests — `pytest --cov=src`, coverage 100% trên algorithm selector và zero-demand padding.

---

### Giai đoạn 4 — Master Data & Data Import (Foundation UCs) ⏳ CHƯA BẮT ĐẦU

#### 4A — CatalogModule (UC-05)
- [ ] **4A.1** `GET /api/v1/categories` — Danh sách ngành hàng (public).
- [ ] **4A.2** `GET/POST /api/v1/products` — Tra cứu SKU (public, filter, pagination) + Tạo SKU mới (MANAGER).
- [ ] **4A.3** `GET/PATCH /api/v1/products/{id}` — Chi tiết + Cập nhật (cấm sửa `sku_code`).
- [ ] **4A.4** `PATCH /api/v1/products/{id}/status` — Active ↔ Inactive (Soft Deactivate, cho phép khi còn on_order).
- [ ] **4A.5** `DELETE /api/v1/products/{id}` — Hard Delete chỉ khi Zero-Link; trả `HARD_DELETE_PROHIBITED` nếu có lịch sử.

#### 4B — SupplierModule (UC-06)
- [ ] **4B.1** `GET/POST /api/v1/suppliers` — Tra cứu (public, kèm OTIF 5 đơn) + Tạo mới (MANAGER, init `performance_score = 80%`).
- [ ] **4B.2** `PATCH /api/v1/suppliers/{id}` — Cập nhật hồ sơ (cấm sửa `supplier_code`).
- [ ] **4B.3** `PATCH /api/v1/suppliers/{id}/status` — Inactive: chặn nếu còn PO Approved.
- [ ] **4B.4** `GET/POST /api/v1/suppliers/{id}/conditions` — Danh sách + Gán SKU với giá nhập & MOQ.
- [ ] **4B.5** `PATCH /api/v1/supply-conditions/{id}` — Cập nhật giá/MOQ (chỉ áp dụng forward, snapshot PO cũ không đổi).

#### 4C — ConfigurationModule (UC-07)
- [ ] **4C.1** `GET /api/v1/dss-configurations` — Lấy singleton (cả 2 roles, STAFF read-only).
- [ ] **4C.2** `PUT /api/v1/dss-configurations` — Cập nhật (MANAGER): validate tổng 4 weights = 1.0 ± 0.001, `targetServiceLevel` ∈ {0.90, 0.95, 0.98, 0.99}, `reviewPeriodDays` ∈ [1, 30]. Trả `SUM_WEIGHT_NOT_100` nếu sai.
- [ ] **4C.3** `POST /api/v1/dss-configurations/reset` — Khôi phục về default (MANAGER).

#### 4D — DataImportModule (UC-04)
- [ ] **4D.1** `GET /api/v1/data-imports/templates/{type}` — Tải file mẫu CSV (type: `sales` / `inventory`).
- [ ] **4D.2** `POST /api/v1/data-imports/sales/validate` — Upload + validate file bán hàng (All-or-Nothing: 1 dòng sai → trả toàn bộ errors + `ALL_OR_NOTHING_IMPORT_FAILED`). Trả preview + `duplicateDatesFound`.
- [ ] **4D.3** `POST /api/v1/data-imports/sales/confirm` — Ghi đè dữ liệu ngày trùng + insert batch trong `prisma.$transaction`.
- [ ] **4D.4** `POST /api/v1/data-imports/inventory/validate` + `confirm` — Validate + cập nhật `current_inventory` (chỉ SKU có trong file, bảo lưu `on_order_quantity` nguyên vẹn).

---

### Giai đoạn 5 — DSS Engine & Gemini Explainability (Trọng tâm) ⏳ CHƯA BẮT ĐẦU

#### 5A — DssCalculationEngineService (Domain Layer)
- [ ] **5A.1** ABC-XYZ classification engine (BR-05) — Cumulative revenue → A/B/C (80/15/5%), CV = σd/d̄ → X/Y/Z (≤0.5/≤1.0/>1.0). Fallback: SKU < 7 ngày → CZ.
- [ ] **5A.2** Safety Stock engine (BR-01) — SS = Z × σd × √L. Z mapping (BR-26): {90%→1.28, 95%→1.65, 98%→2.05, 99%→2.33}. Fallback SKU < 14 ngày: SS = d̄ × 5.
- [ ] **5A.3** ROP & SOQ engine (BR-01, BR-03) — ROP = d̄×L + SS; IP = on_hand + on_order; Base SOQ = d̄×(L+R)+SS−IP; Final SOQ = max(MOQ, ⌈Base SOQ⌉) nếu > 0, else 0.
- [ ] **5A.4** WSM Supplier Ranking engine (BR-02, BR-24, BR-25) — Min-Max normalize Price/LeadTime/MOQ (lower=better), S_History từ rolling 5-order OTIF. Tie-breaking: S_Price > S_History. Cold Start < 3 orders → S_History = 80.
- [ ] **5A.5** StockRiskStatus classifier — 🔴 Cần mua gấp / 🟠 Sắp hết ROP / 🟢 An toàn / ⚪ Overstock.

#### 5B — DssModule Orchestration (UC-01)
- [ ] **5B.1** `POST /api/v1/dss/sessions/analyze` — Filter SKU Active theo `categoryId` (null = toàn cửa hàng); auto-discard phiên Draft cũ; gọi Python AI Service (timeout 3s + Graceful Fallback SMA); chạy 5A engines; lưu `recommendation_sessions` (Draft) + `recommendation_items` kèm snapshot (`snapshot_current_inventory`, `snapshot_on_order_quantity`, `daily_forecasts` JSONB, `supplier_rankings` JSONB).
- [ ] **5B.2** `GET /api/v1/dss/sessions/{id}` — Trả session + items đầy đủ (ABC-XYZ badge, ROP, SS, SOQ, suggestedSupplier với WSM score, dailyForecasts, supplierRankings, llmExplanation).
- [ ] **5B.3** `PATCH /api/v1/dss/items/{itemId}` — Human Adjustment: cập nhật `approved_quantity` và `approved_supplier_id`.
- [ ] **5B.4** `POST /api/v1/dss/items/{itemId}/explain` — Đọc cache `why_buy_explanation`; nếu null → gọi Gemini 1.5 Flash (timeout 3s, fallback text tất định) → cache vào DB. Tuyệt đối không gọi trong luồng analyze.
- [ ] **5B.5** `POST /api/v1/dss/sessions/{id}/approve` — ACID Transaction (INV-24,25,26,27): chốt session → cập nhật approved fields → tạo POs gom theo NCC → snapshot `historical_unit_price/moq/lead_time_days` → tăng `on_order_quantity`. Response: list POs đã sinh.

---

### Giai đoạn 6 — Purchase Orders & Goods Receipt (Closed-Loop) ⏳ CHƯA BẮT ĐẦU

#### 6A — PurchaseOrderModule (UC-02)
- [ ] **6A.1** `GET /api/v1/purchase-orders` — Danh sách PO (filter: status, supplierId, isOverdue; pagination). `isOverdue` tính runtime: `expectedDeliveryDate < TODAY && status = Approved`.
- [ ] **6A.2** `GET /api/v1/purchase-orders/{id}` — Chi tiết PO kèm line items (hiển thị snapshot historical price/MOQ).
- [ ] **6A.3** `POST /api/v1/purchase-orders/{id}/cancel` — Hủy PO (cần `cancellationReason`); giảm `on_order_quantity` cho từng SKU; trả `PO_ALREADY_CLOSED` nếu Completed/Cancelled.
- [ ] **6A.4** `POST /api/v1/purchase-orders/{id}/export` — Xuất PDF hoặc Excel (query param `format`); cập nhật `last_exported_at`.

#### 6B — GoodsReceiptModule (UC-03)
- [ ] **6B.1** `GET /api/v1/goods-receipts/pending-pos` — Danh sách PO Approved chưa nhận hàng.
- [ ] **6B.2** `POST /api/v1/goods-receipts` — ACID Transaction (INV-31..38): validate PO Approved + SKUs thuộc PO; chặn nếu 100% receivedQuantity = 0 (`ZERO_FULFILLMENT_RECEIPT`); tạo `goods_receipts` + `receipt_line_items`; tăng `current_inventory`; giảm `on_order_quantity`; đóng PO → Completed; tính OTIF (BR-13) và cập nhật rolling 5-order window (BR-24).

#### 6C — OTIF Calculation (Application Layer — trong UC-03 transaction)
- [ ] **6C.1** `FulfillmentRate = min(100%, receivedQty / orderedQty × 100%)` — Khóa tối đa 100%.
- [ ] **6C.2** `DaysLate = max(0, actualDate - expectedDate)` — `OnTimeFactor`: 0 ngày → 1.0, 1 → 0.67, 2 → 0.33, ≥3 → 0.0.
- [ ] **6C.3** `OrderScore = (OnTimeFactor × 50) + (FulfillmentRate × 0.5)` — Cập nhật rolling 5-order `performance_score`.

---

### Giai đoạn 7 — Web UI (React + Vite) ⏳ CHƯA BẮT ĐẦU

#### 7A — Hạ tầng Frontend
- [ ] **7A.1** Layout hệ thống — Sidebar (nav theo role), Navbar, responsive breakpoints, Design tokens (colors, spacing).
- [ ] **7A.2** AuthContext + ProtectedRoute — accessToken in memory, role-based route guard.
- [ ] **7A.3** Axios client — Base URL `/api/v1`, withCredentials, interceptor tự động retry sau 401 (gọi `/auth/refresh`).
- [ ] **7A.4** Toast / notification system — Success, Error, Warning.

#### 7B — Feature Screens
- [ ] **7B.1** `auth/` — Màn hình Login (form validation, error message).
- [ ] **7B.2** `dss-review/` (UC-01) — Trigger analyze, bộ lọc ngành hàng, bảng đề xuất với Badge ABC-XYZ, nút "Xem giải thích" (gọi LLM on-demand), modal Supplier Ranking (bảng điểm WSM), chỉnh sửa quantity/supplier, nút Approve. Biểu đồ Recharts: actual sales history + forecast 14 ngày + CI 95% band.
- [ ] **7B.3** `orders/` (UC-02) — Danh sách PO (filter status/overdue), badge Overdue, modal chi tiết, nút Cancel (form reason), nút Export PDF/Excel.
- [ ] **7B.4** `receipts/` (UC-03) — Dropdown chọn PO Approved, form nhập `receivedQuantity` từng dòng, soft warning khi giao vượt, nút Confirm Receipt.
- [ ] **7B.5** `data-import/` (UC-04) — Nút tải file mẫu (sales/inventory), drag-drop upload, data preview table, bảng lỗi chi tiết từng dòng (row + skuCode + issue).
- [ ] **7B.6** `catalog/` (UC-05) — Danh sách SKU (filter ngành hàng, search, pagination), form thêm/sửa (MANAGER), badge Active/Inactive, xem tồn kho.
- [ ] **7B.7** `suppliers/` (UC-06) — Danh sách NCC kèm OTIF badge 5 đơn, form hồ sơ (MANAGER), tab Supply Conditions (giá/MOQ/SKU), lịch sử giao hàng.
- [ ] **7B.8** `configuration/` (UC-07) — 4 sliders trọng số WSM (live validation tổng = 100%), radio Service Level (90/95/98/99%), input Review Period (1-30 ngày), nút Save + Reset.

---

### Giai đoạn 8 — Testing, Integration & Deployment ⏳ CHƯA BẮT ĐẦU

- [ ] **8.1** Unit tests Domain Engine (100% coverage) — `calculateSafetyStock`, `calculateRop`, `calculateSoq`, `classifyAbcXyz`, `calculateWsmScore`, `calculateOtif`, `selectForecastAlgorithm`.
- [ ] **8.2** Integration tests Service layer — Mock PrismaService, mock HttpService (AI Service), mock Gemini SDK cho các UC chính.
- [ ] **8.3** API tests AI Service — Pytest + TestClient: happy path, empty series, chuỗi < 30 ngày, intermittent demand.
- [ ] **8.4** E2E verification — Vòng lặp đầy đủ: Import data → DSS Analyze → Human Adjust → Approve → PO Export → Goods Receipt → OTIF Update → DSS Analyze lần 2 (kiểm tra OTIF phản ánh lại).
- [ ] **8.5** Docker Compose production build — 4 containers đầy đủ, health checks, depends_on ordering.
- [ ] **8.6** README.md — Hướng dẫn khởi chạy 1-click (`docker compose up`), tài khoản test mặc định, link Swagger UI.

---

## 3. Nhật Ký Milestone

| Ngày | Milestone | Kết quả | Commit |
| :--- | :--- | :--- | :---: |
| 17/09/2026 | Chốt tài liệu — chuyển phase Implementation | 100% docs Confirmed | `077aa59` |
| 17/09/2026 | Khởi tạo Project Index | Master Tracker 8 giai đoạn | `1d44232` |
| 17/09/2026 | Task 1.1 — Docker + PostgreSQL | Container `dss_postgres` healthy port 5432 | `9426481` |
| 18/09/2026 | Task 1.2 — NestJS Backend scaffold | Health check, Swagger, API Envelope | `e5a1945` |
| 18/09/2026 | Task 1.3 — Prisma 16 tables | `schema.prisma` apply thành công | Done |
| 19/09/2026 | Task 1.4 — Thin DB | Bỏ DB Triggers, chuyển lên App Layer | Done |
| 19/09/2026 | Task 1.5 — Seed data | 2 users, DSS config singleton, categories | Done |
| 19/09/2026 | Task 1.6 — AI Service + Frontend scaffold | FastAPI health, React+Vite shell | Done |
| 19/09/2026 | Task 2.1 — AuthModule JWT + Token Rotation | Login/Logout/Refresh/Me hoạt động | Done |
| 19/09/2026 | Task 2.2 — RBAC Guards | @Roles + RolesGuard active | Done |
| 25/09/2026 | Tái cấu trúc GEMINI.md + .agents/* | Audit + rewrite toàn bộ agent config | — |
