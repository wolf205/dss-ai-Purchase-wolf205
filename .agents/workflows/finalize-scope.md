---
description: Finalize Scope Workflow
---

# Finalize Scope Workflow

## 1. Điều Kiện Bắt Đầu

Chỉ chạy workflow này khi Scope đã được trao đổi đủ rõ.

Không dùng workflow này để thay thế quá trình phân tích.

---

## 2. Đọc Context

Đọc:

```text
docs/business/business-problem.md
docs/project-decisions.md
```

và các tài liệu liên quan.

---

## 3. Tóm Tắt Final Understanding

Xác nhận:

* Business Objective.
* Core Problem.
* Core Workflow.
* Main Actors.
* Core Capabilities.
* System Boundary.
* In-Scope.
* Out-of-Scope.

---

## 4. Kiểm Tra Tính Nhất Quán

Kiểm tra:

* Có mâu thuẫn với Business Problem không?
* Có Scope Creep không?
* Có thiếu Core Capability không?
* Có Technical Detail lọt vào Scope không?
* Scope có quá lớn đối với project không?

---

## 5. User Validation

Trình bày Final Understanding cho người dùng.

Chưa tạo `scope.md` nếu người dùng chưa xác nhận.

---

## 6. Tạo Tài Liệu

Sau khi được xác nhận:

Tạo hoặc cập nhật:

```text
docs/business/scope.md
```

Chỉ ghi những nội dung đã được chốt.

---

## 7. Cập Nhật Project Decisions

Nếu Scope tạo ra quyết định quan trọng mới, cập nhật:

```text
docs/project-decisions.md
```

Chỉ ghi các quyết định đã được xác nhận.
