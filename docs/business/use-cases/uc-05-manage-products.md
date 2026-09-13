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
  * Bảo vệ tính toàn vẹn dữ liệu chuỗi thời gian và lịch sử giao dịch thông qua cơ chế bất biến của mã SKU và chính sách ngừng kinh doanh an toàn thay cho việc xóa vĩnh viễn sản phẩm đã phát sinh hoạt động vận hành.

---

## 2. Nguyên Tắc & Ranh Giới Nghiệp Vụ

* **Tính bất biến của mã SKU (SKU Code Immutability):**
  * Mã SKU là định danh logic duy nhất trong toàn hệ thống.
  * Sau khi tạo thành công, mã SKU bị khóa cố định (không cho phép chỉnh sửa). Mọi tệp nạp ngoài (`UC-04`) và các bảng dữ liệu liên kết đều dùng mã này để đối chiếu theo `BR-17`.
* **Tách biệt với Điều kiện cung ứng của Nhà cung cấp (UC-06):**
  * Hồ sơ SKU tại `UC-05` thuần túy mô tả thuộc tính định danh và phân loại của mặt hàng (Tên sản phẩm, Ngành hàng, Đơn vị tính, Mã vạch).
  * Các thông tin thương mại như Giá nhập mua (`Purchase Price`), Thời gian giao hàng cam kết (`Committed Lead Time`), và Số lượng đặt tối thiểu (`MOQ`) thuộc về quan hệ giữa SKU và từng Nhà cung cấp tại `UC-06` (một SKU có thể có nhiều nhà cung cấp với các điều kiện khác nhau).
  * *Lưu ý nghiệp vụ:* Sau khi tạo mới SKU tại `UC-05`, mặt hàng cần được thiết lập Điều kiện cung ứng tại `UC-06` trước khi DSS có thể đưa vào chu trình đề xuất mua hàng tự động hoàn chỉnh tại `UC-01`.
* **Chính sách Ngừng kinh doanh bảo vệ dữ liệu liên kết (Deactivation over Permanent Deletion):**
  * Tuyệt đối không xóa vĩnh viễn nếu SKU đã phát sinh bất kỳ bản ghi liên kết nào trong hệ thống (lịch sử bán hàng, tồn kho kiểm kê, đơn mua PO, hoặc điều kiện cung ứng).
  * Khi cửa hàng dừng kinh doanh một mặt hàng, SKU được chuyển sang trạng thái `Inactive` theo `BR-18`.
  * SKU ở trạng thái `Inactive` sẽ bị loại trừ hoàn toàn khỏi chu trình gợi ý mua hàng của DSS (`UC-01`), nhưng vẫn được tiếp nhận bình thường trong các đợt nạp dữ liệu bán hàng và kiểm kê tại `UC-04` để phục vụ việc bán nốt hàng tồn dư và theo dõi tồn kho thực tế.
  * Chỉ cho phép xóa vĩnh viễn nếu SKU đó vừa tạo mới do nhầm lẫn và hoàn toàn chưa phát sinh bất kỳ dữ liệu liên kết nào trong hệ thống.
* **Ràng buộc khi chuyển Ngừng kinh doanh (Deactivation Guard):**
  * Hệ thống chặn không cho chuyển một SKU sang `Inactive` chừng nào SKU đó vẫn còn số lượng hàng đang trên đường về (`On-order > 0`) trong các đơn mua hàng đang chờ giao (`Approved PO`).
* **Khởi tạo Tồn kho mặc định bằng 0:**
  * Khi tạo mới một SKU, hệ thống tự động gán `Current Inventory = 0` và `On-order = 0` theo `BR-19`.
  * Tồn kho thực tế được cập nhật chính danh qua nạp tệp kiểm kê (`UC-04`) hoặc nhận hàng (`UC-03`), không cho phép nhập tùy tiện số tồn kho khi khai báo sản phẩm.
* **Phạm vi quản lý tinh gọn:**
  * Thao tác quản lý danh mục SKU được thực hiện trực tiếp trên hệ thống; tính năng nạp hàng loạt danh mục từ tệp tạm thời đưa ra ngoài phạm vi ban đầu để tập trung hoàn thiện bài toán cốt lõi của đồ án.

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
* Cửa hàng bắt đầu nhập kinh doanh một mặt hàng mới.
* Store Manager cần cập nhật thông tin sản phẩm (tên sản phẩm, ngành hàng, đơn vị tính, mã vạch).
* Cửa hàng ngừng kinh doanh một mặt hàng hoặc muốn kích hoạt mở bán lại.
* Purchasing Staff hoặc Store Manager cần tra cứu thông tin sản phẩm phục vụ công việc hàng ngày.

