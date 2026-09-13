# UC-06: Quản Lý Nhà Cung Cấp Và Điều Kiện Cung Ứng (Manage Suppliers & Supply Conditions)

## 1. Thông Tin Chung

* **Mã Use Case:** `UC-06`
* **Tên Use Case:** Quản lý nhà cung cấp và điều kiện cung ứng (*Manage Suppliers & Supply Conditions*)
* **Actor chính:** `Store Manager` (Quản lý cửa hàng).
* **Actor tra cứu (Read-only):** `Purchasing Staff` (Nhân viên mua hàng có quyền tra cứu thông tin liên hệ, bảng giá, thời gian giao hàng cam kết và theo dõi lịch sử hiệu suất đối tác).
* **Phân loại:** Foundation.
* **Mục tiêu nghiệp vụ (Goal):**
  * Thiết lập và quản trị hồ sơ chuẩn hóa cho toàn bộ các đối tác cung ứng hàng hóa (`Suppliers`) của cửa hàng.
  * Quản trị ma trận **Điều kiện cung ứng** chi tiết cho từng mặt hàng mà NCC đó cung cấp: **Đơn giá nhập (`Purchase Price`)**, **Thời gian giao hàng cam kết (`Committed Lead Time`)**, và **Số lượng đặt tối thiểu (`MOQ`)**.
  * Cung cấp trung tâm theo dõi **Lịch sử và Chỉ số hiệu suất giao hàng thực tế** tích lũy của từng NCC (tỷ lệ đúng hạn, tỷ lệ đủ hàng) được hệ thống tự động cập nhật từ các đợt nhận hàng tại `UC-03`.
  * Cung cấp nguồn dữ liệu đầu vào cốt lõi cho thuật toán chấm điểm và xếp hạng nhà cung cấp (`BR-02`) tại `UC-01`, giúp đưa ra khuyến nghị mua hàng khách quan và tối ưu.

---

## 2. Nguyên Tắc & Ranh Giới Nghiệp Vụ

* **Tính bất biến của mã Nhà cung cấp (Supplier Code Immutability):**
  * Mã NCC là định danh logic duy nhất toàn hệ thống.
  * Sau khi tạo thành công, mã NCC bị khóa cố định (không cho phép chỉnh sửa). Mọi đơn mua hàng (`PO`) và lịch sử giao hàng đều gắn liền với mã định danh này theo `BR-21`.
* **Tách biệt với Kế toán & Công nợ (Scope Separation):**
  * Hồ sơ NCC tại `UC-06` thuần túy phục vụ cho việc mua hàng và đánh giá hiệu suất giao vận.
  * Hệ thống không quản lý công nợ chi tiết, hóa đơn thuế VAT, chiết khấu phức tạp, hay thanh toán trực tuyến (thuộc Out-of-Scope).
* **Bảo lưu Snapshot giá trên Đơn hàng (PO Price Snapshot):**
  * Mọi thay đổi về Đơn giá nhập, Lead Time cam kết, hoặc MOQ tại `UC-06` **chỉ có hiệu lực cho các lần chạy phân tích DSS tại `UC-01` trong tương lai** theo `BR-22`.
  * Toàn bộ các Đơn mua hàng (`Purchase Order`) cũ đã được phê duyệt (`Approved`, `Completed`) tại `UC-02` đều bảo lưu nguyên vẹn mức giá và điều kiện tại thời điểm duyệt đơn, tuyệt đối không bị thay đổi hồi tố.
* **Quy tắc Ngừng cung ứng SKU (Discontinuation Guard):**
  * **Chặn cứng:** Không cho phép ngừng cung ứng một SKU nếu đang có ít nhất một đơn PO ở trạng thái `Approved` của chính NCC này có chứa SKU đó (hàng đang trên đường về) theo `BR-23`.
  * **Cảnh báo mềm:** Nếu NCC này là đối tác duy nhất hiện tại của một SKU, hệ thống bắt buộc phải cảnh báo về rủi ro DSS sẽ không thể gợi ý mua hàng cho SKU đó cho đến khi có NCC mới thay thế theo `BR-23`.
