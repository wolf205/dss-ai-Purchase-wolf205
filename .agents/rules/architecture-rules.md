---
trigger: model_decision
description: Quy tắc thiết kế Kiến trúc Hệ thống (System Architecture), phân tầng ứng dụng Modular Monolith, chuẩn hóa API, bảo mật RBAC, phân lập động cơ AI/DSS và kết nối CSDL PostgreSQL 16+.
---

# Quy Tắc Thiết Kế Kiến Trúc Hệ Thống (Architecture Rules)

## 1. Mục Đích & Vị Trí Trong Chuỗi Kỹ Thuật

Trong chuỗi chuyển tiếp một chiều được định nghĩa tại [GEMINI.md](../../GEMINI.md):
```text
Business Problem → Scope → Use Cases → Business Rules → Domain Model → Data Model → [Architecture] → Implementation
```

**Architecture (Thiết kế Kiến trúc Hệ thống)** là tầng kỹ thuật trung tâm, đóng vai trò chuyển hóa mô hình dữ liệu vật lý ([docs/technical/data-model.md](../../docs/technical/data-model.md) với 16 bảng PostgreSQL 16+) và 7 Use Cases nghiệp vụ thành bản thiết kế kỹ thuật phần mềm chi tiết, khả thi và tối ưu trước khi bắt tay vào lập trình (Implementation).

Mục tiêu cốt lõi:
* Xác lập mô hình kiến trúc tổng thể: **Polyglot Decoupled Architecture** (Backend Web API NestJS + AI Service Python + Frontend SPA React+Vite + CSDL PostgreSQL 16+).
* Hiện thực hóa nguyên tắc nền tảng **"AI recommends. Human decides"** thông qua phân lập 3 động cơ tính toán độc lập.
* Đóng kín vòng lặp dữ liệu (Closed-loop Feedback): kết nối từ duyệt mua (UC-01), phát hành PO (UC-02), nhận hàng (UC-03), tính điểm OTIF suy giảm tuyến tính đến cập nhật phong độ 5 đơn gần nhất phục vụ chấm điểm NCC ở lần chạy DSS kế tiếp.
* Thiết lập cơ chế bảo vệ Tier 3 Invariants tại tầng ứng dụng (Application Services & ACID Transactions).
* Chuẩn hóa hợp đồng giao tiếp (RESTful API Contracts) và phân định cấu trúc tài liệu theo mô hình Hub & Spoke (`architecture.md` và `api-specification.md`).

---

## 2. Ranh Giới Kỹ Thuật: Data Model vs Architecture vs Implementation

Agent bắt buộc phải duy trì ranh giới phân định rạch ròi:

| Khía cạnh | Data Model (Tầng trước) | Architecture (Tầng này) | Implementation (Tầng sau) |
| :--- | :--- | :--- | :--- |
| **Góc nhìn** | Lưu trữ dữ liệu quan hệ vật lý | Tổ chức thành phần, luồng dữ liệu, giao thức & giải pháp tích hợp | Mã nguồn cụ thể của ứng dụng |
| **Đối tượng** | 16 Tables, Cột, Constraints, Triggers, Indexes | Modules, Services, Controllers, API Contracts, Guards, C4 Diagrams | Files `.ts`, `.py`, `.tsx`, CSS, DTO classes, SQL migrations |
| **Trọng tâm** | Bất biến dữ liệu & Toàn vẹn tham chiếu | Phân tách trách nhiệm (SoC), Khả năng mở rộng, Tính bảo mật & Hiệu năng | Clean code, Xử lý ngoại lệ, Unit tests, Syntax |
| **Tài liệu đầu ra** | `docs/technical/data-model.md` | `docs/technical/architecture.md` & `docs/technical/api-specification.md` | Source code trong `src/` hoặc repo |

---

## 3. Các Nguyên Tắc Kiến Trúc Bắt Buộc (Architecture Invariants)

### 3.1. Phân Lập 3 Động Cơ Tính Toán DSS (Three-Engine Isolation)
Hệ thống phân định độc lập 3 động cơ nhằm bảo đảm tính minh bạch, tốc độ và độ tin cậy:
1. **AI Forecasting Engine (Python):**
   * Chuyên trách huấn luyện và suy luận chuỗi thời gian (Daily Demand Forecasting).
   * Đầu ra là mảng dự báo từng ngày kèm khoảng tin cậy được lưu vào `recommendation_items.daily_forecasts (JSONB)`.
   * Giao tiếp với Backend Web API qua RESTful HTTP API nội bộ.
2. **Deterministic Business Calculation Engine (Backend NestJS):**
   * Thực thi các công thức toán học tất định (Safety Stock, Reorder Point, Suggested Order Quantity, phân loại ABC-XYZ, mô hình chấm điểm nhà cung cấp WSM).
   * Cùng một tập dữ liệu đầu vào bắt buộc luôn sinh ra cùng một kết quả gợi ý mua hàng.
   * Không phụ thuộc vào kết nối mạng hay dịch vụ AI bên ngoài.
3. **On-Demand LLM Explainability Service (Google Gemini Flash):**
   * Chỉ kích hoạt theo nhu cầu (`On-demand`) khi người dùng chủ động bấm xem giải thích cho một SKU cụ thể tại UC-01.
   * **Tuyệt đối không đưa LLM vào đường dẫn tới hạn (Critical Path)** của chu trình phân tích mua hàng ban đầu.
   * Kết quả giải thích được lưu tạm (cache) vào `recommendation_items.llm_explanation`.

