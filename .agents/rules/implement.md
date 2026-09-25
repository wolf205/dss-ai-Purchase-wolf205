---
trigger: model_decision
description: >-
  Đọc khi viết bất kỳ mã nguồn nào: NestJS controller/service/dto,
  React component/hook, Python FastAPI router/model, Prisma migration,
  hay bất kỳ file .ts, .tsx, .py nào trong project.
---

# Implement — Chuẩn Mực Code Bắt Buộc

## 1. Plan-Before-Code (Kỷ Luật Không Ngoại Lệ)

> Không gõ một dòng code nào khi Implementation Plan chưa được người dùng phê duyệt.

Nếu nhận task code → Chạy workflow `/implement` ngay.

## 2. API Envelope Chuẩn (Mọi Response)

```typescript
// Thành công (200 OK / 201 Created)
{ success: true, data: <T>, meta: { timestamp: string, pagination?: {...} } }

// Thất bại (4xx / 5xx)
{ success: false, error: { code: "ERROR_CODE", message: "...", details: [...], timestamp: string, path: string } }
```

Toàn bộ lỗi bắt qua `AllExceptionsFilter` — không để raw stack trace lọt ra client.

**Error Codes chuẩn hóa (từ api-specification.md):**
- `VALIDATION_ERROR` (400) · `ALL_OR_NOTHING_IMPORT_FAILED` (400) · `SUM_WEIGHT_NOT_100` (400)
- `ZERO_FULFILLMENT_RECEIPT` (400) · `INVALID_FUTURE_DATE` (400)
- `UNAUTHORIZED` (401) · `TOKEN_REVOKED` (401) · `FORBIDDEN_ROLE` (403)
- `RESOURCE_NOT_FOUND` (404) · `DUPLICATE_CODE` (409) · `PO_ALREADY_CLOSED` (409)
- `HARD_DELETE_PROHIBITED` (409) · `AI_SERVICE_UNAVAILABLE` (503)

## 3. Tier 3 ACID Transactions (3 Nghiệp Vụ Bắt Buộc)

| Use Case | Ranh giới Transaction | Invariants |
|---|---|---|
| **UC-01 Approve** | Chốt session → Cập nhật approved_quantity/supplier → Tạo POs gom theo NCC → Tăng `on_order_quantity` (Trigger) | INV-24,25,26,27 |
| **UC-03 Goods Receipt** | Thẩm định PO Approved → Tạo GR + lines → Trigger: tăng `current_inventory`, giảm `on_order`, đóng PO, tính OTIF | INV-31,32,33,35,36,37,38 |
| **UC-04 Data Import** | Validate 100% in-memory → deleteMany ngày trùng → createMany batch (All-or-Nothing) | INV-14,22,23 |

Dùng `prisma.$transaction(async (tx) => { ... })`. Không commit partial data.

## 4. Snapshot Bất Biến (Historical Immutability)

Khi tạo `po_line_items`, **bắt buộc** lưu snapshot tại thời điểm duyệt:
- `historical_unit_price` — không JOIN về `supply_conditions` hiện tại
- `historical_moq`
- `historical_lead_time_days`
- `expected_delivery_date = approval_date + supplier.committed_lead_time_days`

## 5. LLM — Critical Path Isolation

> **LLM (Gemini Flash) tuyệt đối không được gọi trong `POST /api/v1/dss/sessions/analyze`.**

- Chỉ kích hoạt: `POST /api/v1/dss/items/{itemId}/explain` (On-demand)
- Cache kết quả vào cột `recommendation_items.why_buy_explanation`
- Timeout: 3 giây; lỗi → trả về fallback text tất định

## 6. Type Safety

- **TypeScript Strict Mode** cho toàn bộ `backend/` và `frontend/`
- **Pydantic v2** cho toàn bộ Request/Response trong `ai-service/`
- Không dùng `any` — Không dùng `FLOAT`/`REAL` cho tiền tệ/tỷ lệ (dùng `NUMERIC` ở DB, `Decimal` hoặc `number` integer ở TS)

## 7. Security

- Không commit `.env`, passwords, API keys vào Git
- Duy trì `.env.example` đầy đủ với placeholder an toàn
- Input validation qua `class-validator` + `ValidationPipe` (backend) và Pydantic (ai-service)
- Cookie Refresh Token: `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`

## 8. Feedback Loop Khi Có Mâu Thuẫn

Phát hiện Spec vs thực tế mâu thuẫn → **dừng coding** → báo cáo → đề xuất → chờ quyết định.
Không tự ý bỏ qua spec hoặc thay đổi spec.
