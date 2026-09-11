# UC-05: Quản Lý Danh Mục Sản Phẩm (Manage Products / SKUs)

## 1. Thông Tin Chung

* **Mã Use Case:** `UC-05`
* **Tên Use Case:** Quản lý danh mục sản phẩm (*Manage Products / SKUs*)
* **Actor chính:** `Store Manager` (Quản lý cửa hàng).
* **Actor tra cứu (Read-only):** `Purchasing Staff` (Nhân viên mua hàng có quyền tra cứu, tìm kiếm và xem chi tiết danh mục).
* **Phân loại:** Foundation.
* **Mục tiêu nghiệp vụ (Goal):**
  * Cung cấp cơ chế quản trị dữ liệu nền tảng (*Master Data*) chuẩn hóa cho toàn bộ danh mục mặt hàng (`SKU`) của cửa hàng bán lẻ đơn lẻ.
  * Thiết lập nguồn dữ liệu danh mục chuẩn duy nhất (`Single Source of Truth`) về sản phẩm làm nền tảng cho mọi luồng nghiệp vụ của hệ thống DSS: phân tích dự báo nhu cầu & gợi ý mua hàng (`UC-01`), quản lý đơn mua (`UC-02`), nhận hàng (`UC-03`), nạp dữ liệu bán hàng & tồn kho (`UC-04`), và liên kết nhà cung cấp (`UC-06`).
  * Bảo vệ tính toàn vẹn dữ liệu chuỗi thời gian và lịch sử giao dịch thông qua cơ chế bất biến của mã SKU và chính sách vô hiệu hóa an toàn thay cho xóa vĩnh viễn.

---

## 2. Nguyên Tắc & Ranh Giới Nghiệp Vụ

* **Tính bất biến của mã SKU (SKU Code Immutability):**
  * Mã SKU là định danh logic duy nhất trong toàn hệ thống.
  * Sau khi tạo thành công, mã SKU bị khóa cố định (không cho phép chỉnh sửa). Mọi tệp nạp ngoài (`UC-04`) và các bảng dữ liệu liên kết đều dùng mã này để đối chiếu.
* **Tách biệt với Điều kiện cung ứng của Nhà cung cấp (UC-06):**
  * Hồ sơ SKU tại `UC-05` thuần túy mô tả thuộc tính định danh và phân loại của mặt hàng (Tên, Ngành hàng, Đơn vị tính, Mã vạch).
  * Các thông tin thương mại như Giá nhập mua (`Purchase Price`), Thời gian giao hàng cam kết (`Committed Lead Time`), và Số lượng đặt tối thiểu (`MOQ`) thuộc về quan hệ giữa SKU và từng Nhà cung cấp tại `UC-06` (một SKU có thể có nhiều nhà cung cấp với các điều kiện khác nhau).
* **Chính sách Vô hiệu hóa bảo vệ toàn vẹn tham chiếu (Soft Deactivation over Hard Delete):**
  * Tuyệt đối cấm xóa vĩnh viễn (`Hard Delete`) nếu SKU đã phát sinh bất kỳ bản ghi liên kết nào (lịch sử bán hàng, tồn kho, đơn mua PO, hoặc liên kết với nhà cung cấp).
  * Khi ngừng kinh doanh, SKU được chuyển sang trạng thái `Inactive`.
  * SKU ở trạng thái `Inactive` sẽ bị loại trừ hoàn toàn khỏi bảng phân tích gợi ý mua hàng của DSS (`UC-01`), và bị từ chối nếu xuất hiện trong tệp nạp mới tại `UC-04`.
  * Chỉ cho phép xóa vĩnh viễn (`Hard Delete`) nếu SKU đó vừa tạo mới và hoàn toàn chưa có bất kỳ dữ liệu ràng buộc nào trong hệ thống.
* **Ràng buộc khi chuyển Ngừng kinh doanh (Deactivation Guard):**
  * Hệ thống chặn không cho chuyển một SKU sang `Inactive` chừng nào SKU đó vẫn còn số lượng hàng đang trên đường về (`On-order > 0`) trong các đơn mua hàng đang chờ giao (`Approved PO`).
