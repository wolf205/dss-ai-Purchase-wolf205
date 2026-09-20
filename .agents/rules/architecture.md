---
trigger: model_decision
description: >-
  Đọc khi task liên quan đến quyết định kiến trúc: thêm module mới,
  thay đổi cấu trúc thư mục, tích hợp service mới, hoặc bất kỳ thay đổi
  nào ảnh hưởng đến ranh giới giữa các tầng ứng dụng.
---

# Architecture — Ràng Buộc Kiến Trúc Bất Biến

## 1. Stack Cố Định (Không Thêm/Thay)

```
Backend API    → NestJS (TypeScript, Port 3000) — Modular Monolith
AI Service     → Python FastAPI (Port 8000) — Stateless Compute
Frontend SPA   → React + Vite (TypeScript, Port 5173)
Database       → PostgreSQL 16+ (16 tables theo data-model.md)
Orchestration  → Docker Compose (chỉ 4 containers: postgres, backend, ai-service, frontend)
```

## 2. Phân Lập 3 Động Cơ DSS (Ba Bất Biến Không Được Vi Phạm)

| Engine | Trách nhiệm | Ràng buộc |
|---|---|---|
| **AI Forecasting** (Python) | Daily demand forecast, CI bands | Stateless, nhận payload qua HTTP |
| **Deterministic Calc** (NestJS) | SS, ROP, SOQ, ABC-XYZ, WSM | Pure functions, không phụ thuộc HTTP/DB |
| **LLM Explainability** (Gemini) | Giải thích on-demand cho từng SKU | **Tuyệt đối ngoài critical path UC-01** |

> **LLM không bao giờ được gọi trong luồng `POST /dss/sessions/analyze`.**  
> LLM chỉ kích hoạt khi user click "Xem giải thích" tại endpoint riêng.

## 3. Strict Layering (Backend NestJS)

```
Controller   → Nhận HTTP request, validate DTO, gọi Service, trả Envelope
    ↓
Service      → Điều phối Use Case, quản lý Transaction, gọi Domain Engine
    ↓
Domain Engine → Pure functions / stateless class — KHÔNG import Prisma, KHÔNG import NestJS HTTP
    ↓
Infrastructure → PrismaService, HttpService (gọi Python/Gemini)
```

> Controller không chứa logic. Domain Engine không truy vấn DB trực tiếp.

## 4. RBAC — 2 Roles Cố Định

| Role | Quyền |
|---|---|
| `STORE_MANAGER` | Toàn quyền: UC-05, UC-06, UC-07 + tất cả tác nghiệp |
| `PURCHASING_STAFF` | Chỉ tác nghiệp: UC-01, UC-02, UC-03, UC-04 (read-only catalog/config) |

Không thêm role mới. Guard: `@UseGuards(JwtAuthGuard, RolesGuard)`.

## 5. Bảo Mật Token

- **Access Token**: JWT ngắn hạn → lưu trong memory React (không localStorage)
- **Refresh Token**: Hash SHA-256 lưu bảng `refresh_tokens` → gửi qua Cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
- Cơ chế: Token Rotation — mỗi refresh sinh token mới, vô hiệu token cũ

## 6. Graceful Fallback (Python AI Service)

NestJS luôn bọc `try-catch` timeout **3 giây** khi gọi Python AI Service.  
Nếu lỗi → chuyển sang Simple Moving Average qua SQL + gắn `is_fallback: true` trong response.

## 7. Closed-Loop Feedback Path

```
UC-01 Approve → UC-02 Issue PO → UC-03 Goods Receipt
    → Tính OTIF Score (BR-13, BR-24)
    → Cập nhật Rolling 5-Order Window của Supplier
    → Cung cấp dữ liệu cho lần chạy DSS tiếp theo
```