### 3.2. Preconditions (Điều kiện tiên quyết)
* Actor đã đăng nhập vào hệ thống với vai trò phù hợp:
  * `Store Manager`: Toàn quyền Thêm mới, Chỉnh sửa, Ngừng kinh doanh / Kích hoạt lại, và Xóa sản phẩm chưa có dữ liệu liên kết.
  * `Purchasing Staff`: Quyền Tra cứu và Xem chi tiết danh mục (Read-only).

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Hồ sơ SKU mới được hệ thống lưu trữ chính thức với trạng thái mặc định là `Active`, số lượng tồn kho khả dụng và hàng đang về khởi tạo bằng 0.
2. Các thông tin thay đổi của SKU được cập nhật tức thời và phản ánh đồng bộ trên toàn hệ thống.
3. Nếu SKU chuyển sang `Inactive`, nó lập tức được loại khỏi phạm vi tính toán gợi ý mua hàng của DSS tại `UC-01` (vẫn tiếp nhận dữ liệu bán hàng và kiểm kê tại `UC-04` để bán nốt số hàng tồn dư).

---

## 5. Luồng Sự Kiện Chính (Main Flow) - Thêm Mới Sản Phẩm

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Truy cập chức năng Quản lý danh mục sản phẩm. |
| **2** | **Hệ thống** | Hiển thị danh sách sản phẩm hiện có với các thông tin đối chiếu:<br>- Mặc định hiển thị các SKU có trạng thái `Active` (Đang kinh doanh).<br>- Các thông tin cơ bản: Mã SKU, Tên sản phẩm, Ngành hàng, Đơn vị tính, Mã vạch (nếu có), Trạng thái, Số lượng tồn khả dụng hiện tại (`Current Inventory`).<br>- Hỗ trợ tìm kiếm theo mã SKU, tên sản phẩm và lọc theo Ngành hàng, Trạng thái (`Active`, `Inactive`, `Tất cả`).<br>- *Trường hợp danh mục chưa có sản phẩm nào:* Hệ thống hiển thị thông báo trạng thái khởi đầu và hướng dẫn Actor thêm sản phẩm mới. |
| **3** | **Actor** | Chọn yêu cầu **Thêm sản phẩm mới** (`Create Product`). |
| **4** | **Hệ thống** | Yêu cầu cung cấp các thông tin hồ sơ sản phẩm:<br>- `Mã SKU` (*Bắt buộc*): Chuỗi ký tự định danh duy nhất toàn hệ thống.<br>- `Tên sản phẩm` (*Bắt buộc*): Tên gọi mô tả sản phẩm.<br>- `Ngành hàng` (*Bắt buộc*): Thuộc tính phân loại mặt hàng (chọn từ danh mục ngành hàng chuẩn hóa hoặc tạo nhanh ngành hàng mới nếu chưa có).<br>- `Đơn vị tính` (*Bắt buộc*): Đơn vị đo lường lưu kho và bán lẻ (Chai, Lon, Hộp, Gói, Kg...).<br>- `Mã vạch - Barcode` (*Tùy chọn*): Chuỗi số mã vạch chuẩn của nhà sản xuất.<br>- `Trạng thái`: Mặc định khởi tạo là `Active` (Đang kinh doanh). |
| **5** | **Actor** | Nhập các thông tin hồ sơ sản phẩm (có thể tạo nhanh ngành hàng mới nếu cần theo AF-5) và xác nhận **Lưu sản phẩm** (`Save`). |
| **6** | **Hệ thống** | Thực hiện xác thực tính hợp lệ của dữ liệu:<br>a. **Chuẩn hóa chuỗi & Kiểm tra tính đầy đủ:** Tự động cắt tỉa khoảng trắng đầu và cuối (trim whitespace) cho toàn bộ các trường ký tự. Xác nhận không có trường bắt buộc nào (`Mã SKU`, `Tên sản phẩm`, `Ngành hàng`, `Đơn vị tính`) bị để trống hoặc chỉ chứa khoảng trắng theo `EF-5`.<br>b. **Kiểm tra định dạng mã SKU:** Chỉ gồm chữ cái, chữ số, dấu gạch nối (`-`), gạch dưới (`_`), không chứa khoảng trắng, dấu phẩy hoặc ký tự đặc biệt theo `BR-17` và `EF-6`.<br>c. **Kiểm tra tính duy nhất toàn cục của Mã SKU:** Mã SKU chưa từng tồn tại trong hệ thống (không phân biệt hoa/thường) theo `BR-17` và `EF-1`.<br>d. **Kiểm tra tính duy nhất của Mã vạch (nếu có nhập):** Nếu Actor có nhập Mã vạch, xác nhận mã vạch này chưa được gán cho sản phẩm nào khác trong hệ thống theo `EF-2`. Nếu không nhập mã vạch (để trống), hệ thống bỏ qua bước kiểm tra này (cho phép nhiều sản phẩm cùng không có mã vạch). |
| **7** | **Hệ thống** | Lưu trữ hồ sơ sản phẩm mới với trạng thái `Active`, khởi tạo `Current Inventory = 0` và `On-order = 0` theo `BR-19`; hiển thị thông báo kết quả thành công và cập nhật danh sách hiển thị sản phẩm. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Chỉnh sửa thông tin sản phẩm (Edit Product)
* **Điều kiện:** Store Manager cần cập nhật tên sản phẩm, ngành hàng, đơn vị tính hoặc mã vạch của một SKU đã có.
* **Xử lý:**
  1. Tại danh sách sản phẩm, Actor chọn yêu cầu **Chỉnh sửa** (`Edit`) trên dòng sản phẩm tương ứng.
  2. Hệ thống hiển thị thông tin hiện tại của SKU:
     * Trường `Mã SKU` được bảo lưu cố định, không cho phép chỉnh sửa theo `BR-17`.
     * Các trường cho phép chỉnh sửa: `Tên sản phẩm`, `Ngành hàng`, `Đơn vị tính`, `Mã vạch`.
  3. Actor điều chỉnh thông tin:
     * Có thể thay đổi tên sản phẩm, ngành hàng, đơn vị tính.
     * Có thể cập nhật mã vạch mới hoặc **xóa trắng mã vạch hiện tại** để chuyển về trạng thái không sử dụng mã vạch.
  4. Actor xác nhận cập nhật.
  5. Hệ thống chuẩn hóa cắt tỉa khoảng trắng, kiểm tra hợp lệ dữ liệu (không để trống trường bắt buộc theo `EF-5`, kiểm tra trùng lặp Barcode mới nếu có nhập theo `EF-2`) và lưu trữ các thông tin cập nhật.

