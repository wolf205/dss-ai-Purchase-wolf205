---
name: architecture-design
description: >-
  Hướng dẫn phân tích, thiết kế và đặc tả Kiến trúc Hệ thống (System Architecture, Modular Monolith NestJS, Python AI Service, React+Vite, C4 Model, Subsystem Design, API Contracts, Security & Deployment) cho hệ thống DSS bán lẻ.
  Sử dụng khi thiết kế kiến trúc kỹ thuật, lựa chọn công nghệ, thiết kế API, hoặc viết tài liệu Architecture.
---

# Architecture Design Skill

## 1. Mục Đích & Vai Trò

Tài liệu này định hướng cho Agent (trong vai trò **Software Architect & System Designer**) thực hiện việc phân tích, thiết kế và đặc tả chi tiết **Kiến Trúc Hệ Thống (System Architecture)** cho hệ thống *AI-Powered Purchase Decision Support System for a Single Retail Store*.

Kiến trúc là cầu nối kỹ thuật quan trọng nhất giữa Cơ sở dữ liệu và Triển khai mã nguồn:
```text
Business Problem → Scope → Use Cases → Business Rules → Domain Model → Data Model → [Architecture] → Implementation
```

Mục tiêu chính:
* Hiện thực hóa mô hình **Polyglot Decoupled Architecture**: Backend Web API (NestJS Modular Monolith) + AI Forecasting Service (Python) + Frontend SPA (React + Vite) + CSDL (PostgreSQL 16+ với 16 bảng đã chốt).
* Cấu trúc hóa tài liệu kỹ thuật theo mô hình **Hub & Spoke** tối ưu: `docs/technical/architecture.md` (Bản thiết kế kiến trúc toàn cảnh) và `docs/technical/api-specification.md` (Hợp đồng giao tiếp chi tiết phục vụ trực tiếp bước Implementation).
* Phân lập triệt để 3 động cơ DSS: AI Forecasting chuỗi thời gian, Deterministic Business Calculations (SS, ROP, WSM Scoring, ABC-XYZ), và On-demand LLM Explainability (Gemini Flash).
* Hiện thực hóa chu trình phản hồi khép kín (Closed-Loop Supplier Performance Feedback) và cơ chế phòng thủ 3 tầng (Tier 3 Invariants tại tầng ứng dụng).
* Đặc tả cơ chế xác thực JWT, bảo mật RBAC 2 vai trò (`STORE_MANAGER` vs `PURCHASING_STAFF`), và lưu vết kiểm toán bất biến `activity_logs`.

---

## 2. Nguyên Tắc Thiết Kế Cốt Lõi

1. **Modular Monolith & Phân Tách Trách Nhiệm (Separation of Concerns):**
   * Backend Web API tổ chức theo các Module độc lập ánh xạ 1:1 với Bounded Contexts trong Domain Model.
   * Tránh bẫy Microservices phức tạp quá mức cho một cửa hàng bán lẻ đơn lẻ; giữ việc triển khai tinh gọn qua Docker Compose.
2. **"AI Recommends. Human Decides" Tại Mức Kiến Trúc:**
   * Thuật toán AI và LLM chỉ đóng vai trò phân tích, dự báo và gợi ý.
   * Đơn PO chỉ được phát hành khi con người bấm duyệt tại UC-01. Mọi sai lệch số liệu duyệt vs gợi ý (`Suggested` vs `Approved`) được âm thầm lưu vết phục vụ đánh giá mô hình.
3. **Non-blocking On-demand LLM:**
   * LLM API tuyệt đối không được nằm trong luồng tính toán đồng bộ của UC-01. Quá trình tính toán DSS phản hồi tức thì (< 1s); LLM chỉ được gọi khi người dùng click xem chi tiết giải thích cho từng mặt hàng.
4. **All-or-Nothing & Data Cleanliness First:**
   * File nạp bán hàng và kiểm kê tại UC-04 được thẩm định toàn diện trong ACID Transaction. Vi phạm bất kỳ dòng nào đều từ chối nạp cả tệp để bảo vệ chất lượng dữ liệu nuôi mô hình AI.

---