* **Chính sách Ngừng hợp tác bảo vệ dữ liệu liên kết (Deactivation over Permanent Deletion):**
  * Tuyệt đối không xóa vĩnh viễn nếu NCC đã từng phát sinh Đơn mua hàng (`PO`) hoặc đang có danh mục SKU liên kết.
  * Chặn không cho chuyển NCC sang trạng thái `Inactive` nếu đối tác đang có đơn PO `Approved` chờ giao hàng theo `BR-24`.
  * Khi chuyển sang `Inactive`: Toàn bộ các SKU do NCC này cung ứng sẽ tự động bị loại trừ khỏi thuật toán xếp hạng tại `UC-01`. Dữ liệu lịch sử đơn hàng cũ vẫn được bảo lưu nguyên vẹn để phục vụ theo dõi và đối soát.
  * Chỉ cho phép xóa vĩnh viễn nếu NCC vừa tạo mới do nhầm lẫn và hoàn toàn chưa có bất kỳ liên kết dữ liệu nào trong toàn hệ thống.
* **Đo lường hiệu suất theo Cửa sổ trượt 5 đơn gần nhất (Rolling 5-Order Performance Window):**
  * Thuật toán DSS tại `UC-01` sử dụng Tỷ lệ đúng hạn (`On-time Rate`) và Tỷ lệ đủ hàng (`Fulfillment Rate`) được tính toán trên **tối đa 5 đơn hàng hoàn tất gần nhất** (`Completed POs`) của NCC theo `BR-24`.
  * Cơ chế này giúp DSS phản ánh nhạy bén phong độ giao hàng thực tế gần đây của đối tác, tránh hiện tượng quán tính lịch sử làm sai lệch khuyến nghị mua hàng.
  * Hệ thống cung cấp song song cả 2 góc nhìn: **Chỉ số 5 đơn gần nhất** (phục vụ thuật toán DSS) và **Chỉ số tích lũy toàn thời gian** (phục vụ quản trị và đối soát).
* **Cơ chế đối tác mới ("Cold Start Supplier"):**
  * Đối tác mới chưa có lịch sử giao hàng được hệ thống gán mức điểm tín nhiệm ban đầu chuẩn là **80% (mức Khá)** cho tiêu chí Lịch sử giao hàng trong **3 đơn hàng đầu tiên** (`Completed POs`) theo `BR-24` để có cơ hội cạnh tranh công bằng về Giá, Lead Time và MOQ.
  * Hệ thống phân loại và gắn nhãn trạng thái: `[NCC Mới - Điểm khởi tạo: 80%]` để người dùng nhận diện và đưa ra quyết định phù hợp.

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
* Cửa hàng thiết lập quan hệ hợp tác với một Nhà cung cấp mới.
* Nhà cung cấp cập nhật chính sách giá nhập, thay đổi thời gian giao hàng cam kết hoặc thay đổi MOQ.
* Cửa hàng bổ sung hoặc ngừng nhập một số SKU từ một Nhà cung cấp cụ thể.
* Store Manager muốn ngừng hợp tác hoặc mở lại hợp tác với một đối tác.
* Purchasing Staff hoặc Store Manager cần tra cứu thông tin liên hệ, điều kiện cung ứng hoặc kiểm tra uy tín giao hàng của NCC.

### 3.2. Preconditions (Điều kiện tiên quyết)
* Actor đã đăng nhập vào hệ thống với vai trò phù hợp:
  * `Store Manager`: Toàn quyền Thêm mới, Chỉnh sửa, Ngừng hợp tác / Tái kích hoạt, Gán SKU, sửa điều kiện cung ứng và Xóa NCC chưa có dữ liệu liên kết.
  * `Purchasing Staff`: Quyền Tra cứu và Xem chi tiết (Read-only).
* Để gán một mặt hàng cho NCC, mặt hàng đó phải đang ở trạng thái `Active` tại Danh mục sản phẩm (`UC-05`).

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Hồ sơ Nhà cung cấp mới được hệ thống lưu trữ chính thức với trạng thái mặc định là `Active` kèm thời gian giao hàng cam kết tiêu chuẩn (`Committed Lead Time`).
2. Danh mục SKU cung ứng kèm các điều kiện mua hàng (Đơn giá, MOQ) được thiết lập hoặc cập nhật, sẵn sàng làm đầu vào cho thuật toán chấm điểm NCC tại `UC-01`.
3. Nếu NCC chuyển sang `Inactive`, toàn bộ các mặt hàng của NCC này sẽ không được DSS gợi ý chọn trong các đợt phân tích mua hàng tiếp theo.
4. Mọi lịch sử giao hàng thực tế và chỉ số hiệu suất tích lũy của NCC được phản ánh minh bạch, chính xác.

---

