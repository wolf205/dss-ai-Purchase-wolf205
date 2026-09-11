# Mẫu Đặc Tả Business Rule (Rule Specification Template)

Tài liệu này cung cấp khung mẫu chuẩn mực để mô tả chi tiết từng Quy tắc nghiệp vụ (Business Rule - BR) trong hệ thống DSS. Mọi quy tắc khi được đặc tả chính thức đều phải tuân thủ cấu trúc này.

---

## Template Chuẩn

```markdown
### [MÃ-BR]: [Tên Quy Tắc Nghiệp Vụ Ngắn Gọn]

* **Mã quy tắc:** [BR-XX]
* **Tên quy tắc:** [Tên đầy đủ]
* **Nhóm quy tắc:** [Nhu cầu & Tồn kho / Đánh giá NCC / Ràng buộc Mua hàng / Vòng đời PO / Toàn vẹn Dữ liệu]
* **Ý nghĩa nghiệp vụ (Business Purpose):**
  [Mô tả mục đích kinh doanh của quy tắc: Giải quyết rủi ro gì? Hỗ trợ quyết định nào của nhân viên mua hàng?]

* **Thời điểm kích hoạt (Trigger):**
  [Khi nào quy tắc này được thực thi? Ví dụ: Khi chạy batch tính toán khuyến nghị hàng ngày / Khi nhân viên bấm xem chi tiết SKU / Khi duyệt PO / Khi nhập file dữ liệu...]

* **Dữ liệu đầu vào (Input Parameters):**
  * `Biến số 1`: Ý nghĩa, đơn vị tính, nguồn gốc dữ liệu.
  * `Biến số 2`: Ý nghĩa, đơn vị tính, nguồn gốc dữ liệu.
  * `Tham số cấu hình (System Configuration)`: Giá trị mặc định (nếu có).

* **Logic / Công thức chi tiết (Formula & Logic):**
  * **Công thức toán học:**
    $$[Công thức LaTeX hoặc biểu thức toán học]$$
  * **Giải thích các thành phần:**
    * `A`: ...
    * `B`: ...
  * **Bảng quyết định / Điều kiện rẽ nhánh (Decision Table / Logic):**
    | Điều kiện | Hành động / Kết quả tính toán |
    | :--- | :--- |
    | Trường hợp 1 | ... |
    | Trường hợp 2 | ... |

* **Dữ liệu đầu ra (Output):**
  * `Kết quả trả về`: Tên trường dữ liệu, kiểu giá trị, ý nghĩa kết quả.
  * `Trạng thái / Cảnh báo sinh ra`: (nếu có, ví dụ cảnh báo Stockout Risk, cảnh báo Overdue...).

* **Cơ chế dự phòng khi thiếu dữ liệu (Fallback / Edge Cases):**
  * **Trường hợp thiếu dữ liệu:** [Ví dụ: SKU mới chưa có lịch sử bán hàng / NCC mới chưa có lịch sử giao...]
  * **Phương án xử lý fallback:** [Áp dụng công thức ước lượng đơn giản / Gán giá trị mặc định / Cảnh báo cần con người xem xét...]

* **Tính minh bạch & Giải thích (Explainability):**
  [Hệ thống sẽ hiển thị lời giải thích như thế nào trên giao diện để nhân viên hiểu tại sao ra được con số này?]

* **Use Cases liên quan (Mapped Use Cases):**
  * [Mã UC - Tên UC]: Bước nào trong luồng sử dụng quy tắc này.
```

---

## Tiêu Chí Kiểm Tra (Rule Quality Checklist)

Trước khi coi một Business Rule là hoàn tất, kiểm tra các câu hỏi sau:
1. **Tính tất định (Determinism):** Với cùng một tập Input đầu vào, quy tắc có luôn cho ra cùng một Output duy nhất không?
2. **Không lẫn kỹ thuật (No Technical Bloat):** Quy tắc có chứa tên bảng CSDL, tên API, framework hay mã nguồn không? (Nếu có $\rightarrow$ Phải loại bỏ).
3. **Đầy đủ Fallback:** Nếu dữ liệu bị khuyết thiếu hoặc bằng 0 (ví dụ chia cho 0, lịch sử trống), quy tắc đã có phương án xử lý chưa?
4. **Hỗ trợ con người ra quyết định:** Kết quả của quy tắc có giúp nhân viên mua hàng hiểu rõ "Tại sao nên mua / Tại sao chọn NCC này" không?
