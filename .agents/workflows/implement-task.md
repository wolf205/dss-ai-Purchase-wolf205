---
description: Spec-Driven Task Implementation Workflow (Plan-Before-Code)
---

# Spec-Driven Task Implementation Workflow

## 1. Mục Đích & Điều Kiện Bắt Đầu

Workflow này bắt buộc áp dụng cho **mọi tác vụ lập trình (Task / Feature / Milestone)** trong giai đoạn Implementation.

Nguyên tắc cốt lõi:
> **"Spec-Driven & Plan-Before-Code"**  
> Mỗi khi nhận task, bắt buộc phải tìm và đọc các spec liên quan trong `docs/business/` và `docs/technical/`, rồi dựa vào codebase và spec để lên plan và đặt các câu hỏi làm rõ; chỉ đến khi chốt được plan cùng người dùng thì mới bắt tay vào viết code.

---

## 2. Quy Trình 5 Pha Triển Khai Task

```text
Pha 1: Tiếp nhận Task & Đọc Spec liên quan (docs/business/ & docs/technical/)
       ↓
Pha 2: Khảo sát Codebase hiện tại & Lên Implementation Plan + Câu hỏi làm rõ
       ↓
Pha 3: Trao đổi & Người dùng phê duyệt Plan (Confirmation Gate)
       ↓
Pha 4: Thực thi Lập trình (Code) & Tự động chạy kiểm tra (Build / Lint / Tests)
       ↓
Pha 5: Báo cáo Walkthrough & Hướng dẫn Người dùng nghiệm thu
```

---

### Pha 1: Tra Cứu & Đọc Spec Liên Quan (Context & Spec Retrieval)
Trước khi làm bất kỳ việc gì:
1. Xác định Task thuộc Use Case nào (`UC-01` đến `UC-07`).
2. **Đọc tài liệu Nghiệp vụ liên quan:**
   * File Use Case chi tiết tại `docs/business/use-cases/uc-*.md`.
   * Các Business Rules tương ứng tại `docs/business/business-rules.md`.
3. **Đọc tài liệu Kỹ thuật tương ứng:**
   * Bảng CSDL và Constraints tại `docs/technical/data-model.md`.
   * Endpoints, Request/Response DTOs, Error Codes tại `docs/technical/api-specification.md`.
   * Module và luồng kiến trúc tại `docs/technical/architecture.md`.

---

### Pha 2: Khảo Sát Codebase & Lập Implementation Plan
Dựa trên hiện trạng codebase và các spec vừa đọc:
1. Kiểm tra các file hiện có, tránh viết đè hoặc tạo trùng lặp cấu trúc.
2. Lập **Implementation Plan** chi tiết gồm:
   * **Mục tiêu task:** Mô tả ngắn gọn những gì sẽ đạt được.
   * **Spec áp dụng:** Liệt kê rõ các Use Cases, Business Rules, API endpoints liên quan.
   * **Danh sách file dự kiến tác động:** Phân loại rõ `[NEW]`, `[MODIFY]`, `[DELETE]`.
   * **Các câu hỏi làm rõ / Lựa chọn kỹ thuật (nếu có):** Nêu rõ các điểm còn phân vân kèm phương án đề xuất (Option A vs Option B).
   * **Kế hoạch kiểm thử (Verification Plan):** Lệnh kiểm tra build, lint, hoặc test scenario cụ thể.

---

### Pha 3: Trao Đổi & Phê Duyệt Plan (Confirmation Gate)
1. Trình bày Implementation Plan cho người dùng xem xét.
2. Trao đổi, tinh chỉnh theo phản hồi của người dùng.
3. **Confirmation Gate:** Chỉ chuyển sang Pha 4 khi người dùng phản hồi đồng ý với Plan (nhấn Proceed hoặc nhắn xác nhận rõ ràng).

---

### Pha 4: Thực Thi Lập Trình & Tự Động Kiểm Tra (Execution & Verification)
Khi Plan đã được chốt:
1. Tiến hành viết mã nguồn theo đúng các file và cấu trúc đã thống nhất trong Plan.
2. Tuân thủ nghiêm ngặt các quy chuẩn tại [.agents/rules/implementation-rules.md](../rules/implementation-rules.md):
   * Không viết code ngoài phạm vi task (No Scope Creep).
   * Đảm bảo Type-safety, bọc transaction cho Tier 3, chuẩn hóa API Envelope.
3. **Tự động chạy kiểm tra xác minh:**
   * Chạy linter / typecheck kiểm tra lỗi cú pháp và kiểu dữ liệu.
   * Chạy build kiểm tra không bị crash.
   * Nếu phát sinh lỗi, tự sửa trước khi bàn giao.

---

### Pha 5: Báo Cáo Walkthrough & Nghiệm Thu (Review & Acceptance)
1. Cung cấp báo cáo Walkthrough tóm tắt:
   * Các file đã tạo / chỉnh sửa.
   * Kết quả tự kiểm tra (build status, test pass).
   * Hướng dẫn cụ thể để người dùng chạy thử trên máy của mình.
2. Chờ phản hồi nghiệm thu của người dùng trước khi chuyển sang Task tiếp theo.