## 5. Luồng Sự Kiện Chính (Main Flow) - Tạo Mới Nhà Cung Cấp & Thiết Lập Điều Kiện Cung Ứng

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Truy cập chức năng Quản lý nhà cung cấp. |
| **2** | **Hệ thống** | Hiển thị danh sách các Nhà cung cấp hiện có với các thông tin đối chiếu:<br>- Mặc định hiển thị các NCC có trạng thái `Active` (Đang hợp tác).<br>- Các thông tin cơ bản: Mã NCC, Tên NCC, Người liên hệ, Số điện thoại, Thời gian giao cam kết (Lead Time), Địa chỉ, Số lượng SKU cung ứng, Tỷ lệ đúng hạn 5 đơn gần nhất, Tỷ lệ đủ hàng 5 đơn gần nhất, Trạng thái.<br>- Cung cấp công cụ tìm kiếm (theo mã, tên, SĐT) và bộ lọc Trạng thái (`Active`, `Inactive`, `Tất cả`).<br>- *Trường hợp chưa có NCC nào:* Hệ thống hiển thị thông báo trạng thái khởi tạo và hướng dẫn Actor tạo Nhà cung cấp đầu tiên. |
| **3** | **Actor** | Chọn yêu cầu **Thêm nhà cung cấp mới** (`Create Supplier`). |
| **4** | **Hệ thống** | Yêu cầu cung cấp các thông tin hồ sơ Nhà cung cấp:<br>- `Mã NCC` (*Bắt buộc*): Chuỗi ký tự định danh duy nhất (ví dụ: `SUP-001`).<br>- `Tên Nhà cung cấp` (*Bắt buộc*): Tên doanh nghiệp hoặc nhà phân phối.<br>- `Người liên hệ` (*Bắt buộc*): Họ tên người đại diện/kinh doanh trực tiếp.<br>- `Số điện thoại` (*Bắt buộc*): Chuỗi số liên lạc chính thức.<br>- `Thời gian giao cam kết - Committed Lead Time` (*Bắt buộc*): Thời gian giao hàng tiêu chuẩn tính theo ngày, yêu cầu là số nguyên $\ge 1$.<br>- `Email` (*Tùy chọn*): Địa chỉ thư điện tử giao dịch.<br>- `Địa chỉ` (*Tùy chọn*): Địa chỉ kho xuất hàng hoặc văn phòng đối tác.<br>- `Trạng thái`: Mặc định khởi tạo là `Active` (Đang hợp tác). |
| **5** | **Actor** | Nhập các thông tin hồ sơ Nhà cung cấp và xác nhận **Lưu thông tin** (`Save`). |
| **6** | **Hệ thống** | Thực hiện xác thực tính hợp lệ của dữ liệu:<br>a. **Chuẩn hóa chuỗi & Kiểm tra tính đầy đủ:** Tự động cắt tỉa khoảng trắng đầu và cuối (trim whitespace). Xác nhận toàn bộ các trường bắt buộc (`Mã NCC`, `Tên Nhà cung cấp`, `Người liên hệ`, `Số điện thoại`, `Thời gian giao cam kết`) không bị để trống hoặc chỉ chứa khoảng trắng theo `EF-7`.<br>b. **Kiểm tra định dạng mã NCC:** Chỉ gồm chữ cái, chữ số, dấu gạch nối (`-`), gạch dưới (`_`), không chứa khoảng trắng hoặc ký tự đặc biệt theo `BR-21` và `EF-8`.<br>c. **Kiểm tra tính duy nhất toàn cục của Mã NCC:** Mã NCC chưa từng tồn tại trong hệ thống (không phân biệt hoa/thường) theo `BR-21` và `EF-1`.<br>d. **Kiểm tra định dạng thông tin liên hệ & Lead Time:** Số điện thoại hợp lệ; `Thời gian giao cam kết` là số nguyên $\ge 1$; nếu có nhập Email thì phải đúng định dạng thư điện tử. |
| **7** | **Hệ thống** | Lưu trữ hồ sơ NCC mới với trạng thái `Active`, phân loại hiệu suất ban đầu `[NCC Mới - Điểm khởi tạo: 80%]`; hiển thị thông báo kết quả thành công và mở phần thiết lập danh mục SKU cung ứng cho NCC này. |
| **8** | **Actor** | Tại phân mục danh mục SKU cung ứng, chọn yêu cầu **Thêm SKU cung ứng** (`Assign SKU`). |
| **9** | **Hệ thống** | Yêu cầu thiết lập điều kiện cung ứng cho mặt hàng:<br>- `Chọn mặt hàng (SKU)` (*Bắt buộc*): Chọn từ danh sách các SKU đang `Active` trong hệ thống (loại trừ các SKU đã gán cho chính NCC này). *Nếu không còn SKU nào khả dụng, hệ thống thông báo tất cả mặt hàng đã được gán hoặc chưa có SKU Active tại UC-05.*<br>- `Đơn giá nhập - Purchase Price` (*Bắt buộc*): Giá tiền tính theo VNĐ, yêu cầu là số dương $> 0$.<br>- `Số lượng đặt tối thiểu - MOQ` (*Bắt buộc*): Số lượng đặt hàng nhỏ nhất cho một lần mua, yêu cầu là số nguyên $\ge 1$. |
| **10** | **Actor** | Chọn mặt hàng, nhập đầy đủ 2 tham số điều kiện cung ứng và xác nhận **Thêm SKU**. |
| **11** | **Hệ thống** | Kiểm tra tính đầy đủ và hợp lệ của các thông số theo `BR-22` (xử lý lỗi theo `EF-6` nếu vi phạm), ghi nhận liên kết điều kiện cung ứng `(Supplier, SKU, Price, MOQ)`; cập nhật danh sách mặt hàng cung ứng của NCC. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Chỉnh sửa thông tin hồ sơ Nhà cung cấp
* **Điều kiện:** Store Manager cần cập nhật tên đối tác, người liên hệ, số điện thoại, thời gian giao cam kết, email hoặc địa chỉ.
* **Xử lý:**
  1. Tại danh sách nhà cung cấp, Actor chọn yêu cầu **Chỉnh sửa** (`Edit`) trên dòng NCC tương ứng.
  2. Hệ thống hiển thị thông tin hiện tại của NCC:
     * Trường `Mã NCC` được bảo lưu cố định, không cho phép chỉnh sửa theo `BR-21`.
     * Các trường cho phép chỉnh sửa: `Tên Nhà cung cấp`, `Người liên hệ`, `Số điện thoại`, `Thời gian giao cam kết`, `Email`, `Địa chỉ`.
  3. Actor điều chỉnh thông tin:
     * Có thể thay đổi Tên NCC, Người liên hệ, SĐT, Thời gian giao cam kết (phải là số nguyên $\ge 1$, không được để trống).
     * Có thể cập nhật mới hoặc **xóa trắng Email / Địa chỉ** để chuyển về trạng thái không sử dụng (hành vi hợp lệ với trường tùy chọn).
  4. Actor xác nhận cập nhật.
  5. Hệ thống chuẩn hóa cắt tỉa khoảng trắng, kiểm tra hợp lệ dữ liệu (không để trống trường bắt buộc theo `EF-7`, kiểm tra định dạng email nếu có nhập) và lưu trữ các thông tin cập nhật.

