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

Nếu nhận task code → Chạy workflow `/implement-task` ngay.

## 2. API Envelope Chuẩn (Mọi Response)

```typescript
// Thành công
{ success: true, data: <T>, meta: { timestamp: string, ... } }

// Lỗi
{ success: false, error: { code: "ERROR_CODE", message: "...", details: [...] } }
```

Toàn bộ lỗi được bắt qua `AllExceptionsFilter` — không để raw stack trace lọt ra client.

## 3. Tier 3 ACID Transactions (3 Nghiệp Vụ Bắt Buộc)

| Use Case | Transaction boundary |
|---|---|
| **UC-01 Approve** | Chốt session → Sinh POs gom theo NCC → Cập nhật `on_order_quantity` |
| **UC-03 Goods Receipt** | Kiểm tra PO → Tạo Receipt → Cập nhật stock & on_order → Đóng PO → Ghi OTIF |
| **UC-04 Data Import** | Validate 100% file → Xóa dữ liệu ngày cũ trùng lặp → Insert batch (All-or-Nothing) |

Dùng `prisma.$transaction(async (tx) => { ... })`. Không commit partial data.

## 4. Type Safety

- **TypeScript Strict Mode** cho toàn bộ `backend/` và `frontend/`.
- **Pydantic** cho toàn bộ Request/Response DTOs trong `ai-service/`.
- Không dùng `any`, không dùng `float` cho tiền tệ/số lượng (dùng `Decimal`/`number` integer).

## 5. Security

- Không commit file `.env`, passwords, API keys, secrets vào Git.
- Duy trì `.env.example` đầy đủ tên biến với giá trị placeholder an toàn.
- Input validation qua `class-validator` + `ValidationPipe` (backend) và Pydantic (ai-service).

## 6. Feedback Loop Khi Có Mâu Thuẫn

Phát hiện Spec vs thực tế mâu thuẫn → **dừng coding** → báo cáo → đề xuất → chờ quyết định.  
Không tự ý giải quyết bằng cách bỏ qua spec hoặc thay đổi spec.
