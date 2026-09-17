# Đặc Tả Hợp Đồng Giao Tiếp API (Technical API Specification)

* **Tên hệ thống:** AI-Powered Purchase Decision Support System for a Single Retail Store
* **Phiên bản:** 1.0
* **Trạng thái:** Status: Confirmed
* **Tài liệu tham chiếu:**
  * Kiến trúc Toàn cảnh: [docs/technical/architecture.md](architecture.md)
  * Mô hình Dữ liệu: [docs/technical/data-model.md](data-model.md)
  * Quy tắc Nghiệp vụ: [docs/business/business-rules.md](../business/business-rules.md)

---

## 1. Quy Chuẩn Kỹ Thuật Chung

### 1.1. Base URL & Phiên Bản Hóa
Toàn bộ các API được định tuyến qua tiền tố phiên bản:
```text
https://{host}/api/v1
```

### 1.2. Chuẩn Hóa Cấu Trúc Phản Hồi (Standard API Envelope)

Mọi phản hồi từ Backend NestJS về Client React đều tuân thủ cấu trúc đồng nhất:

#### Phản Hồi Thành Công (HTTP 200 OK, 201 Created)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-14T20:00:00.000Z",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 150,
      "totalPages": 8
    }
  }
}
```

#### Phản Hồi Thất Bại (HTTP 4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu yêu cầu không hợp lệ.",
    "details": [
      {
        "field": "committedLeadTimeDays",
        "issue": "committedLeadTimeDays phải là số nguyên dương >= 1."
      }
    ],
    "timestamp": "2026-09-14T20:00:00.000Z",
    "path": "/api/v1/suppliers"
  }
}
```

### 1.3. Bảng Phân Loại Mã Lỗi Nghiệp Vụ Chuẩn Hóa (Error Code Taxonomy)

| HTTP Status | Error Code | Ý nghĩa nghiệp vụ |
| :--- | :--- | :--- |
| **400 Bad Request** | `VALIDATION_ERROR` | Dữ liệu đầu vào vi phạm ràng buộc DTO (`class-validator`). |
| **400 Bad Request** | `ALL_OR_NOTHING_IMPORT_FAILED` | File import tại UC-04 chứa ít nhất một dòng lỗi. |
| **400 Bad Request** | `SUM_WEIGHT_NOT_100` | Tổng 4 trọng số WSM tại UC-07 khác 100%. |
| **400 Bad Request** | `ZERO_FULFILLMENT_RECEIPT` | Toàn bộ các mặt hàng thực nhận tại UC-03 đều bằng 0 (100% Rejection). |
| **400 Bad Request** | `INVALID_FUTURE_DATE` | Ngày giao dịch vượt quá ngày hiện tại (`CURRENT_DATE`). |
| **401 Unauthorized**| `UNAUTHORIZED` | Thiếu token, token hết hạn hoặc chữ ký không hợp lệ. |
| **401 Unauthorized**| `TOKEN_REVOKED` | Refresh Token đã bị thu hồi hoặc phát hiện token tái sử dụng. |
| **403 Forbidden**   | `FORBIDDEN_ROLE` | Nhân viên tác nghiệp cố thực hiện thao tác quản trị của Store Manager. |
| **404 Not Found**   | `RESOURCE_NOT_FOUND` | Không tìm thấy SKU, NCC, Đơn PO hoặc Phiên phân tích tương ứng. |
| **409 Conflict**    | `DUPLICATE_CODE` | Mã SKU hoặc Mã NCC đã tồn tại trong hệ thống (UPPER match). |
| **409 Conflict**    | `PO_ALREADY_CLOSED` | Cố sửa đổi hoặc nhận hàng cho đơn PO đã `Completed` hoặc `Cancelled`. |
| **409 Conflict**    | `HARD_DELETE_PROHIBITED` | Cố xóa SKU hoặc NCC đã có liên kết dữ liệu lịch sử (Zero-link violation). |
| **500 Internal**    | `INTERNAL_SERVER_ERROR` | Lỗi máy chủ không mong muốn. |
| **503 Unavailable** | `AI_SERVICE_UNAVAILABLE` | Python AI Service mất kết nối khi gọi dự báo chuỗi thời gian. |

---

## 2. Phân Hệ 0: Xác Thực & Định Danh (Authentication & IAM)

