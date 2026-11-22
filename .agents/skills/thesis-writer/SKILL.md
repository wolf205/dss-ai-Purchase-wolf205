---
name: thesis-writer
description: >-
  Hướng dẫn biên soạn thuyết minh Đồ án tốt nghiệp CNTT/Kỹ thuật phần mềm chuẩn học thuật Trường ĐH Xây dựng Hà Nội (HUCE):
  loại bỏ hoàn toàn văn phong AI sáo rỗng (Anti-AI Clichés), tuân thủ nguyên tắc Grounding dựa trên tài liệu docs/ và mã nguồn,
  quy tắc nghiêm ngặt về Placeholder cho hình ảnh và số liệu thực nghiệm [ mô tả nội dung ], điều phối tiến độ qua REPORT_INDEX.md
  và phân bổ chuẩn cấu trúc 5 chương theo khung-do-an-tot-nghiep-chuan.docx (Mẫu ĐATN-14).
---

# Thesis Writer Skill — Chuẩn Mực Biên Soạn ĐATN Kỹ Thuật (HUCE)

Skill này định nghĩa toàn bộ quy trình, phương pháp và quy tắc bắt buộc áp dụng khi Agent biên soạn thuyết minh Đồ án tốt nghiệp cùng người dùng.

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

1. **Nguyên tắc Placeholder tuyệt đối cho Hình ảnh và Số liệu thực tế:**
   * **Tuyệt đối KHÔNG tự vẽ hoặc nhúng khối mã Mermaid, PlantUML hay mã giả sơ đồ vào nội dung báo cáo.**
   * **Tuyệt đối KHÔNG tự bịa đặt, suy đoán số liệu đo đạc thực nghiệm (WAPE, MASE, Bias, số test case, độ trễ...).**
   * **Mọi vị trí cần hình ảnh/sơ đồ** (sơ đồ Use Case, Activity, Architecture, ERD, Deployment, Sequence, Flowchart, ảnh chụp màn hình giao diện thực tế, ảnh chụp terminal kết quả chạy test, văn bản có chữ ký sống...):  
     $\rightarrow$ **CHỈ ĐỂ DUY NHẤT một dòng dạng `[ mô tả nội dung ]`** (ví dụ: `[Hình 2.1 – Sơ đồ ca sử dụng tổng quát của hệ thống (Use Case Diagram)]`, `[Hình 4.1 – Ảnh chụp màn hình giao diện Trang chủ / Dashboard quản trị]`). Người dùng sẽ tự bổ sung và chèn ảnh độ phân giải cao vào sau.
   * **Mọi vị trí cần số liệu thực nghiệm chưa chốt:**  
     $\rightarrow$ **CHỈ ĐỂ dạng `[...]` hoặc `[... %]` hoặc `[số lượng SKU]`** để người dùng đo đạc thực tế và điền vào sau.

2. **Quy trình phối hợp từng bước (Step-by-Step via `REPORT_INDEX.md`):**
   * Mọi công việc biên soạn được chia nhỏ thành các Task theo 7 giai đoạn (GĐ 0 đến GĐ 6) quy định tại `report/REPORT_INDEX.md`.
   * Agent chỉ thực hiện đúng Task người dùng yêu cầu, cập nhật tích chọn `[x]` vào `report/REPORT_INDEX.md` sau khi hoàn thành.
   * **Tuyệt đối KHÔNG tự ý biên dịch hoặc sinh file Word (`.docx`)** nếu người dùng không yêu cầu trực tiếp. Toàn bộ quá trình soạn thảo tập trung trên các tệp `.md` trong thư mục `report/`.

3. **Fact-based & Grounded Writing:**
   * 100% nội dung phân tích, thiết kế, công thức toán và nghiệp vụ phải trích xuất từ các tài liệu chuẩn trong thư mục `docs/`:
     * 28 Business Rules $\rightarrow$ `docs/business/business-rules.md`.
     * 7 Use Cases cốt lõi $\rightarrow$ `docs/business/use-cases/uc-*.md`.
     * Ranh giới phạm vi $\rightarrow$ `docs/business/scope.md`.
     * Kiến trúc Modular Monolith & 3-Engine $\rightarrow$ `docs/technical/architecture.md`.
     * Cơ sở dữ liệu 16 bảng & 44 Invariants $\rightarrow$ `docs/technical/data-model.md`.
   * **Tên đề tài chính thức:**
     * Tiếng Việt: **Hệ thống hỗ trợ quyết định mua hàng bán lẻ ứng dụng AI**
     * Tiếng Anh: **AI-Driven Retail Purchase Decision Support System**
     * Tên viết tắt: **RetailDSS** (hoặc **AI-Purchase DSS**)

