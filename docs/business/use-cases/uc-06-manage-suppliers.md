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
  * Sau khi tạo thành công, mã NCC bị khóa cố định (không cho phép chỉnh sửa). Mọi đơn mua hàng (`PO`) và lịch sử giao hàng đều gắn liền với mã định danh này.
* **Tách biệt với Kế toán & Công nợ (Scope Separation):**
  * Hồ sơ NCC tại UC-06 thuần túy phục vụ cho việc mua hàng và đánh giá hiệu suất giao vận.
  * Hệ thống không quản lý công nợ chi tiết, hóa đơn thuế VAT, chiết khấu phức tạp, hay thanh toán online (thuộc Out-of-Scope).
* **Bảo lưu Snapshot giá trên Đơn hàng (PO Price Snapshot):**
  * Mọi thay đổi về Đơn giá nhập, Lead Time cam kết, hoặc MOQ tại UC-06 **chỉ có hiệu lực cho các lần chạy phân tích DSS tại `UC-01` trong tương lai**.
  * Toàn bộ các Đơn mua hàng (`Purchase Order`) cũ đã được phê duyệt (`Approved`, `Completed`) tại `UC-02` đều bảo lưu nguyên vẹn mức giá và điều kiện tại thời điểm duyệt đơn, tuyệt đối không bị thay đổi hồi tố.
* **Quy tắc Ngừng cung ứng SKU (Discontinuation Guard):**
  * **Chặn cứng:** Không cho phép ngừng cung ứng một SKU nếu đang có ít nhất một đơn PO ở trạng thái `Approved` của chính NCC này có chứa SKU đó (hàng đang trên đường về).
  * **Cảnh báo mềm:** Nếu NCC này là đối tác duy nhất hiện tại của một SKU, hệ thống sẽ cảnh báo về việc DSS sẽ không thể gợi ý mua hàng cho SKU đó cho đến khi có NCC mới thay thế.
* **Chính sách Vô hiệu hóa & Bảo vệ toàn vẹn tham chiếu (Soft Deactivation):**
  * Tuyệt đối cấm xóa vĩnh viễn (`Hard Delete`) nếu NCC đã từng phát sinh Đơn mua hàng (`PO`) hoặc đang có SKU liên kết.
  * Chặn không cho chuyển NCC sang trạng thái `Inactive` nếu đang có đơn PO `Approved` chờ giao.
  * Khi chuyển sang `Inactive`: Toàn bộ các SKU do NCC này cung ứng sẽ tự động bị loại trừ khỏi thuật toán xếp hạng tại `UC-01`. Dữ liệu lịch sử đơn hàng cũ vẫn được lưu vết đầy đủ.
  * Chỉ cho phép xóa vĩnh viễn nếu NCC vừa tạo mới và hoàn toàn chưa có liên kết dữ liệu nào.
* **Đo lường hiệu suất theo Cửa sổ trượt 5 đơn gần nhất (Rolling 5-Order Performance Window):**
  * Thuật toán DSS tại `UC-01` sử dụng Tỷ lệ đúng hạn (`On-time Rate`) và Tỷ lệ đủ hàng (`Fulfillment Rate`) được tính toán trên **tối đa 5 đơn hàng hoàn tất gần nhất** (`Completed POs`) của NCC.
  * Cơ chế này giúp DSS phản ánh nhạy bén "phong độ" giao hàng thực tế gần đây của đối tác, tránh hiện tượng quán tính lịch sử làm sai lệch khuyến nghị mua hàng.
  * Trên giao diện `UC-06`, hệ thống hiển thị song song cả 2 góc nhìn: **Chỉ số 5 đơn gần nhất** (dùng cho DSS) và **Chỉ số tích lũy toàn thời gian** (dùng cho đối soát quản trị).
