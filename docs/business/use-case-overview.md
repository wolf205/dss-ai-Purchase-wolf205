# Use Case Overview

## Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI

---

## 1. Nguyên Tắc Cốt Lõi

* **Loại hệ thống:** Decision Support System (DSS) cho cửa hàng bán lẻ đơn lẻ (`Single Retail Store`).
* **Nguyên tắc vận hành:**
  > **AI recommends. Human decides.**
* AI đóng vai trò xử lý ngầm (Dự báo nhu cầu, tính toán tồn kho, xếp hạng nhà cung cấp, giải thích tự nhiên bằng LLM).
* Con người là chủ thể ra quyết định cuối cùng và chịu trách nhiệm nghiệp vụ.

---

## 2. Actors & Phân Quyền

Hệ thống có **2 Actor** nghiệp vụ trực tiếp tương tác:

### 2.1. Purchasing Staff (Nhân viên mua hàng)

* Là người thực thi quy trình nghiệp vụ mua hàng hàng ngày.
* Kích hoạt đợt phân tích mua hàng on-demand.
* Xem xét, điều chỉnh và trực tiếp phê duyệt phương án mua hàng.
* Theo dõi, in/xuất `Purchase Order (PO)` gửi cho nhà cung cấp.
* Ghi nhận nhận hàng thực tế khi hàng về kho.
* Nhập dữ liệu bán hàng và tồn kho phục vụ phân tích.

### 2.2. Store Manager (Quản lý cửa hàng / Admin)

* Là người quản trị dữ liệu nền tảng và định hướng chính sách mua hàng.
* Quản lý danh mục sản phẩm (`SKU`).
* Quản lý hồ sơ nhà cung cấp (`Supplier`) và điều kiện cung ứng (`Giá nhập`, `Lead Time`, `MOQ`).
* Thiết lập các tham số vận hành DSS (trọng số đánh giá NCC, mức độ phục vụ, chu kỳ rà soát tồn kho).
* **Quyền kế thừa:** `Store Manager` có toàn quyền thực hiện mọi Use Case của `Purchasing Staff` khi cần thiết.

---

## 3. Core Business Workflow & Phân Bổ Use Case

```text
[Dữ liệu nền tảng & Vận hành]
  Store Manager: Quản lý SKU, NCC & Điều kiện cung ứng (UC-05, UC-06)
  Store Manager: Cấu hình trọng số NCC & Tham số DSS (UC-07)
  Purchasing Staff / Store Manager: Import Doanh số & Tồn kho (UC-04)
                     ↓
[Phân tích DSS & Ra quyết định mua]
  Purchasing Staff: Kích hoạt phân tích On-demand
  System: Chạy Dự báo → Phân loại ABC-XYZ → Tính SS/ROP/Số lượng mua → Xếp hạng NCC → Tạo giải thích LLM
  Purchasing Staff: Xem xét cơ sở dữ liệu → Tùy chỉnh (nếu cần) → Bấm "Phê duyệt"
  System: Tự động gom SKU theo từng NCC để sinh các Purchase Order (Approved) (UC-01)
                     ↓
[Phát hành & Quản lý Đơn mua hàng]
  Purchasing Staff: Xem danh sách PO, xuất/in đơn mua hàng gửi NCC, theo dõi tiến độ (UC-02)
                     ↓
[Nhận hàng & Đóng vòng lặp dữ liệu]
  Purchasing Staff: Ghi nhận ngày giao thực tế & số lượng thực nhận đối chiếu PO
  System: Tự động cộng tồn kho, chuyển PO sang Completed, cập nhật chỉ số NCC (UC-03)
```

---

## 4. Danh Mục Use Cases

Hệ thống gồm **7 Use Cases** được phân chia theo vai trò và phân loại nghiệp vụ:

