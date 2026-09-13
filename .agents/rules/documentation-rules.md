---
trigger: model_decision
description: Quy chuẩn viết và định dạng tài liệu, thuật ngữ tiếng Anh chuẩn hóa (Terminology) và quy tắc gắn nhãn trạng thái (Status Proposed vs Confirmed) khi tạo hoặc cập nhật bất kỳ tài liệu nào.
---

# Quy Tắc Viết Tài Liệu

## 1. Mục Tiêu

Tài liệu phải phù hợp cho:

* Người đọc (giảng viên, người đánh giá, người vận hành).
* AI Agent (dễ dàng parse ngữ cảnh và truy vết).
* Tham chiếu nhất quán trong các giai đoạn phát triển tiếp theo.

---

## 2. Cấu Trúc

Ưu tiên:

```text
# Title

## Section

### Subsection
```

Mỗi Section chỉ tập trung vào một chủ đề duy nhất, không lồng ghép lan man.

---

## 3. Cách Viết & Văn Phong Khách Quan

Ưu tiên:

* Câu ngắn, rõ ràng, gãy gọn.
* Đoạn văn ngắn (tối đa 3-4 dòng mỗi đoạn).
* Bullet points cho danh sách tiêu chí/ràng buộc.
* Bảng (Table) khi cần so sánh, đối chiếu hoặc ánh xạ.
* Sơ đồ / Code block khi mô tả luồng xử lý hoặc cấu trúc dữ liệu.

Hạn chế & Tuyệt đối tránh:

* Đoạn văn dài dòng, văn hoa tiếp thị (Marketing language).
* Giải thích lặp lại nhiều lần cùng một ý.
* Từ ngữ mơ hồ, không đo lường được.
* Chi tiết kỹ thuật CSDL/API không cần thiết lọt vào tài liệu Business.

**Quy chuẩn ngôn ngữ khách quan:**
* **Không dùng:** "đảm bảo chính xác 100%", "tối ưu tuyệt đối", "loại bỏ hoàn toàn Stockout", "hệ thống hoàn hảo".
* **Nên dùng:** "hỗ trợ ra quyết định", "giảm thiểu rủi ro thiếu hàng", "phát hiện sớm nguy cơ đứt gãy", "cải thiện hiệu quả tồn kho".

---

## 4. Terminology (Thuật Ngữ Chuẩn Hóa)

Dùng English keyword ổn định cho các khái niệm nghiệp vụ:

* `Demand Forecast`
* `Inventory`
* `Stockout`
* `Overstock`
* `Safety Stock`
* `Reorder Point` (ROP)
* `Suggested Order Quantity` (SOQ)
* `Supplier`
* `Lead Time`
* `MOQ` (Minimum Order Quantity)
* `Purchase Recommendation`
* `Explainable Insights`

Không thay đổi terminology tùy tiện chỉ để tránh lặp từ.

---

## 5. Trạng Thái Quyết Định (Project Decision Status)

Mọi nội dung trong tài liệu phải có trạng thái rõ ràng:

* Nếu nội dung do Agent đề xuất hoặc đang thảo luận, chưa được người dùng chốt:
```text
Status: Proposed
```

* Nếu đã được người dùng xác nhận chính thức qua hội thoại:
```text
Status: Confirmed
```

Không trình bày nội dung `Proposed` như một quyết định chính thức đã chốt.

---

## 6. Khi Chỉnh Sửa Tài Liệu

Khi cập nhật tài liệu hiện hữu, Agent bắt buộc phải:

1. Giữ lại các nội dung đúng đã được xác nhận trước đó.
2. Sửa triệt để các điểm mâu thuẫn được phát hiện.
3. Xóa bỏ các đoạn văn trùng lặp hoặc thừa thãi.
4. Giữ tài liệu cô đọng, ngắn gọn và có tính truy vết cao.
5. Không tự ý mở rộng phạm vi tài liệu (Scope Creep) ngoài yêu cầu.
