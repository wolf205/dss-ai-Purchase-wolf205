# Hướng Dẫn Thiết Kế API & Hợp Đồng Giao Tiếp (API Design Guidelines)

Tài liệu này cung cấp các nguyên tắc và chuẩn mực kỹ thuật để xây dựng tài liệu hợp đồng giao tiếp chi tiết `docs/technical/api-specification.md`.

---

## 1. Nguyên Tắc Cốt Lõi Của RESTful API Trong Dự Án

1. **Định Hướng Tài Nguyên (Resource-Oriented URI):**
   * Sử dụng danh từ số nhiều, chữ thường nối gạch ngang (`kebab-case`).
   * *Đúng:* `/api/v1/purchase-orders`, `/api/v1/recommendation-sessions`.
   * *Sai:* `/api/v1/getOrders`, `/api/v1/create_po`.
2. **Phiên Bản Hóa (API Versioning):**
   * Bắt buộc gắn tiền tố phiên bản: `/api/v1/...`.
3. **HTTP Methods Chuẩn Xác:**
   * `GET`: Truy vấn danh sách hoặc chi tiết tài nguyên (Idempotent, Safe).
   * `POST`: Tạo mới tài nguyên hoặc kích hoạt tác vụ nghiệp vụ (Analyze, Approve).
   * `PATCH`: Cập nhật một phần thuộc tính (ví dụ: thay đổi trạng thái Inactive).
   * `DELETE`: Xóa tài nguyên (chỉ cho phép khi Zero-Link theo BR-18, BR-23).

---

## 2. Chuẩn Hóa Cấu Trúc Phản Hồi (Standard API Envelope)

Toàn bộ các API phản hồi về Frontend phải được đóng gói theo định dạng thống nhất:

### 2.1. Phản Hồi Thành Công (Success Response)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-14T10:30:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 150,
      "totalPages": 8
    }
  }
}
```

### 2.2. Phản Hồi Thất Bại (Error Response)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "File import chứa dữ liệu không hợp lệ tại dòng 15.",
    "details": [
      {
        "row": 15,
        "field": "quantity",
        "issue": "Số lượng bán không được là số âm."
      }
    ],
    "timestamp": "2026-09-14T10:30:00.000Z",
    "path": "/api/v1/data-imports/sales"
  }
}
```

---

## 3. Bảng Phân Loại Mã Lỗi Nghiệp Vụ Chuẩn Hóa (Error Code Taxonomy)

| HTTP Status | Mã lỗi nghiệp vụ (`error.code`) | Ý nghĩa & Bối cảnh phát sinh |
| :--- | :--- | :--- |
| **400 Bad Request** | `VALIDATION_ERROR` | Dữ liệu đầu vào sai định dạng hoặc vi phạm ràng buộc DTO. |
| **400 Bad Request** | `ALL_OR_NOTHING_IMPORT_FAILED`| File nạp tại UC-04 chứa ít nhất một dòng vi phạm. |
| **400 Bad Request** | `SUM_WEIGHT_NOT_100` | Tổng trọng số đánh giá NCC tại UC-07 khác 100%. |
| **400 Bad Request** | `ZERO_FULFILLMENT_RECEIPT` | Toàn bộ các mặt hàng thực nhận tại UC-03 đều bằng 0 (100% Rejection). |
| **401 Unauthorized**| `UNAUTHORIZED` | Không có token hoặc token đã hết hạn / không hợp lệ. |
| **403 Forbidden**   | `FORBIDDEN_ROLE` | Nhân viên tác nghiệp cố truy cập API cấu hình/quản trị của Quản lý. |
| **404 Not Found**   | `RESOURCE_NOT_FOUND` | Không tìm thấy SKU, NCC, Đơn PO hoặc Phiên phân tích tương ứng. |
| **409 Conflict**    | `DUPLICATE_CODE` | Mã SKU hoặc Mã NCC đã tồn tại trong hệ thống (UPPER match). |
| **409 Conflict**    | `PO_ALREADY_CLOSED` | Cố tình sửa đổi hoặc nhận hàng cho đơn PO đã `Completed` hoặc `Cancelled`. |
| **409 Conflict**    | `HARD_DELETE_PROHIBITED` | Cố xóa SKU hoặc NCC đã phát sinh bất kỳ liên kết dữ liệu nào. |
| **500 Internal**    | `INTERNAL_SERVER_ERROR` | Lỗi không mong muốn tại server. |
| **503 Unavailable** | `AI_SERVICE_UNAVAILABLE` | Mất kết nối tới Python AI Service khi chạy dự báo nhu cầu. |

---

## 4. Bản Đồ Ánh Xạ Endpoints Cho 7 Use Cases & Phân Hệ Auth

### Phân hệ 0: Xác thực & Định danh (Auth & IAM)
* `POST /api/v1/auth/login` — Đăng nhập hệ thống, trả về Access Token + Set Cookie Refresh Token.
* `POST /api/v1/auth/refresh` — Quay vòng Refresh Token (Token Rotation) cấp Access Token mới.
* `POST /api/v1/auth/logout` — Đăng xuất, thu hồi Refresh Token trong CSDL.
* `GET  /api/v1/auth/me` — Lấy thông tin tài khoản và Role hiện hành.

