---
description: Finalize Business Rules Workflow
---

# Finalize Business Rules Workflow

## 1. Điều Kiện Bắt Đầu

Chỉ chạy workflow này khi:
* Tài liệu Use Cases ([use-case-overview.md](../../docs/business/use-case-overview.md) và các file chi tiết từ [uc-01](../../docs/business/use-cases/uc-01-review-approve-recommendations.md) đến [uc-07](../../docs/business/use-cases/uc-07-configure-dss-parameters.md)) đã hoàn thành.
* Các quy tắc nghiệp vụ (BR-01 đến BR-28) đã được thảo luận và làm rõ công thức, tham số và cơ chế dự phòng.

Không dùng workflow này để thay thế quá trình phân tích và trao đổi logic nghiệp vụ.

---

## 2. Đọc Context

Đọc các tài liệu bắt buộc:

```text
docs/business/business-problem.md
docs/business/scope.md
docs/business/use-case-overview.md
docs/business/use-cases/uc-01-review-approve-recommendations.md
docs/business/use-cases/uc-02-manage-purchase-orders.md
docs/business/use-cases/uc-03-record-goods-receipt.md
docs/business/use-cases/uc-04-import-operational-data.md
docs/project-decisions.md
.agents/skills/business-rules-analysis/references/inventory-formulas.md
.agents/skills/business-rules-analysis/references/supplier-scoring-model.md
```

---

## 3. Tóm Tắt Final Understanding Về Business Rules

Xác nhận và tổng hợp:
* **Nhóm 1 (Nhu cầu & Tồn kho):** BR-01 (Công thức ROP, Safety Stock $Z \times \sigma_d \times \sqrt{L}$, SOQ), BR-05 (Phân loại ABC theo doanh thu, XYZ theo $CV$), BR-26 (Ánh xạ Service Level sang hệ số $Z$), BR-27 (Chu kỳ rà soát mua hàng).
* **Nhóm 2 (Đánh giá Nhà cung cấp):** BR-02 (Mô hình WSM 4 tiêu chí: Giá, Lead Time, Lịch sử OTIF, MOQ), BR-13 (Cập nhật điểm OTIF sau nhận hàng), BR-24 (Cơ chế NCC mới & Cửa sổ 5 đơn gần nhất), BR-25 (Chuẩn hóa bộ trọng số WSM).
* **Nhóm 3 (Ràng buộc Đặt hàng):** BR-03 (Làm tròn theo MOQ/Pack size), BR-04 (Gom PO theo Nhà cung cấp).
* **Nhóm 4 (Vòng đời PO & Nhận hàng):** BR-06 (Vòng đời trạng thái PO), BR-07 (Đồng bộ hàng On-order), BR-08 (Ngày giao dự kiến), BR-09 (Cảnh báo quá hạn), BR-10 (Lý do hủy đơn), BR-11 (Quy tắc điền trước khi nhận), BR-12 (Đồng bộ tồn kho thực tế & tất toán On-order).
* **Nhóm 5 (Toàn vẹn Dữ liệu Vận hành):** BR-14 (Cơ chế All-or-Nothing), BR-15 (Khử trùng & ghi đè doanh số), BR-16 (Thay thế snapshot tồn kho kiểm kê).
* **Nhóm 6 (Dữ liệu Nền tảng & Cấu hình):** BR-17 (Bất biến SKU), BR-18 (Ngừng kinh doanh SKU), BR-19 (SKU mới & tồn ban đầu), BR-20 (Ngành hàng bắt buộc), BR-21 (Bất biến NCC), BR-22 (Snapshot điều kiện cung ứng), BR-23 (Ngừng cung ứng & Cảnh báo độc quyền), BR-28 (Bộ tham số cấu hình mặc định).
* **Cơ chế Fallback:** Quy tắc tính toán khi SKU mới hoặc NCC mới thiếu dữ liệu lịch sử.

---

## 4. Kiểm Tra Tính Nhất Quán (Consistency & Feedback Loop)

Kiểm tra:
* Có mâu thuẫn với Use Cases hay Scope không?
* Các quy tắc có tôn trọng nguyên tắc **"AI recommends. Human decides."** không? (Không để quy tắc tự động duyệt đơn hay tự động gửi đơn mà không có con người).
* Có chi tiết kỹ thuật/CSDL (tên bảng, SQL, API) bị lọt vào Business Rules không?
* Mọi quy tắc tính toán có đảm bảo tính minh bạch giải thích được (Explainability) không?

---

## 5. User Validation (Confirmation Gate)

Trình bày bản tóm tắt Final Understanding cho người dùng theo mẫu:

```text
Proposed Final Understanding for Business Rules:
1. Danh sách 28 quy tắc nghiệp vụ chuẩn hóa (BR-01 đến BR-28).
2. Công thức toán học và logic tính toán cốt lõi.
3. Bảng trọng số và tham số mặc định của hệ thống.
4. Cơ chế dự phòng (Fallback logic) khi dữ liệu khuyết thiếu.

Remaining Uncertainty:
None
```

**Chưa tạo hoặc cập nhật tài liệu chính thức nếu người dùng chưa xác nhận chốt.**

---

## 6. Tạo Tài Liệu Chính Thức

Sau khi được người dùng xác nhận:

Tạo hoặc cập nhật tài liệu duy nhất:

```text
docs/business/business-rules.md
```

Tài liệu phải tuân thủ chuẩn cấu trúc đặc tả tại [rule-specification-template.md](../skills/business-rules-analysis/references/rule-specification-template.md).

---

## 7. Cập Nhật Project Decisions

Nếu quá trình chuẩn hóa Business Rules tạo ra các quyết định quan trọng (như lựa chọn công thức tồn kho, trọng số chấm điểm NCC, ngưỡng phân loại ABC-XYZ), cập nhật ngay:

```text
docs/project-decisions.md
```

Chỉ ghi các quyết định đã được người dùng xác nhận chính thức.