### AF-2: Cập nhật điều kiện cung ứng của một SKU (Sửa Đơn giá / MOQ)
* **Điều kiện:** NCC thông báo điều chỉnh đơn giá nhập hoặc thay đổi MOQ của một mặt hàng đã gán.
* **Xử lý:**
  1. Tại thông tin chi tiết NCC, trong danh mục SKU cung ứng, Actor chọn yêu cầu **Sửa điều kiện** trên mặt hàng cần thay đổi.
  2. Hệ thống hiển thị các thông số hiện tại: Đơn giá nhập, MOQ.
  3. Actor nhập các số liệu mới và xác nhận cập nhật.
  4. Hệ thống kiểm tra các giá trị mới (không để trống, yêu cầu Đơn giá $> 0$, MOQ $\ge 1$ theo `EF-6`).
  5. Hệ thống lưu trữ điều kiện cung ứng mới và ghi nhận thời điểm cập nhật. Mức giá và điều kiện mới này áp dụng tiến về trước cho các lần chạy phân tích DSS tại `UC-01` tiếp theo; toàn bộ đơn PO cũ được bảo lưu snapshot giá theo `BR-22`.

### AF-3: Ngừng cung ứng một mặt hàng cụ thể (Stop Supplying SKU)
* **Điều kiện:** NCC không còn phân phối hoặc cửa hàng ngừng nhập một mặt hàng từ NCC này.
* **Xử lý:**
  1. Tại thông tin chi tiết NCC, Actor chọn yêu cầu **Ngừng cung ứng** (`Remove / Stop Supply`) trên dòng SKU tương ứng.
  2. Hệ thống kiểm tra **Điều kiện chặn (Hard Constraint):**
     * Kiểm tra các đơn PO đang ở trạng thái `Approved` của chính NCC này.
     * Nếu tồn tại đơn PO `Approved` có chứa SKU này $\rightarrow$ Hệ thống từ chối và cảnh báo theo `EF-5`.
  3. Nếu không có đơn PO `Approved`, hệ thống kiểm tra **Cảnh báo mềm (Soft Warning):**
     * Kiểm tra xem NCC này có phải là đối tác duy nhất cung ứng SKU này hay không.
     * *Nếu là NCC duy nhất:* Hệ thống hiển thị cảnh báo:
       > *"Cảnh báo: Đây là nhà cung cấp duy nhất của mặt hàng [Tên SKU]. Nếu ngừng cung ứng, hệ thống DSS sẽ không thể gợi ý mua hàng cho mặt hàng này cho đến khi bạn gán nhà cung cấp mới. Bạn có chắc chắn muốn tiếp tục?"*
     * *Nếu có NCC khác cùng cung cấp:* Hệ thống hiển thị yêu cầu xác nhận thông thường.
  4. Actor xác nhận ngừng cung ứng.
  5. Hệ thống gỡ bỏ liên kết SKU khỏi danh mục cung ứng của NCC theo `BR-23`. Toàn bộ các đơn PO trong quá khứ có chứa SKU này vẫn bảo lưu dữ liệu snapshot nguyên vẹn.