4. **Triết lý vận hành bất biến:**
   > **AI recommends. Human decides.**  
   *(AI chỉ đóng vai trò xử lý ngầm, tính toán định lượng và đưa ra khuyến nghị; con người giữ toàn quyền xem xét, điều chỉnh và phê duyệt đơn hàng mua PO).*

5. **Kỷ luật dung lượng:**
   * Phần nội dung chính (từ Mở đầu đến Kết luận) **không vượt quá 150 trang A4**.
   * Hành văn súc tích, cô đọng, hàm lượng kỹ thuật cao.

---

## 2. BỘ LỌC TRIỆT TIÊU "MÙI VĂN AI" (ANTI-AI CLICHÉS FILTER)

### 2.1. Danh mục từ ngữ CẤM KỴ (Blacklist)

| Cụm từ cấm (Văn mẫu AI sáo rỗng) | Lý do cấm | Cách diễn đạt kỹ thuật thay thế (Whitelist) |
|---|---|---|
| *"Trong thời đại kỷ nguyên số 4.0 phát triển như vũ bão / vượt bậc..."* | Sáo rỗng, thiếu thông tin kỹ thuật | Đi thẳng vào bài toán: *"Quản trị mua hàng tại các cửa hàng bán lẻ độc lập đối mặt với hai thách thức lớn: đứt gãy tồn kho (Stockout) và ứ đọng vốn (Overstock)..."* |
| *"Đóng vai trò như một ngọn hải đăng / chiếc chìa khóa vạn năng..."* | Hình tượng hóa cải lương, phi học thuật | Nêu rõ chức năng: *"Module tính toán đóng vai trò xác định ngưỡng tồn kho an toàn và số lượng đặt hàng gợi ý..."* |
| *"Giải pháp đột phá mang tính cách mạng / tối ưu tuyệt đối..."* | Phóng đại, thiếu căn cứ | Nêu bản chất giải pháp: *"Giải pháp kết hợp mô hình Croston cho chuỗi ngắt quãng và AutoARIMA cho chuỗi đều giúp giảm thiểu sai số dự báo..."* |
| *"Không thể phủ nhận rằng..."*, *"Rõ ràng thấy được..."* | Khẳng định chủ quan, thiếu số liệu | Dùng câu dẫn khách quan: *"Dữ liệu vận hành thực tế cho thấy...", "Qua khảo sát quy trình mua hàng..."* |
| *"Một cách toàn diện, sâu sắc và tinh tế..."* | Tính từ rỗng, không đo lường được | Dùng thông số kỹ thuật, tiêu chí định lượng hoặc chuẩn đo lường (WAPE, MASE, RMSE, OTIF). |
| *"Chúng tôi vô cùng tự hào / vui mừng nhận thấy..."* | Cảm xúc cá nhân | Dùng thể bị động khách quan: *"Hệ thống được thiết kế...", "Đồ án đạt được các mục tiêu đề ra..."* |

### 2.2. Quy tắc hành văn kỹ thuật
1. **Thể bị động khách quan (Objective Passive Voice):** Tránh xưng *"tôi"*, *"chúng tôi"*, *"tác giả"*. Ưu tiên: *"Hệ thống được thiết kế theo kiến trúc Modular Monolith..."*, *"Phương pháp phân loại ABC-XYZ được áp dụng nhằm..."*.
2. **Cấu trúc đoạn văn tam đoạn luận (Claim - Evidence - Impact):** Bắt đầu bằng **Luận điểm kỹ thuật** $\rightarrow$ **Dẫn chứng / Cơ chế** $\rightarrow$ **Tác động / Ý nghĩa trong hệ thống**.
3. **Mạch lạc thuật ngữ:** Thống nhất xuyên suốt: *Cửa hàng bán lẻ độc lập*, *Khuyến nghị mua hàng*, *Số lượng đặt hàng gợi ý ($SOQ$)*, *Điểm đặt hàng lại ($ROP$)*, *Tồn kho an toàn ($SS$)*.

---