| Mã UC | Tên Use Case | Actor chính | Phân loại | Mục tiêu nghiệp vụ (Business Outcome) |
| :--- | :--- | :--- | :--- | :--- |
| **UC-01** | **Xử lý và phê duyệt đề xuất mua hàng** | Purchasing Staff | **Core DSS** | Hoàn thành phương án mua hàng tối ưu từ gợi ý của DSS. Hệ thống tự động sinh các `Purchase Order (PO)` trạng thái `Approved`. |
| **UC-02** | **Quản lý đơn mua hàng** | Purchasing Staff | Supporting | Xem chi tiết, xuất file/in ấn PO gửi đối tác và theo dõi trạng thái đơn hàng (`Approved`, `Completed`). |
| **UC-03** | **Ghi nhận nhận hàng** | Purchasing Staff | Supporting (Feedback) | Cập nhật số lượng tồn kho thực tế, hoàn tất PO, và ghi nhận dữ liệu giao hàng thực tế để tự động cập nhật chỉ số hiệu suất NCC. |
| **UC-04** | **Nhập dữ liệu vận hành** | Purchasing Staff, Store Manager | Foundation | Nạp dữ liệu lịch sử bán hàng và số liệu kiểm kê tồn kho mới nhất từ file (CSV/Excel) vào hệ thống. |
| **UC-05** | **Quản lý danh mục sản phẩm** | Store Manager | Foundation | Duy trì thông tin chuẩn của danh mục mặt hàng (`SKU`) kinh doanh trong cửa hàng. |
| **UC-06** | **Quản lý nhà cung cấp và điều kiện cung ứng** | Store Manager | Foundation | Quản lý hồ sơ nhà cung cấp, thiết lập danh mục SKU cung ứng (kèm Giá, Lead Time, MOQ) và theo dõi lịch sử hiệu suất giao hàng của NCC. |
| **UC-07** | **Thiết lập tham số phân tích DSS** | Store Manager | Core Config | Tùy chỉnh trọng số đánh giá NCC và các tham số tính toán tồn kho (mức độ phục vụ, chu kỳ rà soát) để định hướng thuật toán phân tích. |

---

## 5. Tóm Tắt Từng Use Case

### UC-01: Xử lý và phê duyệt đề xuất mua hàng (Review & Approve Purchase Recommendations)

* **Actor:** Purchasing Staff (Store Manager có thể thực hiện).
* **Phân loại:** Core DSS.
* **Goal:** Nhận khuyến nghị mua hàng từ DSS, xem xét giải thích lý do, điều chỉnh và chốt duyệt phương án mua hàng.
* **Trigger:** Người dùng chủ động kích hoạt đợt phân tích mua hàng theo nhu cầu (`On-demand`).
* **Pre-conditions:** Dữ liệu bán hàng, tồn kho và danh mục SKU-NCC đã sẵn sàng.
* **Main Flow:**
  1. Actor yêu cầu hệ thống phân tích mua hàng.
  2. Hệ thống thực thi xử lý ngầm:
     * Dự báo nhu cầu bán hàng tương lai (`Demand Forecast`).
     * Phân loại ma trận tồn kho `ABC - XYZ` tự động từ dữ liệu bán hàng.
     * Phân tích rủi ro tồn kho (`Stockout` / `Overstock`), tính toán `Safety Stock`, `Reorder Point`, và số lượng mua đề xuất.
     * Đánh giá, chấm điểm và xếp hạng các nhà cung cấp theo bộ tiêu chí.
     * Sinh tóm tắt giải thích lý do đề xuất (`Why Buy`) bằng LLM dựa trên số liệu định lượng và nhóm phân loại ABC-XYZ.
  3. Actor xem xét danh sách đề xuất (hiển thị nhãn Badge và hỗ trợ lọc/sắp xếp theo nhóm ABC-XYZ), các chỉ số dự báo và nội dung giải thích lý do.
  4. Actor có thể điều chỉnh số lượng mua hoặc chọn lại nhà cung cấp khác nếu cần.
  5. Actor xác nhận phê duyệt phương án mua hàng.
  6. Hệ thống tự động gom nhóm các SKU theo từng nhà cung cấp và sinh các đơn mua hàng (`Purchase Order`) ở trạng thái `Approved`.
* **Post-conditions:** Phương án mua được lưu lại; các bản ghi `Purchase Order` được tạo sẵn sàng cho bước gửi đối tác.

---

### UC-02: Quản lý đơn mua hàng (Manage Purchase Orders)

* **Actor:** Purchasing Staff (Store Manager có thể thực hiện).
* **Phân loại:** Supporting.
* **Goal:** Theo dõi tiến độ đơn hàng và phát hành thông tin đơn mua hàng cho nhà cung cấp.
* **Trigger:** Đơn mua hàng đã được tạo từ UC-01 hoặc khi cần theo dõi trạng thái đơn hàng.
* **Pre-conditions:** Tồn tại ít nhất một đơn mua hàng trong hệ thống.
* **Main Flow:**
  1. Actor tra cứu danh sách các `Purchase Order` theo trạng thái (`Approved`, `Completed`).
  2. Actor mở xem chi tiết đơn mua hàng (danh sách mặt hàng, số lượng, đơn giá, nhà cung cấp).
  3. Actor xuất file hoặc in đơn mua hàng để gửi cho đối tác bên ngoài.
