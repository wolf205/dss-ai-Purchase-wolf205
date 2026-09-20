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
- [ ] `npm run lint` (backend) — 0 errors, 0 warnings
- [ ] `npx tsc --noEmit` (backend) — TypeScript Strict Mode pass
- [ ] `npm run lint` (frontend) — 0 errors
- [ ] `mypy src/` (ai-service) — 0 type errors
- [ ] Build không crash: `npm run build` (backend + frontend), `python -c "from src.main import app"` (ai-service)

### Contract Compliance
- [ ] Mọi endpoint khớp 100% `docs/technical/api-specification.md` (method, path, DTO fields, error codes)
- [ ] Mọi Prisma model + migration khớp 100% `docs/technical/data-model.md` (16 tables, columns, constraints)
- [ ] Mọi công thức tính toán khớp chính xác `docs/business/business-rules.md`

### Security
- [ ] Không commit file `.env`, secret keys, hardcoded passwords
- [ ] Cookie Refresh Token có đủ flags: `HttpOnly; Secure; SameSite=Strict`
- [ ] Input validation được áp dụng tại mọi endpoint mới

### Walkthrough
- [ ] Báo cáo rõ danh sách files đã tạo/sửa
- [ ] Kết quả tự kiểm tra (build status, test pass/fail count)
- [ ] Hướng dẫn đủ để người dùng chạy thử độc lập trên máy của mình

## Severity Levels (Khi Review Cho Người Khác)

| Level | Ý nghĩa | Hành động |
|---|---|---|
| 🔴 **Critical** | Vi phạm contract, security hole, data loss risk | Block — phải fix trước khi merge |
| 🟡 **Warning** | Code smell, missing test, edge case chưa handle | Fix trước milestone |
| 🔵 **Suggestion** | Cải thiện readability, performance nhỏ | Nice-to-have |
