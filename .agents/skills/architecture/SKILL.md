---
name: architecture
description: >-
  Hướng dẫn thiết kế và quyết định kiến trúc: thêm module NestJS mới, thiết kế
  luồng dữ liệu giữa các tầng, tích hợp service mới, viết Prisma schema/migration,
  và lập Architecture Decision Record (ADR). Sử dụng khi có quyết định kiến trúc
  hoặc khi cần thêm cấu phần ngoài phạm vi các feature hiện có.
---

# Architecture Skill — Quyết Định & Thiết Kế Kiến Trúc

## 1. Checklist Trước Khi Thêm Module / Thay Đổi Cấu Trúc

Trả lời 5 câu hỏi này trước khi viết bất kỳ code nào:

1. **Thuộc UC nào?** → Tra Module Map trong `GEMINI.md` Mục 5 — có module nào đã cover chưa?
2. **Ảnh hưởng bảng DB nào?** → Đọc `docs/technical/data-model.md` — 16 bảng đã đủ chưa?
3. **Có endpoint mới không?** → Phải có trong `docs/technical/api-specification.md` trước khi code
4. **Có Business Rule nào chi phối không?** → Tra `docs/business/business-rules.md`
5. **Có vi phạm ranh giới tầng không?** → Kiểm tra Strict Layering trong `architecture.md` rule

## 2. Khi Thêm Module NestJS Mới

Chỉ thêm khi Module Map trong GEMINI.md chưa có UC này. Scaffold đúng thứ tự:

```
src/modules/<name>/
├── <name>.module.ts       # @Module decorator
├── <name>.controller.ts   # @Controller, @UseGuards
├── <name>.service.ts      # Orchestrate UC, manage tx
├── engines/               # Pure functions (nếu có Domain logic)
│   └── <name>.engine.ts
└── dto/
    ├── create-<name>.dto.ts
    └── update-<name>.dto.ts
```

Sau đó đăng ký vào `app.module.ts`.

## 3. Prisma Migration Checklist

Mỗi schema change phải qua:
1. Cập nhật `prisma/schema.prisma` — khớp 100% với `docs/technical/data-model.md`
2. Kiểm tra: `NUMERIC(15,2)` cho tiền tệ, `TIMESTAMPTZ` cho timestamps, `INTEGER` cho số lượng
3. Đảm bảo `ON DELETE RESTRICT` mặc định, chỉ `CASCADE` cho: `recommendation_items`, `po_line_items`, `receipt_line_items`, `refresh_tokens`
4. Chạy: `npx prisma migrate dev --name <migration_name>`
5. Verify: `npx prisma db push --dry-run` (xem diff trước khi commit)
6. Không tạo trigger/check constraint ở DB — xử lý tại Application Layer

## 4. Architecture Decision Record (ADR) Template

Khi có quyết định kiến trúc quan trọng, lập ADR trước khi implement:

```markdown
## ADR — <Tiêu đề quyết định>

### Bối cảnh
[Vấn đề cần giải quyết, context tại sao phải quyết định]

### Các phương án đã xem xét
- **Option A:** [Mô tả] — Pros: [...] / Cons: [...]
- **Option B:** [Mô tả] — Pros: [...] / Cons: [...]

### Quyết định
[Option được chọn và lý do]

### Hệ quả
[Ảnh hưởng đến các module khác, technical debt nếu có]
```

Lưu vào `docs/project-decisions.md`.

## 5. Câu Hỏi Tự Kiểm Khi Có Thay Đổi Kiến Trúc

```
✅ 16 bảng vẫn đủ — không thêm bảng ngoài spec
✅ 9 modules vẫn là ranh giới — không split module
✅ LLM vẫn chỉ tại /explain — không trên critical path
✅ AI Service vẫn stateless — không lưu state trong Python
✅ 4 containers Docker Compose — không thêm container
✅ Domain Engine vẫn pure function — không inject dependency
```
