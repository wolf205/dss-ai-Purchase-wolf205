# UC-02: Quản Lý Đơn Mua Hàng (Manage Purchase Orders)

## 1. Thông Tin Chung

* **Mã Use Case:** `UC-02`
* **Tên Use Case:** Quản lý đơn mua hàng (*Manage Purchase Orders*)
* **Actor chính:** `Purchasing Staff` (Nhân viên mua hàng).
* **Actor kế thừa:** `Store Manager` (Quản lý cửa hàng có toàn quyền thực hiện).
* **Phân loại:** Supporting.
* **Mục tiêu nghiệp vụ (Goal):**
  * Cung cấp trung tâm theo dõi và thực thi đơn hàng (*Order Execution & Tracking Hub*).
  * Giúp Actor theo dõi tiến độ, tình trạng thực hiện của toàn bộ các Đơn mua hàng (`Purchase Order - PO`) từ khi phê duyệt đến khi hoàn tất hoặc hủy bỏ.
  * Xuất bản/in ấn đơn mua hàng theo biểu mẫu chuẩn nghiệp vụ gửi Nhà cung cấp qua các kênh liên lạc bên ngoài (Email, Zalo, điện thoại...).
  * Cho phép Hủy đơn mua hàng khi Nhà cung cấp từ chối hoặc không thể giao, đảm bảo hệ thống tự động hoàn trả số lượng hàng đang về (`On-order quantity`) cho các đợt phân tích DSS tiếp theo.

---

## 2. Nguyên Tắc & Ranh Giới Nghiệp Vụ

* **100% PO bắt nguồn từ DSS:**
  * Toàn bộ Đơn mua hàng trong hệ thống đều phải bắt nguồn từ phương án mua đã được xem xét và phê duyệt tại `UC-01`.
  * Không hỗ trợ tính năng tạo đơn mua hàng thủ công "nhập chay" ngoài hệ thống nhằm bảo đảm tính nhất quán dữ liệu và tập trung vào mục tiêu đồ án DSS.
* **Tính bất biến của Đơn mua hàng (PO Immutability):**
  * Đơn mua hàng sau khi sinh ra từ `UC-01` là cố định. Hệ thống không cho phép sửa đổi số lượng hoặc thêm/bớt SKU trực tiếp trên PO tại `UC-02` nhằm bảo toàn căn cứ tính toán tối ưu của DSS.
  * Mọi sai lệch về số lượng giao thực tế so với đơn đặt sẽ được ghi nhận một cách tự nhiên tại bước Nhận hàng (`UC-03`).
* **Phân định rõ Ra Quyết Định vs Thực Thi Đơn Hàng:**
  * `UC-01` là nơi giải quyết bài toán ra quyết định (*Decision Support*).
  * `UC-02` thuần túy là nơi thực thi và giám sát tiến độ (*Execution & Tracking*), không lặp lại thao tác phê duyệt của con người.

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
Actor chủ động truy cập chức năng Quản lý đơn mua hàng khi:
* Ngay sau khi hoàn tất phê duyệt phương án mua tại `UC-01` để lấy file đơn hàng gửi cho đối tác.
* Định kỳ trong ngày để theo dõi tiến độ các đơn hàng đang chờ giao (`Approved`).
* Khi cần tra cứu lịch sử đơn mua hàng cũ (`Completed`, `Cancelled`).

### 3.2. Preconditions (Điều kiện tiên quyết)
* Đã tồn tại ít nhất một bản ghi `Purchase Order` trong hệ thống (được sinh ra tự động từ `UC-01`).

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Đơn mua hàng được phát hành chính thức (dưới dạng file in hoặc tệp PDF/Excel) để chuyển cho Nhà cung cấp.
2. Trạng thái và tiến độ của các đơn mua hàng được quản lý xuyên suốt, minh bạch.
3. Nếu đơn hàng bị hủy (`Cancelled`), lượng hàng đang trên đường về (`On-order quantity`) của các SKU tương ứng được hoàn trả tức thời, sẵn sàng để DSS tại `UC-01` tự động nhận diện lại nhu cầu thiếu hụt trong đợt phân tích tiếp theo.

---