## 3. Bản Đồ Phân Rã Cấu Phần Hệ Thống (Component Decomposition)

Hệ thống bao gồm 4 khối thành phần chính:

```mermaid
graph TD
    subgraph Client ["Client Layer"]
        FE["Frontend SPA (React + Vite)"]
    end

    subgraph API_Gateway ["Backend Application (NestJS Modular Monolith)"]
        AUTH["Auth & RBAC Module"]
        CATALOG["Catalog Module (Products & Categories)"]
        SUPPLIER["Supplier & Conditions Module"]
        DSS_CORE["DSS Core Engine (Deterministic Calc & ABC-XYZ)"]
        ORDER["Purchase Order Module"]
        RECEIPT["Goods Receipt Module"]
        IMPORT["Data Import Module (Sales & Inventory)"]
        AUDIT["Audit Module (activity_logs)"]
    end

    subgraph AI_Subsystem ["AI & Intelligence Services"]
        PY_AI["Python AI Service (FastAPI / Time-series Forecasting)"]
        LLM["Google Gemini API (Gemini Flash LLM)"]
    end

    subgraph Persistence ["Database Layer (PostgreSQL 16+)"]
        DB[(PostgreSQL 16+ - 16 Tables)]
    end

    FE -->|HTTPS / REST API| API_Gateway
    API_Gateway -->|REST / HTTP| PY_AI
    API_Gateway -->|SDK / HTTPS| LLM
    API_Gateway -->|TypeORM / Kysely Connection Pool| DB
    PY_AI -->|Read Sales Data| DB
```

---

## 4. Mẫu Biểu Đồ Kiến Trúc Chuẩn Bực (C4 & Sequence Diagrams)

### 4.1. Sơ Đồ C4 Container (Level 2)
```mermaid
C4Container
    title Container Diagram for Single Retail Store DSS

    Person(manager, "Store Manager", "Quản trị danh mục, NCC, cấu hình DSS và phê duyệt mua hàng")
    Person(staff, "Purchasing Staff", "Thao tác phê duyệt đề xuất, xuất đơn PO, nhận hàng, import dữ liệu")

    System_Boundary(c1, "Retail Purchase DSS System") {
        Container(spa, "Single-Page Application", "React, Vite, TypeScript, Tailwind", "Giao diện người dùng cho 7 Use Cases")
        Container(api, "Backend Web API", "NestJS, TypeScript", "Xử lý nghiệp vụ, DSS Deterministic Calc, RBAC Guards, Audit Trail")
        Container(ai_svc, "AI Forecasting Service", "Python, FastAPI, Statsforecast/LightGBM", "Huấn luyện và dự báo chuỗi thời gian Daily Demand")
        ContainerDb(db, "Relational Database", "PostgreSQL 16+", "Lưu trữ 16 bảng dữ liệu, ràng buộc vật lý, Triggers")
    }

    System_Ext(gemini, "Google Gemini API", "Sinh văn bản giải thích lý do đề xuất On-demand")

    Rel(manager, spa, "Sử dụng", "HTTPS")
    Rel(staff, spa, "Sử dụng", "HTTPS")
    Rel(spa, api, "Gửi API Requests", "JSON/HTTPS (JWT)")
    Rel(api, db, "Đọc/Ghi dữ liệu", "TCP/PostgreSQL Pool")
    Rel(api, ai_svc, "Yêu cầu dự báo nhu cầu", "HTTP/REST")
    Rel(api, gemini, "Gọi prompt tóm tắt giải thích", "HTTPS/gRPC")
    Rel(ai_svc, db, "Truy vấn lịch sử bán hàng", "TCP/PostgreSQL")
```

