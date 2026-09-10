# Tham Chiếu: Use Case Definition

## 1. Khái Niệm

Use Case mô tả cách một Actor tương tác với hệ thống để đạt được một mục tiêu có ý nghĩa.

Mô hình cơ bản:

```text
Actor
  ↓
Goal
  ↓
System Interaction
  ↓
Business Outcome
```

---

## 2. Use Case Không Phải Là

Use Case không đơn giản là:

* Một màn hình.
* Một API.
* Một bảng database.
* Một CRUD operation.
* Một button.
* Một thuật toán.

---

## 3. Một Use Case Tốt

Một Use Case nên:

* Có Actor rõ ràng.
* Có Goal rõ ràng.
* Có Outcome rõ ràng.
* Có Boundary hợp lý.
* Có giá trị nghiệp vụ.

---

## 4. Câu Hỏi Kiểm Tra

Khi nghi ngờ một Candidate Use Case, hỏi:

> "Actor đang cố gắng đạt được điều gì?"

Nếu câu trả lời chỉ là:

> "Actor muốn mở màn hình X"

thì đó thường không phải Business Use Case.

Nếu câu trả lời là:

> "Purchasing Staff muốn xác định những SKU cần được mua lại"

thì đây là một Business Goal phù hợp để tiếp tục phân tích.