### AF-4: Ngừng hợp tác / Tái kích hoạt Nhà cung cấp (Deactivate / Reactivate)
* **Điều kiện:** Cửa hàng tạm ngừng hoặc chấm dứt hợp tác với toàn bộ nhà cung cấp, hoặc mở lại hợp tác với đối tác cũ.
* **Xử lý Ngừng hợp tác (Deactivate):**
  1. Actor chọn yêu cầu **Ngừng hợp tác** (`Deactivate`) trên một NCC đang `Active`.
  2. Hệ thống kiểm tra điều kiện ràng buộc: Kiểm tra xem NCC này có đơn PO nào đang ở trạng thái `Approved` hay không. Nếu có, từ chối và cảnh báo theo `EF-4`.
  3. Nếu không có đơn PO `Approved`, hệ thống yêu cầu Actor xác nhận hành động ngừng hợp tác:
     > *"Bạn có chắc chắn muốn chuyển nhà cung cấp sang trạng thái Ngừng hợp tác? Toàn bộ các mặt hàng do đối tác này cung cấp sẽ bị loại trừ khỏi gợi ý mua hàng của DSS."*
  4. Actor xác nhận. Hệ thống cập nhật `Status = Inactive` theo `BR-24`.
* **Xử lý Tái kích hoạt (Reactivate):**
  1. Actor lọc tìm các NCC ở trạng thái `Inactive`, chọn yêu cầu **Kích hoạt lại** (`Reactivate`).
  2. Hệ thống chuyển trạng thái NCC sang `Active`, các SKU cung ứng của đối tác lập tức được đưa trở lại thuật toán chấm điểm và xếp hạng tại `UC-01`.

### AF-5: Xóa Nhà cung cấp chưa phát sinh dữ liệu liên kết (Delete Unlinked Supplier)
* **Điều kiện:** NCC vừa tạo mới do nhầm lẫn và **chưa từng phát sinh bất kỳ dữ liệu liên kết nào** trong hệ thống (chưa từng có đơn PO nào kể cả Approved, Completed, Cancelled; và chưa từng gán bất kỳ SKU nào).
* **Xử lý:**
  1. Actor chọn yêu cầu **Xóa** (`Delete`) trên dòng NCC.
  2. Hệ thống kiểm tra các ràng buộc dữ liệu liên kết: Xác nhận NCC hoàn toàn chưa có đơn PO và chưa có SKU nào trong danh mục cung ứng.
  3. Nếu phát hiện đã có dữ liệu liên kết, hệ thống chuyển sang `EF-3` để từ chối xóa.
  4. Nếu hợp lệ, hệ thống yêu cầu Actor xác nhận xóa:
     > *"Hành động này sẽ xóa hoàn toàn nhà cung cấp khỏi danh mục hệ thống và không thể khôi phục. Bạn có chắc chắn muốn tiếp tục?"*
  5. Actor xác nhận. Hệ thống xóa hồ sơ NCC và thông báo kết quả thành công.

