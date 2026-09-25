---
trigger: model_decision
description: >-
  Đọc khi task liên quan đến quyết định kiến trúc: thêm module mới,
  thay đổi cấu trúc thư mục, tích hợp service mới, Prisma schema/migration,
  hoặc bất kỳ thay đổi nào ảnh hưởng đến ranh giới giữa các tầng ứng dụng.
---

# Architecture — Ràng Buộc Kiến Trúc Bất Biến

## 1. Stack & Container Cố Định (Không Thêm/Thay)

```
Backend API    → NestJS (TypeScript, Port 3000) — Modular Monolith, 9 Modules
AI Service     → Python 3.11+ FastAPI (Port 8000) — Stateless Compute
Frontend SPA   → React 18 + Vite (TypeScript, Port 5173 / 80)
Database       → PostgreSQL 16+ (16 tables theo data-model.md)
Orchestration  → Docker Compose (4 containers: postgres, backend, ai-service, frontend)
LLM External   → Google Gemini 1.5 Flash (gọi qua @google/genai SDK, On-demand only)
```

## 2. Phân Lập 3 Động Cơ DSS (Ba Bất Biến Không Được Vi Phạm)

| Engine | Trách nhiệm | Ràng buộc |
|---|---|---|
| **AI Forecasting** (Python FastAPI) | Daily demand forecast 14 ngày, CI 95%, trả về `dailyAverage` + `dailyDemandStd` | Stateless, nhận payload qua `POST /api/v1/forecast` |
| **Deterministic Calc** (NestJS DssCalculationEngineService) | ABC-XYZ, SS, ROP, SOQ, WSM Score — theo BR-01,02,03,04,05,25,26,27 | Pure functions, không import Prisma, không import HTTP |
| **LLM Explainability** (Gemini 1.5 Flash) | Tóm tắt "Why Buy" On-demand cho từng SKU | **Tuyệt đối ngoài critical path UC-01 Analyze** |

> **LLM không bao giờ được gọi trong `POST /api/v1/dss/sessions/analyze`.**
> LLM chỉ kích hoạt khi user click "Xem giải thích" → `POST /api/v1/dss/items/{itemId}/explain`.
> Cache kết quả tại `recommendation_items.why_buy_explanation`.

## 3. Strict Layering (Backend NestJS — 4 Tầng)

```
Controller   → Nhận HTTP, validate DTO (@UseGuards, @Roles), gọi Service, trả Envelope
    ↓
Service      → Điều phối Use Case, thiết lập prisma.$transaction, gọi Domain Engine
    ↓
Domain Engine → Pure functions / stateless class — KHÔNG import Prisma, KHÔNG import NestJS HTTP
    ↓             (DssCalculationEngineService, các engine pure function)
Infrastructure → PrismaService (DB), HttpService (Python AI Service), @google/genai (Gemini)
```

> Controller không chứa business logic.
> Domain Engine không truy vấn DB trực tiếp.
> Service không chứa math formulas — delegate xuống Domain Engine.

## 4. 9 Modules Backend Chuẩn Hóa

| Module | UC | Bảng DB |
|---|---|---|
| `AuthModule` | — | `users`, `refresh_tokens` |
| `CatalogModule` | UC-05 | `categories`, `products` |
| `SupplierModule` | UC-06 | `suppliers`, `supply_conditions` |
| `DssModule` | UC-01, UC-07 | `recommendation_sessions`, `recommendation_items`, `dss_configurations` |
| `PurchaseOrderModule` | UC-02 | `purchase_orders`, `po_line_items` |
| `GoodsReceiptModule` | UC-03 | `goods_receipts`, `receipt_line_items` |
| `DataImportModule` | UC-04 | `sales_records`, `inventory_snapshots` |
| `ConfigurationModule` | UC-07 | `dss_configurations` |
| `AuditModule` | Toàn hệ thống | `activity_logs` |

Không thêm module mới ngoài 9 module trên. Không chia nhỏ module hiện có.

## 5. RBAC — 2 Roles Cố Định

| Role | Quyền |
|---|---|
| `STORE_MANAGER` | Toàn quyền: UC-01 đến UC-07 + xem `audit-logs` + quản lý users |
| `PURCHASING_STAFF` | Tác nghiệp: UC-01,02,03,04 (full). UC-05,06,07: Read-only. Bị chặn `audit-logs` |

Guard bắt buộc: `@UseGuards(JwtAuthGuard, RolesGuard)`.
Không thêm role mới.

## 6. Bảo Mật Token

- **Access Token:** JWT 15 phút, chứa `sub`, `username`, `role` — lưu trong memory React (không localStorage)
- **Refresh Token:** Random string, SHA-256 hash lưu bảng `refresh_tokens`, 7 ngày
  - Cookie: `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
  - Token Rotation: mỗi refresh sinh token mới, thu hồi token cũ (`revoked_at = now()`)
  - Phát hiện reuse token → hủy toàn bộ session

## 7. Graceful Fallback (Python AI Service)

NestJS bọc `try-catch` timeout **3 giây** khi gọi Python AI Service.
Nếu lỗi → tính `dailyAverage` từ SQL trung bình lịch sử thô, gắn `isFallback: true` trong response, hiển thị cảnh báo mềm `[Dự báo Dự Phòng]` trên UI.

## 8. Closed-Loop Feedback Path

```
UC-04 Import → sales_records + current_inventory
    ↓
UC-01 Analyze → Python Forecast → NestJS Calc (ABC-XYZ, SS, ROP, SOQ, WSM) → recommendation_sessions
    ↓
UC-01 Approve → purchase_orders (Approved) + on_order_quantity tăng
    ↓
UC-02 Manage PO → Xuất/in PDF/Excel → Gửi NCC
    ↓
UC-03 Goods Receipt → current_inventory tăng + on_order giảm + PO Completed + OTIF Score (BR-13)
    ↓                    → rolling_5_order_otif_rate cập nhật (BR-24)
→ Nuôi lại WSM Score cho UC-01 lần tiếp theo
```

## 9. Nguyên Tắc Database (Thin DB Architecture)

- **16 bảng** — không thêm/bớt bảng ngoài spec `data-model.md`
- Logic nghiệp vụ (44 Invariants) tại Application Layer, không dùng DB CHECK constraints
- Snapshot denormalization: `historical_unit_price`, `historical_moq`, `historical_lead_time_days` tại `po_line_items`
- `ON DELETE RESTRICT` mặc định — chỉ `CASCADE` cho child tables: `recommendation_items`, `po_line_items`, `receipt_line_items`, `refresh_tokens`
- Kiểu dữ liệu: `NUMERIC(15,2)` cho tiền — `TIMESTAMPTZ` cho timestamps — `DATE` cho ngày lịch kinh doanh