### AF-2: Ngừng kinh doanh / Kích hoạt lại sản phẩm (Deactivate / Reactivate)
* **Điều kiện:** Cửa hàng dừng nhập một mặt hàng hoặc muốn mở bán lại một mặt hàng đã từng ngừng kinh doanh.
* **Xử lý Ngừng kinh doanh (Deactivate):**
  1. Actor chọn yêu cầu **Ngừng kinh doanh** (`Deactivate`) trên một sản phẩm đang ở trạng thái `Active`.
  2. Hệ thống kiểm tra điều kiện ràng buộc: Kiểm tra lượng hàng đang về (`On-order`). Nếu `On-order > 0` (đang có đơn PO `Approved` chờ giao), hệ thống từ chối và cảnh báo theo `EF-4`.
  3. Nếu `On-order = 0`, hệ thống yêu cầu Actor xác nhận hành động ngừng kinh doanh:
     > *"Bạn có chắc chắn muốn chuyển sản phẩm sang trạng thái Ngừng kinh doanh? Mặt hàng này sẽ không được đưa vào gợi ý mua hàng DSS (vẫn tiếp nhận dữ liệu bán hàng và kiểm kê tại UC-04 để bán nốt số hàng tồn dư)."*
  4. Actor xác nhận. Hệ thống cập nhật `Status = Inactive` theo `BR-18`.
* **Xử lý Kích hoạt lại (Reactivate):**
  1. Actor tra cứu danh mục sản phẩm ở trạng thái `Inactive`.
  2. Actor chọn yêu cầu **Kích hoạt lại** (`Reactivate`) trên dòng sản phẩm cần mở bán lại.
  3. Hệ thống chuyển trạng thái SKU thành `Active`, sẵn sàng đưa vào chu trình phân tích mua hàng DSS tại `UC-01`.

