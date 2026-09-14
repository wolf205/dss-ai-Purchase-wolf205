# Khung Đặc Tả Kiến Trúc Hệ Thống (Architecture Specification Template)

Tài liệu này định nghĩa cấu trúc chuẩn mực cho tài liệu kỹ thuật chính thức `docs/technical/architecture.md`.

---

```markdown
# Kiến Trúc Kỹ Thuật Hệ Thống (Technical System Architecture)

* **Tên hệ thống:** AI-Powered Purchase Decision Support System for a Single Retail Store
* **Phiên bản:** 1.0
* **Trạng thái:** Status: Proposed | Confirmed
* **Tài liệu tham chiếu:** 
  * Mô hình Dữ liệu: [docs/technical/data-model.md](data-model.md)
  * Đặc tả API chi tiết: [docs/technical/api-specification.md](api-specification.md)
  * Quy tắc nghiệp vụ: [docs/business/business-rules.md](../business/business-rules.md)

---

## 1. Tổng Quan Kiến Trúc & Mục Tiêu Thiết Kế

### 1.1. Bối Cảnh & Triết Lý Vận Hành
Mô tả triết lý "AI recommends. Human decides", bài toán cân bằng Stockout vs Overstock cho một cửa hàng bán lẻ đơn lẻ.

### 1.2. Các Mục Tiêu Kiến Trúc Trọng Tâm (Architectural Drivers)
* **Tính Đúng Đắn & Bất Biến (Correctness & Immutability):** Đảm bảo tính toàn vẹn nghiệp vụ qua 3-Tier Invariant Defense.
* **Tốc Độ & Hiệu Năng (Performance & Responsiveness):** Phân tích DSS hoàn tất < 1s nhờ tách LLM ra khỏi critical path.
* **Tính Minh Bạch & Giải Trình Được (Explainability):** Minh bạch số liệu định lượng (ABC-XYZ, ROP, WSM) kết hợp văn bản tự nhiên On-demand từ LLM.
* **Đơn Giản & Dễ Triển Khai (Simplicity & Maintainability):** Áp dụng Modular Monolith, đóng gói trọn gói qua Docker Compose.

---

## 2. Lựa Chọn Công Nghệ (Tech Stack Selection & Rationale)

Bảng tổng hợp công nghệ và lý do lựa chọn:

| Phân tầng / Dịch vụ | Công nghệ lựa chọn | Lý do & Căn cứ kỹ thuật |
| :--- | :--- | :--- |
| **Database** | PostgreSQL 16+ | Hỗ trợ JSONB, Generated Columns, Triggers, ACID, Indexing phong phú |
| **Backend Web API** | NestJS (TypeScript) | Kiến trúc Modular Monolith chuẩn Enterprise, DI, Guards (RBAC), Interceptors (Audit), Swagger tự động |
| **AI Forecasting** | Python 3.11+ (FastAPI) | Hệ sinh thái AI/ML mạnh mẽ (Statsforecast, LightGBM, Pandas) tối ưu cho chuỗi thời gian |
| **LLM Provider** | Google Gemini API (Gemini Flash) | Độ trễ thấp (< 1s), chi phí tối ưu, tóm tắt ngữ cảnh kinh doanh chuỗi cung ứng |
| **Frontend Web App** | React 18+ + Vite + Tailwind | Hiệu năng cao, Component-based, Single Page Application, hỗ trợ biểu đồ chuỗi thời gian |
| **Container & Deploy**| Docker & Docker Compose | Đóng gói toàn bộ 4 containers: `frontend`, `backend`, `ai-service`, `postgres` |

---

## 3. Kiến Trúc Mức Cao (High-Level Architecture - C4 Model)

### 3.1. C4 Level 1: Sơ Đồ Ngữ Cảnh Hệ Thống (System Context Diagram)
(Sơ đồ Mermaid C4Context biểu diễn tương tác giữa Store Manager, Purchasing Staff, DSS System, Gemini API, File nạp)

### 3.2. C4 Level 2: Sơ Đồ Thùng Chứa (Container Diagram)
(Sơ đồ Mermaid C4Container biểu diễn các Container: React SPA, NestJS API, Python AI Service, PostgreSQL 16+)

### 3.3. Luồng Dữ Liệu Tổng Thể & Chu Trình Khép Kín (Closed-Loop Data Flow)
(Sơ đồ Mermaid luồng dữ liệu khép kín từ Import -> Forecast -> DSS Review -> PO Issue -> Goods Receipt -> OTIF Update)

---

## 4. Phân Rã Cấu Phần Backend (Backend Component Architecture)

### 4.1. Cấu Trúc Phân Tầng (Layered Architecture Pattern)
Mô tả 4 tầng:
1. *Presentation Layer (Controllers, DTOs, Guards, Interceptors)*
2. *Application / Service Layer (Use Case Coordinators, Transactions)*
3. *Domain / Business Engines (Deterministic DSS Calculators, WSM Scorer)*
4. *Infrastructure / Persistence Layer (Repositories, TypeORM/Kysely, PostgreSQL)*

### 4.2. Danh Mục Các Modules Chuẩn Hóa
Ánh xạ 1:1 với Bounded Contexts:
* `AuthModule`: Xác thực JWT, Refresh Token Rotation, RBAC Guards.
* `ProductsModule` & `CategoriesModule`: Master Data SKU, Tồn kho kệ hiện hành.
* `SuppliersModule`: Master Data NCC, Điều kiện cung ứng, Phong độ OTIF 5 đơn.
* `DssModule`: Động cơ tính toán gợi ý mua hàng, ABC-XYZ, lưu phiên và gọi LLM.
* `PurchaseOrdersModule`: Quản lý vòng đời đơn PO, xuất/in đơn, hủy đơn và hoàn trả On-order.
* `GoodsReceiptsModule`: Nhận hàng đơn giản, cập nhật tồn kho, đóng PO và tính OTIF.
* `DataImportModule`: Nạp dữ liệu bán hàng & kiểm kê hàng loạt với cơ chế All-or-Nothing.
* `AuditModule`: Ghi nhận nhật ký kiểm toán Append-Only vào `activity_logs`.

---

## 5. Thiết Kế Phân Hệ AI & DSS Engine (DSS Subsystem Architecture)

### 5.1. Phân Hệ Dự Báo Nhu Cầu Chuỗi Thời Gian (AI Demand Forecasting)
* Mô hình xử lý dữ liệu từ `sales_records`.
* Thuật toán dự báo (AutoARIMA, LightGBM, Exponential Smoothing) và xử lý Zero-demand.
* Giao thức tích hợp giữa NestJS Backend và Python Service.

### 5.2. Động Cơ Tính Toán Nghiệp Vụ Tất Định (Deterministic Business Calculations)
* Trình tự thực thi logic toán học:
  $$\text{ABC-XYZ} \longrightarrow \text{Safety Stock (SS)} \longrightarrow \text{Reorder Point (ROP)} \longrightarrow \text{Suggested Order Qty} \longrightarrow \text{WSM Ranking}$$
* Công thức toán học và cơ chế Fallback (BR-01, BR-02, BR-03).

### 5.3. Dịch Vụ Giải Thích Tự Nhiên On-Demand (LLM Explainability Service)
* Cấu trúc Prompt nghiệp vụ kết hợp số liệu định lượng và nhãn phân loại tồn kho.
* Chiến lược Caching kết quả giải thích vào `recommendation_items.llm_explanation`.
* Cơ chế Timeout và Graceful Degradation khi mất kết nối Gemini API.

---

## 6. Kiến Trúc Phân Hệ Frontend (Frontend Web Architecture)

### 6.1. Cấu Trúc Module Tính Năng (Feature-Based Structure)
Phân rã các màn hình tương ứng 7 Use Cases.

### 6.2. Quản Lý Trạng Thái & Giao Tiếp API (State Management & API Client)
* Cấu hình Axios/Fetch Client với Interceptor tự động Refresh Token.
* React Query / TanStack Query cho việc caching và re-fetching dữ liệu bảng.

---

## 7. Bảo Mật, Phân Quyền (RBAC) & Nhật Ký Kiểm Toán (Audit Trail)

### 7.1. Chu Trình Xác Thực JWT & Token Rotation
* Access Token ngắn hạn (15 phút).
* Refresh Token dài hạn (7 ngày), băm SHA-256 lưu trong bảng `refresh_tokens`.
* Thu hồi token khi Đăng xuất.

### 7.2. Phân Quyền RBAC Guards
* Ma trận phân quyền 2 vai trò (`STORE_MANAGER` vs `PURCHASING_STAFF`) trên từng endpoint.

### 7.3. Audit Interceptor
* Cơ chế bắt sự kiện tự động ghi nhận vào `activity_logs` (User, Action, Entity, Metadata diff).

---

## 8. Quản Lý Giao Dịch & Xử Lý Bất Biến Tier 3 (Transaction Management)

Chi tiết ranh giới Transaction (ACID Boundaries) cho:
1. *UC-01 Approve Recommendation:* Lưu chốt -> Tạo đơn POs -> Cập nhật On-order.
2. *UC-03 Confirm Goods Receipt:* Tạo Goods Receipt -> Cập nhật tồn kho kệ -> Tất toán On-order -> Cập nhật OTIF rolling window.
3. *UC-04 Operational Data Import:* Validate 100% -> Xóa/Ghi đè ngày cũ -> Chèn mới -> Commit / Rollback.

---

## 9. Kiến Trúc Triển Khai & Vận Hành (Deployment Architecture)

### 9.1. Docker Compose Topology
Cấu hình 4 containers:
* `dss-db`: PostgreSQL 16+ (Port 5432)
* `dss-backend`: NestJS Application (Port 3000)
* `dss-ai-service`: Python FastAPI (Port 8000)
* `dss-frontend`: React SPA Nginx (Port 80/443 hoặc 5173 dev)

### 9.2. Quản Lý Biến Môi Trường (Environment Configuration)

---

## 10. Liên Kết Tài Liệu Hợp Đồng API Chi Tiết

Toàn bộ chi tiết đặc tả 100% Endpoints, DTOs, Error Codes và Query Parameters được quy định chính thức tại:
👉 [docs/technical/api-specification.md](api-specification.md)
```
