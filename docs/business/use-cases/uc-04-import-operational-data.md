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
  * Tệp tải lên phải đạt tính hợp lệ tuyệt đối 100% mới được hệ thống chấp thuận tiếp nhận và lưu trữ chính thức.
  * Nếu tệp có bất kỳ dòng nào vi phạm (mã SKU không tồn tại trong hệ thống, ô trống khuyết thiếu giá trị, số lượng âm, sai định dạng ngày, trùng lặp nội bộ tệp...), hệ thống sẽ **từ chối nạp toàn bộ tệp**, đồng thời cung cấp danh sách chi tiết các dòng lỗi kèm nguyên nhân để người dùng chỉnh sửa triệt để trước khi nạp lại.
* **Cơ chế chống trùng lặp doanh số bán hàng (Sales De-duplication & Date Overwrite):**
  * Dữ liệu bán hàng được quản lý theo mốc thời gian ngày (`Date`).
  * Nếu tệp tải lên chứa các ngày đã có dữ liệu trong hệ thống, hệ thống bắt buộc phải hiển thị cảnh báo và chỉ thực hiện **ghi đè (overwrite)** số liệu của ngày đó sau khi Actor xác nhận. Tuyệt đối không tự động cộng dồn làm nhân đôi doanh số và làm sai lệch mô hình dự báo của AI.
* **Bảo lưu số lượng hàng đang chờ về (On-Order Preservation):**
  * Tệp kiểm kê tồn kho chỉ cập nhật số lượng hàng đếm được thực tế trên kệ vào tồn kho khả dụng (`Current Inventory`).
  * Hệ thống **giữ nguyên toàn bộ số lượng hàng đang về (`On-order quantity`)** của các Đơn mua hàng đang ở trạng thái `Approved`.
* **Hỗ trợ kiểm kê từng phần (Partial Inventory Counting):**
  * Tệp kiểm kê tồn kho chỉ cập nhật số lượng cho các SKU có mặt trong tệp. Các SKU không xuất hiện trong tệp được bảo lưu nguyên vẹn số lượng tồn kho hiện tại (không bị gán về 0), hỗ trợ quy trình kiểm kê luân phiên theo ngành hàng của cửa hàng.
* **Chấp nhận dữ liệu của SKU Ngừng kinh doanh đang xả hàng (Deactivated SKU Support):**
  * Hệ thống chấp nhận tiếp nhận dữ liệu bán hàng và kiểm kê tồn kho của các SKU đang ở trạng thái `Inactive` nhằm phục vụ việc bán nốt hàng tồn cũ và theo dõi chính xác lượng tồn thực tế trên kệ.
  * Hệ thống chỉ chặn nạp khi mã SKU hoàn toàn không tồn tại trong danh mục hệ thống (chưa từng được khai báo tại `UC-05`).
* **Không kết nối trực tiếp API với POS/WMS ngoài:** Hệ thống chỉ tiếp nhận dữ liệu qua hình thức tải tệp (File Upload) để kiểm soát phạm vi và độ phức tạp của đồ án tốt nghiệp.

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
Actor chủ động truy cập chức năng Nhập dữ liệu vận hành khi:
* Định kỳ (cuối ngày hoặc cuối tuần) sau khi xuất báo cáo doanh số từ phần mềm bán hàng POS.
* Sau mỗi đợt kiểm kê hàng hóa thực tế tại cửa hàng.
* Trước khi kích hoạt đợt phân tích đề xuất mua hàng tại `UC-01`.

### 3.2. Preconditions (Điều kiện tiên quyết)
1. Danh mục sản phẩm (`SKU`) đã được khai báo trong hệ thống tại `UC-05`.
2. Tệp dữ liệu nguồn (`CSV` hoặc `Excel`) đã được chuẩn bị sẵn trên máy tính của Actor.

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Hệ thống cập nhật chuỗi dữ liệu bán hàng mới hoặc cập nhật số lượng tồn kho khả dụng mới nhất (`Current Inventory`).
2. Vị thế tồn kho được đồng bộ chính xác, sẵn sàng cho chuỗi tính toán DSS tại `UC-01`.
3. Lịch sử đợt nhập tệp (thời gian nạp, người thực hiện, loại tệp, tên tệp, tổng số bản ghi đã nạp) được lưu vết vào hệ thống phục vụ kiểm tra và đối soát.

---