## 5. Luồng Sự Kiện Chính (Main Flow)

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Truy cập màn hình Quản lý đơn mua hàng. |
| **2** | **Hệ thống** | Hiển thị danh sách tổng hợp các `Purchase Order`:<br>- Mã PO, Ngày tạo, Nhà cung cấp, Số lượng SKU, Tổng giá trị đơn hàng dự kiến, Ngày giao dự kiến, Trạng thái đơn.<br>- Mặc định sắp xếp các đơn hàng mới nhất lên đầu danh sách. |
| **3** | **Actor** | Tìm kiếm hoặc lọc danh sách theo: Mã PO, Nhà cung cấp, Trạng thái đơn hàng (`Approved`, `Completed`, `Cancelled`), hoặc Khoảng thời gian đặt hàng. |
| **4** | **Actor** | Chọn xem chi tiết một Đơn mua hàng cụ thể. |
| **5** | **Hệ thống** | Hiển thị toàn bộ thông tin chi tiết của PO được chọn:<br>- Thông tin Nhà cung cấp: Tên, Người liên hệ, Số điện thoại, Địa chỉ.<br>- Danh sách mặt hàng đặt mua: Mã SKU, Tên sản phẩm, Đơn vị tính, Số lượng đặt, Đơn giá nhập cam kết, Thành tiền.<br>- Tổng tiền đơn hàng, Ngày tạo, Ngày giao dự kiến (tính từ `Lead Time` cam kết của NCC). |
| **6** | **Actor** | Yêu cầu xuất file hoặc in đơn mua hàng (`Export / Print PO`). |
| **7** | **Hệ thống** | Tạo và xuất bản đơn mua hàng theo biểu mẫu chuẩn nghiệp vụ (PDF/Excel hoặc giao diện in sẵn sàng) để Actor tải về hoặc in ra gửi đối tác. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Hủy đơn mua hàng (Cancel PO)
* **Điều kiện:** Nhà cung cấp phản hồi đột xuất không thể giao hàng (hết hàng, ngừng sản xuất) hoặc cửa hàng phát sinh sự cố cần hủy đơn. Chức năng này chỉ khả dụng khi PO đang ở trạng thái `Approved` (chưa thực hiện nhận hàng).
* **Xử lý:**
  1. Actor chọn chức năng **Hủy đơn hàng** (`Cancel PO`) tại màn hình chi tiết đơn.
  2. Hệ thống hiển thị hộp thoại cảnh báo và yêu cầu xác nhận hành động hủy.
  3. Actor xác nhận hủy đơn.
  4. Hệ thống chuyển trạng thái của PO sang `Cancelled`.
  5. Hệ thống lập tức **giảm trừ số lượng `On-order quantity`** tương ứng của các SKU trong đơn.
  6. Ở lần chạy phân tích On-demand tiếp theo tại `UC-01`, hệ thống DSS tính toán lại vị thế tồn kho (`Inventory Position = Stock + On-order`) thấy thiếu hụt và sẽ tự động đưa các SKU này trở lại danh sách khuyến nghị mua hàng.

### AF-2: Lối tắt điều hướng sang Ghi nhận nhận hàng (Goods Receipt Shortcut)
* **Điều kiện:** Khi Nhà cung cấp giao hàng đến cửa hàng, Actor đang mở xem chi tiết đơn PO tại UC-02.
* **Xử lý:**
  1. Actor chọn nút tắt **Nhận hàng** (`Receive Goods`) trên giao diện chi tiết PO.
  2. Hệ thống tự động chuyển ngữ cảnh và dữ liệu của PO này sang `UC-03: Ghi nhận nhận hàng` để tiến hành quy trình kiểm đếm thực tế.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Không tìm thấy đơn hàng theo điều kiện tra cứu
* **Điều kiện:** Actor tìm kiếm mã PO hoặc áp dụng bộ lọc nhưng không có bản ghi nào khớp.
* **Xử lý:** Hệ thống hiển thị thông báo: *"Không tìm thấy đơn mua hàng phù hợp với điều kiện tìm kiếm"* và hiển thị tùy chọn đặt lại bộ lọc.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-05 (PO Status Lifecycle Rule):** Quy định vòng đời trạng thái của PO:
  * `Approved`: Đã được duyệt từ UC-01, đang chờ giao hàng.
  * `Completed`: Đã nhận hàng và đóng đơn thành công (chuyển trạng thái tại UC-03).
  * `Cancelled`: Đã bị hủy trước khi nhận hàng.
  * *Quy tắc:* Không thể chuyển từ `Completed` hoặc `Cancelled` quay ngược lại `Approved`.
* **BR-06 (On-Order Inventory Synchronization Rule):** Quy tắc đồng bộ lượng hàng đang về:
  * Khi PO sinh ra ở `UC-01`: Tăng `On-order`.
  * Khi PO chuyển sang `Completed` (`UC-03`): Giảm `On-order`, tăng tồn kho thực tế (`Current Inventory`).
  * Khi PO chuyển sang `Cancelled` (`UC-02`): Giảm `On-order`.
* **BR-07 (Expected Delivery Date Rule):** Ngày giao hàng dự kiến = `Ngày duyệt PO` + `Lead Time cam kết của Nhà cung cấp`.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Quan hệ với UC-01 (Review & Approve Recommendations):**
  * `UC-02` phụ thuộc hoàn toàn vào dữ liệu do `UC-01` tạo ra.
  * Việc hủy PO tại `UC-02` tác động ngược trở lại `UC-01` thông qua cơ chế tự động cân đối lại biến tồn kho đang về (`On-order`), giúp đợt chạy DSS tiếp theo tự động phát hiện lại nhu cầu bổ sung hàng.
* **Quan hệ với UC-03 (Record Goods Receipt):**
  * `UC-02` chỉ theo dõi trạng thái. Hành vi cập nhật số lượng thực tế nhận, tính toán sai lệch giao hàng và hoàn tất đơn hàng thuộc quyền sở hữu duy nhất của `UC-03`.
