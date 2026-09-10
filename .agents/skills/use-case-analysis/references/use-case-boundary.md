# Tham Chiếu: Use Case Boundary

## 1. Mục Đích

Xác định phần nào thuộc một Use Case và phần nào chỉ là:

* Step.
* Internal processing.
* Supporting action.
* Technical implementation.

---

## 2. Quy Tắc

Một Use Case nên bao phủ toàn bộ interaction cần thiết để Actor đạt Goal.

Không tách riêng mọi bước nhỏ thành Use Case.

Ví dụ:

```text
Xem Purchase Recommendation
    ├── Load Inventory
    ├── Calculate Risk
    ├── Load Forecast
    ├── Calculate Recommendation
    ├── Display Explanation
    └── Review Recommendation
```

Các bước trên không mặc định trở thành 6 Use Case riêng.

---

## 3. Use Case Và Internal Processing

Các hoạt động như:

* Tính Safety Stock.
* Tính ROP.
* Chạy Forecast.
* Tính Supplier Score.

có thể là **internal processing** của hệ thống trong một Use Case lớn hơn.

Chỉ tách chúng thành Use Case khi có Actor Goal độc lập và có lý do nghiệp vụ rõ ràng.
