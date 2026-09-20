---
name: review
description: >-
  Hướng dẫn review code toàn diện: checklist theo từng layer (Controller/Service/Domain/DB),
  phát hiện anti-patterns phổ biến, kiểm tra compliance với api-specification.md và data-model.md,
  security review, performance review. Sử dụng khi review một module hoàn chỉnh
  hoặc trước milestone release.
---

# Review Skill — Code Review Checklist

## 1. Review Theo Layer (Backend NestJS)

### Controller Layer
- [ ] Không chứa business logic — chỉ validate DTO, gọi Service, wrap Envelope
- [ ] Tất cả endpoints có `@UseGuards(JwtAuthGuard, RolesGuard)`
- [ ] DTOs dùng `class-validator` decorators đầy đủ (`@IsString`, `@IsUUID`, `@Min`, etc.)
- [ ] Response wrap đúng format: `{ success: true, data, meta: { timestamp } }`

### Service Layer
- [ ] Orchestrate Use Case — không truy vấn DB trực tiếp (dùng PrismaService qua constructor)
- [ ] Tier 3 operations wrapped trong `prisma.$transaction`
- [ ] Có `try-catch` bọc call sang Python AI Service với timeout
- [ ] HttpException throw với error code chuẩn (không throw raw Error)

### Domain Engine Layer
- [ ] Pure functions / stateless — không `import` từ `@nestjs/*` hoặc `@prisma/client`
- [ ] Tất cả có unit tests (`*.spec.ts`) cover Happy Path + Boundary + Error Cases
- [ ] Công thức tính toán có comment nguồn gốc từ `business-rules.md` (BR-XX)

### Infrastructure / Prisma
- [ ] Dùng `select` projection — không `findMany` lấy tất cả columns khi chỉ cần một phần
- [ ] Không N+1: dùng `include` hoặc nested select thay vì loop query
- [ ] Constraints trong Prisma schema khớp 100% với `data-model.md`

## 2. Anti-Patterns Phổ Biến Cần Phát Hiện

| Anti-Pattern | Dấu hiệu | Fix |
|---|---|---|
| **Fat Controller** | Logic if/else trong Controller | Chuyển xuống Service |
| **Anemic Service** | Service chỉ gọi thẳng Prisma không qua Domain Engine | Tạo Domain Engine function |
| **Blocking LLM** | `await geminiClient.generate()` trong luồng DSS Analysis | Chuyển sang endpoint riêng On-demand |
| **N+1 Query** | `findMany` rồi loop `findUnique` bên trong | Dùng Prisma `include` |
| **Missing Transaction** | UC-01/03/04 không dùng `prisma.$transaction` | Wrap transaction |
| **Hardcoded Secret** | JWT_SECRET, DB password trong code | Chuyển sang `.env` |
| **Raw any Type** | `const data: any = ...` | Định nghĩa TypeScript interface |

## 3. Security Checklist

- [ ] Cookie Refresh Token: `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`
- [ ] Access Token không lưu localStorage/sessionStorage (chỉ trong memory)
- [ ] Không có hardcoded credentials trong bất kỳ file nào (kể cả test files)
- [ ] File `.env` trong `.gitignore`; có `.env.example` đầy đủ
- [ ] Input validation đủ: không có endpoint nhận raw user input mà không validate
- [ ] RBAC áp dụng đúng: MANAGER-only endpoints có `@Roles(Role.STORE_MANAGER)`

## 4. Performance Checklist

- [ ] Không fetch columns thừa (dùng `select` trong Prisma)
- [ ] Pagination áp dụng cho tất cả list endpoints (`page`, `limit`)
- [ ] Index đã định nghĩa trong `data-model.md` có tương ứng trong `schema.prisma`
- [ ] JSON payload không quá lớn: `daily_forecasts` JSONB giới hạn 365 phần tử
- [ ] LLM call không block: chỉ được gọi On-demand, không trong UC-01 DSS Analysis

## 5. API Contract Compliance Check

Với mỗi endpoint mới, đối chiếu:

```
Kiểm tra trong docs/technical/api-specification.md:
  ✓ HTTP Method khớp (GET/POST/PUT/DELETE/PATCH)
  ✓ Path khớp chính xác (/api/v1/<resource>)
  ✓ Request DTO fields & types khớp
  ✓ Response DTO structure khớp
  ✓ Error codes khớp (VD: PRODUCT_NOT_FOUND, INVALID_QUANTITY)
  ✓ HTTP Status codes khớp (200, 201, 400, 401, 403, 404, 409, 422, 500)
```

## 6. Báo Cáo Review

Format báo cáo khi review cho người khác:

```markdown
## Review Report — <Module Name>

### 🔴 Critical Issues (phải fix trước khi merge)
1. [File:Line] Mô tả vấn đề → Fix đề xuất

### 🟡 Warnings (fix trước milestone)
1. [File:Line] Mô tả vấn đề → Fix đề xuất

### 🔵 Suggestions (nice-to-have)
1. [File:Line] Gợi ý cải thiện

### ✅ Summary
- Critical: X issues | Warning: Y issues | Suggestion: Z items
- Verdict: APPROVED / NEEDS_FIX / BLOCKED
```