### AF-6: Tra cứu lịch sử & theo dõi hiệu suất giao hàng (Purchasing Staff / Store Manager)
* **Điều kiện:** Nhân viên mua hàng hoặc Quản lý cửa hàng cần xem uy tín, tiến độ giao hàng và các đơn hàng đã thực hiện của NCC.
* **Xử lý:**
  1. Actor truy cập thông tin chi tiết NCC và chọn xem phần **Lịch sử & Hiệu suất giao hàng**.
  2. Hệ thống hiển thị các chỉ số hiệu suất giao hàng thực tế:
     * **Chỉ số phong độ 5 đơn gần nhất (dùng cho thuật toán DSS):**
       - Tỷ lệ giao đúng hạn 5 đơn gần nhất (`Recent 5-Order On-time Rate %`).
       - Tỷ lệ giao đủ hàng 5 đơn gần nhất (`Recent 5-Order Fulfillment Rate %`).
     * **Chỉ số tích lũy toàn thời gian (dùng cho quản trị & đối soát):**
       - Tổng số đơn mua hàng đã hoàn tất (`Total Completed Orders`).
       - Tỷ lệ đúng hạn tích lũy toàn thời gian (`All-time On-time Rate %`).
       - Tỷ lệ đủ hàng tích lũy toàn thời gian (`All-time Fulfillment Rate %`).
     * **Phân loại trạng thái đối tác theo BR-24:**
       - Gắn nhãn `[NCC Mới - Điểm khởi tạo: 80%]` nếu đối tác hoàn tất $< 3$ đơn hàng.
       - Ghi nhận trạng thái phong độ thực tế nếu đối tác có $\ge 3$ đơn hàng.
  3. Danh sách các đơn PO đã thực hiện: Mã PO, Ngày đặt, Ngày hẹn giao, Ngày giao thực tế, Số lượng đặt, Số lượng thực nhận, Trạng thái đơn.
     * *Trường hợp chưa có đơn hàng nào:* Hệ thống hiển thị thông báo: *"Nhà cung cấp chưa phát sinh đơn mua hàng nào."*

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Trùng lặp mã Nhà cung cấp (Duplicate Supplier Code)
* **Điều kiện:** Tại Bước 6 của Main Flow, mã NCC vừa nhập đã tồn tại trong hệ thống (kể cả với NCC đang `Inactive`).
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo lỗi:
     > *"Mã nhà cung cấp '[Mã]' đã tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc sử dụng mã khác."*
  2. Hệ thống giữ nguyên các dữ liệu đã nhập để Actor sửa lại mã NCC.

### EF-2: Trùng lặp SKU khi gán cho cùng một Nhà cung cấp (Duplicate SKU Assignment)
* **Điều kiện:** Tại Bước 10 của Main Flow, Actor cố gắng gán một SKU đã tồn tại trong danh mục cung ứng của chính NCC đó.
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo:
     > *"Mặt hàng này đã có trong danh mục cung ứng của nhà cung cấp. Vui lòng sử dụng chức năng 'Sửa điều kiện' nếu muốn điều chỉnh đơn giá nhập hoặc MOQ."*
  2. Hệ thống không tạo bản ghi trùng lặp.

### EF-3: Từ chối xóa Nhà cung cấp đã phát sinh dữ liệu liên kết (Linked Data Guard Block)
* **Điều kiện:** Tại AF-5, Actor yêu cầu Xóa NCC nhưng hệ thống phát hiện NCC đã có ít nhất một đơn PO trong lịch sử hoặc đang có SKU liên kết trong danh mục cung ứng.
* **Xử lý:**
  1. Hệ thống từ chối lệnh xóa và hiển thị thông báo giải thích rõ ràng:
     > *"Không thể xóa nhà cung cấp này do đã phát sinh dữ liệu đơn hàng hoặc danh mục hàng hóa liên kết trong hệ thống. Nếu không còn hợp tác, vui lòng sử dụng chức năng 'Ngừng hợp tác' (Deactivate)."*
  2. Lệnh xóa bị hủy bỏ hoàn toàn, hồ sơ NCC được bảo toàn nguyên vẹn.

### EF-4: Từ chối ngừng hợp tác khi đang có đơn hàng chờ giao (Active PO Block)
* **Điều kiện:** Tại AF-4, Actor cố gắng chuyển NCC sang `Inactive` nhưng đối tác đang có ít nhất một đơn PO ở trạng thái `Approved` (chưa nhận hàng và chưa hủy).
* **Xử lý:**
  1. Hệ thống từ chối chuyển trạng thái và hiển thị thông báo:
     > *"Không thể ngừng hợp tác với nhà cung cấp này do đang có [Số lượng] Đơn mua hàng (PO) ở trạng thái 'Approved' đang chờ giao hàng. Vui lòng hoàn tất nhận hàng (UC-03) hoặc hủy đơn mua hàng (UC-02) trước khi ngừng hợp tác."*
  2. Trạng thái của NCC vẫn duy trì là `Active`.

