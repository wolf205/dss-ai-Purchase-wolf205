# UC-04: Nhập Dữ Liệu Vận Hành (Import Operational Data)

## 1. Thông Tin Chung

* **Mã Use Case:** `UC-04`
* **Tên Use Case:** Nhập dữ liệu vận hành (*Import Operational Data*)
* **Actor chính:** `Purchasing Staff` (Nhân viên mua hàng), `Store Manager` (Quản lý cửa hàng).
* **Phân loại:** Foundation.
* **Mục tiêu nghiệp vụ (Goal):** 
  * Cung cấp cơ chế tiếp nhận và chuẩn hóa dữ liệu vận hành thực tế từ bên ngoài vào hệ thống DSS thông qua tệp dữ liệu chuẩn (`CSV` hoặc `Excel`).
  * Làm giàu chuỗi dữ liệu lịch sử bán hàng (`Sales History`) phục vụ các thuật toán AI dự báo nhu cầu tương lai và phân loại ma trận `ABC - XYZ`.
  * Cập nhật số liệu kiểm kê tồn kho thực tế mới nhất trên kệ (`Current Inventory Snapshot`) để làm mới vị thế tồn kho trước khi chạy đợt phân tích mua hàng.

---

## 2. Nguyên Tắc & Ranh Giới Nghiệp Vụ

* **Nguyên tắc chất lượng dữ liệu ("Garbage In, Garbage Out"):** DSS phụ thuộc trực tiếp vào dữ liệu đầu vào để tính toán. Dữ liệu nạp vào phải sạch, hợp lệ và có thể truy xuất nguồn gốc rõ ràng.
* **Chiến lược kiểm tra toàn vẹn 100% (All-or-Nothing Validation):**
  * Tệp tải lên phải đạt tính hợp lệ tuyệt đối 100% mới được chấp thuận ghi vào cơ sở dữ liệu.
  * Nếu tệp có bất kỳ dòng nào vi phạm (mã SKU không tồn tại, số lượng âm, sai định dạng ngày...), hệ thống sẽ **từ chối nạp toàn bộ tệp**, đồng thời chỉ rõ danh sách các dòng lỗi kèm nguyên nhân cụ thể để người dùng chỉnh sửa triệt để trước khi nạp lại.
* **Cơ chế chống trùng lặp doanh số bán hàng (Sales De-duplication & Date Overwrite):**
  * Dữ liệu bán hàng được quản lý theo mốc thời gian ngày (`Date`).
  * Nếu tệp tải lên chứa các ngày đã có dữ liệu trong hệ thống, hệ thống bắt buộc phải hiển thị cảnh báo và chỉ thực hiện **ghi đè (overwrite)** số liệu của ngày đó sau khi Actor xác nhận. Tuyệt đối không tự động cộng dồn làm nhân đôi doanh số và làm sai lệch mô hình dự báo của AI.
* **Bảo lưu số lượng hàng đang chờ về (On-Order Preservation):**
  * Tệp kiểm kê tồn kho chỉ ghi đè số lượng hàng đếm được thực tế trên kệ vào tồn kho khả dụng (`Current Inventory`).
  * Hệ thống **giữ nguyên toàn bộ số lượng hàng đang về (`On-order quantity`)** của các Đơn mua hàng đang ở trạng thái `Approved`.
* **Không kết nối trực tiếp API với POS/WMS ngoài:** Hệ thống chỉ tiếp nhận dữ liệu qua hình thức tải tệp (File Upload) để kiểm soát phạm vi và độ phức tạp của đồ án tốt nghiệp.

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
Actor chủ động truy cập chức năng Nhập dữ liệu vận hành khi:
* Định kỳ (cuối ngày hoặc cuối tuần) sau khi xuất báo cáo doanh số từ phần mềm bán hàng POS.
* Sau mỗi đợt kiểm kê hàng hóa thực tế tại cửa hàng.
* Trước khi kích hoạt đợt phân tích đề xuất mua hàng tại `UC-01`.

### 3.2. Preconditions (Điều kiện tiên quyết)
1. Danh mục sản phẩm (`SKU`) đã được khai báo và kích hoạt trong hệ thống tại `UC-05`.
2. Tệp dữ liệu nguồn (`CSV` hoặc `Excel`) đã được chuẩn bị sẵn trên máy tính của Actor.

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Cơ sở dữ liệu hệ thống được bổ sung chuỗi dữ liệu bán hàng mới hoặc cập nhật số lượng tồn kho khả dụng mới nhất (`Current Inventory`).
2. Vị thế tồn kho được đồng bộ chính xác, sẵn sàng cho chuỗi tính toán DSS tại `UC-01`.
3. Lịch sử đợt nhập tệp (thời gian nạp, người thực hiện, loại tệp, tên tệp, tổng số bản ghi đã nạp) được lưu vết vào hệ thống phục vụ kiểm tra và đối soát.

