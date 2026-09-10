# Tham Chiếu: Actor Và Goal

## Actor

Actor là đối tượng bên ngoài hệ thống có tương tác với hệ thống để đạt một mục tiêu.

Actor có thể là:

* Người dùng.
* Hệ thống bên ngoài.
* Thiết bị hoặc external service.

Chỉ đưa Actor vào Use Case Model khi Actor thực sự có tương tác có ý nghĩa trong phạm vi project.

---

## Goal

Goal mô tả kết quả Actor muốn đạt được.

Goal nên:

* Có giá trị nghiệp vụ.
* Có kết quả nhận biết được.
* Có liên quan đến Scope.

---

## Ví Dụ

### Không phù hợp

```text
Purchasing Staff
→ Click "Forecast"
```

Đây là UI interaction.

### Phù hợp

```text
Purchasing Staff
→ Xem dự báo nhu cầu
```

Nếu mục tiêu nghiệp vụ là:

> Đánh giá nhu cầu tương lai để hỗ trợ quyết định mua hàng.

thì đây là Goal có ý nghĩa hơn.
