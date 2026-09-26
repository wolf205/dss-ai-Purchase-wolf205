---
description: Architecture Decision Workflow — Phân tích impact, lập ADR, chờ xác nhận trước khi implement
---

# /architecture — Quy Trình Quyết Định Kiến Trúc

> **Nguyên tắc:** Không implement bất kỳ thay đổi kiến trúc nào khi ADR chưa được người dùng phê duyệt.

---

## Bước 1: Xác Định Loại Thay Đổi

Phân loại yêu cầu vào một trong các nhóm:

| Loại | Ví dụ | Mức độ impact |
|---|---|---|
| **Thêm module mới** | Module ngoài 9 module hiện có | 🔴 High — cần ADR |
| **Thay đổi DB schema** | Thêm/sửa/xóa bảng hoặc column | 🔴 High — cần ADR |
| **Tích hợp service mới** | Thêm container Docker, API ngoài | 🔴 High — cần ADR |
| **Thay đổi layering** | Move logic giữa tầng | 🟡 Medium — cần ADR |
| **Prisma migration** | Thêm column, index, constraint | 🟡 Medium — follow checklist |
| **Refactor internal** | Rename, extract function, trong 1 module | 🔵 Low — không cần ADR |

---

## Bước 2: Nạp Skill & Đọc Spec Liên Quan

1. Nạp `.agents/skills/architecture/SKILL.md` — checklist và ADR template.
2. Đọc spec ảnh hưởng:
   - `docs/technical/architecture.md` — kiến trúc hiện tại
   - `docs/technical/data-model.md` — 16 bảng hiện có
   - `docs/technical/api-specification.md` — nếu cần endpoint mới
   - `docs/business/use-cases/uc-<N>.md` — nếu liên quan UC

---

## Bước 3: Phân Tích Impact

Trả lời đầy đủ trước khi đề xuất ADR:

```markdown
### Impact Analysis

**Modules bị ảnh hưởng:** [Danh sách module]
**Bảng DB bị ảnh hưởng:** [Danh sách bảng]
**Endpoints bị ảnh hưởng:** [Danh sách endpoint]
**Vi phạm ràng buộc hiện có?** [Có/Không — nếu có, nêu rõ]
**Phương án thay thế không cần thay đổi kiến trúc?** [Có/Không — nếu có, mô tả]
```

---

## Bước 4: Lập Architecture Decision Record (ADR)

Trình bày ADR theo template trong `skills/architecture/SKILL.md`.

---

## Bước 5: Confirmation Gate ⛔

> **DỪNG TẠI ĐÂY.** Trình bày ADR cho người dùng.

Chỉ chuyển sang implement khi người dùng:
- Nhấn nút **Proceed**, hoặc
- Phản hồi xác nhận rõ ràng bằng text

Nếu người dùng yêu cầu điều chỉnh → cập nhật ADR → Gate lại.

---

## Bước 6: Implement & Document

Khi ADR đã được chốt:
1. Implement theo ADR đã thống nhất.
2. Chạy workflow `/implement` cho phần code cụ thể.
3. Lưu ADR vào `docs/project-decisions.md`.
4. Cập nhật `PROJECT_INDEX.md` nếu cấu trúc thư mục thay đổi.
