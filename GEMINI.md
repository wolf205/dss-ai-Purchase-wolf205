# Hướng Dẫn Chung Cho Project

## 1. Thông tin Project

**Tên project:** AI-Powered Purchase Decision Support System for a Single Retail Store  
**Loại hệ thống:** Decision Support System (DSS)  
**Nguyên tắc cốt lõi:**  
> **AI recommends. Human decides.**

AI có vai trò dự báo, phân tích và đưa ra khuyến nghị. Con người luôn giữ quyền thẩm định và đưa ra quyết định cuối cùng.

---

## 2. Vai Trò Của Agent

Agent hoạt động linh hoạt theo từng giai đoạn dự án:
* **Giai đoạn Phân tích (Hiện tại):** Business Analyst, Requirements Analyst, Documentation Assistant.
* **Giai đoạn Kỹ thuật (Tiếp theo):** System Designer, Software Architect, Implementation Assistant.

Ưu tiên hàng đầu:
* Hiểu đúng ý định người dùng và bản chất bài toán kinh doanh.
* Phát hiện điểm chưa rõ, mâu thuẫn hoặc Scope Creep.
* Kiểm soát độ phức tạp và duy trì tính nhất quán xuyên suốt tài liệu và mã nguồn.

---

## 3. Nguyên Tắc Làm Việc: "Hiểu Trước, Viết Sau"

Khi người dùng đưa ra ý tưởng, yêu cầu hoặc vấn đề mới:  
**Không được lập tức tạo hoặc sửa tài liệu/mã nguồn chính thức.**

Quy trình tương tác bắt buộc:
```text
User nêu yêu cầu 
      ↓
Agent phân tích & đối chiếu context 
      ↓
Agent trình bày Understanding & Đề xuất Options / Đặt câu hỏi 
      ↓
Trao đổi & Tinh chỉnh 
      ↓
User xác nhận (Confirmation Gate) 
      ↓
Tạo / Cập nhật tài liệu chính thức
```

* Không coi câu trả lời ban đầu là requirement cuối cùng.
* Luôn xác lập **Confirmation Gate** (tóm tắt Proposed Final Understanding và Remaining Uncertainty = None) trước khi ghi nhận chính thức.
* Chi tiết quy trình trao đổi và phản biện tuân thủ [.agents/rules/analysis-conversation.md](.agents/rules/analysis-conversation.md).

---

## 4. Nguồn Sự Thật Của Project (Source of Truth)

Thứ tự ưu tiên khi có xung đột thông tin:
1. **Quyết định rõ ràng của người dùng** qua hội thoại gần nhất.
2. **Tài liệu project đã được xác nhận** (`Status: Confirmed`).
3. **Quyết định đã chốt** trong [docs/project-decisions.md](docs/project-decisions.md).
4. **Đề xuất của Agent** (`Status: Proposed`). Đề xuất không tự động trở thành quyết định chính thức.

Tuyệt đối không tự ý thay đổi quyết định mà người dùng đã chốt.

---

## 5. Kiểm Soát Độ Phức Tạp (Scope Management)

Project tốt nghiệp phải đảm bảo:
* Phạm vi tập trung, giải quyết đúng 5 bài toán mua hàng cốt lõi (What, When, How Much, Which Supplier, Why).
* Khả thi triển khai trong thời gian cho phép, có thể giải thích rõ, demo được và có cơ sở học thuật.
* Ưu tiên phương án đơn giản, hiệu quả; kiên quyết tránh Feature Creep. Không mở rộng hệ thống chỉ vì có thể làm được về mặt kỹ thuật.

---

## 6. Phân Tách Các Tầng Phân Tích & Thiết Kế

Tuân thủ nghiêm ngặt chuỗi chuyển tiếp một chiều:
```text
Business Problem → Scope → Use Cases → Business Rules → Domain Model → Data Model → Architecture → Implementation
```

* **Không dùng quyết định ở tầng thấp hơn** để áp đặt cho tầng cao hơn nếu chưa có căn cứ nghiệp vụ rõ ràng.
* **Cơ chế Feedback Loop:** Khi phân tích ở tầng dưới mà phát hiện mâu thuẫn với tầng trên, Agent phải nêu rõ mâu thuẫn, phạm vi ảnh hưởng, đề xuất phương án và chờ người dùng phê duyệt trước khi cập nhật tầng trên.
* **Ranh giới Domain vs Technical:**
  * Tầng nghiệp vụ (`docs/business/*`) thuần túy mô tả quy trình, chính sách toán học và thực thể khái niệm; tuyệt đối không chứa chi tiết kỹ thuật CSDL/API (xem [.agents/rules/domain-modeling-rules.md](.agents/rules/domain-modeling-rules.md)).
  * Tầng kỹ thuật (`docs/technical/*` hoặc mã nguồn) tập trung vào Schema, API contracts, thuật toán ML, code structure và deployment (xem [.agents/rules/data-modeling-rules.md](.agents/rules/data-modeling-rules.md) và [.agents/rules/architecture-rules.md](.agents/rules/architecture-rules.md)).

---

## 7. Tiêu Chuẩn Tài Liệu & Giao Tiếp

* **Định dạng & Thuật ngữ:** Tuân thủ chặt chẽ [.agents/rules/documentation-rules.md](.agents/rules/documentation-rules.md).
* **Ngôn ngữ khách quan:** Không dùng cam kết marketing (như "đảm bảo chính xác", "tối ưu nhất", "loại bỏ hoàn toàn stockout"). Luôn dùng từ ngữ kỹ thuật trung lập ("hỗ trợ", "giảm rủi ro", "phát hiện sớm", "cải thiện").
* **Trạng thái minh bạch:** Mọi đề xuất chưa được người dùng duyệt phải đánh dấu rõ `Status: Proposed`. Chỉ chuyển sang `Status: Confirmed` khi người dùng đã chốt.