### Phân hệ 1: Ra Quyết Định Mua Hàng DSS (UC-01)
* `POST /api/v1/dss/sessions/analyze` — Khởi tạo phiên phân tích mới, kích hoạt dự báo AI và tính toán DSS.
* `GET  /api/v1/dss/sessions/{id}` — Lấy chi tiết phiên phân tích và danh sách gợi ý SKU (kèm ABC-XYZ, WSM).
* `PATCH /api/v1/dss/items/{itemId}` — Cập nhật số lượng duyệt và NCC do người dùng điều chỉnh.
* `POST /api/v1/dss/items/{itemId}/explain` — Gọi LLM On-demand sinh văn bản giải thích lý do đề xuất.
* `POST /api/v1/dss/sessions/{id}/approve` — Chốt duyệt phiên phân tích, tự động sinh các đơn PO `Approved`.

### Phân hệ 2: Quản Lý Đơn Mua Hàng (UC-02)
* `GET  /api/v1/purchase-orders` — Tra cứu danh sách đơn PO (bộ lọc: NCC, ngày, trạng thái, cảnh báo quá hạn).
* `GET  /api/v1/purchase-orders/{id}` — Xem chi tiết đơn PO và các dòng hàng bảo lưu giá snapshot.
* `POST /api/v1/purchase-orders/{id}/cancel` — Hủy đơn PO (yêu cầu lý do hủy, tự động hoàn trả On-order).
* `POST /api/v1/purchase-orders/{id}/export` — Xuất đơn PO ra PDF/Excel, tự động cập nhật `last_exported_at`.

### Phân hệ 3: Nhận Hàng Kho Đơn Giản (UC-03)
* `GET  /api/v1/goods-receipts/pending-pos` — Tra cứu danh sách các đơn PO `Approved` đang chờ nhận hàng.
* `POST /api/v1/goods-receipts` — Xác nhận phiếu nhận hàng, cập nhật tồn kho kệ, giải phóng On-order và tính OTIF.

### Phân hệ 4: Nạp Dữ Liệu Vận Hành (UC-04)
* `POST /api/v1/data-imports/sales/validate` — Thẩm định file doanh số bán hàng (Data Preview & Row validation).
* `POST /api/v1/data-imports/sales/confirm` — Xác nhận ghi đè dữ liệu bán hàng vào CSDL (All-or-Nothing Transaction).
* `POST /api/v1/data-imports/inventory/validate` — Thẩm định file kiểm kê tồn kho.
* `POST /api/v1/data-imports/inventory/confirm` — Xác nhận cập nhật tồn kho kiểm kê kệ.
* `GET  /api/v1/data-imports/templates/{type}` — Tải file mẫu chuẩn (`sales` hoặc `inventory`).

### Phân hệ 5: Quản Lý Danh Mục Hàng Hóa (UC-05)
* `GET    /api/v1/products` — Tra cứu danh sách SKU (bộ lọc ngành hàng, tìm kiếm tên/mã, trạng thái).
* `POST   /api/v1/products` — Tạo mới SKU (`current_inventory = 0`, `on_order = 0`).
* `GET    /api/v1/products/{id}` — Xem chi tiết SKU.
* `PATCH  /api/v1/products/{id}` — Cập nhật thông tin SKU (cấm sửa mã SKU).
* `PATCH  /api/v1/products/{id}/status` — Chuyển trạng thái Active $\leftrightarrow$ Inactive.
* `DELETE /api/v1/products/{id}` — Hard Delete (chỉ cho phép khi Zero-Link).
* `GET    /api/v1/categories` — Lấy danh mục ngành hàng.

### Phân hệ 6: Quản Lý Nhà Cung Cấp & Báo Giá (UC-06)
* `GET    /api/v1/suppliers` — Tra cứu hồ sơ NCC kèm Lead Time cam kết và phong độ 5 đơn gần nhất.
* `POST   /api/v1/suppliers` — Tạo mới hồ sơ NCC (khởi tạo điểm tín nhiệm mặc định 80%).
* `PATCH  /api/v1/suppliers/{id}` — Cập nhật hồ sơ NCC (cấm sửa mã NCC).
* `PATCH  /api/v1/suppliers/{id}/status` — Chuyển trạng thái Active $\leftrightarrow$ Inactive (chặn nếu còn PO chờ).
* `GET    /api/v1/suppliers/{id}/conditions` — Danh sách điều kiện báo giá (SKU, Giá nhập, MOQ).
* `POST   /api/v1/suppliers/{id}/conditions` — Thiết lập điều kiện báo giá mới cho SKU.
* `PATCH  /api/v1/supply-conditions/{id}` — Cập nhật giá nhập hoặc MOQ (chỉ áp dụng cho tương lai).

### Phân hệ 7: Cấu Hình Tham Số DSS (UC-07)
* `GET  /api/v1/dss-configurations` — Lấy cấu hình tham số Singleton hiện hành.
* `PUT  /api/v1/dss-configurations` — Cập nhật bộ tham số (yêu cầu tổng 4 trọng số WSM = 100%, Service Level hợp lệ).
* `POST /api/v1/dss-configurations/reset` — Khôi phục cấu hình về giá trị mặc định chuẩn mực.

### Phân hệ 8: Nhật Ký Kiểm Toán (System Audit)
* `GET  /api/v1/audit-logs` — Tra cứu nhật ký hoạt động hệ thống (bộ lọc: User, Action, Ngày, Entity).