* **Post-conditions:** Đơn mua hàng được phát hành để gửi tới nhà cung cấp; trạng thái được theo dõi xuyên suốt cho tới khi nhận hàng.

---

### UC-03: Ghi nhận nhận hàng (Record Goods Receipt)

* **Actor:** Purchasing Staff (Store Manager có thể thực hiện).
* **Phân loại:** Supporting (Closed-Loop Feedback).
* **Goal:** Ghi nhận kết quả giao hàng thực tế từ nhà cung cấp để cập nhật tồn kho và chỉ số đánh giá nhà cung cấp.
* **Trigger:** Nhà cung cấp giao hàng đến cửa hàng vật lý.
* **Pre-conditions:** Đơn mua hàng đang ở trạng thái `Approved`.
* **Main Flow:**
  1. Actor chọn đơn mua hàng tương ứng với đợt giao hàng thực tế.
  2. Actor nhập ngày nhận hàng thực tế và số lượng thực nhận cho từng mặt hàng trong đơn.
  3. Actor xác nhận hoàn tất nhận hàng.
  4. Hệ thống xử lý:
     * Cập nhật tăng số lượng vào tồn kho hiện tại (`Current Inventory`).
     * Chuyển trạng thái đơn mua hàng sang `Completed`.
     * Tính toán sai lệch về thời gian và số lượng so với cam kết để ghi nhận lịch sử giao hàng của nhà cung cấp.
* **Post-conditions:** Tồn kho được cập nhật tức thời; dữ liệu hiệu suất của nhà cung cấp (`On-time Rate`, `Fulfillment Rate`) được cập nhật để phục vụ các đợt phân tích mua hàng tiếp theo.

---

### UC-04: Nhập dữ liệu vận hành (Import Operational Data)

* **Actor:** Purchasing Staff, Store Manager.
* **Phân loại:** Foundation.
* **Goal:** Cập nhật dữ liệu lịch sử bán hàng và số liệu tồn kho mới nhất vào hệ thống làm đầu vào cho DSS.
* **Trigger:** Định kỳ trước khi chạy phân tích mua hàng hoặc khi có dữ liệu kiểm kê/bán hàng mới.
* **Pre-conditions:** Tệp dữ liệu nguồn (CSV/Excel) đúng định dạng quy định.
* **Main Flow:**
  1. Actor chọn tệp dữ liệu bán hàng hoặc tệp kiểm kê tồn kho từ máy tính.
  2. Hệ thống kiểm tra tính hợp lệ của tệp (cấu trúc cột, mã SKU hợp lệ, giá trị số dương).
  3. Actor xác nhận nhập dữ liệu.
  4. Hệ thống lưu trữ dữ liệu vào cơ sở dữ liệu và thông báo kết quả nhập (số dòng thành công, cảnh báo nếu có).
* **Post-conditions:** Dữ liệu bán hàng và tồn kho mới nhất sẵn sàng cho các thuật toán dự báo và tính toán tồn kho.

---

### UC-05: Quản lý danh mục sản phẩm (Manage Products / SKUs)

* **Actor:** Store Manager.
* **Phân loại:** Foundation.
* **Goal:** Duy trì danh mục các mặt hàng được phép kinh doanh tại cửa hàng.
* **Trigger:** Cửa hàng nhập thêm mặt hàng mới hoặc cần chỉnh sửa thông tin sản phẩm.
* **Main Flow:**
  1. Actor tra cứu danh mục sản phẩm hiện có.
  2. Actor thực hiện thêm mới, cập nhật thông tin sản phẩm (mã SKU, tên sản phẩm, ngành hàng, đơn vị tính) hoặc dừng kinh doanh mặt hàng.
  3. Hệ thống xác thực tính duy nhất của mã SKU và lưu thông tin.
* **Post-conditions:** Danh mục sản phẩm chuẩn hóa được lưu trong hệ thống.

---

### UC-06: Quản lý nhà cung cấp và điều kiện cung ứng (Manage Suppliers & Supply Conditions)