* **Cơ chế đối tác mới ("Cold Start Supplier"):**
  * Đối tác mới chưa có lịch sử giao hàng được hệ thống gán mức điểm tín nhiệm ban đầu chuẩn là **80% (mức Khá)** cho tiêu chí Lịch sử giao hàng trong **3 đơn hàng đầu tiên** (`Completed POs`) để có cơ hội cạnh tranh công bằng về Giá, Lead Time và MOQ.
  * Giao diện gắn nhãn trực quan: `[NCC Mới - Điểm khởi tạo: 80%]` để người dùng nhận diện và đưa ra quyết định phù hợp.


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
  * `Store Manager`: Toàn quyền Thêm mới, Chỉnh sửa, Ngừng hợp tác, Gán SKU và sửa điều kiện cung ứng.
  * `Purchasing Staff`: Quyền Tra cứu và Xem chi tiết (Read-only).
* Để gán một mặt hàng cho NCC, mặt hàng đó phải đang ở trạng thái `Active` tại Danh mục sản phẩm (`UC-05`).

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Hồ sơ Nhà cung cấp mới được lưu trữ trong cơ sở dữ liệu với trạng thái mặc định là `Active`.
2. Danh mục SKU cung ứng kèm các điều kiện mua hàng (Giá, Lead Time, MOQ) được thiết lập hoặc cập nhật, sẵn sàng làm đầu vào cho thuật toán chấm điểm NCC tại `UC-01`.
3. Nếu NCC chuyển sang `Inactive`, toàn bộ các mặt hàng của NCC này sẽ không được DSS gợi ý chọn trong các đợt phân tích mua hàng tiếp theo.
4. Mọi lịch sử giao hàng thực tế và chỉ số hiệu suất tích lũy của NCC được hiển thị minh bạch, chính xác.

---

