---
description: Spec-Driven Task Implementation Workflow — Plan-Before-Code (5 Pha)
---

# /implement-task — Quy Trình Triển Khai Task

> **Nguyên tắc bất biến:** Không gõ một dòng code nào khi Plan chưa được người dùng phê duyệt.

---

## Pha 1: Tra Cứu Spec Liên Quan

Trước khi làm bất kỳ việc gì:

1. Xác định task thuộc **Use Case** nào (UC-01 đến UC-07).
2. Đọc tài liệu nghiệp vụ liên quan:
   - Use Case chi tiết: `docs/business/use-cases/uc-<N>.md`
   - Business Rules liên quan: `docs/business/business-rules.md`
3. Đọc tài liệu kỹ thuật liên quan:
   - Bảng DB & constraints: `docs/technical/data-model.md`
   - Endpoints, DTOs, Error Codes: `docs/technical/api-specification.md`
   - Module & luồng kiến trúc: `docs/technical/architecture.md`
4. Nạp **Skill** phù hợp theo loại task (tra Agent Routing Guide trong `GEMINI.md`).

---

## Pha 2: Khảo Sát Codebase & Lập Implementation Plan

Dựa trên Spec đã đọc và trạng thái codebase hiện tại:

1. Kiểm tra các file hiện có — tránh tạo trùng hoặc ghi đè ngoài ý muốn.
2. Lập **Implementation Plan** gồm:

```markdown
## Implementation Plan — <Task Name>

### Mục tiêu
[Mô tả ngắn gọn những gì sẽ đạt được]

### Spec áp dụng
- Use Cases: UC-XX, UC-YY
- Business Rules: BR-XX, BR-YY
- API Endpoints: POST /api/v1/..., GET /api/v1/...
- DB Tables: table_a, table_b

### Danh sách file tác động
- [NEW]    src/modules/<name>/<name>.controller.ts
- [NEW]    src/modules/<name>/<name>.service.ts
- [MODIFY] src/app.module.ts
- [DELETE] (nếu có)

### Câu hỏi làm rõ / Lựa chọn kỹ thuật
- Q1: [Điểm còn phân vân] → Option A vs Option B → Đề xuất: Option A vì...

### Verification Plan
- [ ] `npx tsc --noEmit` pass
- [ ] `npm run lint` pass
- [ ] Test scenario: [mô tả cách kiểm thử cụ thể]
```

---

## Pha 3: Confirmation Gate ⛔

> **DỪNG TẠI ĐÂY.** Trình bày Implementation Plan cho người dùng.

Chỉ chuyển sang Pha 4 khi người dùng:
- Nhấn nút **Proceed**, hoặc
- Phản hồi xác nhận rõ ràng bằng text

Nếu người dùng yêu cầu điều chỉnh → cập nhật Plan → Confirmation Gate lại.

---

## Pha 4: Thực Thi & Tự Kiểm Tra

Khi Plan đã được chốt:

1. Viết mã nguồn đúng theo danh sách file đã thống nhất.
2. Tuân thủ nghiêm ngặt `.agents/rules/implement.md`.
3. **Không code ngoài phạm vi task** (No Scope Creep).
4. Sau khi viết xong, tự chạy:
   ```bash
   # Backend
   npx tsc --noEmit
   npm run lint
   npm run test
   
   # Frontend
   npm run lint
   
   # AI Service
   mypy src/
   pytest -v
   ```
5. Tự fix mọi lỗi lint/typecheck/test trước khi báo cáo.

---

## Pha 5: Walkthrough & Nghiệm Thu

Báo cáo kết quả gồm:

```markdown
## Walkthrough — <Task Name>

### Files đã tạo/sửa
- [NEW] src/modules/...
- [MODIFY] src/app.module.ts

### Kết quả tự kiểm tra
- TypeScript: ✅ 0 errors
- Lint: ✅ 0 errors
- Tests: ✅ X passed, 0 failed
- Build: ✅ Thành công

### Hướng dẫn nghiệm thu
1. Chạy: `npm run start:dev`
2. Gọi endpoint: `POST /api/v1/...` với body: {...}
3. Kết quả mong đợi: {...}
```

Chờ phản hồi nghiệm thu trước khi chuyển sang task tiếp theo.