* **Khởi tạo Tồn kho mặc định bằng 0:**
  * Khi tạo mới một SKU, hệ thống tự động gán `Current Inventory = 0` và `On-order = 0`.
  * Tồn kho thực tế được cập nhật chính danh qua nạp tệp kiểm kê (`UC-04`) hoặc nhận hàng (`UC-03`), không cho phép nhập tùy tiện số tồn kho trong form tạo sản phẩm.
* **Phạm vi nhập liệu tinh gọn:**
  * Thao tác nhập và chỉnh sửa SKU được thực hiện trực tiếp qua Form giao diện trực quan trên web.
  * Tính năng nạp hàng loạt từ file tạm thời đưa ra ngoài phạm vi ban đầu để tập trung hoàn thiện bài toán cốt lõi của đồ án.

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
* Cửa hàng bắt đầu nhập kinh doanh một mặt hàng mới.
* Store Manager cần cập nhật thông tin sản phẩm (tên hiển thị, ngành hàng, đơn vị tính, mã vạch).
* Cửa hàng ngừng kinh doanh một mặt hàng hoặc muốn kích hoạt mở bán lại.
* Purchasing Staff hoặc Store Manager cần tra cứu thông tin sản phẩm phục vụ công việc hàng ngày.

### 3.2. Preconditions (Điều kiện tiên quyết)
* Actor đã đăng nhập vào hệ thống với vai trò phù hợp:
  * `Store Manager`: Toàn quyền Thêm mới, Chỉnh sửa, Ngừng kinh doanh / Kích hoạt lại, và Xóa sản phẩm chưa có dữ liệu.
  * `Purchasing Staff`: Quyền Tra cứu và Xem chi tiết (Read-only).

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Hồ sơ SKU mới được lưu trữ trong cơ sở dữ liệu với trạng thái mặc định là `Active`, số lượng tồn kho khả dụng và hàng đang về khởi tạo bằng 0.
2. Các thông tin thay đổi của SKU được cập nhật tức thời và phản ánh đồng bộ trên toàn hệ thống.
3. Nếu SKU chuyển sang `Inactive`, nó lập tức được loại khỏi phạm vi tính toán mua hàng của DSS tại `UC-01` và các đợt nạp dữ liệu tại `UC-04`.

---

## 5. Luồng Sự Kiện Chính (Main Flow) - Thêm Mới Sản Phẩm Qua Form

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Truy cập màn hình Danh mục sản phẩm. |
| **2** | **Hệ thống** | Hiển thị danh sách sản phẩm hiện có:<br>- Mặc định chỉ hiển thị các SKU có trạng thái `Active` (Đang kinh doanh).<br>- Các cột thông tin: Mã SKU, Tên sản phẩm, Ngành hàng, Đơn vị tính, Mã vạch (nếu có), Trạng thái, Số lượng tồn khả dụng hiện tại (`Current Inventory`).<br>- Cung cấp thanh tìm kiếm (theo mã SKU, tên sản phẩm), bộ lọc theo Ngành hàng và bộ lọc Trạng thái (`Active`, `Inactive`, `Tất cả`). |
| **3** | **Actor** | Chọn chức năng **Thêm sản phẩm mới** (`Create Product`). |
| **4** | **Hệ thống** | Hiển thị Form tạo mới sản phẩm với các trường dữ liệu:<br>- `Mã SKU` (*Bắt buộc*): Ô nhập chuỗi ký tự.<br>- `Tên sản phẩm` (*Bắt buộc*): Ô nhập văn bản.<br>- `Ngành hàng` (*Bắt buộc*): Dropdown danh sách ngành hàng hiện có, tích hợp tính năng gõ để chọn hoặc thêm nhanh ngành hàng mới nếu chưa có.<br>- `Đơn vị tính` (*Bắt buộc*): Ô nhập hoặc chọn (Chai, Lon, Hộp, Gói, Kg...).<br>- `Mã vạch - Barcode` (*Tùy chọn*): Ô nhập chuỗi số tham chiếu.<br>- `Trạng thái`: Mặc định hiển thị là `Active` (Đang kinh doanh). |
| **5** | **Actor** | Nhập đầy đủ các thông tin bắt buộc và bấm **Lưu sản phẩm** (`Save`). |
| **6** | **Hệ thống** | Thực hiện xác thực dữ liệu (Validation):<br>a. Kiểm tra các trường bắt buộc không được để trống.<br>b. Kiểm tra định dạng mã SKU (chuỗi hợp lệ, không chứa dấu phẩy, không chứa ký tự xuống dòng).<br>c. Kiểm tra tính duy nhất toàn cục của `SKU Code` (không phân biệt hoa/thường).<br>d. *(Nếu có nhập Barcode)* Kiểm tra tính duy nhất của mã vạch so với các sản phẩm khác trong hệ thống. |
| **7** | **Hệ thống** | Lưu thông tin sản phẩm mới vào cơ sở dữ liệu với trạng thái `Active`, khởi tạo `Current Inventory = 0` và `On-order = 0`; hiển thị thông báo thành công và đưa người dùng về danh sách sản phẩm. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Chỉnh sửa thông tin sản phẩm (Edit Product)
* **Điều kiện:** Store Manager cần sửa tên sản phẩm, ngành hàng, đơn vị tính hoặc mã vạch của một SKU đã có.
* **Xử lý:**
  1. Tại màn hình danh sách, Actor bấm chọn thao tác **Chỉnh sửa** (`Edit`) trên dòng sản phẩm tương ứng.
  2. Hệ thống mở Form chỉnh sửa với các thông tin hiện tại của SKU:
     * Trường `Mã SKU` hiển thị ở chế độ **Khóa / Chỉ đọc (Read-only)**, tuyệt đối không cho phép sửa.
     * Các trường `Tên sản phẩm`, `Ngành hàng`, `Đơn vị tính`, `Mã vạch` cho phép chỉnh sửa.
  3. Actor điều chỉnh thông tin và bấm **Cập nhật**.
  4. Hệ thống kiểm tra hợp lệ dữ liệu (bao gồm kiểm tra trùng lặp Barcode nếu có thay đổi) và lưu các thông tin mới vào cơ sở dữ liệu.

