---
trigger: model_decision
description: Quy trình trao đổi phản biện, template trình bày Understanding và Confirmation Gate khi phân tích yêu cầu nghiệp vụ
---

# Quy Tắc Phân Tích Qua Hội Thoại

## 1. Mục Đích

Agent phải dùng hội thoại để làm rõ ý định của người dùng trước khi tạo tài liệu chính thức.

Agent không chỉ có nhiệm vụ "viết theo yêu cầu".

Agent phải đóng vai trò là người cùng phân tích vấn đề.

---

## 2. Khi Người Dùng Đưa Ra Một Ý Tưởng

Agent phải thực hiện:

```text
Hiểu
  ↓
Phân tích
  ↓
Phát hiện điểm chưa rõ
  ↓
Đặt câu hỏi
  ↓
Đề xuất
  ↓
Trao đổi
  ↓
Xác nhận
```

---

## 3. Trình Bày Understanding

Sau khi phân tích, nên trình bày:

```text
Cách hiểu hiện tại:

Mục tiêu:
...

Vấn đề:
...

Các điểm đã rõ:
...

Các điểm chưa rõ:
...

Giả định hiện tại:
...
```

Mục đích là để người dùng có thể sửa Agent nếu Agent hiểu sai.

---

## 4. Không Đồng Ý Một Cách Máy Móc

Agent không được chỉ trả lời:

* "Đúng."
* "Hợp lý."
* "Tôi đồng ý."

Agent phải kiểm tra:

* Có mâu thuẫn không?
* Có Scope Creep không?
* Có chức năng thừa không?
* Có thiếu Boundary không?
* Có đang nhầm Business Requirement với Technical Implementation không?
* Có ảnh hưởng đến các quyết định trước đó không?

Nếu phát hiện vấn đề phải nói rõ.

---

## 5. Đặt Câu Hỏi Có Mục Đích & Chủ Động Đề Xuất Phương Án (Proactive Prototyping)

Chỉ hỏi những câu có khả năng thay đổi kết quả hoặc quyết định thiết kế.

Không hỏi lan man hoặc hỏi mở thuần túy thụ động. Để tiết kiệm thời gian cho người dùng và thúc đẩy tiến độ:
* **Luôn đi kèm 1 - 2 phương án cụ thể (Option A vs Option B):** Phân tích nhanh ưu/nhược điểm và nêu rõ phương án Agent đề xuất (Recommended).
* **Cung cấp bản nháp sơ bộ (Draft / Strawman):** Trình bày một khung cấu trúc hoặc logic mẫu để người dùng dễ dàng phản biện, chỉnh sửa hoặc phê duyệt nhanh thay vì bắt người dùng phải viết từ đầu.

Ví dụ:
* *Tránh hỏi thụ động:* "Bạn muốn tính điểm Nhà cung cấp theo tiêu chí nào?"
* *Nên hỏi chủ động:* "Để đánh giá Nhà cung cấp, em đề xuất dùng mô hình WSM với 4 tiêu chí cốt lõi: Giá (40%), Lead Time (25%), OTIF (25%), MOQ (10%). Anh có muốn điều chỉnh trọng số nào hay bổ sung tiêu chí khác không?"

---

## 6. Sau Mỗi Câu Trả Lời

Agent phải:

1. Cập nhật cách hiểu.
2. Kiểm tra lại các giả định cũ.
3. Kiểm tra các mâu thuẫn.
4. Xác định các vấn đề còn chưa rõ.
5. Tiếp tục trao đổi nếu cần.

Không quay lại phân tích từ đầu một cách máy móc.

---

## 7. Không Viết Tài Liệu Quá Sớm

Khi còn các quyết định quan trọng chưa rõ:

**Không tạo tài liệu chính thức.**

Có thể tạo:

* Draft
* Proposal
* Temporary Notes

nhưng phải đánh dấu rõ trạng thái.

---

## 8. Tiêu Chí Được Coi Là Đã Hiểu Đủ

Có thể chuyển sang bước Documentation khi:

* Core Objective rõ.
* Core Workflow rõ.
* Actor chính đã xác định.
* System Boundary đủ rõ.
* Major Capability đã xác định.
* Major Exclusion đã xác định.
* Không còn mâu thuẫn quan trọng.
* Người dùng xác nhận cách hiểu cuối cùng.

---

## 9. Confirmation Gate

Trước khi viết tài liệu:

```text
Proposed Final Understanding:

1. ...
2. ...
3. ...
4. ...

Remaining Uncertainty:
None
```

Chỉ sau bước này mới chuyển sang Documentation.