### EF-5: Từ chối ngừng cung ứng SKU khi đang có hàng chờ giao (On-Order SKU Block)
* **Điều kiện:** Tại AF-3, Actor yêu cầu ngừng cung ứng một SKU nhưng SKU đó đang nằm trong một đơn PO trạng thái `Approved` của chính NCC này.
* **Xử lý:**
  1. Hệ thống từ chối và hiển thị thông báo:
     > *"Không thể ngừng cung ứng sản phẩm [Tên SKU] do đang có hàng chờ giao trong Đơn mua hàng [Mã PO]. Vui lòng hoàn tất nhận hàng (UC-03) hoặc hủy đơn mua hàng (UC-02) trước khi ngừng cung ứng mặt hàng này."*
  2. Liên kết SKU của NCC được giữ nguyên.

### EF-6: Dữ liệu điều kiện cung ứng không hợp lệ hoặc khuyết thiếu (Invalid / Missing Supply Conditions)
* **Điều kiện:** Khi thêm hoặc sửa điều kiện cung ứng tại Bước 10 (Main Flow) hoặc AF-2, Actor để trống thông tin, chưa chọn SKU, hoặc nhập các giá trị vi phạm ràng buộc toán học: Đơn giá $\le 0$ hoặc MOQ $< 1$.
* **Xử lý:**
  1. Hệ thống từ chối ghi nhận và chỉ rõ các trường thông tin vi phạm:
     * *Vui lòng chọn mặt hàng (SKU) cần gán.*
     * *Đơn giá nhập không được để trống và phải là số dương lớn hơn 0.*
     * *Số lượng đặt tối thiểu (MOQ) không được để trống và phải là số nguyên từ 1 trở lên.*
  2. Hệ thống giữ nguyên thông tin để Actor điều chỉnh lại các chỉ số cho hợp lệ.

### EF-7: Khuyết thiếu thông tin hồ sơ Nhà cung cấp bắt buộc (Missing Mandatory Supplier Fields)
* **Điều kiện:** Tại Bước 6 của Main Flow hoặc AF-1, sau khi đã tự động cắt tỉa khoảng trắng, Actor để trống một trong các trường bắt buộc: `Mã NCC`, `Tên Nhà cung cấp`, `Người liên hệ`, `Số điện thoại`, hoặc `Thời gian giao cam kết`.
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo:
     > *"Vui lòng điền đầy đủ các trường thông tin bắt buộc (Mã nhà cung cấp, Tên nhà cung cấp, Người liên hệ, Số điện thoại, Thời gian giao cam kết)."*
  2. Hệ thống chỉ rõ danh sách các trường thông tin còn bị bỏ trống để Actor bổ sung hoàn thiện.

### EF-8: Mã Nhà cung cấp không đúng định dạng quy định (Invalid Supplier Code Format)
* **Điều kiện:** Tại Bước 6 của Main Flow, Actor nhập mã NCC chứa khoảng trắng, dấu phẩy, ký tự xuống dòng, hoặc các ký tự đặc biệt ngoài chữ cái, chữ số, dấu gạch nối (`-`) và dấu gạch dưới (`_`).
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo:
     > *"Mã nhà cung cấp không hợp lệ. Mã NCC chỉ được phép chứa chữ cái, chữ số, dấu gạch ngang (-) hoặc gạch dưới (_), không được chứa khoảng trắng hoặc ký tự đặc biệt."*
  2. Hệ thống giữ nguyên thông tin để Actor chỉnh sửa lại mã NCC đúng định dạng theo `BR-21`.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-21 (Supplier Code Immutability & Profile Integrity Rule):**
  * Mỗi Nhà cung cấp phải có một mã định danh duy nhất toàn hệ thống, không phân biệt chữ hoa chữ thường (ví dụ: `SUP-001` và `sup-001` được coi là trùng nhau).
  * Mã NCC chỉ được phép chứa các ký tự chữ cái, chữ số, dấu gạch nối (`-`) hoặc gạch dưới (`_`), không được chứa dấu phẩy, khoảng trắng hoặc ký tự đặc biệt.
  * Mã NCC là định danh bất biến (Immutable): Sau khi đã tạo thành công, trường mã NCC bị khóa vĩnh viễn, không thể chỉnh sửa trong bất kỳ trường hợp nào.