### 4.2. Luồng Xử Lý Cốt Lõi UC-01 (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor User as Purchasing Staff / Manager
    participant FE as React Frontend
    participant API as NestJS Backend (DSS Module)
    participant AI as Python AI Service
    participant DB as PostgreSQL 16+
    participant LLM as Google Gemini API

    User->>FE: Bấm "Phân tích đề xuất mua hàng"
    FE->>API: POST /api/v1/dss/sessions/analyze
    API->>DB: Lấy cấu hình DSS, Active SKUs, Tồn kho kệ, On-order, NCC
    API->>AI: POST /forecast (Truyền danh sách SKU & Sales History)
    AI-->>API: Trả về Daily Forecasts (mảng ngày + biên độ)
    API->>API: Tính toán tất định (ABC-XYZ, SS, ROP, Order Qty, WSM Supplier Ranking)
    API->>DB: Lưu RecommendationSession & RecommendationItems (Status: Pending)
    API-->>FE: Trả về Giỏ hàng đề xuất DSS (Hoàn tất < 1s)
    
    opt Xem giải thích On-demand
        User->>FE: Bấm "Xem giải thích" tại SKU X
        FE->>API: POST /api/v1/dss/items/{id}/explain
        API->>LLM: Gửi Prompt (Context: ABC-XYZ, Tồn kho, Forecast, Điểm NCC)
        LLM-->>API: Trả về đoạn văn giải thích tự nhiên
        API->>DB: Cache giải thích vào recommendation_items.llm_explanation
        API-->>FE: Hiển thị đoạn giải thích
    end

    User->>FE: Điều chỉnh số lượng / NCC (nếu cần) & Bấm "Phê duyệt"
    FE->>API: POST /api/v1/dss/sessions/{id}/approve
    Note over API,DB: Transaction: Lưu chốt -> Sinh POs Approved -> Cập nhật On-order
    API->>DB: BEGIN Transaction -> Insert POs & Lines -> COMMIT
    API-->>FE: Phê duyệt thành công & Danh sách mã PO sinh ra
```

---

## 5. Quy Trình Thiết Kế Kiến Trúc 6 Bước (Architecture Workflow Steps)

```text
Bước 1: Xác lập Tổng quan Tech Stack & Rationale (NestJS, Python, React+Vite, PostgreSQL)
        ↓
Bước 2: Xây dựng biểu đồ C4 Context & Container và phân rã Modules Backend
        ↓
Bước 3: Thiết kế Phân hệ AI Forecasting & DSS Deterministic Engine & LLM On-demand
        ↓
Bước 4: Thiết kế chuẩn hóa API Contracts & DTOs (Hub & Spoke: api-specification.md)
        ↓
Bước 5: Thiết kế Bảo mật JWT/RBAC, Xử lý Bất biến Tier 3 & Nhật ký kiểm toán Audit
        ↓
Bước 6: Kiểm tra tính nhất quán (Consistency Check) & Xác nhận qua Confirmation Gate
```

---

## 6. Tiêu Chí Nghiệm Thu Chất Lượng & Anti-Patterns Cần Tránh

### Tiêu Chí Nghiệm Thu (Quality Checklist)
* [ ] Kiến trúc phản ánh đầy đủ 100% 7 Use Cases và 16 bảng CSDL PostgreSQL 16+.
* [ ] 3 động cơ DSS (Forecasting, Calculation, LLM) được phân lập rõ ràng, không có sự phụ thuộc chéo làm nghẽn hệ thống.
* [ ] Có cơ chế quản lý Transaction rõ ràng cho toàn bộ các Invariants thuộc Tier 3.
* [ ] RBAC 2 roles (`STORE_MANAGER` và `PURCHASING_STAFF`) được phân định rõ ràng trên từng nhóm API.
* [ ] Tài liệu được tổ chức theo mô hình Hub & Spoke: `architecture.md` (toàn cảnh) và `api-specification.md` (chi tiết hợp đồng DTO).

### Danh Mục Anti-Patterns Tuyệt Đối Tránh
* ❌ **Microservices Overkill:** Không chia nhỏ thành hàng chục microservices riêng biệt giao tiếp qua Kafka/RabbitMQ cho quy mô 1 cửa hàng bán lẻ.
* ❌ **Blocking LLM in Main Loop:** Không gọi LLM tuần tự cho hàng trăm SKU trong API phân tích DSS ban đầu.
* ❌ **Tight User Coupling:** Không tạo Foreign Key cứng từ các bảng nghiệp vụ mua hàng sang bảng `users`.
* ❌ **Floating Point Currency:** Không dùng `number` dấu phẩy động cho tiền tệ hoặc số lượng.
