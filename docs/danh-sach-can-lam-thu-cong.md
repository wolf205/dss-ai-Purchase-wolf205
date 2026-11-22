# CHECKLIST CÁC HẠNG MỤC CẦN CHUẨN BỊ THỦ CÔNG CHO ĐỒ ÁN TỐT NGHIỆP (HUCE)

> **Mục đích:** Tổng hợp toàn bộ các đầu việc về hình ảnh, số liệu thực nghiệm, minh chứng mã nguồn và hồ sơ pháp lý mà AI Agent **không thể tự tạo** hoặc **không được phép tự bịa đặt** (theo Quy định liêm chính học thuật tại QĐ 483/QĐ-ĐHXDHN).

---

## 1. BỘ SƠ ĐỒ KỸ THUẬT (XUẤT ẢNH TỪ CÔNG CỤ CHUYÊN DỤNG)
*Lưu ý kỹ thuật: Xuất định dạng `.png` hoặc `.svg` độ phân giải cao (300 DPI), nền trắng, chữ tiếng Việt có dấu rõ nét, không vỡ chữ khi in khổ A4. Bạn có thể nhờ Agent sinh mã Mermaid/PlantUML từ tài liệu nghiệp vụ trước, sau đó tự kiểm tra logic và xuất ra ảnh.*

- [ ] **Hình 2.1 – Sơ đồ ca sử dụng (Use Case Diagram):** Gồm 01 sơ đồ tổng quát và các sơ đồ phân rã theo từng vai trò người dùng (Actors).
- [ ] **Hình 2.2 – Sơ đồ hoạt động (Activity Diagram):** Thể hiện luồng xử lý của 1–2 nghiệp vụ cốt lõi nhất trong hệ thống.
- [ ] **Hình 2.3 – Sơ đồ kiến trúc tổng quan hệ thống:** Mô tả các tầng (Client, API Gateway/Middleware, Service, Database, dịch vụ ngoài) và luồng giao tiếp.
- [ ] **Hình 2.4 – Mô hình dữ liệu (ERD / Schema):** Xuất trực tiếp từ công cụ quản trị CSDL thật (DBeaver, pgAdmin, Prisma Studio, MongoDB Compass...) để khớp 100% tên bảng, kiểu dữ liệu và khóa ngoại với mã nguồn.
- [ ] **Hình 2.5 – Sơ đồ triển khai & hạ tầng mạng (Deployment Diagram):** Ghi rõ giao thức, cổng kết nối (`HTTP/HTTPS`, `TCP/TLS`) và cơ chế bảo mật.
- [ ] **Hình 3.1 – Sơ đồ tuần tự (Sequence Diagram):** Mô tả luồng gọi hàm/API chi tiết cho các nghiệp vụ phức tạp hoặc có tích hợp thuật toán/AI.
- [ ] **Hình 3.2 – Lưu đồ thuật toán / Luồng xử lý module lõi:** Sơ đồ khối thuật toán hoặc pipeline xử lý đặc thù tạo nên giá trị cốt lõi của đề tài.

---

## 2. ẢNH CHỤP MÀN HÌNH & MINH CHỨNG CHẠY THỰC TẾ (CHƯƠNG IV & V)
*Lưu ý: Chụp khung trình duyệt/cửa sổ ứng dụng gọn gàng, ẩn thanh bookmark hoặc dữ liệu cá nhân không liên quan; dùng dữ liệu mẫu nghiêm túc, đúng ngữ cảnh nghiệp vụ.*

- [ ] **Ảnh giao diện sản phẩm thực tế (Mục 4.2 – Hình 4.1, 4.2...):**
  - [ ] Màn hình Trang chủ / Đăng nhập / Đăng ký.
  - [ ] Các màn hình nghiệp vụ cốt lõi (Danh sách, Chi tiết, Thêm/Sửa/Xóa, Xử lý luồng chính).
  - [ ] Màn hình quản trị / phân quyền theo từng vai trò người dùng.
  - [ ] Ảnh kiểm tra giao diện tương thích thiết bị di động (Responsive trên khung hình ~390px) nếu có cam kết trong yêu cầu phi chức năng.
- [ ] **Ảnh chụp terminal chạy kiểm thử tự động (Mục 4.4 – Hình 4.3):** Chạy bộ Unit Test / Integration Test (`Jest`, `Pytest`, `JUnit`...) và chụp kết quả hiển thị rõ số lượng test case `PASS`.
- [ ] **Ảnh/Log kiểm tra chất lượng mã & bảo mật (Mục 4.6):**
  - [ ] Kết quả rà soát lỗ hổng thư viện (`npm audit`, `pip-audit`...).
  - [ ] Kết quả kiểm tra tĩnh mã nguồn Linter (`ESLint`, `SonarQube`...).
  - [ ] Kết quả đo tốc độ tải trang / kích thước gói build (Lighthouse / Build output).