## 5. Luồng Sự Kiện Chính (Main Flow) - Tạo Mới Nhà Cung Cấp & Thiết Lập Điều Kiện Cung Ứng

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Truy cập màn hình Quản lý nhà cung cấp. |
| **2** | **Hệ thống** | Hiển thị danh sách các Nhà cung cấp hiện có:<br>- Mặc định chỉ hiển thị các NCC có trạng thái `Active` (Đang hợp tác).<br>- Các cột thông tin: Mã NCC, Tên NCC, Người liên hệ, Số điện thoại, Địa chỉ, Số lượng SKU cung ứng, Tỷ lệ đúng hạn, Tỷ lệ đủ hàng, Trạng thái.<br>- Cung cấp thanh tìm kiếm (theo mã, tên, SĐT) và bộ lọc Trạng thái (`Active`, `Inactive`, `Tất cả`). |
| **3** | **Actor** | Chọn chức năng **Thêm nhà cung cấp mới** (`Create Supplier`). |
| **4** | **Hệ thống** | Hiển thị Form tạo mới NCC với các trường thông tin:<br>- `Mã NCC` (*Bắt buộc*): Chuỗi ký tự định danh duy nhất (ví dụ: `SUP-001`).<br>- `Tên Nhà cung cấp` (*Bắt buộc*): Văn bản.<br>- `Người liên hệ` (*Bắt buộc*): Họ tên người đại diện/kinh doanh.<br>- `Số điện thoại` (*Bắt buộc*): Chuỗi số liên lạc.<br>- `Email` (*Tùy chọn*): Định dạng email hợp lệ.<br>- `Địa chỉ` (*Tùy chọn*): Văn bản mô tả địa chỉ kho/văn phòng đối tác.<br>- `Trạng thái`: Mặc định hiển thị `Active` (Đang hợp tác). |
| **5** | **Actor** | Điền các thông tin và bấm **Lưu thông tin** (`Save`). |
| **6** | **Hệ thống** | Xác thực dữ liệu (Validation):<br>a. Kiểm tra các trường bắt buộc không được để trống.<br>b. Kiểm tra tính duy nhất toàn cục của `Supplier Code` (không phân biệt hoa/thường).<br>c. Kiểm tra định dạng số điện thoại và email (nếu có). |
| **7** | **Hệ thống** | Lưu hồ sơ NCC mới vào cơ sở dữ liệu với trạng thái `Active`, gắn nhãn hiệu suất `[NCC Mới - Điểm khởi tạo: 80%]`; thông báo thành công và chuyển Actor đến **Màn hình Chi tiết Nhà cung cấp** để thiết lập danh mục SKU cung ứng. |
| **8** | **Actor** | Tại mục "Danh mục SKU cung ứng", chọn nút **Thêm SKU cung ứng** (`Assign SKU`). |
| **9** | **Hệ thống** | Hiển thị Form gán điều kiện cung ứng mặt hàng:<br>- `Chọn sản phẩm` (*Bắt buộc*): Dropdown tìm kiếm và chọn từ danh mục SKU `Active` (loại trừ các SKU đã gán cho chính NCC này).<br>- `Đơn giá nhập - Purchase Price` (*Bắt buộc*): Ô nhập số tiền (VNĐ), yêu cầu $> 0$.<br>- `Thời gian giao cam kết - Committed Lead Time` (*Bắt buộc*): Ô nhập số ngày, yêu cầu là số nguyên $\ge 1$.<br>- `Số lượng đặt tối thiểu - MOQ` (*Bắt buộc*): Ô nhập số lượng, yêu cầu là số nguyên $\ge 1$. |
| **10** | **Actor** | Nhập đầy đủ 3 thông số và bấm **Xác nhận thêm SKU**. |
| **11** | **Hệ thống** | Kiểm tra tính hợp lệ của các chỉ số và lưu bản ghi điều kiện cung ứng `(Supplier, SKU, Price, LeadTime, MOQ)`; cập nhật bảng danh sách mặt hàng cung ứng của NCC. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Chỉnh sửa thông tin hồ sơ Nhà cung cấp
* **Điều kiện:** Store Manager cần cập nhật số điện thoại, địa chỉ, email hoặc người liên hệ của đối tác.
* **Xử lý:**
  1. Tại màn hình danh sách, Actor bấm chọn **Chỉnh sửa** (`Edit`) trên dòng NCC tương ứng.
  2. Hệ thống hiển thị Form sửa thông tin:
     * Trường `Mã NCC` ở chế độ **Khóa / Chỉ đọc (Read-only)**, tuyệt đối không được sửa.
     * Các trường Tên, Người liên hệ, SĐT, Email, Địa chỉ cho phép sửa.
  3. Actor sửa thông tin và bấm **Lưu thay đổi**.
  4. Hệ thống kiểm tra hợp lệ và lưu cập nhật.

### AF-2: Cập nhật điều kiện cung ứng của một SKU (Sửa Giá / Lead Time / MOQ)
* **Điều kiện:** NCC thông báo điều chỉnh đơn giá nhập, thay đổi thời gian giao hàng cam kết hoặc thay đổi MOQ của một mặt hàng.
* **Xử lý:**
  1. Tại Màn hình Chi tiết NCC, trong bảng "Danh mục SKU cung ứng", Actor bấm nút **Sửa điều kiện** trên dòng SKU cần đổi.
  2. Hệ thống mở cửa sổ chỉnh sửa: Hiển thị Đơn giá nhập hiện tại, Lead Time hiện tại, MOQ hiện tại.
  3. Actor nhập số liệu mới và bấm **Cập nhật**.
  4. Hệ thống kiểm tra các giá trị mới ($> 0$, $\ge 1$), lưu điều kiện mới và ghi nhận thời điểm cập nhật.
  5. Mức giá và điều kiện mới này sẽ được áp dụng cho các lần chạy DSS tại `UC-01` tiếp theo.