---

## 5. Luồng Sự Kiện Chính (Main Flow)

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Truy cập chức năng Nhập dữ liệu vận hành và lựa chọn loại dữ liệu cần nạp:<br>- **Dữ liệu bán hàng** (`Sales History`); hoặc<br>- **Dữ liệu kiểm kê tồn kho** (`Current Inventory Snapshot`). |
| **2** | **Actor** | Chọn tệp dữ liệu (`.csv` hoặc `.xlsx`) từ máy tính và tải lên hệ thống. |
| **3** | **Hệ thống** | Thực thi quy trình tiền kiểm tra dữ liệu tự động (Pre-validation):<br>a. Kiểm tra cấu trúc tiêu đề cột theo đúng biểu mẫu quy định.<br>b. Kiểm tra kiểu dữ liệu từng dòng (ngày tháng hợp lệ, số lượng $\ge 0$, doanh thu $\ge 0$).<br>c. Đối chiếu mã SKU với Danh mục sản phẩm (`UC-05`): Toàn bộ SKU trong tệp phải tồn tại và đang hoạt động.<br>d. *(Nếu là tệp Bán hàng)* Quét đối chiếu các ngày trong tệp với dữ liệu lịch sử để phát hiện ngày bị trùng lặp. |
| **4** | **Hệ thống** | Hiển thị màn hình **Xem trước & Tóm tắt kiểm tra (Data Preview & Validation Summary)**:<br>- Thông tin chung: Tên tệp, kích thước, tổng số dòng dữ liệu.<br>- Trạng thái kiểm tra: `Hợp lệ 100%` (màu xanh).<br>- *(Nếu có ngày trùng lặp)* Bật khối cảnh báo màu vàng: Liệt kê các ngày đã có dữ liệu và thông báo về cơ chế ghi đè.<br>- Bảng xem trước: Hiển thị 5-10 dòng dữ liệu đầu tiên để Actor rà soát trực quan. |
| **5** | **Actor** | Kiểm tra thông tin tóm tắt và bấm **Xác nhận nhập dữ liệu** (nếu có cảnh báo trùng ngày, nút xác nhận hiển thị rõ: *"Xác nhận ghi đè dữ liệu"*). |
| **6** | **Hệ thống** | Thực thi lưu trữ dữ liệu vào cơ sở dữ liệu:<br>- *Đối với Bán hàng:* Ghi nhận nối tiếp các ngày mới; thay thế/ghi đè số liệu cũ của các ngày bị trùng lặp theo cặp `(Date, SKU)`.<br>- *Đối với Tồn kho:* Ghi đè số lượng tồn kho mới vào trường `Current Inventory` của các SKU tương ứng, giữ nguyên `On-order quantity`. |
| **7** | **Hệ thống** | Thông báo kết quả nạp dữ liệu thành công (hiển thị số bản ghi đã nạp, thời gian hoàn tất) và lưu nhật ký đợt nhập. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Tải tệp biểu mẫu chuẩn (Download Template)
* **Điều kiện:** Tại Bước 1, Actor chưa có tệp đúng định dạng hoặc muốn chuẩn bị dữ liệu theo mẫu chuẩn của hệ thống.
* **Xử lý:**
  1. Actor bấm nút **Tải file mẫu** tương ứng (`Sales Template` hoặc `Inventory Template`).
  2. Hệ thống xuất tệp mẫu chuẩn (`.csv` hoặc `.xlsx`) có sẵn các cột tiêu đề bắt buộc và một số dòng dữ liệu minh họa.
  3. Actor sử dụng tệp mẫu để điền số liệu và quay lại thực hiện tiếp Bước 2.

### AF-2: Hủy bỏ đợt nhập khi thấy cảnh báo trùng lặp ngày
* **Điều kiện:** Tại Bước 4 hoặc 5, hệ thống cảnh báo có ngày trùng lặp và Actor nhận ra mình đã chọn nhầm tệp dữ liệu cũ.
* **Xử lý:**
  1. Actor chọn nút **Hủy bỏ** (`Cancel`).
  2. Hệ thống hủy phiên nạp tệp, không ghi nhận bất kỳ dữ liệu nào vào cơ sở dữ liệu.
  3. Màn hình quay về trạng thái ban đầu để Actor chọn lại tệp đúng.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Tệp dữ liệu sai cấu trúc định dạng hoặc rỗng