### AF-3: Xóa sản phẩm chưa phát sinh dữ liệu liên kết (Delete Unlinked Product)
* **Điều kiện:** Sản phẩm vừa được tạo mới do nhầm lẫn và **chưa từng phát sinh bất kỳ liên kết dữ liệu nào** trong hệ thống (không có lịch sử bán hàng trong `UC-04`, không có số liệu tồn kho, chưa từng gán với nhà cung cấp nào ở `UC-06`, và không nằm trong bất kỳ đơn PO nào).
* **Xử lý:**
  1. Actor chọn yêu cầu **Xóa** (`Delete`) trên dòng sản phẩm.
  2. Hệ thống kiểm tra các ràng buộc dữ liệu liên kết: Xác nhận SKU này hoàn toàn chưa có bất kỳ giao dịch hoặc quan hệ dữ liệu nào trong toàn hệ thống.
  3. Nếu phát hiện đã có dữ liệu liên kết, hệ thống chuyển sang `EF-3` để từ chối xóa.
  4. Nếu hợp lệ, hệ thống yêu cầu Actor xác nhận xóa:
     > *"Hành động này sẽ xóa hoàn toàn sản phẩm khỏi danh mục hệ thống và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?"*
  5. Actor xác nhận. Hệ thống xóa hồ sơ sản phẩm và thông báo kết quả thành công.

### AF-4: Tra cứu và lọc danh mục (Search & Filter Products)
* **Điều kiện:** Store Manager hoặc Purchasing Staff cần tra cứu thông tin sản phẩm, kiểm tra đơn vị tính, ngành hàng phục vụ công việc.
* **Xử lý:**
  1. Actor nhập từ khóa tìm kiếm theo Mã SKU, Tên sản phẩm hoặc áp dụng bộ lọc theo Ngành hàng / Trạng thái (`Active`, `Inactive`, `Tất cả`).
  2. Hệ thống thực hiện tìm kiếm và hiển thị danh sách các sản phẩm thỏa mãn điều kiện.
  3. *Trường hợp không có sản phẩm nào khớp:* Hệ thống hiển thị thông báo phản hồi rõ ràng: *"Không tìm thấy sản phẩm nào khớp với điều kiện tìm kiếm."*
  4. *Phân quyền truy cập:* Purchasing Staff chỉ có quyền tra cứu và xem chi tiết (Read-only); các thao tác Thêm mới, Chỉnh sửa, Ngừng kinh doanh, Kích hoạt lại và Xóa chỉ khả dụng cho Store Manager.

### AF-5: Tạo nhanh ngành hàng mới khi khai báo sản phẩm (Rapid Category Entry)
* **Điều kiện:** Tại Bước 4 của Main Flow hoặc AF-1, ngành hàng của sản phẩm chưa có trong danh mục phân loại chuẩn.
* **Xử lý:**
  1. Actor chọn thao tác tạo nhanh ngành hàng mới.
  2. Hệ thống yêu cầu nhập tên ngành hàng mới.
  3. Actor nhập tên ngành hàng và xác nhận.
  4. Hệ thống kiểm tra: Cắt tỉa khoảng trắng, kiểm tra tên không được rỗng (nếu rỗng hoặc trùng lặp thì xử lý theo `EF-7`).
  5. Hệ thống ghi nhận ngành hàng mới vào danh mục phân loại chuẩn và tự động chọn ngành hàng này cho sản phẩm đang khai báo.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Trùng lặp mã SKU (Duplicate SKU Code)
* **Điều kiện:** Tại Bước 6 của Main Flow, mã SKU vừa nhập đã tồn tại trong hệ thống (kể cả với sản phẩm đang ở trạng thái `Inactive`).
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo lỗi tại trường Mã SKU:
     > *"Mã SKU '[Mã]' đã tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc sử dụng mã khác."*
  2. Hệ thống giữ nguyên các dữ liệu đã nhập để Actor chỉnh sửa lại mã SKU.

### EF-2: Trùng lặp mã vạch (Duplicate Barcode)
* **Điều kiện:** Tại Bước 6 của Main Flow hoặc AF-1, Mã vạch nhập vào (khác rỗng) trùng với mã vạch của một sản phẩm khác đang có trong hệ thống.
* **Xử lý:**
  1. Hệ thống từ chối lưu và thông báo lỗi:
     > *"Mã vạch này đã được gán cho sản phẩm khác ([Mã SKU khác] - [Tên sản phẩm khác]). Vui lòng kiểm tra lại."*
  2. Hệ thống giữ nguyên dữ liệu để Actor kiểm tra lại mã vạch.
  * *Lưu ý:* Nếu trường Mã vạch để trống (không nhập), ngoại lệ này không kích hoạt.