- [ ] **Ảnh minh chứng quy trình quản lý mã nguồn (Mục 5.4):** Chụp lịch sử commit, nhánh phát triển hoặc Pull Request tiêu biểu trên GitHub/GitLab.

---

## 3. DỮ LIỆU THỰC NGHIỆM & NGỮ CẢNH THẬT (CUNG CẤP CHO AGENT BIÊN TẬP)
*Lưu ý: Cung cấp dữ liệu thô thật để Agent tổng hợp thành bảng biểu và diễn giải, tuyệt đối không để Agent tự nghĩ ra số liệu.*

- [ ] **Bộ số liệu đo đạc hiệu năng / thuật toán (Mục 4.5 & 4.7):**
  - [ ] Thời gian phản hồi API thực tế (tính bằng `ms`) hoặc thông số trước và sau khi tối ưu.
  - [ ] Các chỉ số đánh giá mô hình/thuật toán nếu có (`Precision`, `Recall`, `F1-score`, độ chính xác trên tập dữ liệu thử nghiệm).
  - [ ] Danh sách các tình huống kiểm thử chức năng (`TC-01`, `TC-02`...) đã chạy thực tế trên giao diện.
- [ ] **Thông tin kỹ thuật từ mã nguồn thật (Mục 4.1 & Phụ lục B):**
  - [ ] Cấu hình phần cứng/phần mềm máy thử nghiệm và link kho mã nguồn (GitHub/GitLab).
  - [ ] Xuất cây thư mục mã nguồn thực tế (dùng lệnh `tree` và lược bỏ `node_modules`, `.git`, `venv`).
  - [ ] Danh sách tên biến trong tệp `.env.example` (**bắt buộc xóa sạch mật khẩu và API key thật**).
  - [ ] Các câu lệnh cài đặt môi trường, khởi tạo CSDL và chạy thử ứng dụng.
- [ ] **Ghi chú 3–4 vướng mắc kỹ thuật thực tế (Mục 5.5):** Ghi vắn tắt các lỗi/bài toán khó bạn đã trực tiếp gặp phải trong quá trình lập trình và hướng đã xử lý để Agent viết đúng văn phong kỹ thuật cá nhân.

---

## 4. HỒ SƠ HÀNH CHÍNH, CHỮ KÝ SỐNG & KIỂM TRA TRÙNG LẶP
*Lưu ý: Đây là các yêu cầu bắt buộc để đủ điều kiện qua các mốc đánh giá M1, M2, M3 và nộp lưu trữ số theo Mẫu ĐATN-09.*

- [ ] **Thông tin định danh chính xác (Trang bìa, Phụ bìa, Nhiệm vụ ĐATN):**
  - [ ] Tên đề tài Tiếng Việt và tên dịch Tiếng Anh chuẩn xác theo quyết định giao đề tài.
  - [ ] Họ tên sinh viên, MSSV, Lớp, Khóa, Ngành, Chuyên ngành, Học hàm/Học vị + Họ tên GVHD.
  - [ ] Mốc thời gian thực hiện thực tế (M1: Tuần 2–3, M2: Tuần 8–14, M3: Tuần cuối).
- [ ] **Các biểu mẫu giấy có chữ ký sống (để đóng quyển và scan định dạng `.pdf`):**
  - [ ] **Nhiệm vụ ĐATN (Mẫu ĐATN-01):** Đầy đủ 3 chữ ký (Sinh viên, GVHD, Chủ tịch Hội đồng).
  - [ ] **Nhật ký thực hiện ĐATN (Mẫu ĐATN-02):** Ghi chép tiến độ hàng tuần có chữ ký xác nhận của GVHD (đóng kèm vào **Phụ lục A**).
  - [ ] Phiếu đánh giá mốc M1 (Mẫu ĐATN-03) và mốc M2 (Mẫu ĐATN-04).
  - [ ] Phiếu nhận xét của Người hướng dẫn & Phiếu nhận xét của Người phản biện.
- [ ] **Rà soát định dạng Word & Kiểm tra đạo văn trước khi nộp:**
  - [ ] Cập nhật tự động **Mục lục**, **Danh sách hình vẽ**, **Danh sách bảng biểu** sau khi chèn đầy đủ ảnh.
  - [ ] Kiểm tra lại ngắt trang: phần đầu đánh số La Mã (`i, ii, iii...`), bắt đầu từ trang đầu tiên của **Mở đầu** đánh số Ả Rập (`1, 2, 3...`), nội dung chính không vượt quá **150 trang A4**.
  - [ ] Chạy phần mềm kiểm tra mức độ trùng lặp (**Similarity / Plagiarism Report**) và xuất tệp báo cáo nộp kèm hồ sơ.
  - [ ] Đóng gói toàn bộ 10 thành phần hồ sơ theo đúng quy tắc đặt tên tệp tin không dấu của Điều 9 (xem chi tiết tại **Phụ lục C** của khung đồ án).