* **Actor:** Store Manager.
* **Phân loại:** Foundation.
* **Goal:** Quản lý thông tin nhà cung cấp, thiết lập danh mục SKU mà NCC đó cung ứng kèm điều kiện mua hàng, và theo dõi lịch sử hiệu suất giao hàng thực tế.
* **Trigger:** Hợp tác với nhà cung cấp mới, cập nhật chính sách giá/lead time/MOQ, hoặc tra cứu uy tín đối tác.
* **Main Flow:**
  1. Actor quản lý thông tin chung của nhà cung cấp (tên, thông tin liên hệ, địa chỉ, trạng thái).
  2. Actor thiết lập danh sách các SKU do nhà cung cấp đó cung cấp, bao gồm:
     * `Purchase Price` (Giá nhập mua).
     * `Committed Lead Time` (Thời gian giao hàng cam kết, tính theo ngày).
     * `MOQ` (Số lượng đặt tối thiểu).
  3. Actor có thể xem lịch sử các lần giao hàng thực tế và chỉ số giao hàng tích lũy (tỷ lệ đúng hạn, tỷ lệ đủ hàng) của nhà cung cấp đó.
* **Post-conditions:** Thông tin hồ sơ và điều kiện cung ứng được lưu trữ, làm dữ liệu đầu vào trực tiếp cho thuật toán đánh giá và xếp hạng nhà cung cấp.

---

### UC-07: Thiết lập tham số phân tích DSS (Configure DSS Parameters)

* **Actor:** Store Manager.
* **Phân loại:** Core Config.
* **Goal:** Điều chỉnh các trọng số đánh giá nhà cung cấp và các tham số tính toán tồn kho để định hướng hành vi của hệ thống DSS phù hợp với chiến lược cửa hàng.
* **Trigger:** Khi cửa hàng thay đổi chiến lược mua hàng hoặc tối ưu lại tham số vận hành.
* **Main Flow:**
  1. Actor mở màn hình cấu hình tham số DSS.
  2. Actor điều chỉnh bộ trọng số đánh giá nhà cung cấp (tổng tỷ trọng = 100%):
     * Tỷ trọng Đơn giá (`Price Weight`).
     * Tỷ trọng Thời gian giao hàng (`Lead Time Weight`).
     * Tỷ trọng Số lượng đặt tối thiểu (`MOQ Weight`).
     * Tỷ trọng Lịch sử thực hiện giao hàng (`Historical Performance Weight`).
  3. Actor điều chỉnh các tham số chính sách tồn kho:
     * Mức độ phục vụ mong muốn (`Target Service Level`, dùng để xác định hệ số an toàn $Z$).
     * Chu kỳ rà soát mua hàng (`Review Period`, tính theo ngày).
  4. Hệ thống kiểm tra tính hợp lệ và lưu cấu hình.
* **Post-conditions:** Cấu hình mới được áp dụng ngay cho các đợt phân tích mua hàng tiếp theo.

---

## 6. Ranh Giới & Ràng Buộc Nghiệp Vụ (Boundaries)

1. **AI / LLM không phải là Actor:**
   * Dự báo nhu cầu, phân loại ABC-XYZ, tính ROP/Safety stock, chấm điểm NCC và sinh lời giải thích LLM hoàn toàn là **tác vụ xử lý bên trong** của `UC-01`.
2. **Không phân mảnh CRUD / Screen:**
   * Các thao tác xem gợi ý, so sánh NCC, chỉnh sửa số lượng và phê duyệt được hợp nhất trong một chu trình nghiệp vụ khép kín tại `UC-01`.
   * Hiệu suất nhà cung cấp không tách thành màn hình báo cáo rời rạc mà được gắn liền theo ngữ cảnh tại `UC-01` (khi chọn NCC) và `UC-06` (khi xem chi tiết NCC).
3. **Sinh đơn mua hàng tự động sau khi duyệt:**
   * Tại `UC-01`, khi phê duyệt phương án mua, hệ thống tự động tạo các `Purchase Order` ở trạng thái `Approved` cho từng NCC. `UC-02` chỉ tập trung vào việc quản lý vòng đời và xuất gửi đơn hàng.
4. **Đóng kín vòng lặp dữ liệu (Closed-Loop Feedback):**
   * `UC-03` hoàn tất quy trình mua hàng bằng việc đưa dữ liệu thực nhận trở lại hệ thống để cập nhật tồn kho và cập nhật chỉ số đánh giá NCC cho các đợt mua tiếp theo.