### 2.1. Đăng Nhập Hệ Thống
* **Endpoint:** `POST /api/v1/auth/login`
* **Quyền hạn:** Public
* **Request DTO (`LoginRequestDto`):**
```json
{
  "username": "manager_an",
  "password": "SecretPassword123!"
}
```
* **Response DTO (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "manager_an",
      "role": "STORE_MANAGER"
    }
  }
}
```
*(Ghi chú: Backend đồng thời gửi header `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`)*.

### 2.2. Quay Vòng Token (Token Rotation)
* **Endpoint:** `POST /api/v1/auth/refresh`
* **Quyền hạn:** Public (Yêu cầu Cookie `refreshToken`)
* **Response DTO (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2.3. Đăng Xuất
* **Endpoint:** `POST /api/v1/auth/logout`
* **Quyền hạn:** Authenticated
* **Mô tả:** Đánh dấu `revoked_at = now()` trên `refresh_tokens`, xóa Cookie client.

### 2.4. Lấy Thông Tin Người Dùng Hiện Hành
* **Endpoint:** `GET /api/v1/auth/me`
* **Quyền hạn:** Authenticated

---

## 3. Phân Hệ 1: Hỗ Trợ Ra Quyết Định Mua Hàng (UC-01 Core DSS)

### 3.1. Khởi Tạo Phiên Phân Tích Mua Hàng
* **Endpoint:** `POST /api/v1/dss/sessions/analyze`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Request DTO (`AnalyzeSessionRequestDto`):**
```json
{
  "categoryId": 1
}
```
*(Ghi chú: `categoryId` là tùy chọn; nếu `null` hoặc không truyền, hệ thống quét toàn bộ danh mục SKU Active).*
* **Mô tả:** Kích hoạt chuỗi phân tích DSS: Lọc danh mục SKU theo phạm vi $\rightarrow$ Gọi Python AI Service dự báo 14 ngày tới $\rightarrow$ Chạy thuật toán tất định (ABC-XYZ, SS, ROP, SOQ, WSM) $\rightarrow$ Tự động chuyển phiên nháp cũ sang `Discarded` (INV-REC-03) $\rightarrow$ Lưu bản ghi `recommendation_sessions` ở trạng thái `Draft`.
* **Response DTO (HTTP 201):**
```json
{
  "success": true,
  "data": {
    "sessionId": 105,
    "sessionCode": "REC-20260915-001",
    "totalSkusAnalyzed": 120,
    "suggestedOrderCount": 18,
    "createdAt": "2026-09-15T08:30:00.000Z"
  }
}
```

### 3.2. Lấy Chi Tiết Phiên Phân Tích & Bảng Đề Xuất DSS
* **Endpoint:** `GET /api/v1/dss/sessions/{id}`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Response DTO (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "sessionId": 105,
    "sessionCode": "REC-20260915-001",
    "status": "Draft",
    "items": [
      {
        "itemId": 1001,
        "skuId": 12,
        "skuCode": "MILK-TH-1L",
        "skuName": "Sữa tươi TH True Milk 1L",
        "categoryName": "Hàng Tươi Sống",
        "abcClassification": "A",
        "xyzClassification": "X",
        "currentInventory": 15,
        "onOrderQuantity": 0,
        "reorderPoint": 35,
        "safetyStock": 12,
        "suggestedQuantity": 50,
        "approvedQuantity": 50,
        "suggestedSupplier": {
          "id": 3,
          "code": "TH_TRUE_MILK",
          "name": "Công ty Cổ phần Sữa TH",
          "leadTimeDays": 2,
          "moq": 20,
          "unitPrice": 32000.00,
          "wsmScore": 92.5
        },
        "approvedSupplierId": 3,
        "dailyForecasts": [
          { "date": "2026-09-16", "predicted": 12.0, "lower": 10.0, "upper": 14.0 },
          { "date": "2026-09-17", "predicted": 13.0, "lower": 11.0, "upper": 15.0 }
        ],
        "supplierRankings": [
          { "supplierId": 3, "name": "TH True Milk", "score": 92.5, "price": 32000, "leadTime": 2 },
          { "supplierId": 5, "name": "Đại Lý Hà Nội", "score": 81.0, "price": 33500, "leadTime": 1 }
        ],
        "llmExplanation": null
      }
    ]
  }
}
```
*(Ghi chú: Trường DTO `llmExplanation` được ánh xạ trực tiếp từ cột CSDL `recommendation_items.why_buy_explanation` - mặc định `null`, chỉ sinh khi gọi endpoint explain).*