### AF-2: Ngừng kinh doanh / Kích hoạt lại sản phẩm (Deactivate / Reactivate)
* **Điều kiện:** Cửa hàng dừng bán một mặt hàng hoặc muốn mở bán lại một mặt hàng đã từng ngừng kinh doanh.
* **Xử lý Ngừng kinh doanh (Deactivate):**
  1. Actor chọn thao tác **Ngừng kinh doanh** (`Deactivate`) trên một sản phẩm đang ở trạng thái `Active`.
  2. Hệ thống kiểm tra điều kiện ràng buộc: Kiểm tra lượng hàng đang về (`On-order`). Nếu `On-order > 0` (đang có đơn PO `Approved` chờ giao), hệ thống từ chối và cảnh báo (chuyển sang EF-4).
  3. Nếu `On-order = 0`, hệ thống hiển thị hộp thoại xác nhận:
     > *"Bạn có chắc chắn muốn chuyển sản phẩm sang trạng thái Ngừng kinh doanh? Mặt hàng này sẽ không được đưa vào gợi ý mua hàng DSS và không nhận dữ liệu nạp mới."*
  4. Actor xác nhận. Hệ thống cập nhật `Status = Inactive`.
* **Xử lý Kích hoạt lại (Reactivate):**
  1. Actor sử dụng bộ lọc Trạng thái trên bảng danh mục để tìm các sản phẩm `Inactive`.
  2. Bấm chọn **Kích hoạt lại** (`Reactivate`) trên dòng sản phẩm cần mở bán lại.
  3. Hệ thống chuyển trạng thái SKU thành `Active`, sẵn sàng đưa vào chu trình phân tích DSS và tiếp nhận dữ liệu bán hàng.

