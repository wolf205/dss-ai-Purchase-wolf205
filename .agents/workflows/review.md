---
description: Review Workflow — Review code toàn module và báo cáo issues theo severity
---

# /review-code — Quy Trình Review Code

---

## Bước 1: Xác Định Phạm Vi

Làm rõ trước khi bắt đầu:
- **Phạm vi review:** Module cụ thể? Tất cả files trong một PR? Toàn bộ hệ thống?
- **Mục đích:** Review trước milestone? Review sau khi implement task?

---

## Bước 2: Nạp Skill & Tài Liệu Tham chiếu

1. Nạp `.agents/skills/review/SKILL.md` để có checklist đầy đủ.
2. Mở sẵn các tài liệu đối chiếu:
   - `docs/technical/api-specification.md` — API contract
   - `docs/technical/data-model.md` — DB schema
   - `docs/business/business-rules.md` — Công thức tính toán

---

## Bước 3: Review Theo Checklist

Kiểm tra theo thứ tự từ ngoài vào trong:

```
1. Security (Critical nếu vi phạm)
   → Cookie flags, no hardcoded secrets, input validation

2. Contract Compliance (Critical nếu vi phạm)
   → API endpoint, DTO, error codes vs api-specification.md
   → Schema, constraints vs data-model.md
   → Business formulas vs business-rules.md

3. Architecture (Warning nếu vi phạm)
   → Strict layering: Controller → Service → Domain Engine → Infrastructure
   → LLM không trong critical path
   → Tier 3 transactions đúng 3 nghiệp vụ

4. Code Quality (Warning hoặc Suggestion)
   → Anti-patterns: Fat Controller, N+1 query, missing tests
   → Type safety: không dùng `any`
   → Error handling: không để raw exception lọt ra
```

---

## Bước 4: Báo Cáo Issues

Dùng format từ `skills/review/SKILL.md`:

```markdown
## Review Report — <Module/Scope>

### 🔴 Critical Issues
1. [File:Line] Vấn đề → Fix đề xuất

### 🟡 Warnings
1. [File:Line] Vấn đề → Fix đề xuất

### 🔵 Suggestions
1. [File:Line] Gợi ý

### ✅ Summary
- Critical: X | Warning: Y | Suggestion: Z
- Verdict: APPROVED / NEEDS_FIX / BLOCKED
- Next action: [Fix và submit lại / Sẵn sàng deploy]
```
