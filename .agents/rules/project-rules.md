---
trigger: model_decision
description: Quy tắc phân định ranh giới AI vs Business Calculation vs Human Decision và 5 bài toán mua hàng cốt lõi trong DSS
---

# Quy Tắc Nghiệp Vụ Cốt Lõi Của Project

## 1. 5 Bài Toán Mua Hàng Cốt Lõi (Core Business Problem)

Hệ thống DSS tập trung giải quyết 5 bài toán mua hàng cho cửa hàng bán lẻ:

* **What to Buy**: Mặt hàng (SKU) nào đang có rủi ro thiếu hụt hoặc cần bổ sung?
* **When to Buy**: Thời điểm tối ưu cần kích hoạt đặt hàng để kịp về kho?
* **How Much to Buy**: Số lượng đề xuất mua là bao nhiêu để tối ưu tồn kho và chi phí?
* **Which Supplier**: Chọn nhà cung cấp nào dựa trên giá, Lead Time, MOQ và độ tin cậy?
* **Why Buy**: Lý do rõ ràng, minh bạch (Explainable Insights) để con người tự tin ra quyết định.

---

## 2. Phân Tách 3 Tầng Xử Lý (AI vs Business Calculation vs Human Decision)

Để tuân thủ nguyên tắc **"AI recommends. Human decides."**, hệ thống phải phân định ranh giới rạch ròi giữa 3 tầng:

| Tầng xử lý | Bản chất | Ví dụ cụ thể | Vai trò |
| :--- | :--- | :--- | :--- |
| **AI Layer** | Dự báo, phát hiện quy luật, gợi ý thông minh | Demand Forecast, Trend/Seasonality, Pattern Detection | Cung cấp đầu vào dự báo mang tính xác suất |
| **Business Calculation** | Công thức toán học và quy tắc nghiệp vụ cố định | Safety Stock, Reorder Point (ROP), EOQ, Supplier Score, Stockout Risk Threshold | Áp dụng logic kinh doanh tất định, minh bạch |
| **Human Decision** | Thẩm định, điều chỉnh và chốt quyết định cuối cùng | Review đề xuất, chỉnh số lượng/NCC, Phê duyệt PO, Quyết định mua hàng | Trách nhiệm và quyền hạn tối cao |

*Không gộp ba tầng này thành một khái niệm duy nhất. Không tự động hóa tầng Human Decision.*

---

## 3. Trạng Thái Yêu Cầu (Requirement Status)

Mọi thông tin hoặc đề xuất chưa được người dùng chốt qua hội thoại:
* Bắt buộc đánh dấu: `Status: Proposed`
* Không được ghi nhận như một quyết định chính thức hoặc requirement bắt buộc của hệ thống.