### AF-3: Xóa vĩnh viễn sản phẩm chưa phát sinh dữ liệu (Hard Delete)
* **Điều kiện:** Sản phẩm vừa được tạo mới do nhầm lẫn và **chưa từng phát sinh bất kỳ bản ghi liên kết nào** trong hệ thống (không có lịch sử bán hàng trong `UC-04`, không có số liệu tồn kho, chưa từng gán với nhà cung cấp nào ở `UC-06`, và không nằm trong bất kỳ đơn PO nào).
* **Xử lý:**
  1. Actor chọn thao tác **Xóa** (`Delete`) trên dòng sản phẩm.
  2. Hệ thống thực hiện kiểm tra toàn vẹn tham chiếu trong cơ sở dữ liệu: Xác nhận SKU này hoàn toàn trắng dữ liệu liên kết.
  3. Hệ thống hiển thị cảnh báo xác nhận xóa vĩnh viễn:
     > *"Hành động này sẽ xóa vĩnh viễn sản phẩm khỏi hệ thống và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?"*
  4. Actor xác nhận. Hệ thống xóa hoàn toàn bản ghi SKU khỏi cơ sở dữ liệu và thông báo kết quả thành công.

### AF-4: Tra cứu và xem danh mục (Purchasing Staff)
* **Điều kiện:** Nhân viên mua hàng cần tra cứu thông tin sản phẩm, kiểm tra đơn vị tính hoặc ngành hàng phục vụ đối chiếu mua hàng.
* **Xử lý:**
  1. Actor truy cập màn hình Danh mục sản phẩm (Purchasing Staff chỉ thấy các tính năng Tra cứu, Lọc, Xem chi tiết; các nút Thêm mới, Chỉnh sửa, Ngừng kinh doanh, Xóa bị ẩn hoàn toàn).
  2. Actor nhập từ khóa tìm kiếm theo Mã SKU hoặc Tên sản phẩm, hoặc lọc theo Ngành hàng.
  3. Hệ thống cập nhật bảng dữ liệu tương ứng theo thời gian thực.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Trùng lặp mã SKU (Duplicate SKU Code)
* **Điều kiện:** Tại Bước 6 của Main Flow, mã SKU vừa nhập đã tồn tại trong hệ thống (kể cả với sản phẩm đang ở trạng thái `Inactive`).
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo lỗi tại trường Mã SKU:
     > *"Mã SKU '[Mã]' đã tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc sử dụng mã khác."*
  2. Form giữ nguyên các dữ liệu đã nhập để Actor chỉnh sửa lại mã SKU.

### EF-2: Trùng lặp mã vạch (Duplicate Barcode)
* **Điều kiện:** Mã vạch nhập vào trùng với mã vạch của một sản phẩm khác đang có trong hệ thống.
* **Xử lý:**
  1. Hệ thống từ chối lưu và báo lỗi:
     > *"Mã vạch này đã được gán cho sản phẩm khác ([Mã SKU khác] - [Tên sản phẩm khác]). Vui lòng kiểm tra lại."*
  2. Form giữ nguyên dữ liệu để Actor kiểm tra lại mã vạch.

### EF-3: Từ chối xóa sản phẩm đã phát sinh dữ liệu (Referential Integrity Block)
* **Điều kiện:** Tại AF-3, Actor bấm Xóa một SKU nhưng hệ thống kiểm tra thấy SKU này đã có ít nhất một liên kết dữ liệu (lịch sử bán hàng, tồn kho, đơn PO, hoặc liên kết nhà cung cấp).
* **Xử lý:**
  1. Hệ thống từ chối lệnh xóa và hiển thị thông báo giải thích rõ ràng:
     > *"Không thể xóa sản phẩm này do đã phát sinh dữ liệu lịch sử liên kết trong hệ thống. Nếu cửa hàng không còn kinh doanh mặt hàng này, vui lòng sử dụng chức năng 'Ngừng kinh doanh' (Deactivate)."*
  2. Lệnh xóa bị hủy bỏ hoàn toàn, dữ liệu sản phẩm được giữ nguyên vẹn.