### 3.3. Điều Chỉnh Số Lượng / NCC Được Chọn (Human Adjustment)
* **Endpoint:** `PATCH /api/v1/dss/items/{itemId}`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Request DTO (`UpdateRecommendationItemDto`):**
```json
{
  "approvedQuantity": 60,
  "approvedSupplierId": 3
}
```

### 3.4. Yêu Cầu Giải Thích Tự Nhiên On-Demand (Google Gemini Flash)
* **Endpoint:** `POST /api/v1/dss/items/{itemId}/explain`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Mô tả:** Đọc cache từ CSDL; nếu chưa có thì gọi Gemini Flash tóm tắt lý do mua và cache lại.
* **Response DTO (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "itemId": 1001,
    "llmExplanation": "Mặt hàng này thuộc nhóm A-X (Doanh số cao, nhu cầu rất ổn định). Tồn khả dụng (15 hộp) hiện đã rơi xuống dưới mức đặt hàng lại ROP (35 hộp), tiềm ẩn rủi ro đứt hàng trong 2 ngày tới. Đề xuất đặt 50 hộp từ TH True Milk do đối tác đạt điểm WSM cao nhất (92.5) với giá nhập tốt nhất và lịch sử giao hàng 5 đơn gần nhất đạt 100% đúng hạn."
  }
}
```

### 3.5. Phê Duyệt Phiên Phân Tích & Sinh Đơn PO (Approval)
* **Endpoint:** `POST /api/v1/dss/sessions/{id}/approve`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Mô tả:** Chốt duyệt giỏ hàng trong ACID Transaction: Cập nhật session sang `Approved`, tạo các đơn `purchase_orders` ở trạng thái `Approved` (gom theo NCC), kích hoạt trigger tăng `on_order_quantity`.
* **Response DTO (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "sessionId": 105,
    "generatedPurchaseOrders": [
      {
        "poId": 201,
        "poNumber": "PO-20260915-001",
        "supplierName": "Công ty Cổ phần Sữa TH",
        "totalLines": 5,
        "totalAmount": 12500000.00,
        "expectedDeliveryDate": "2026-09-17T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 4. Phân Hệ 2: Quản Lý Đơn Mua Hàng (UC-02 Purchase Orders)

### 4.1. Tra Cứu Danh Sách Đơn PO
* **Endpoint:** `GET /api/v1/purchase-orders`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Query Params:** `page`, `limit`, `status` (`Approved`, `Completed`, `Cancelled`), `supplierId`, `isOverdue` (boolean).

### 4.2. Xem Chi Tiết Đơn PO
* **Endpoint:** `GET /api/v1/purchase-orders/{id}`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Mô tả:** Trả về đơn PO kèm các dòng hàng bảo lưu giá và điều kiện snapshot.

### 4.3. Hủy Đơn PO (Cancel PO with On-Order Reversal)
* **Endpoint:** `POST /api/v1/purchase-orders/{id}/cancel`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Request DTO (`CancelPoDto`):**
```json
{
  "cancellationReason": "Nhà cung cấp báo hết hàng đột xuất tại kho tổng"
}
```
* **Mô tả:** Cập nhật `status = 'Cancelled'`. Trigger 2 trong CSDL tự động hoàn trả/giảm trừ `products.on_order_quantity`.

### 4.4. Xuất Đơn PO Ra File / In Ấn
* **Endpoint:** `POST /api/v1/purchase-orders/{id}/export`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Query Params:** `format=pdf` hoặc `format=excel`.
* **Mô tả:** Cập nhật cột metadata `last_exported_at = now()`, trả về file stream tải về.

---

## 5. Phân Hệ 3: Nhận Hàng Kho Đơn Giản (UC-03 Goods Receipts)

### 5.1. Danh Sách Đơn PO Đang Chờ Nhận Hàng
* **Endpoint:** `GET /api/v1/goods-receipts/pending-pos`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Mô tả:** Lấy danh sách các đơn PO ở trạng thái `Approved` chưa nhận hàng.

### 5.2. Xác Nhận Phiếu Nhận Hàng Kho (Confirm Receipt)
* **Endpoint:** `POST /api/v1/goods-receipts`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Request DTO (`CreateGoodsReceiptDto`):**
```json
{
  "purchaseOrderId": 201,
  "receiptDate": "2026-09-17",
  "note": "Giao hàng đúng hẹn, bao bì nguyên vẹn",
  "lines": [
    {
      "poLineItemId": 501,
      "skuId": 12,
      "receivedQuantity": 50
    }
  ]
}
```
* **Mô tả:** Thực thi trong ACID Transaction. Trigger tự động: (1) Tăng `current_inventory`; (2) Giải phóng `on_order_quantity`; (3) Đóng đơn PO sang `Completed`; (4) Tính OTIF Score theo Linear Penalty Decay và làm mới phong độ 5 đơn gần nhất của NCC.

---

## 6. Phân Hệ 4: Nạp Dữ Liệu Vận Hành (UC-04 Operational Data Import)

### 6.1. Thẩm Định File Doanh Số Bán Hàng (Data Preview & Validation)
* **Endpoint:** `POST /api/v1/data-imports/sales/validate`
* **Content-Type:** `multipart/form-data`
* **Response DTO (Nếu hợp lệ 100%):**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "totalRows": 250,
    "duplicateDatesFound": ["2026-09-14"],
    "previewRows": [
      { "date": "2026-09-14", "skuCode": "MILK-TH-1L", "quantity": 18, "revenue": 576000 }
    ]
  }
}
```
* **Response DTO (Nếu có dòng vi phạm - HTTP 400):**
```json
{
  "success": false,
  "error": {
    "code": "ALL_OR_NOTHING_IMPORT_FAILED",
    "message": "File import chứa dữ liệu không hợp lệ. Vui lòng sửa lại toàn bộ trước khi nạp.",
    "details": [
      { "row": 14, "skuCode": "UNKNOWN-SKU", "issue": "Mã SKU không tồn tại trong hệ thống." },
      { "row": 28, "skuCode": "MILK-TH-1L", "issue": "Số lượng bán không được là số âm (-5)." }
    ]
  }
}
```