### AF-3: Ngừng cung ứng một mặt hàng cụ thể (Stop Supplying SKU)
* **Điều kiện:** NCC không còn phân phối hoặc cửa hàng ngừng nhập một mặt hàng từ NCC này.
* **Xử lý:**
  1. Tại Màn hình Chi tiết NCC, Actor chọn thao tác **Ngừng cung ứng** (`Remove / Stop Supply`) trên dòng SKU tương ứng.
  2. Hệ thống kiểm tra **Điều kiện chặn (Hard Constraint):**
     * Quét các đơn PO đang ở trạng thái `Approved` của chính NCC này.
     * Nếu tồn tại PO chứa SKU này $\rightarrow$ Hệ thống từ chối và cảnh báo (chuyển sang EF-5).
  3. Nếu không có PO `Approved`, hệ thống kiểm tra **Cảnh báo mềm (Soft Warning):**
     * Kiểm tra xem NCC này có phải là đối tác duy nhất cung cấp SKU này không.
     * *Nếu là NCC duy nhất:* Hiển thị cảnh báo: *"Cảnh báo: Đây là nhà cung cấp duy nhất của mặt hàng [Tên SKU]. Nếu ngừng cung ứng, hệ thống DSS sẽ không thể gợi ý mua hàng cho mặt hàng này cho đến khi bạn gán nhà cung cấp mới. Bạn có chắc chắn muốn tiếp tục?"*
     * *Nếu có NCC khác cùng bán:* Hiển thị hộp thoại xác nhận thông thường.
  4. Actor bấm **Xác nhận ngừng cung ứng**.
  5. Hệ thống gỡ bỏ liên kết SKU khỏi danh mục cung ứng của NCC. Toàn bộ các đơn PO trong quá khứ có chứa SKU này vẫn bảo lưu dữ liệu snapshot nguyên vẹn.

### AF-4: Ngừng hợp tác / Tái kích hoạt Nhà cung cấp (Deactivate / Reactivate)
* **Điều kiện:** Cửa hàng tạm ngừng hoặc chấm dứt hợp tác với toàn bộ nhà cung cấp, hoặc mở lại hợp tác với đối tác cũ.
* **Xử lý Ngừng hợp tác (Deactivate):**
  1. Actor chọn thao tác **Ngừng hợp tác** (`Deactivate`) trên dòng NCC đang `Active`.
  2. Hệ thống kiểm tra điều kiện ràng buộc: Kiểm tra xem NCC này có đơn PO nào đang ở trạng thái `Approved` không. Nếu có, từ chối và cảnh báo (chuyển sang EF-4).
  3. Nếu không có đơn PO `Approved`, hệ thống hiển thị hộp thoại xác nhận:
     > *"Bạn có chắc chắn muốn chuyển nhà cung cấp sang trạng thái Ngừng hợp tác? Toàn bộ các mặt hàng do đối tác này cung cấp sẽ bị loại trừ khỏi gợi ý mua hàng của DSS."*
  4. Actor xác nhận. Hệ thống cập nhật `Status = Inactive`.
* **Xử lý Tái kích hoạt (Reactivate):**
  1. Actor lọc tìm các NCC `Inactive`, bấm chọn **Kích hoạt lại** (`Reactivate`).
  2. Hệ thống chuyển trạng thái NCC sang `Active`, các SKU cung ứng của đối tác lập tức được đưa trở lại thuật toán chấm điểm và xếp hạng tại `UC-01`.

### AF-5: Xóa vĩnh viễn Nhà cung cấp chưa phát sinh dữ liệu (Hard Delete)
* **Điều kiện:** NCC vừa tạo mới do nhầm lẫn và **chưa từng phát sinh bất kỳ bản ghi liên kết nào** (chưa từng có đơn PO nào kể cả Approved, Completed, Cancelled; và chưa từng gán SKU nào).
* **Xử lý:**
  1. Actor bấm nút **Xóa** (`Delete`) trên dòng NCC.
  2. Hệ thống kiểm tra toàn vẹn tham chiếu trong CSDL: Xác nhận NCC hoàn toàn trắng dữ liệu.
  3. Hệ thống hiển thị cảnh báo xác nhận xóa vĩnh viễn.
  4. Actor xác nhận. Hệ thống xóa bản ghi NCC khỏi cơ sở dữ liệu và thông báo thành công.

