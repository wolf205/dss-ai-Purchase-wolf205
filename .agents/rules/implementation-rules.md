---
trigger: model_decision
description: Quy tắc triển khai mã nguồn, chuẩn mực lập trình Full-stack, bảo toàn kiến trúc và kỷ luật kiểm thử cho hệ thống DSS bán lẻ.
---

# Quy Tắc Triển Khai Mã Nguồn (Implementation Rules)

## 1. Nguyên Tắc Nền Tảng: "Spec-Driven Development"

1. **Mã nguồn không tự sinh ra từ suy đoán:**
   * Mọi API endpoint, DTO, trường dữ liệu, mã lỗi phải đối chiếu và khớp 100% với [docs/technical/api-specification.md](../../docs/technical/api-specification.md).
   * Mọi bảng CSDL, quan hệ, kiểu dữ liệu, constraints và triggers phải khớp 100% với [docs/technical/data-model.md](../../docs/technical/data-model.md).
   * Mọi công thức tính toán (SS, ROP, SOQ, ABC-XYZ, WSM, OTIF linear decay) phải trung thực tuyệt đối với [docs/business/business-rules.md](../../docs/business/business-rules.md).
2. **Kỷ luật Plan-Before-Code:**
   * Không gõ code khi chưa có Implementation Plan được người dùng phê duyệt theo workflow [.agents/workflows/implement-task.md](../workflows/implement-task.md).

---

## 2. Chuẩn Mực Kỹ Thuật Backend (NestJS Modular Monolith)

1. **Phân tầng trách nhiệm nghiêm ngặt (Strict Layering):**
   * **Presentation Layer (Controllers):** Chỉ làm nhiệm vụ tiếp nhận HTTP request, gắn DTO qua `ValidationPipe`, gắn `@UseGuards(JwtAuthGuard, RolesGuard)` và đóng gói phản hồi `Standard API Envelope`. Tuyệt đối không chứa logic tính toán hay truy vấn CSDL trực tiếp.
   * **Application Layer (Services):** Điều phối quy trình nghiệp vụ Use Case, thiết lập ranh giới giao dịch `prisma.$transaction`, gọi Domain Engines và xử lý Tier 3 Invariants.
   * **Domain Layer (Engines/Calculations):** Viết dưới dạng Pure Functions hoặc stateless classes độc lập (không phụ thuộc vào Prisma hay NestJS HTTP), nhận input và trả output để 100% kiểm thử được bằng Unit Test.
   * **Infrastructure Layer (PrismaService, External Clients):** Chuyên trách giao tiếp CSDL và gọi HTTP client sang Python AI Service / Gemini API.
2. **Quản lý giao dịch Tier 3 ACID (`prisma.$transaction`):**
   * Bắt buộc bọc transaction cho 3 nghiệp vụ phức hợp:
     * *UC-01 Approve PO:* Chốt session $\to$ Sinh POs gom theo NCC $\to$ Cập nhật `on_order_quantity`.
     * *UC-03 Goods Receipt:* Kiểm tra PO Approved $\to$ Tạo Receipt $\to$ Cập nhật tồn kệ & hàng về $\to$ Đóng PO $\to$ Ghi nhận OTIF decay.
     * *UC-04 Data Import:* Thẩm định 100% file $\to$ Xóa dữ liệu ngày cũ trùng lặp $\to$ Insert batch mới theo cơ chế All-or-Nothing.
3. **Chuẩn hóa Error Handling & API Envelope:**
   * Toàn bộ phản hồi thành công đóng gói: `{ success: true, data: ..., meta: { timestamp, ... } }`.
   * Toàn bộ lỗi được bắt qua Global `AllExceptionsFilter` và chuẩn hóa: `{ success: false, error: { code: "ERROR_CODE", message: "...", details: [...] } }`.

---

## 3. Chuẩn Mực Phân Hệ Dự Báo AI (Python FastAPI Service)

1. **Stateless Compute Service:**
   * Dịch vụ chỉ nhận dữ liệu chuỗi thời gian qua HTTP payload, xử lý toán học/ML và trả về kết quả dự báo; không duy trì session trong bộ nhớ.
2. **Pydantic Validation:**
   * Tất cả Request và Response DTOs phải định nghĩa kiểu dữ liệu chặt chẽ bằng Pydantic models.
3. **Mô hình chuỗi thời gian chuyên dụng:**
   * Tự động bù đắp Zero-Demand cho các ngày không bán được hàng.
   * Sử dụng thuật toán phù hợp: Croston / TSB cho dữ liệu ngắt quãng ($CV > 1.0$ hoặc tỷ lệ ngày bán $= 0 > 30\%$), AutoARIMA / Holt-Winters cho nhu cầu đều ($CV \le 0.5$).
4. **Graceful Fallback:**
   * Backend NestJS luôn phải có khối `try-catch` bọc cuộc gọi sang Python Service với timeout 3.0 giây. Nếu sự cố, chuyển sang tính Simple Moving Average / Lịch sử thô qua SQL và gắn cờ cảnh báo mềm `is_fallback: true`.

---

## 4. Chuẩn Mực Frontend (React + Vite SPA)

1. **Cấu trúc theo tính năng (Feature-Driven Structure):**
   * Tổ chức mã nguồn trong `src/features/<feature-name>/` tương ứng 7 Use Cases.
   * Mỗi feature chứa: `components/`, `hooks/`, `services/`, `types.ts`, `index.tsx`.
2. **Quản lý trạng thái (State Management):**
   * Dữ liệu từ Server (Products, POs, Receipts, Sessions) bắt buộc quản lý qua **TanStack Query (React Query)** để tận dụng caching, loading state, và tự động refetch sau mutations.
   * Trạng thái Client cục bộ dùng React Context (`AuthContext`) hoặc local state.
3. **Trải nghiệm thị giác & Visual Excellence:**
   * Tuyệt đối không dùng giao diện thô sơ (MVP xấu). Sử dụng CSS/Tailwind hiện đại, màu sắc hài hòa, card phân cấp, badge trạng thái rõ ràng, hover micro-animations.
   * Biểu đồ chuỗi thời gian thể hiện trực quan: Đường bán thực tế quá khứ + Dải dự báo 14 ngày tương lai + Vùng tin cậy 95% bằng thư viện **Recharts**.

---

## 5. An Toàn Bảo Mật & Quản Lý Môi Trường

1. **Bảo mật Token:**
   * Refresh Token truyền qua Cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`. Tuyệt đối không lưu Refresh Token vào `localStorage` hay `sessionStorage`.
   * Access Token lưu trong bộ nhớ ứng dụng React.
2. **Không commit Secret:**
   * Mọi thông tin nhạy cảm (`DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`) phải đưa vào file `.env`.
   * Bắt buộc tạo và duy trì file `.env.example` với đầy đủ tên biến và giá trị mẫu an toàn.

---

## 6. Kỷ Luật Tự Kiểm Tra (Self-Verification Checklist)

Trước khi bàn giao bất kỳ task code nào cho người dùng:
1. [ ] Đã chạy linter / typecheck (`npm run lint`, `tsc --noEmit` hoặc `mypy`) không còn lỗi cú pháp/kiểu dữ liệu.
2. [ ] Backend / Frontend / Python service build thử thành công không bị crash.
3. [ ] Các trường dữ liệu và endpoint test thử khớp chính xác với `api-specification.md`.
4. [ ] Báo cáo kết quả cụ thể, rõ ràng trong phần Walkthrough để người dùng kiểm thử.
