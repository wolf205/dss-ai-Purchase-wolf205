---
trigger: model_decision
description: Quy Tắc Viết Tài Liệu
---

# Quy Tắc Viết Tài Liệu

## 1. Mục Tiêu

Tài liệu phải phù hợp cho:

* Người đọc.
* AI Agent.
* Tham chiếu trong các giai đoạn phát triển tiếp theo.

---

## 2. Cấu Trúc

Ưu tiên:

```text
# Title

## Section

### Subsection
```

Mỗi Section chỉ tập trung vào một chủ đề.

---

## 3. Cách Viết

Ưu tiên:

* Câu ngắn.
* Đoạn ngắn.
* Bullet points.
* Bảng khi cần so sánh.
* Code block khi mô tả flow.

Hạn chế:

* Đoạn văn dài.
* Giải thích lặp lại.
* Marketing language.
* Từ ngữ mơ hồ.
* Chi tiết kỹ thuật không cần thiết.

---

## 4. Terminology

Dùng English keyword ổn định cho các khái niệm nghiệp vụ.

Ví dụ:

* `Demand Forecast`
* `Inventory`
* `Stockout`
* `Overstock`
* `Safety Stock`
* `Reorder Point`
* `Supplier`
* `Lead Time`
* `MOQ`
* `Purchase Recommendation`
* `Explainable Insights`

Không thay đổi terminology chỉ để tránh lặp từ.

---

## 5. Project Decision

Nếu một nội dung chưa được người dùng xác nhận:

```text
Status: Proposed
```

Nếu đã được người dùng xác nhận:

```text
Status: Confirmed
```

Không trình bày `Proposed` như một quyết định chính thức.

---

## 6. Khi Chỉnh Sửa Tài Liệu

Phải:

* Giữ lại nội dung đúng.
* Sửa mâu thuẫn.
* Xóa trùng lặp.
* Giữ document ngắn nhất có thể.
* Không tự ý mở rộng tài liệu.

Không sửa các phần không liên quan.