### AF-6: Tra cứu lịch sử & theo dõi hiệu suất giao hàng (Purchasing Staff / Store Manager)
* **Điều kiện:** Nhân viên mua hàng hoặc Quản lý cửa hàng cần xem uy tín, tiến độ giao hàng và các đơn hàng đã thực hiện của NCC.
* **Xử lý:**
  1. Actor vào Màn hình Chi tiết NCC và chuyển sang tab **Lịch sử & Hiệu suất giao hàng**.
  2. Hệ thống hiển thị bảng điều khiển chỉ số hiệu suất:
     * **Chỉ số phong độ 5 đơn gần nhất (dùng cho thuật toán DSS):**
       - Tỷ lệ giao đúng hạn 5 đơn gần nhất (`Recent 5-Order On-time Rate %`).
       - Tỷ lệ giao đủ hàng 5 đơn gần nhất (`Recent 5-Order Fulfillment Rate %`).
     * **Chỉ số tích lũy toàn thời gian (dùng cho quản trị & đối soát):**
       - Tổng số đơn mua hàng đã hoàn tất (`Total Completed Orders`).
       - Tỷ lệ đúng hạn tích lũy toàn thời gian (`All-time On-time Rate %`).
       - Tỷ lệ đủ hàng tích lũy toàn thời gian (`All-time Fulfillment Rate %`).
     * **Nhãn nhận diện trạng thái:** `[NCC Mới - Điểm khởi tạo: 80%]` nếu hoàn tất $< 3$ đơn; hoặc `[Đối tác tin cậy]` / `[Cảnh báo trễ hạn]` dựa trên phong độ 5 đơn gần nhất.
  3. Danh sách các đơn PO đã thực hiện gần nhất: Mã PO, Ngày đặt, Ngày hẹn giao, Ngày giao thực tế, Số lượng đặt, Số lượng thực nhận, Trạng thái đơn.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Trùng lặp mã Nhà cung cấp (Duplicate Supplier Code)
* **Điều kiện:** Tại Bước 6 của Main Flow, mã NCC vừa nhập đã tồn tại trong hệ thống (kể cả với NCC đang Inactive).
* **Xử lý:**
  1. Hệ thống từ chối lưu và hiển thị thông báo lỗi tại trường Mã NCC:
     > *"Mã nhà cung cấp '[Mã]' đã tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc sử dụng mã khác."*
  2. Form giữ nguyên các dữ liệu đã nhập để Actor sửa lại mã NCC.

### EF-2: Trùng lặp SKU khi gán cho cùng một Nhà cung cấp
* **Điều kiện:** Tại Bước 10 của Main Flow, Actor cố gắng gán một SKU đã tồn tại trong danh mục cung ứng của chính NCC đó.
* **Xử lý:**
  1. Hệ thống từ chối và báo lỗi: *"Mặt hàng này đã có trong danh mục cung ứng của nhà cung cấp. Vui lòng sử dụng tính năng 'Sửa điều kiện' nếu muốn thay đổi giá hoặc Lead Time."*
  2. Không tạo bản ghi trùng lặp.

### EF-3: Từ chối xóa Nhà cung cấp đã phát sinh dữ liệu (Referential Integrity Block)
* **Điều kiện:** Tại AF-5, Actor bấm Xóa NCC nhưng hệ thống phát hiện NCC đã có ít nhất một đơn PO trong lịch sử hoặc đang có danh mục SKU liên kết.
* **Xử lý:**
  1. Hệ thống từ chối lệnh xóa và thông báo giải thích:
     > *"Không thể xóa nhà cung cấp này do đã phát sinh dữ liệu đơn hàng hoặc danh mục hàng hóa liên kết trong hệ thống. Nếu không còn hợp tác, vui lòng sử dụng chức năng 'Ngừng hợp tác' (Deactivate)."*
  2. Lệnh xóa bị hủy bỏ hoàn toàn.