### EF-3: Từ chối xóa sản phẩm đã phát sinh dữ liệu liên kết (Linked Data Guard Block)
* **Điều kiện:** Tại AF-3, Actor yêu cầu Xóa một SKU nhưng hệ thống kiểm tra thấy SKU này đã có ít nhất một liên kết dữ liệu (lịch sử bán hàng, tồn kho kiểm kê, đơn PO, hoặc liên kết điều kiện cung ứng).
* **Xử lý:**
  1. Hệ thống từ chối lệnh xóa và hiển thị thông báo giải thích rõ ràng:
     > *"Không thể xóa sản phẩm này do đã phát sinh dữ liệu liên kết trong hệ thống. Nếu cửa hàng không còn kinh doanh mặt hàng này, vui lòng sử dụng chức năng 'Ngừng kinh doanh' (Deactivate)."*
  2. Lệnh xóa bị hủy bỏ hoàn toàn, hồ sơ sản phẩm được bảo toàn nguyên vẹn.

### EF-4: Từ chối ngừng kinh doanh khi đang có hàng chờ giao trên PO (On-Order Active Block)
* **Điều kiện:** Tại AF-2, Actor cố gắng chuyển SKU sang `Inactive` nhưng sản phẩm đang có số lượng hàng chờ về (`On-order > 0`) trong một đơn mua hàng đang ở trạng thái `Approved`.
* **Xử lý:**
  1. Hệ thống từ chối chuyển trạng thái và hiển thị thông báo:
     > *"Không thể ngừng kinh doanh sản phẩm này do đang có [Số lượng] đơn vị hàng đang chờ giao trên Đơn mua hàng (PO). Vui lòng hoàn tất nhận hàng (UC-03) hoặc hủy đơn mua hàng (UC-02) trước khi ngừng kinh doanh."*
  2. Trạng thái của SKU vẫn duy trì là `Active`.

### EF-5: Khuyết thiếu thông tin bắt buộc (Missing Mandatory Fields)
* **Điều kiện:** Tại Bước 6 của Main Flow hoặc Bước 5 của AF-1, sau khi đã tự động cắt tỉa khoảng trắng, Actor để trống một trong các trường bắt buộc: `Mã SKU`, `Tên sản phẩm`, `Ngành hàng`, hoặc `Đơn vị tính`.
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo:
     > *"Vui lòng điền đầy đủ các trường thông tin bắt buộc (Mã SKU, Tên sản phẩm, Ngành hàng, Đơn vị tính)."*
  2. Hệ thống chỉ rõ danh sách các trường thông tin bắt buộc còn bị bỏ trống để Actor bổ sung hoàn thiện.

### EF-6: Mã SKU không đúng định dạng quy định (Invalid SKU Code Format)
* **Điều kiện:** Tại Bước 6 của Main Flow, Actor nhập mã SKU chứa khoảng trắng, dấu phẩy, ký tự xuống dòng, hoặc các ký tự đặc biệt ngoài chữ cái, chữ số, dấu gạch nối (`-`) và dấu gạch dưới (`_`).
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo:
     > *"Mã SKU không hợp lệ. Mã SKU chỉ được phép chứa chữ cái, chữ số, dấu gạch ngang (-) hoặc gạch dưới (_), không được chứa khoảng trắng hoặc ký tự đặc biệt."*
  2. Hệ thống giữ nguyên thông tin để Actor sửa lại mã SKU theo đúng định dạng.

### EF-7: Khuyết thiếu hoặc trùng lặp tên ngành hàng mới (Invalid Rapid Category Name)
* **Điều kiện:** Tại AF-5, khi tạo nhanh ngành hàng mới, Actor để trống tên ngành hàng (hoặc chỉ nhập khoảng trắng), hoặc nhập tên ngành hàng đã tồn tại trong danh mục phân loại chuẩn.
* **Xử lý:**
  1. Hệ thống từ chối tạo và hiển thị thông báo:
     > *"Tên ngành hàng không được để trống hoặc trùng lặp với ngành hàng đã có. Vui lòng kiểm tra lại."*
  2. Hệ thống cho phép Actor nhập lại tên ngành hàng hợp lệ hoặc quay lại chọn từ danh mục ngành hàng có sẵn.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-17 (SKU Code Immutability & Global Uniqueness Rule):**
  * Mỗi mặt hàng phải có một mã SKU duy nhất toàn hệ thống, không phân biệt chữ hoa chữ thường (ví dụ: `MILK-001` và `milk-001` được coi là trùng nhau).
  * Mã SKU chỉ được phép chứa các ký tự chữ cái, chữ số, dấu gạch nối (`-`) hoặc gạch dưới (`_`), không được chứa dấu phẩy (`,`), khoảng trắng hoặc ký tự đặc biệt để đảm bảo tính toàn vẹn khi xử lý dữ liệu.
  * Mã SKU là định danh bất biến (Immutable): Sau khi đã tạo thành công, trường mã SKU bị khóa vĩnh viễn, không thể chỉnh sửa trong bất kỳ trường hợp nào.
