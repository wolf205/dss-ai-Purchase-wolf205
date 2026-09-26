---
trigger: model_decision
description: >-
  Đọc trước khi bàn giao bất kỳ task code nào cho người dùng,
  hoặc khi cần review một module/feature hoàn chỉnh trước milestone.
---

# Review — Self-Verification Checklist

> Hoàn thành checklist này trước khi tuyên bố task "Done".
> Bàn giao code khi còn lỗi lint hoặc build fail là KHÔNG chấp nhận được.

## Checklist Bắt Buộc

### Code Quality
- [ ] `npx tsc --noEmit` (backend) — TypeScript Strict Mode pass, 0 errors
- [ ] `npm run lint` (backend) — 0 errors, 0 warnings
- [ ] `npm run lint` (frontend) — 0 errors
- [ ] `mypy src/` (ai-service) — 0 type errors
- [ ] Build không crash: `npm run build` (backend + frontend), `python -c "from src.main import app"` (ai-service)

### Contract Compliance
- [ ] Mọi endpoint khớp 100% `docs/technical/api-specification.md` (method, path, DTO fields, error codes, HTTP status)
- [ ] Mọi Prisma model + migration khớp 100% `docs/technical/data-model.md` (16 tables, columns, types, constraints)
- [ ] Mọi công thức tính toán khớp chính xác `docs/business/business-rules.md` (BR-01 SS/ROP/SOQ, BR-02 WSM, BR-05 ABC-XYZ, BR-13 OTIF)
- [ ] Snapshot fields được lưu đúng tại `po_line_items`: `historical_unit_price`, `historical_moq`, `historical_lead_time_days`

### Architecture Compliance
- [ ] LLM không được gọi trong `POST /api/v1/dss/sessions/analyze` — chỉ tại `/explain`
- [ ] Domain Engine là pure function — không import `@prisma/client` hay `@nestjs/*`
- [ ] Controller không chứa business logic — chỉ validate DTO, gọi Service, wrap Envelope
- [ ] Tier 3 transactions: UC-01 Approve, UC-03 Receipt, UC-04 Import đều có `prisma.$transaction`

### Security
- [ ] Không commit file `.env`, secret keys, hardcoded passwords (kể cả test files)
- [ ] Cookie Refresh Token có đủ flags: `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
- [ ] Access Token không lưu localStorage/sessionStorage (chỉ trong memory React)
- [ ] Input validation đầy đủ tại mọi endpoint mới

### Walkthrough
- [ ] Báo cáo rõ danh sách files đã tạo/sửa (với annotation [NEW]/[MODIFY])
- [ ] Kết quả tự kiểm tra (lint/typecheck/test pass counts)
- [ ] Hướng dẫn đủ để người dùng chạy thử độc lập

## Severity Levels (Khi Review Cho Người Khác)

| Level | Ý nghĩa | Hành động |
|---|---|---|
| 🔴 **Critical** | Vi phạm contract, security hole, data loss risk, LLM trên critical path | Block — phải fix trước khi merge |
| 🟡 **Warning** | Code smell, missing test, edge case chưa handle, thiếu snapshot | Fix trước milestone |
| 🔵 **Suggestion** | Cải thiện readability, performance nhỏ | Nice-to-have |