### 3.2. Kiến Trúc Vòng Lặp Khép Kín (Closed-Loop Feedback Architecture)
Mọi quyết định mua và giao nhận hàng phải khép kín chu trình dữ liệu để tự cải thiện chất lượng khuyến nghị:
```text
[UC-01: DSS Approve] 
        ↓ (sinh PO Approved)
[UC-02: Issue PO] 
        ↓ (gửi NCC, theo dõi)
[UC-03: Simple Goods Receipt] 
        ↓ (nhập kho, đối soát 1:1)
[Tính toán OTIF Score theo Linear Penalty Decay (BR-13, BR-24)]
        ↓ 
[Cập nhật Rolling 5-Order Performance Window của NCC (BR-02, UC-06)]
        ↓ 
[Cung cấp dữ liệu Lịch sử Giao hàng cho lần chạy DSS tiếp theo tại UC-01]
```

### 3.3. Hiện Thực Hóa Ràng Buộc Tier 3 (Application Service & Transactions)
Các bất biến không thể khóa cứng bằng DDL/Trigger (Tier 1 & Tier 2) bắt buộc phải được xử lý tại tầng ứng dụng:
* **INV-14 (All-or-Nothing Import):** Toàn bộ file dữ liệu bán hàng hoặc kiểm kê phải được kiểm tra 100% tính hợp lệ trước khi ghi vào CSDL. Mọi thao tác ghi phải bọc trong một Database Transaction duy nhất (`BEGIN ... COMMIT / ROLLBACK`).
* **INV-22 (Sales De-duplication & Overwrite):** Ghi đè dữ liệu bán hàng theo mốc ngày đã tồn tại trong transaction, bảo đảm không cộng dồn doanh số.
* **INV-32 (Receipt SKU Matching):** Đối soát tập SKU thực nhận khớp chính xác với các SKU trong đơn PO gốc trước khi cho phép xác nhận nhận hàng.
* **Date Validations (Non-immutable):** Kiểm tra `date <= CURRENT_DATE` tại DTO/Service layer trước khi lưu.

### 3.4. Bảo Mật, RBAC & Nhật Ký Kiểm Toán (Loose Coupling IAM)
* Xác thực Stateless qua cặp mã: `Access Token` (JWT ngắn hạn) và `Refresh Token` (băm SHA-256 lưu trong bảng `refresh_tokens`, cơ chế Token Rotation).
* Phân quyền cứng 2 vai trò qua NestJS Guards:
  * `STORE_MANAGER`: Toàn quyền cấu hình (UC-07), quản trị danh mục (UC-05), nhà cung cấp (UC-06), và tác nghiệp mua hàng.
  * `PURCHASING_STAFF`: Chỉ thực hiện tác nghiệp (UC-01, UC-02, UC-03, UC-04) và xem danh mục/NCC/cấu hình ở chế độ Read-only.
* `AuditLogInterceptor`: Tự động bắt sự kiện thành công của các hành vi trọng yếu và ghi nhận bất biến (Append-Only) vào bảng `activity_logs`.

---

## 4. Tiêu Chuẩn Biểu Diễn & Mô Hình Hóa

1. **C4 Model:**
   * Bắt buộc sử dụng mô hình C4 để biểu diễn kiến trúc từ tổng quan đến chi tiết:
     * *Level 1: System Context Diagram* (Người dùng, DSS System, External LLM API, Files).
     * *Level 2: Container Diagram* (Frontend SPA, Backend API, Python AI Service, PostgreSQL DB).
     * *Level 3: Component Diagram* (Phân rã các Modules bên trong Backend Web API).
2. **Mermaid Diagrams:** Toàn bộ sơ đồ kiến trúc và luồng tương tác (Sequence Diagrams) phải được vẽ bằng cú pháp Mermaid chuẩn.
3. **Cấu Trúc Tài Liệu Hub & Spoke:**
   * `docs/technical/architecture.md`: Bản thiết kế kiến trúc toàn cảnh.
   * `docs/technical/api-specification.md`: Hợp đồng giao tiếp kỹ thuật chi tiết (100% Endpoints, DTOs, Errors).

---

## 5. Quy Chuẩn Đặt Tên & Cấu Trúc Mã Nguồn Dự Kiến

1. **Backend (NestJS):**
   * Theo chuẩn Module: `src/modules/<module-name>/` (`auth`, `products`, `categories`, `suppliers`, `dss`, `orders`, `receipts`, `import`, `audit`).
   * Mỗi module gồm: `<name>.controller.ts`, `<name>.service.ts`, thư mục `dto/`. (Sử dụng trực tiếp `PrismaService` theo hướng Pragmatic, không bắt buộc tạo Repository bọc ngoài).
2. **Python AI Service:**
   * Tổ chức theo service nhẹ (FastAPI): `src/api/`, `src/forecasting/`, `src/models/`.
3. **Frontend (React + Vite):**
   * Tổ chức theo tính năng: `src/features/<feature-name>/` (`auth`, `dss-review`, `orders`, `receipts`, `import`, `catalog`, `suppliers`, `config`).
   * Thư mục dùng chung: `src/components/`, `src/hooks/`, `src/services/api/`.

---

## 6. Cơ Chế Phản Hồi Ngược (Feedback Loop)

Khi thiết kế kiến trúc, nếu phát hiện điểm mâu thuẫn với Data Model (16 bảng) hoặc 28 Business Rules:
1. Nêu rõ điểm bất cập và nguyên nhân kỹ thuật.
2. Đánh giá phạm vi ảnh hưởng tới các tầng trên.
3. Đề xuất phương án điều chỉnh cụ thể.
4. Chờ người dùng xác nhận trước khi cập nhật tài liệu tầng trên. Tuyệt đối không tự ý thay đổi schema CSDL đã chốt.