### EF-4: Từ chối ngừng kinh doanh khi đang có hàng chờ giao trên PO (On-Order Active Block)
* **Điều kiện:** Tại AF-2, Actor cố gắng chuyển SKU sang `Inactive` nhưng sản phẩm đang có số lượng hàng chờ về (`On-order > 0`) trong một đơn mua hàng đang ở trạng thái `Approved`.
* **Xử lý:**
  1. Hệ thống từ chối chuyển trạng thái và hiển thị thông báo:
     > *"Không thể ngừng kinh doanh sản phẩm này do đang có [Số lượng] đơn vị hàng đang chờ giao trên Đơn mua hàng (PO). Vui lòng hoàn tất nhận hàng (UC-03) hoặc hủy đơn mua hàng (UC-02) trước khi ngừng kinh doanh."*
  2. Trạng thái của SKU vẫn duy trì là `Active`.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-17 (SKU Code Immutability & Global Uniqueness Rule):**
  * Mỗi mặt hàng phải có một mã SKU duy nhất toàn hệ thống, không phân biệt chữ hoa chữ thường (ví dụ: `MILK-001` và `milk-001` được coi là trùng nhau).
  * Mã SKU chỉ được phép chứa các ký tự chữ cái, chữ số, dấu gạch nối (`-`) hoặc gạch dưới (`_`), không được chứa dấu phẩy (`,`) hoặc ký tự xuống dòng để tránh lỗi định dạng file CSV.
  * Mã SKU là định danh bất biến (Immutable): Sau khi đã tạo thành công, trường mã SKU bị khóa vĩnh viễn, không thể chỉnh sửa trong bất kỳ trường hợp nào.
* **BR-18 (Product Deactivation & Referential Integrity Protection Rule):**
  * **Chặn Hard Delete:** Tuyệt đối không xóa vật lý bản ghi SKU nếu đã tồn tại dữ liệu liên kết ở bất kỳ phân hệ nào (Sales History, Inventory, Purchase Orders, Supplier Conditions).
  * **Chặn Deactivate khi có On-order:** Không cho phép chuyển SKU sang `Inactive` khi `On-order > 0`.
  * **Quy tắc loại trừ Inactive khỏi DSS và Import:**
    * Khi một SKU ở trạng thái `Inactive`, thuật toán phân tích tại `UC-01` sẽ tự động bỏ qua mặt hàng này (không tính toán đề xuất mua và không hiển thị trên bảng gợi ý).
    * Quy trình tiền kiểm tra tại `UC-04` sẽ từ chối nạp toàn bộ tệp nếu phát hiện có dòng chứa mã SKU đang `Inactive`.
  * Toàn bộ dữ liệu lịch sử trong quá khứ của SKU Inactive được giữ nguyên vẹn để phục vụ báo cáo và kiểm toán.
* **BR-19 (Initial Inventory & Default State Rule):**
  * Mọi SKU tạo mới mặc định có `Status = Active`.
  * Các biến số tồn kho ban đầu được tự động khởi tạo: `Current Inventory = 0`, `On-order = 0`. Mọi thay đổi tồn kho sau đó đều phải xuất phát từ các giao dịch có nguồn gốc rõ ràng (nhập dữ liệu kiểm kê `UC-04` hoặc nhận hàng `UC-03`).
* **BR-20 (Category Classification & Rapid Entry Rule):**
  * Ngành hàng (`Category`) là trường phân loại bắt buộc của mỗi SKU, phục vụ việc gom nhóm và lọc dữ liệu trên các bảng phân tích DSS.
  * Giao diện cung cấp danh sách ngành hàng chuẩn hóa và hỗ trợ tạo nhanh ngành hàng mới ngay trên form nhập liệu để đảm bảo tính linh hoạt mà vẫn hạn chế phân mảnh dữ liệu.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Quan hệ với UC-01 (Review & Approve Recommendations):**
  * Cung cấp danh mục các mặt hàng `Active` để DSS tính toán dự báo, phân loại ABC-XYZ và đưa ra đề xuất mua hàng.
  * Tự động loại trừ các mặt hàng `Inactive` khỏi danh sách khuyến nghị mua.
* **Quan hệ với UC-04 (Import Operational Data):**
  * `UC-05` là điều kiện tiên quyết bắt buộc của `UC-04`. Toàn bộ mã SKU trong các tệp bán hàng và tồn kho phải tồn tại và đang ở trạng thái `Active` tại `UC-05` thì tệp mới được chấp thuận nạp vào hệ thống.
* **Quan hệ với UC-06 (Manage Suppliers & Supply Conditions):**
  * `UC-05` cung cấp danh mục SKU để Store Manager gán vào danh mục hàng hóa cung ứng của từng Nhà cung cấp tại `UC-06`, kèm theo đơn giá nhập, thời gian giao hàng cam kết và MOQ.