## 3. QUY CHUẨN CÔNG THỨC TOÁN & ĐỊNH LƯỢNG

1. **Định dạng công thức:** Viết bằng LaTeX block đặt ở dòng riêng:
   $$ROP = (\bar{d} \times L) + SS$$
   Ngay dưới công thức, **bắt buộc giải thích đầy đủ các biến số và đơn vị đo**:
   *Trong đó:*
   - $ROP$: Điểm đặt hàng lại (Reorder Point), tính theo đơn vị sản phẩm (SKU).
   - $\bar{d}$: Nhu cầu bán trung bình ngày (Average Daily Demand).
   - $L$: Thời gian giao hàng của nhà cung cấp (Lead time, tính theo ngày).
   - $SS$: Mức tồn kho an toàn (Safety Stock).
2. **Các công thức cốt lõi (khớp 100% với `business-rules.md`):**
   - **Tồn kho an toàn:** $SS = Z \times \sigma_d \times \sqrt{L}$ (với $Z = 1.65$ tương ứng Service Level 95%).
   - **Số lượng đặt hàng gợi ý:** $SOQ = \max(0, ROP + (\bar{d} \times R) - (I_{current} + I_{on\_order}))$ kết hợp làm tròn theo Pack size (BR-09).
   - **Mô hình WSM đánh giá nhà cung cấp:** $Score_k = \sum_{j=1}^m w_j \times S_{kj}$ với $\sum w_j = 1.0$.

---

## 4. QUY CHUẨN TRÌNH BÀY BẢNG BIỂU & HÌNH ẢNH

### 4.1. Hình vẽ (Figures) — CHỈ DÙNG PLACEHOLDER
- Tuyệt đối không sinh mã vẽ sơ đồ dài vào bài viết.
- Luôn có câu dẫn trước và đặt placeholder duy nhất:
  *"Sơ đồ ca sử dụng tổng quát của hệ thống được thể hiện tại Hình 2.1."*
  `[Hình 2.1 – Sơ đồ ca sử dụng tổng quát của hệ thống (Use Case Diagram)]`

### 4.2. Bảng biểu (Tables)
- Tên bảng đặt **phía trên** bảng: `Bảng 1.1: Danh mục tổng hợp yêu cầu chức năng hệ thống`.
- Header bảng phải in đậm, dữ liệu căn giữa hoặc căn trái phù hợp, đơn vị đo rõ ràng.

### 4.3. Đoạn mã nguồn (Code Snippets)
- Tuyệt đối không paste cả file code dài.
- Chỉ trích dẫn các đoạn logic toán học hoặc xử lý giao dịch cốt lõi (Locking Transaction, Domain Engine), mỗi đoạn **không quá 20 dòng** kèm chú thích.

---

## 5. CẤU TRÚC 5 CHƯƠNG CHUẨN THEO KHUNG ĐỒ ÁN (HUCE MẪU ĐATN-14)

* **PHẦN ĐẦU (Đánh số trang La Mã thường: i, ii, iii...):**
  * Trang bìa cứng & Gáy sách (chuẩn HUCE)
  * Trang phụ bìa (bảng thông tin sinh viên, GVHD)
  * Nhận xét của Người hướng dẫn (tinh gọn, tiêu đề + các dòng chấm chấm)
  * Nhận xét của Người phản biện (tinh gọn, tiêu đề + các dòng chấm chấm)
  * Tóm tắt Đồ án (Abstract 4 đoạn $\le 1$ trang A4; số liệu thực nghiệm để `[...]`)
  * Nhiệm vụ ĐATN (Mẫu ĐATN-01 đầy đủ 4 nội dung, bảng tiến độ 10 tuần, 3 chữ ký)
  * Lời nói đầu (Trang i — Lý do chọn đề tài, tóm lược 5 chương, lời cảm ơn)
  * Cam đoan (Trang ii — Cam kết liêm chính học thuật theo QĐ 483)
  * Mục lục (Trang iii — Tự động cập nhật ở GĐ 6)
  * Danh sách Bảng, Hình vẽ (Trang iv — Cập nhật ở GĐ 6)
  * Danh sách Ký hiệu, Chữ viết tắt (Trang v — Bảng tra cứu thuật ngữ)