* **BR-18 (Product Deactivation & Operational Data Continuity Rule):**
  * **Ngăn chặn xóa sản phẩm đã có liên kết:** Tuyệt đối không xóa hồ sơ SKU nếu đã tồn tại dữ liệu liên kết ở bất kỳ phân hệ nào (Lịch sử bán hàng, Tồn kho kiểm kê, Đơn mua hàng PO, Điều kiện cung ứng).
  * **Chặn Deactivate khi có On-order:** Không cho phép chuyển SKU sang `Inactive` khi vẫn còn hàng đang trên đường về (`On-order > 0`).
  * **Quy tắc đối với SKU Inactive:**
     * **Tại UC-01 (Lõi DSS):** SKU `Inactive` tự động bị **loại trừ 100%** khỏi chu trình gợi ý mua hàng (không phân tích nhu cầu, không tính ROP, không bao giờ sinh đề xuất mua mới).
     * **Tại UC-04 (Dữ liệu vận hành):** Vẫn **tiếp nhận bình thường** các bản ghi bán hàng và kiểm kê tồn kho của SKU `Inactive` để phục vụ theo dõi việc bán nốt số tồn dư và cập nhật chính xác lượng hàng thực tế trên kệ. Hệ thống chỉ từ chối nạp khi mã SKU hoàn toàn không tồn tại trong danh mục hệ thống.
  * Toàn bộ dữ liệu lịch sử trong quá khứ của SKU Inactive được giữ nguyên vẹn để phục vụ báo cáo và kiểm toán.
* **BR-19 (Initial Inventory & Default State Rule):**
  * Mọi SKU tạo mới mặc định có `Status = Active`.
  * Các biến số tồn kho ban đầu được tự động khởi tạo: `Current Inventory = 0`, `On-order = 0`. Mọi thay đổi tồn kho sau đó đều phải xuất phát từ các giao dịch có nguồn gốc rõ ràng (nhập dữ liệu kiểm kê `UC-04` hoặc nhận hàng `UC-03`).
* **BR-20 (Category Classification & Rapid Entry Rule):**
  * Ngành hàng (`Category`) là trường phân loại bắt buộc của mỗi SKU, phục vụ việc gom nhóm và lọc dữ liệu trên các bảng phân tích DSS.
  * Hệ thống cung cấp danh mục ngành hàng chuẩn hóa và hỗ trợ tạo nhanh ngành hàng mới ngay trong quá trình khai báo sản phẩm để đảm bảo tính linh hoạt mà vẫn hạn chế phân mảnh dữ liệu.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Quan hệ với UC-01 (Review & Approve Recommendations):**
  * Cung cấp danh mục các mặt hàng `Active` để DSS tính toán dự báo, phân loại ABC-XYZ và đưa ra đề xuất mua hàng.
  * Tự động loại trừ các mặt hàng `Inactive` khỏi danh sách khuyến nghị mua.
* **Quan hệ với UC-04 (Import Operational Data):**
  * `UC-05` là điều kiện tiên quyết bắt buộc của `UC-04`. Toàn bộ mã SKU trong các tệp bán hàng và tồn kho phải tồn tại trong danh mục hệ thống tại `UC-05` (chấp nhận cả SKU `Active` và SKU `Inactive` đang xả hàng).
* **Quan hệ với UC-06 (Manage Suppliers & Supply Conditions):**
  * `UC-05` cung cấp danh mục SKU để Store Manager gán vào danh mục hàng hóa cung ứng của từng Nhà cung cấp tại `UC-06`, kèm theo đơn giá nhập, thời gian giao hàng cam kết và MOQ.
  * SKU mới tạo tại `UC-05` cần hoàn tất cấu hình điều kiện cung ứng tại `UC-06` trước khi DSS có thể đề xuất tạo đơn mua hàng hợp lệ tại `UC-01`.