## 5. Luồng Sự Kiện Chính (Main Flow)

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Truy cập chức năng Nhập dữ liệu vận hành và lựa chọn loại dữ liệu cần nạp:<br>- **Dữ liệu bán hàng** (`Sales History`); hoặc<br>- **Dữ liệu kiểm kê tồn kho** (`Current Inventory Snapshot`). |
| **2** | **Actor** | Chọn tệp dữ liệu (`.csv` hoặc `.xlsx`) từ máy tính và tải lên hệ thống. |
| **3** | **Hệ thống** | Thực thi quy trình tiền kiểm tra dữ liệu tự động (Pre-validation):<br>a. **Loại bỏ dòng trống:** Tự động phát hiện và bỏ qua các dòng trống hoàn toàn xen kẽ hoặc ở cuối tệp.<br>b. **Kiểm tra cấu trúc:** Kiểm tra sự đầy đủ của các cột tiêu đề bắt buộc theo biểu mẫu quy định.<br>c. **Kiểm tra dữ liệu từng dòng:** Không được để trống giá trị ở các ô bắt buộc; ngày tháng hợp lệ và $\le$ ngày hiện tại; số lượng và doanh thu hợp lệ ($\ge 0$).<br>d. **Đối chiếu danh mục SKU:** Toàn bộ SKU trong tệp phải tồn tại trong hệ thống (`UC-05`), chấp nhận cả SKU `Active` và SKU `Inactive` đang xả hàng.<br>e. **Kiểm tra trùng lặp nội bộ tệp:** Đảm bảo không có hai dòng dữ liệu nào trùng lặp cùng cặp `(Date, SKU)` trong tệp Bán hàng hoặc cùng mã `SKU` trong tệp Tồn kho.<br>f. *(Nếu là tệp Bán hàng)* Quét đối chiếu các ngày trong tệp với dữ liệu lịch sử để phát hiện ngày bị trùng lặp. |
| **4** | **Hệ thống** | Hiển thị kết quả xem trước và tóm tắt kiểm tra dữ liệu:<br>- Thông tin chung: Tên tệp, kích thước, tổng số dòng dữ liệu hợp lệ.<br>- Trạng thái kiểm tra: Đạt tiêu chuẩn hợp lệ 100%.<br>- Bảng xem trước: Hiển thị một số dòng dữ liệu đầu tiên để Actor rà soát trực quan.<br>- *(Nếu có ngày trùng lặp)* Hiển thị cảnh báo: Liệt kê các ngày đã có dữ liệu trong hệ thống và thông báo về cơ chế ghi đè dữ liệu. |
| **5** | **Actor** | Kiểm tra thông tin tóm tắt và xác nhận tiếp nhận dữ liệu (trường hợp có cảnh báo trùng lặp ngày, Actor xác nhận ghi đè dữ liệu cũ). |
| **6** | **Hệ thống** | Thực hiện cập nhật dữ liệu vào hệ thống:<br>- *Đối với Bán hàng:* Ghi nhận nối tiếp các ngày mới; thay thế/ghi đè số liệu cũ của các ngày bị trùng lặp theo cặp `(Date, SKU)`.<br>- *Đối với Tồn kho:* Cập nhật số lượng tồn kho mới cho các SKU có trong tệp, giữ nguyên tồn kho của các SKU vắng mặt và bảo lưu nguyên vẹn số lượng hàng đang về (`On-order quantity`) của các đơn PO `Approved`. |
| **7** | **Hệ thống** | Thông báo kết quả nạp dữ liệu thành công (hiển thị số bản ghi đã nạp, thời gian hoàn tất) và lưu nhật ký đợt nhập. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Tải tệp biểu mẫu chuẩn (Download Template)
* **Điều kiện:** Tại Bước 1, Actor chưa có tệp đúng định dạng hoặc muốn chuẩn bị dữ liệu theo mẫu chuẩn của hệ thống.
* **Xử lý:**
  1. Actor yêu cầu tải biểu mẫu chuẩn tương ứng (`Sales Template` hoặc `Inventory Template`).
  2. Hệ thống cung cấp tệp mẫu chuẩn (`.csv` hoặc `.xlsx`) có sẵn các cột tiêu đề bắt buộc và một số dòng dữ liệu minh họa.
  3. Actor sử dụng tệp mẫu để chuẩn bị số liệu và tiếp tục thực hiện Bước 2.

### AF-2: Hủy bỏ đợt nhập khi thấy cảnh báo trùng lặp ngày
* **Điều kiện:** Tại Bước 4 hoặc 5, hệ thống cảnh báo có ngày trùng lặp và Actor nhận ra mình đã chọn nhầm tệp dữ liệu cũ.
* **Xử lý:**
  1. Actor hủy bỏ phiên làm việc.
  2. Hệ thống không lưu trữ bất kỳ dữ liệu nào và kết thúc đợt nạp tệp.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Tệp dữ liệu sai cấu trúc định dạng hoặc rỗng
* **Điều kiện:** Tại Bước 3, hệ thống phát hiện tệp tải lên không đúng định dạng (không phải CSV/Excel), tệp bị rỗng (0 byte), hoặc thiếu một trong các cột tiêu đề bắt buộc.
* **Xử lý:**
  1. Hệ thống từ chối xử lý và hiển thị thông báo:
     > *"Tệp tải lên không hợp lệ hoặc thiếu các cột bắt buộc. Vui lòng kiểm tra lại cấu trúc tệp hoặc tải tệp biểu mẫu chuẩn."*
  2. Hệ thống không lưu bất kỳ dữ liệu nào và cho phép Actor tải lên tệp khác.