### EF-4: Từ chối ngừng hợp tác khi đang có đơn hàng chờ giao (Active PO Block)
* **Điều kiện:** Tại AF-4, Actor cố gắng chuyển NCC sang `Inactive` nhưng đối tác đang có ít nhất một đơn PO ở trạng thái `Approved` (chưa nhận hàng và chưa hủy).
* **Xử lý:**
  1. Hệ thống từ chối chuyển trạng thái và thông báo:
     > *"Không thể ngừng hợp tác với nhà cung cấp này do đang có [Số lượng] Đơn mua hàng (PO) ở trạng thái 'Approved' đang chờ giao hàng. Vui lòng hoàn tất nhận hàng (UC-03) hoặc hủy đơn mua hàng (UC-02) trước khi ngừng hợp tác."*
  2. Trạng thái của NCC vẫn duy trì là `Active`.

### EF-5: Từ chối ngừng cung ứng SKU khi đang có hàng chờ giao (On-Order SKU Block)
* **Điều kiện:** Tại AF-3, Actor bấm ngừng cung ứng một SKU nhưng SKU đó đang nằm trong một đơn PO trạng thái `Approved` của chính NCC này.
* **Xử lý:**
  1. Hệ thống từ chối và thông báo:
     > *"Không thể ngừng cung ứng sản phẩm [Tên SKU] do đang có hàng chờ giao trong Đơn mua hàng [Mã PO]. Vui lòng hoàn tất nhận hàng hoặc hủy đơn hàng trước khi ngừng cung ứng mặt hàng này."*
  2. Liên kết SKU của NCC được giữ nguyên.

### EF-6: Dữ liệu điều kiện cung ứng không hợp lệ
* **Điều kiện:** Khi thêm hoặc sửa điều kiện cung ứng tại Bước 10 (Main Flow) hoặc AF-2, Actor nhập Đơn giá $\le 0$, Lead Time $< 1$, hoặc MOQ $< 1$.
* **Xử lý:**
  1. Hệ thống chỉ rõ trường vi phạm và báo lỗi:
     * *Đơn giá nhập phải là số dương lớn hơn 0.*
     * *Thời gian giao cam kết phải là số nguyên từ 1 ngày trở lên.*
     * *Số lượng đặt tối thiểu (MOQ) phải là số nguyên từ 1 trở lên.*
  2. Nút Lưu bị vô hiệu hóa cho đến khi số liệu hợp lệ.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-21 (Supplier Code Immutability & Profile Integrity Rule):**
  * Mỗi Nhà cung cấp phải có một mã định danh duy nhất toàn hệ thống, không phân biệt chữ hoa chữ thường (ví dụ: `SUP-001` và `sup-001` được coi là trùng nhau).
  * Mã NCC là định danh bất biến (Immutable): Sau khi đã tạo thành công, trường mã NCC bị khóa vĩnh viễn, không thể chỉnh sửa trong bất kỳ trường hợp nào.
* **BR-22 (Supply Condition Snapshot & Forward-Looking Pricing Rule):**
  * Mỗi liên kết giữa Nhà cung cấp và SKU được xác định bởi bộ 3 tham số: `Purchase Price` ($> 0$), `Committed Lead Time` ($\ge 1$ ngày), và `MOQ` ($\ge 1$).
  * Mọi thay đổi về giá nhập và điều kiện giao hàng chỉ có giá trị cho các đợt phân tích và sinh đơn mua hàng mới tại `UC-01`.
  * Các đơn PO đã sinh ra trong quá khứ được bảo lưu vĩnh viễn giá trị snapshot tại thời điểm phê duyệt.