* **Điều kiện:** Tại Bước 3, hệ thống phát hiện tệp tải lên không đúng định dạng (không phải CSV/Excel), tệp bị rỗng (0 byte), hoặc thiếu một trong các cột tiêu đề bắt buộc.
* **Xử lý:**
  1. Hệ thống từ chối xử lý và hiển thị thông báo lỗi cấu trúc:
     > *"Tệp tải lên không hợp lệ hoặc thiếu các cột bắt buộc. Vui lòng kiểm tra lại cấu trúc tệp hoặc tải tệp biểu mẫu chuẩn."*
  2. Hệ thống không lưu bất kỳ dữ liệu nào và cho phép Actor tải lên tệp khác.

### EF-2: Tệp chứa dữ liệu không hợp lệ (Vi phạm quy tắc All-or-Nothing)
* **Điều kiện:** Tại Bước 3, tệp có ít nhất một dòng dữ liệu vi phạm quy tắc tính hợp lệ:
  * Mã SKU không tồn tại trong hệ thống (`UC-05`).
  * Số lượng bán hoặc số lượng tồn kho có giá trị âm hoặc không phải là số nguyên.
  * Định dạng ngày tháng không hợp lệ hoặc nằm trong tương lai.
* **Xử lý:**
  1. Hệ thống **từ chối nạp toàn bộ tệp**.
  2. Màn hình hiển thị Bảng báo cáo lỗi chi tiết:
     - Tổng số dòng bị lỗi / Tổng số dòng trong tệp.
     - Danh sách chi tiết từng dòng lỗi: `[Số dòng] | [Mã SKU] | [Giá trị lỗi] | [Nguyên nhân chi tiết]`.
  3. Nút "Xác nhận nhập dữ liệu" bị vô hiệu hóa.
  4. Actor phải mở tệp trên máy tính, chỉnh sửa sạch 100% các lỗi được chỉ ra rồi tải lại từ Bước 2.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-14 (Operational Data Schema & All-or-Nothing Integrity Rule):**
  * **Cấu trúc tệp Bán hàng chuẩn:** `Date` (YYYY-MM-DD, không vượt quá ngày hiện tại), `SKU` (bắt buộc tồn tại trong hệ thống), `Quantity` (số nguyên dương $> 0$), `Revenue` (số tiền $\ge 0$).
  * **Cấu trúc tệp Tồn kho kiểm kê chuẩn:** `SKU` (bắt buộc tồn tại trong hệ thống), `StockQuantity` (số nguyên $\ge 0$).
  * **Quy tắc All-or-Nothing:** Chỉ chấp thuận nạp khi 100% các dòng đều thỏa mãn toàn bộ ràng buộc trên.
* **BR-15 (Sales De-duplication & Date Overwrite Rule):**
  * Khóa xác định duy nhất của bản ghi bán hàng là cặp `(Date, SKU)`.
  * Nếu phát hiện ngày nạp đã tồn tại trong hệ thống, bắt buộc phải cảnh báo người dùng. Khi được xác nhận, hệ thống thực hiện cập nhật thay thế (Upsert/Overwrite) số lượng và doanh thu của các SKU trong ngày đó, tuyệt đối không cộng dồn.
* **BR-16 (Physical Inventory Snapshot Replacement Rule):**
  * Khi nạp tệp kiểm kê tồn kho thành công:
    $$CurrentInventory_{SKU} = StockQuantity_{mới}$$
  * Số lượng hàng đang về (`On-order quantity`) của các SKU tương ứng hoàn toàn được giữ nguyên:
    $$OnOrder_{SKU} = OnOrder_{SKU\ (hiện\ tại)}$$

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Mối quan hệ với UC-05 (Manage Products / SKUs):**
  * `UC-04` phụ thuộc hoàn toàn vào danh mục SKU từ `UC-05`. Bất kỳ SKU nào xuất hiện trong tệp bán hàng hoặc tệp tồn kho đều phải được khai báo trước tại `UC-05`.
* **Mối quan hệ với UC-01 (Review & Approve Purchase Recommendations):**
  * `UC-04` cung cấp nguồn dữ liệu đầu vào quan trọng nhất cho `UC-01`.
  * Dữ liệu bán hàng nạp từ `UC-04` là cơ sở để `UC-01` chạy mô hình dự báo nhu cầu tương lai và phân loại nhóm mặt hàng theo ma trận `ABC - XYZ`.
  * Số liệu tồn kho kiểm kê từ `UC-04` giúp `UC-01` nhận diện chính xác mức tồn kho hiện có để tính toán nguy cơ thiếu hàng (`Stockout`) và số lượng đặt mua đề xuất.