### EF-2: Tệp chứa dữ liệu không hợp lệ (Vi phạm quy tắc All-or-Nothing)
* **Điều kiện:** Tại Bước 3, tệp có ít nhất một dòng dữ liệu vi phạm một trong các quy tắc tính hợp lệ:
  * Mã SKU hoàn toàn không tồn tại trong danh mục hệ thống (`UC-05`).
  * Khuyết thiếu dữ liệu (ô giá trị bị trống / Null / Blank) ở bất kỳ cột bắt buộc nào.
  * Số lượng bán hoặc số lượng tồn kho có giá trị âm hoặc không phải là số nguyên.
  * Định dạng ngày tháng không hợp lệ hoặc nằm trong tương lai ($Date > Today$).
  * Tồn tại dòng trùng lặp nội bộ tệp (trùng cặp `(Date, SKU)` trong tệp Bán hàng hoặc trùng mã `SKU` trong tệp Tồn kho).
* **Xử lý:**
  1. Hệ thống **từ chối nạp toàn bộ tệp**.
  2. Hệ thống hiển thị báo cáo chi tiết các dòng vi phạm:
     - Tổng số dòng bị lỗi / Tổng số dòng trong tệp.
     - Danh sách chi tiết từng dòng lỗi: `[Số dòng] | [Mã SKU] | [Giá trị lỗi] | [Nguyên nhân chi tiết]`.
  3. Hệ thống khóa thao tác xác nhận nạp dữ liệu.
  4. Actor thực hiện chỉnh sửa sạch 100% các lỗi trên tệp nguồn và thực hiện tải lại từ Bước 2.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-14 (Operational Data Schema & All-or-Nothing Integrity Rule):**
  * **Cấu trúc tệp Bán hàng chuẩn:** `Date` (YYYY-MM-DD, $\le$ Ngày hiện tại), `SKU` (bắt buộc tồn tại trong hệ thống), `Quantity` (số nguyên dương $> 0$), `Revenue` (số tiền $\ge 0$).
  * **Cấu trúc tệp Tồn kho kiểm kê chuẩn:** `SKU` (bắt buộc tồn tại trong hệ thống), `StockQuantity` (số nguyên $\ge 0$).
  * **Quy tắc All-or-Nothing:** Chỉ chấp thuận nạp khi 100% các dòng đều thỏa mãn toàn bộ ràng buộc trên; tự động bỏ qua các dòng hoàn toàn trống.
* **BR-15 (Sales De-duplication & Date Overwrite Rule):**
  * Khóa xác định duy nhất của bản ghi bán hàng là cặp `(Date, SKU)`.
  * Nếu phát hiện ngày nạp đã tồn tại trong hệ thống, bắt buộc phải cảnh báo người dùng. Khi được xác nhận, hệ thống thực hiện ghi đè (Overwrite) số lượng và doanh thu của các SKU trong ngày đó, tuyệt đối không cộng dồn.
* **BR-16 (Physical Inventory Snapshot Replacement Rule):**
  * Khi nạp tệp kiểm kê tồn kho thành công, hệ thống cập nhật số lượng tồn cho các SKU có trong tệp, giữ nguyên tồn kho của các SKU vắng mặt:
    $$CurrentInventory_{SKU} = StockQuantity_{mới}$$
  * Số lượng hàng đang về (`On-order quantity`) của các SKU tương ứng hoàn toàn được giữ nguyên:
    $$OnOrder_{SKU} = OnOrder_{SKU\ (hiện\ tại)}$$
* **BR-18 (Product Deactivation & Operational Data Continuity Rule):**
  * SKU ở trạng thái `Inactive` (Ngừng kinh doanh) bị loại trừ hoàn toàn khỏi chu trình gợi ý mua hàng tại `UC-01`, nhưng vẫn được tiếp nhận dữ liệu bán hàng và kiểm kê tại `UC-04` để phục vụ bán nốt số tồn dư và theo dõi tồn kho thực tế.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Mối quan hệ với UC-05 (Manage Products / SKUs):**
  * `UC-04` phụ thuộc vào danh mục SKU từ `UC-05`. Mọi SKU xuất hiện trong tệp bán hàng hoặc tệp tồn kho đều phải tồn tại trong danh mục hệ thống.
* **Mối quan hệ với UC-01 (Review & Approve Purchase Recommendations):**
  * `UC-04` cung cấp nguồn dữ liệu đầu vào quan trọng nhất cho `UC-01`.
  * Dữ liệu bán hàng nạp từ `UC-04` là cơ sở để `UC-01` chạy mô hình dự báo nhu cầu tương lai và phân loại nhóm mặt hàng theo ma trận `ABC - XYZ` (chỉ áp dụng cho các SKU đang `Active`).
  * Số liệu tồn kho kiểm kê từ `UC-04` giúp `UC-01` nhận diện chính xác mức tồn kho hiện có để tính toán nguy cơ thiếu hàng (`Stockout`) và số lượng đặt mua đề xuất.