* **BR-23 (Supply Discontinuation & Sole Supplier / Active PO Guard Rule):**
  * **Chặn cứng Active PO:** Cấm gỡ bỏ hoặc ngừng cung ứng một SKU của một NCC nếu đang có đơn PO `Approved` của chính NCC đó chứa SKU này.
  * **Cảnh báo mềm Sole Supplier:** Nếu NCC là đối tác duy nhất của một SKU, hệ thống bắt buộc phải hiển thị cảnh báo về nguy cơ gián đoạn nguồn cung tại DSS trước khi cho phép người dùng xác nhận ngừng cung ứng.
* **BR-24 (Supplier Deactivation, Rolling 5-Order Window & Cold Start Rule):**
  * **Chặn Deactivate khi có PO Approved:** Cấm chuyển NCC sang `Inactive` khi còn đơn hàng chưa hoàn tất nhận hàng hoặc chưa hủy.
  * **Loại trừ Inactive khỏi DSS:** Khi NCC ở trạng thái `Inactive`, thuật toán tại `UC-01` tự động bỏ qua toàn bộ các mặt hàng của đối tác này trong quá trình chấm điểm và xếp hạng.
  * **Cơ chế tính điểm Lịch sử giao hàng (Historical Performance Scoring):**
    * *Giai đoạn 1 - Khởi tạo đối tác mới (Cold Start, $< 3$ đơn completed):* Hệ thống tạm gán điểm tiêu chí Lịch sử bằng **80% (mức Khá)** trong công thức `BR-02` để đối tác mới có cơ hội cạnh tranh sòng phẳng. Giao diện hiển thị nhãn: `[NCC Mới - Điểm khởi tạo: 80%]`.
    * *Giai đoạn 2 - Chuyển tiếp ($3 \le \text{đơn} < 5$):* Điểm lịch sử được tính bằng trung bình cộng số liệu thực tế của toàn bộ các đơn hàng hiện có.
    * *Giai đoạn 3 - Cửa sổ trượt chuẩn ($\ge 5$ đơn completed):* Điểm lịch sử được tính toán dựa trên **đúng 5 đơn hàng hoàn tất gần nhất** (`Rolling 5-Order Window`) đối chiếu từ `UC-03`, giúp phản ánh nhạy bén phong độ hiện tại của đối tác và loại bỏ quán tính lịch sử sai lệch.


---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Quan hệ với UC-01 (Review & Approve Recommendations):**
  * `UC-06` cung cấp toàn bộ bảng giá nhập, Lead Time cam kết, MOQ và điểm hiệu suất của các NCC cho thuật toán `BR-02` tại `UC-01` để xếp hạng và tự động gợi ý nhà cung cấp tối ưu nhất cho từng SKU.
* **Quan hệ với UC-02 (Manage Purchase Orders):**
  * Thông tin liên hệ của NCC (Tên, Người liên hệ, SĐT, Địa chỉ) và snapshot giá từ `UC-06` được trích xuất để hiển thị trên đơn PO và in/xuất file gửi đối tác.
* **Quan hệ với UC-03 (Record Goods Receipt):**
  * `UC-03` là nguồn cung cấp dữ liệu thực tế duy nhất để cập nhật ngược trở lại các chỉ số hiệu suất giao hàng tích lũy (`On-time Rate`, `Fulfillment Rate`) hiển thị tại `UC-06`.
* **Quan hệ với UC-05 (Manage Products):**
  * `UC-06` phụ thuộc vào `UC-05`: Chỉ các mặt hàng đang `Active` trong danh mục SKU của `UC-05` mới được phép gán vào danh mục hàng hóa cung ứng của NCC.
* **Quan hệ với UC-07 (Configure DSS Parameters):**
  * `UC-07` thiết lập bộ trọng số đánh giá (Đơn giá, Lead Time, MOQ, Lịch sử), còn `UC-06` cung cấp dữ liệu thực tế của từng tiêu chí để nhân với các trọng số đó.