* **BR-22 (Supply Condition Snapshot & Forward-Looking Pricing Rule):**
  * Mỗi liên kết giữa Nhà cung cấp và SKU được xác định bởi bộ 2 tham số: `Purchase Price` ($> 0$) và `MOQ` ($\ge 1$). Thời gian giao hàng cam kết `Committed Lead Time` ($\ge 1$ ngày) được quản lý tập trung ở cấp độ đối tác Nhà cung cấp và áp dụng chung cho mọi mặt hàng của đối tác đó.
  * Mọi thay đổi về giá nhập và điều kiện giao hàng chỉ có giá trị cho các đợt phân tích và sinh đơn mua hàng mới tại `UC-01` kể từ thời điểm cập nhật.
  * Các đơn PO đã sinh ra trong quá khứ được bảo lưu vĩnh viễn giá trị snapshot tại thời điểm phê duyệt.
* **BR-23 (Supply Discontinuation & Sole Supplier / Active PO Guard Rule):**
  * **Chặn cứng Active PO:** Cấm gỡ bỏ hoặc ngừng cung ứng một SKU của một NCC nếu đang có đơn PO `Approved` của chính NCC đó chứa SKU này.
  * **Cảnh báo mềm Sole Supplier:** Nếu NCC là đối tác duy nhất của một SKU, hệ thống bắt buộc phải hiển thị cảnh báo về nguy cơ gián đoạn nguồn cung tại DSS trước khi cho phép người dùng xác nhận ngừng cung ứng.
* **BR-24 (Supplier Cold Start, Rolling 5-Order Window & Deactivation Rule):**
  * **Chặn Deactivate khi có PO Approved:** Cấm chuyển NCC sang `Inactive` khi còn đơn hàng chưa hoàn tất nhận hàng hoặc chưa hủy.
  * **Loại trừ Inactive khỏi DSS:** Khi NCC ở trạng thái `Inactive`, thuật toán tại `UC-01` tự động bỏ qua toàn bộ các mặt hàng của đối tác này trong quá trình chấm điểm và xếp hạng.
  * **Cơ chế tính điểm Lịch sử giao hàng (Historical Performance Scoring):**
    * *Giai đoạn 1 - Khởi tạo đối tác mới (Cold Start, $< 3$ đơn completed):* Hệ thống tạm gán điểm tiêu chí Lịch sử bằng **80% (mức Khá)** trong công thức `BR-02` để đối tác mới có cơ hội cạnh tranh sòng phẳng. Gắn nhãn trạng thái: `[NCC Mới - Điểm khởi tạo: 80%]`.
    * *Giai đoạn 2 - Chuyển tiếp ($3 \le \text{đơn} < 5$):* Điểm lịch sử được tính bằng trung bình cộng số liệu thực tế của toàn bộ các đơn hàng hiện có.
    * *Giai đoạn 3 - Cửa sổ trượt chuẩn ($\ge 5$ đơn completed):* Điểm lịch sử được tính toán dựa trên **đúng 5 đơn hàng hoàn tất gần nhất** (`Rolling 5-Order Window`) đối chiếu từ `UC-03`, giúp phản ánh nhạy bén phong độ hiện tại của đối tác và loại bỏ quán tính lịch sử sai lệch.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Quan hệ với UC-01 (Review & Approve Recommendations):**
  * `UC-06` cung cấp toàn bộ bảng giá nhập, Lead Time cam kết, MOQ và điểm hiệu suất của các NCC cho thuật toán `BR-02` tại `UC-01` để xếp hạng và tự động gợi ý nhà cung cấp tối ưu nhất cho từng SKU.
* **Quan hệ với UC-02 (Manage Purchase Orders):**
  * Thông tin liên hệ của NCC (Tên, Người liên hệ, SĐT, Địa chỉ) và snapshot giá từ `UC-06` được trích xuất để hiển thị trên đơn PO và in/xuất chứng từ gửi đối tác.
* **Quan hệ với UC-03 (Record Goods Receipt):**
  * `UC-03` là nguồn cung cấp dữ liệu thực tế duy nhất để cập nhật ngược trở lại các chỉ số hiệu suất giao hàng tích lũy (`On-time Rate`, `Fulfillment Rate`) hiển thị tại `UC-06`.
* **Quan hệ với UC-05 (Manage Products):**
  * `UC-06` phụ thuộc vào `UC-05`: Chỉ các mặt hàng đang `Active` trong danh mục SKU của `UC-05` mới được phép gán vào danh mục hàng hóa cung ứng của NCC.
* **Quan hệ với UC-07 (Configure DSS Parameters):**
  * `UC-07` thiết lập bộ trọng số đánh giá (Đơn giá, Lead Time, MOQ, Lịch sử theo `BR-25`), còn `UC-06` cung cấp dữ liệu thực tế của từng tiêu chí để nhân với các trọng số đó.