### 6.2. Xác Nhận Ghi Đè Dữ Liệu Bán Hàng (Confirm Ingestion)
* **Endpoint:** `POST /api/v1/data-imports/sales/confirm`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF`
* **Mô tả:** Xóa dữ liệu cũ các ngày trùng lặp và chèn hàng loạt bản ghi mới trong transaction duy nhất.

### 6.3. Thẩm Định & Xác Nhận File Kiểm Kê Kệ
* **Endpoint:** `POST /api/v1/data-imports/inventory/validate`
* **Endpoint:** `POST /api/v1/data-imports/inventory/confirm`
* **Mô tả:** Cập nhật `products.current_inventory` cho các SKU đếm được, bảo lưu tồn kho các SKU vắng mặt và bảo lưu `on_order_quantity`.

### 6.4. Tải File Mẫu Chuẩn (Download Template)
* **Endpoint:** `GET /api/v1/data-imports/templates/{type}`
* **Path Params:** `type=sales` hoặc `type=inventory`.

---

## 7. Phân Hệ 5: Quản Lý Danh Mục Hàng Hóa (UC-05 Products & Categories)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/categories` | Mọi user | Lấy danh mục ngành hàng. |
| `GET` | `/api/v1/products` | Mọi user | Tra cứu danh sách SKU (lọc ngành hàng, tìm kiếm, phân trang). |
| `POST`| `/api/v1/products` | `STORE_MANAGER` | Tạo SKU mới (`current_inventory=0`, `on_order=0`). |
| `GET` | `/api/v1/products/{id}` | Mọi user | Chi tiết SKU. |
| `PATCH`| `/api/v1/products/{id}`| `STORE_MANAGER` | Sửa tên, quy cách, ngành hàng (Cấm sửa mã SKU). |
| `PATCH`| `/api/v1/products/{id}/status` | `STORE_MANAGER` | Đổi Active $\leftrightarrow$ Inactive (cho phép Inactive khi còn On-order). |
| `DELETE`| `/api/v1/products/{id}`| `STORE_MANAGER` | Xóa cứng SKU (chỉ cho phép khi Zero-Link). |

---

## 8. Phân Hệ 6: Quản Lý Nhà Cung Cấp & Báo Giá (UC-06 Suppliers)