* **PHẦN NỘI DUNG CHÍNH (Đánh số trang Ả Rập: 1, 2, 3... Tối đa 150 trang):**
  * **MỞ ĐẦU (Trang 1):** Bối cảnh thực tế, Mục tiêu & Phạm vi, Phương pháp tiếp cận, Bảng 0.1 đối chiếu 8 chuẩn đầu ra (CLO1–CLO8).
  * **CHƯƠNG I: XÁC ĐỊNH VÀ PHÁT BIỂU ĐỀ TÀI (1.1 $\rightarrow$ 1.9):** Bối cảnh, mô hình Input-Process-Output, mục tiêu, đối tượng, 7 nhóm yêu cầu chức năng (Bảng 1.1), yêu cầu phi chức năng (Bảng 1.2), ràng buộc (Bảng 1.3), tiêu chí thành công (Bảng 1.4), giả định & quy phạm (Bảng 1.5).
  * **CHƯƠNG II: PHÂN TÍCH BÀI TOÁN (2.1 $\rightarrow$ 2.6):** Phân tích chức năng (đặc tả 7 UCs Bảng 2.1–2.7), Kiến trúc Modular Monolith (3-Engine), Phân tích CSDL 16 bảng, Hạ tầng Docker, Phần cứng/phần mềm, Thách thức kỹ thuật cốt lõi.
  * **CHƯƠNG III: THIẾT KẾ VÀ PHÁT TRIỂN GIẢI PHÁP (3.1 $\rightarrow$ 3.8):** Quy trình phát triển, Lý do chọn công nghệ, Thiết kế máy chủ (RESTful API, RBAC), Thiết kế module lõi & thuật toán (Croston/TSB/AutoARIMA/SMA, SS/ROP/SOQ, WSM, Gemini Flash On-demand, ví dụ tính toán số liệu), Thiết kế bảo mật ACID, UI/UX Recharts, Tính khả thi và Tiềm năng thương mại hóa.
  * **CHƯƠNG IV: TRIỂN KHAI VÀ THỬ NGHIỆM (4.1 $\rightarrow$ 4.8):** Môi trường thử nghiệm, Bộ giao diện thực tế, Kế hoạch thử nghiệm, Kết quả test tự động (Jest/Pytest PASS), Thực nghiệm đo lường định lượng trên tập M5 (WAPE/MASE), Chất lượng mã & an toàn thư viện, Kịch bản test chức năng, Diễn giải kết quả & hạn chế.
  * **CHƯƠNG V: TỔ CHỨC THỰC HIỆN, GIAO TIẾP VÀ TRÌNH BÀY (5.1 $\rightarrow$ 5.8):** Hình thức cá nhân, Bàn giao sản phẩm, Tiến độ 10 tuần (M1-M2-M3), Quy trình Git, 4 vướng mắc kỹ thuật thực tế & cách khắc phục, Tự đánh giá đạt 8 CLO.
  * **KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN:** Tổng kết kết quả đạt được, 4–5 hướng mở rộng.
* **PHẦN KẾT THÚC & PHỤ LỤC:**
  * **Tài liệu tham khảo:** Chuẩn trích dẫn quốc tế IEEE.
  * **Phụ lục A:** Nhật ký thực hiện ĐATN 10 tuần (Mẫu ĐATN-02).
  * **Phụ lục B:** Cây thư mục mã nguồn và Hướng dẫn cài đặt/chạy thử hệ thống.
  * **Phụ lục C:** Hướng dẫn lưu trữ số & đặt tên file theo Mẫu ĐATN-09.

---

## 6. CHECKLIST KIỂM SOÁT KHI BIÊN SOẠN BÁO CÁO

Trước khi bàn giao bất kỳ task báo cáo nào cho người dùng, Agent bắt buộc tự rà soát:
- [ ] Mọi hình vẽ, sơ đồ đều ở dạng `[Hình X.Y – Tên mô tả nội dung]`, tuyệt đối KHÔNG có khối mã Mermaid/PlantUML trong văn bản báo cáo.
- [ ] Mọi số liệu đo đạc thực nghiệm chưa chốt đều ở dạng `[...]` hoặc `[... %]`.
- [ ] Tuyệt đối KHÔNG có câu từ sáo rỗng trong danh mục Blacklist.
- [ ] Đã cập nhật trạng thái `[x]` tương ứng trong `report/REPORT_INDEX.md`.
- [ ] Không tự tiện tạo hay ghi đè file Word (`.docx`) khi người dùng chưa bảo.
