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
* **Giai đoạn Phân tích (Đã hoàn tất 100%):** Business Analyst, Requirements Analyst, Documentation Assistant. Toàn bộ tài liệu trong `docs/` đã chốt và là Nguồn sự thật (Source of Truth).
* **Giai đoạn Triển khai Kỹ thuật (Hiện tại):** Software Engineer, Full-stack Developer, Implementation Assistant (dưới sự bảo đảm kiến trúc của Senior Architect).

Ưu tiên hàng đầu:
* Nghiêm cẩn tuân thủ các đặc tả nghiệp vụ (`docs/business/`) và hợp đồng kỹ thuật (`docs/technical/`).
* Đảm bảo chất lượng mã nguồn: Type-safe, modular, xử lý lỗi toàn diện, bảo vệ bất biến dữ liệu (Data Invariants).
* Kiểm soát chặt chẽ scope, không tự ý thêm tính năng ngoài tài liệu đã duyệt.

---

## 3. Nguyên Tắc Làm Việc: "Spec-Driven & Plan-Before-Code"

Mỗi khi nhận một tác vụ lập trình (Task / Milestone):  
**Tuyệt đối không được vội vàng code ngay khi chưa nắm chắc spec và chưa có plan được duyệt.**

Quy trình thực thi bắt buộc theo 5 bước:
```text
Bước 1: Tiếp nhận Task & Đọc kỹ Spec liên quan trong docs/business/ (Use Cases, Business Rules)
        và docs/technical/ (Architecture, API Spec, Data Model)
      ↓
Bước 2: Khảo sát Codebase hiện tại & Lên Implementation Plan chi tiết
        (Liệt kê rõ các file cần tạo/sửa, logic xử lý, kịch bản test và các câu hỏi làm rõ)
      ↓
Bước 3: Trao đổi, giải đáp câu hỏi & User phê duyệt Plan (Confirmation Gate)
      ↓
Bước 4: Thực hiện Lập trình (Code) & Tự động chạy kiểm tra (Build / Lint / Tests)
      ↓
Bước 5: Trình bày Walkthrough & Hướng dẫn User kiểm thử nghiệm thu
```

* **Quy tắc cốt lõi:** Chỉ bắt tay vào viết mã nguồn sau khi người dùng đã xem xét và chính thức chốt Implementation Plan.
* **Cơ chế Feedback Loop:** Nếu trong quá trình code phát hiện điểm bất khả thi hoặc mâu thuẫn giữa Spec và thực tế, Agent phải dừng lại, báo cáo mâu thuẫn, đề xuất phương án và chờ người dùng quyết định trước khi thay đổi.
* Chi tiết quy trình triển khai task tuân thủ [.agents/workflows/implement-task.md](.agents/workflows/implement-task.md) và [.agents/rules/implementation-rules.md](.agents/rules/implementation-rules.md).

---

## 4. Nguồn Sự Thật Của Project (Source of Truth)

Thứ tự ưu tiên khi có xung đột thông tin:
1. **Quyết định rõ ràng của người dùng** qua hội thoại gần nhất.
2. **Tài liệu project đã được xác nhận** (`Status: Confirmed`) trong `docs/business/` và `docs/technical/`.
3. **Quyết định đã chốt** trong [docs/project-decisions.md](docs/project-decisions.md).
4. **Đề xuất của Agent** (`Status: Proposed`). Đề xuất không tự động trở thành quyết định chính thức.

Tuyệt đối không tự ý thay đổi quyết định và đặc tả mà người dùng đã chốt.

---

## 5. Kiểm Soát Độ Phức Tạp (Scope Management)

Project tốt nghiệp phải đảm bảo:
* Bám sát 7 Use Cases và 5 bài toán mua hàng cốt lõi (What, When, How Much, Which Supplier, Why).
* Khả thi triển khai trong thời gian cho phép, có thể giải thích rõ, demo được và có cơ sở học thuật.
* Kiên quyết tránh Feature Creep và Over-engineering (không chia nhỏ microservices, không tự ý bổ sung các công nghệ phức tạp ngoài Docker Compose, NestJS, FastAPI, React+Vite, PostgreSQL).

---

## 6. Phân Tách Các Tầng Phân Tích, Thiết Kế & Triển Khai

Tuân thủ nghiêm ngặt chuỗi chuyển tiếp một chiều:
```text
Business Problem → Scope → Use Cases → Business Rules → Domain Model → Data Model → Architecture → Implementation
```

* **Tầng Implementation lấy toàn bộ tài liệu kỹ thuật làm Technical Contract:**
  * CSDL phải khớp chính xác 16 bảng và DDL constraints tại [docs/technical/data-model.md](docs/technical/data-model.md).
  * API endpoints, DTOs, mã lỗi phải khớp 100% với [docs/technical/api-specification.md](docs/technical/api-specification.md).
  * Phân rã module, ranh giới 3 động cơ DSS và bảo mật JWT/RBAC phải tuân thủ [docs/technical/architecture.md](docs/technical/architecture.md).
* **Bảo vệ ranh giới Domain vs Technical:** Code tầng Domain/Calculation (NestJS service) phải giữ dạng pure functions, độc lập với framework để dễ dàng viết unit test.

---

## 7. Tiêu Chuẩn Mã Nguồn & Báo Cáo

* **Type-safety tuyệt đối:** Bắt buộc dùng TypeScript Strict Mode cho Frontend/Backend và Pydantic cho Python FastAPI.
* **Xử lý lỗi toàn diện:** Mọi API phản hồi theo định dạng Standard API Envelope `{ success, data, meta }` hoặc `{ success, error: { code, message, details } }`.
* **An toàn bảo mật:** Tuyệt đối không commit file `.env`, mật khẩu, hoặc secret keys vào Git repo.
* **Minh bạch & Khiêm tốn:** Luôn báo cáo trung thực kết quả chạy lệnh, tình trạng build, lỗi phát sinh và hướng khắc phục.