| Method | Endpoint | Quyền hạn | Mô tả |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/suppliers` | Mọi user | Tra cứu NCC kèm Committed Lead Time và điểm OTIF 5 đơn. |
| `POST`| `/api/v1/suppliers` | `STORE_MANAGER` | Tạo mới NCC (khởi tạo điểm tín nhiệm mặc định 80%). |
| `PATCH`| `/api/v1/suppliers/{id}`| `STORE_MANAGER` | Cập nhật hồ sơ NCC (cấm sửa mã NCC). |
| `PATCH`| `/api/v1/suppliers/{id}/status`| `STORE_MANAGER`| Đổi Active $\leftrightarrow$ Inactive (chặn nếu còn đơn PO Approved). |
| `GET` | `/api/v1/suppliers/{id}/conditions` | Mọi user | Danh sách điều kiện cung ứng (SKU, Giá nhập, MOQ). |
| `POST`| `/api/v1/suppliers/{id}/conditions` | `STORE_MANAGER` | Gán SKU cho NCC với Đơn giá nhập và MOQ. |
| `PATCH`| `/api/v1/supply-conditions/{id}` | `STORE_MANAGER` | Cập nhật giá nhập / MOQ (chỉ áp dụng cho tương lai). |

---

## 9. Phân Hệ 7: Cấu Hình Tham Số DSS (UC-07 Configuration)

### 9.1. Lấy Cấu Hình Singleton Hiện Hành
* **Endpoint:** `GET /api/v1/dss-configurations`
* **Quyền hạn:** `STORE_MANAGER`, `PURCHASING_STAFF` (Staff xem Read-only)

### 9.2. Cập Nhật Tham Số Cấu Hình DSS
* **Endpoint:** `PUT /api/v1/dss-configurations`
* **Quyền hạn:** `STORE_MANAGER` (Chỉ Quản lý)
* **Request DTO (`UpdateDssConfigurationDto`):**
```json
{
  "weightPrice": 0.40,
  "weightLeadTime": 0.20,
  "weightMoq": 0.15,
  "weightHistory": 0.25,
  "targetServiceLevel": 0.95,
  "reviewPeriodDays": 7
}
```
* **Validation:** Bắt buộc tổng 4 trọng số $w_P + w_L + w_M + w_H = 1.0$ (dung sai $\pm 0.001$), `targetServiceLevel` thuộc tập `[0.90, 0.95, 0.98, 0.99]`, `reviewPeriodDays` $\in [1, 30]$.

### 9.3. Khôi Phục Cấu Hình Về Mặc Định Chuẩn Mực
* **Endpoint:** `POST /api/v1/dss-configurations/reset`
* **Quyền hạn:** `STORE_MANAGER`

---

## 10. Phân Hệ 8: Nhật Ký Kiểm Toán (System Audit Trail)

### 10.1. Tra Cứu Nhật Ký Hoạt Động
* **Endpoint:** `GET /api/v1/audit-logs`
* **Quyền hạn:** `STORE_MANAGER` (Chỉ Quản lý)
* **Query Params:** `page`, `limit`, `action`, `username`, `fromDate`, `toDate`.
* **Response DTO (HTTP 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 801,
      "username": "manager_an",
      "action": "DSS_APPROVE_RECOMMENDATION",
      "entityType": "RecommendationSession",
      "entityId": "105",
      "metadata": {
        "poGeneratedCount": 2,
        "totalAmount": 28400000.00
      },
      "ipAddress": "192.168.1.15",
      "createdAt": "2026-09-15T09:15:30.000Z"
    }
  ]
}
```

---

## 11. Hợp Đồng Giao Tiếp Nội Bộ: Python AI Forecasting Service

Dịch vụ Python FastAPI lắng nghe tại cổng nội bộ 8000 (chỉ giao tiếp trong mạng Docker):

### 11.1. API Dự Báo Chuỗi Thời Gian
* **Endpoint:** `POST http://ai-service:8000/api/v1/forecast`
* **Request Payload:**
```json
{
  "horizonDays": 14,
  "series": [
    {
      "skuId": 12,
      "history": [
        { "date": "2026-08-01", "quantity": 10 },
        { "date": "2026-08-02", "quantity": 0 },
        { "date": "2026-08-31", "quantity": 15 }
      ]
    }
  ]
}
```
* **Response Payload (HTTP 200):**
```json
{
  "success": true,
  "results": [
    {
      "skuId": 12,
      "dailyAverage": 11.5,
      "dailyDemandStd": 2.8,
      "modelUsed": "AutoARIMA",
      "dailyForecasts": [
        { "date": "2026-09-01", "predicted": 12.0, "lower": 10.0, "upper": 14.0 },
        { "date": "2026-09-02", "predicted": 11.5, "lower": 9.5, "upper": 13.5 }
      ]
    }
  ]
}
```

### 11.2. Health Check
* **Endpoint:** `GET http://ai-service:8000/api/v1/health`
* **Response:** `{ "status": "ok", "service": "retail-dss-forecasting" }`
