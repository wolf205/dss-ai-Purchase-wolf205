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
* Người dùng đã đăng nhập hệ thống với quyền hạn hợp lệ (`Purchasing Staff` hoặc `Store Manager`).
*(Trường hợp hệ thống mới khởi tạo và chưa có đơn mua hàng nào sẽ được xử lý qua trạng thái rỗng tại Bước 2).*

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Đơn mua hàng được phát hành chính thức (dạng tài liệu điện tử hoặc bản in) để chuyển cho Nhà cung cấp, đồng thời hệ thống ghi nhận thời điểm xuất chứng từ gần nhất (`Last Exported At`).
2. Trạng thái và tiến độ của các đơn mua hàng được quản lý xuyên suốt, minh bạch (kèm cảnh báo trạng thái quá hạn giao theo `BR-09`).
3. Nếu đơn hàng bị hủy (`Cancelled`), lý do hủy đơn (`Cancellation Reason`) được lưu vết vào lịch sử theo `BR-10` và lượng hàng đang trên đường về (`On-order quantity`) của các SKU tương ứng được hoàn trả tức thời theo `BR-07`, sẵn sàng để DSS tại `UC-01` tự động nhận diện lại nhu cầu thiếu hụt trong đợt phân tích tiếp theo.

---

## 5. Luồng Sự Kiện Chính (Main Flow)

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Truy cập chức năng Quản lý đơn mua hàng. |
| **2** | **Hệ thống** | Kiểm tra và hiển thị danh sách đơn mua hàng:<br>- *Trường hợp đã có đơn hàng:* Hiển thị danh sách tổng hợp các `Purchase Order` (mặc định ưu tiên đơn mới nhất lên đầu): Mã PO, Ngày tạo, Nhà cung cấp, Số lượng SKU, Tổng giá trị đơn hàng dự kiến, Ngày giao dự kiến, Trạng thái đơn (tự động gắn cờ cảnh báo `Quá hạn giao - Overdue` theo `BR-09` nếu ngày hiện tại vượt quá Ngày giao dự kiến mà đơn vẫn ở trạng thái `Approved`), Thời điểm xuất chứng từ gần nhất (`Chưa xuất` hoặc `Đã xuất: [thời gian]`).<br>- *Trường hợp chưa có đơn hàng nào:* Hiển thị giao diện trạng thái rỗng (*Empty State*) thông báo hệ thống chưa phát sinh đơn mua hàng, kèm hướng dẫn và liên kết chuyển nhanh tới `UC-01` để phê duyệt đề xuất mua hàng. |
| **3** | **Actor** | Tìm kiếm hoặc lọc danh sách theo: Mã PO, Nhà cung cấp, Trạng thái đơn hàng (`Approved`, `Completed`, `Cancelled`), Tình trạng quá hạn (`Tất cả`, `Đang chờ giao`, `Quá hạn giao`), hoặc Khoảng thời gian đặt hàng. |
| **4** | **Actor** | Chọn xem chi tiết một Đơn mua hàng cụ thể. |
| **5** | **Hệ thống** | Hiển thị toàn bộ thông tin chi tiết của PO được chọn:<br>- Thông tin Nhà cung cấp: Tên, Người liên hệ, Số điện thoại, Địa chỉ (trường nào chưa có dữ liệu sẽ hiển thị `Chưa cập nhật`).<br>- Danh sách mặt hàng đặt mua: Mã SKU, Tên sản phẩm, Đơn vị tính, Số lượng đặt, Đơn giá nhập cam kết snapshot tại thời điểm duyệt (`BR-22`), Thành tiền.<br>- Tổng tiền đơn hàng, Ngày tạo, Ngày giao dự kiến cố định (`BR-08`), Thời điểm xuất chứng từ gần nhất. Nếu đơn đã bị hủy, hiển thị thêm Lý do hủy đơn (`BR-10`) và Thời điểm hủy.<br>- *Kiểm soát hành động theo trạng thái (`BR-06`):* Nếu PO đang ở trạng thái kết thúc (`Completed` hoặc `Cancelled`), hệ thống khóa toàn bộ các hành động Hủy đơn và Nhận hàng, chỉ cho phép tra cứu thông tin và xuất chứng từ lưu trữ. |
| **6** | **Actor** | Yêu cầu phát hành chứng từ đơn mua hàng (`Export / Print PO`). |
| **7** | **Hệ thống** | Phát hành chứng từ Đơn mua hàng theo biểu mẫu chuẩn nghiệp vụ (dạng tài liệu điện tử hoặc bản in) để Actor gửi đối tác; đồng thời tự động ghi nhận thời điểm xuất đơn gần nhất (`Last Exported At`) với mốc thời gian hiện tại. Trạng thái nghiệp vụ của đơn hàng vẫn duy trì là `Approved`. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Hủy đơn mua hàng (Cancel PO)
* **Điều kiện:** Nhà cung cấp phản hồi đột xuất không thể giao hàng (hết hàng, ngừng sản xuất) hoặc cửa hàng phát sinh sự cố cần hủy đơn. Chức năng này chỉ khả dụng khi PO đang ở trạng thái `Approved` (chưa thực hiện nhận hàng theo `BR-06`).
* **Xử lý:**
  1. Actor chọn chức năng **Hủy đơn hàng** (`Cancel PO`) tại giao diện chi tiết đơn.
  2. Hệ thống yêu cầu Actor xác nhận và chọn/nhập **Lý do hủy đơn** (`Cancellation Reason`) theo danh mục chuẩn `BR-10`:
     * *NCC báo hết hàng*
     * *NCC không liên lạc được*
     * *Cửa hàng thay đổi kế hoạch*
     * *Lỗi nhập sai số lượng*
     * *Khác (nhập văn bản)*
  3. Actor xác nhận lý do và chốt hủy đơn.
  4. Hệ thống chuyển trạng thái của PO sang `Cancelled` và lưu trữ lý do hủy vào hồ sơ đơn hàng để phục vụ tra cứu và đánh giá uy tín NCC (`BR-06`, `BR-10`).
  5. Hệ thống lập tức **giảm trừ số lượng `On-order quantity`** tương ứng của các SKU trong đơn theo `BR-07`.
  6. Ở lần chạy phân tích On-demand tiếp theo tại `UC-01`, hệ thống DSS tính toán lại vị thế tồn kho (`Inventory Position = Stock + On-order`) thấy thiếu hụt và sẽ tự động đưa các SKU này trở lại danh sách khuyến nghị mua hàng.

### AF-2: Lối tắt điều hướng sang Ghi nhận nhận hàng (Goods Receipt Shortcut)
* **Điều kiện:** Khi Nhà cung cấp giao hàng đến cửa hàng, Actor đang mở xem chi tiết đơn PO ở trạng thái `Approved` tại UC-02.
* **Xử lý:**
  1. Actor chọn thao tác chuyển nhanh sang **Nhận hàng** (`Receive Goods`) trên giao diện chi tiết PO.
  2. Hệ thống tự động chuyển ngữ cảnh và dữ liệu của PO này sang `UC-03: Ghi nhận nhận hàng` để tiến hành quy trình kiểm đếm thực tế.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Không tìm thấy đơn hàng theo điều kiện tra cứu
* **Điều kiện:** Actor tìm kiếm mã PO hoặc áp dụng bộ lọc nhưng không có đơn mua hàng nào khớp với điều kiện.
* **Xử lý:** Hệ thống thông báo không tìm thấy kết quả phù hợp và cung cấp tùy chọn đặt lại bộ lọc về mặc định.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-06 (PO Status Lifecycle Rule):** Quy định vòng đời trạng thái của PO (`Approved` $\rightarrow$ `Completed` hoặc `Cancelled`). Đơn đã ở trạng thái `Completed` hoặc `Cancelled` là bất biến, không thể khôi phục hay chỉnh sửa.
* **BR-07 (On-Order Inventory Synchronization Rule):** Quy tắc đồng bộ lượng hàng đang về: Tăng `On-order` khi duyệt đơn ở `UC-01`, giải phóng và giảm trừ `On-order` khi hủy đơn tại `UC-02` hoặc khi hoàn tất nhận hàng tại `UC-03`.
* **BR-08 (Expected Delivery Date Rule):** Ngày giao hàng dự kiến = `Ngày duyệt PO` + `Lead Time cam kết của Nhà cung cấp`, được lưu cố định vào PO và không bị reset.
* **BR-09 (PO Overdue Identification Rule):** Tự động gắn cờ cảnh báo quá hạn giao (`Overdue`) khi `Ngày hiện tại > Expected Delivery Date` và trạng thái PO vẫn là `Approved`.
* **BR-10 (PO Cancellation Reason Rule):** Bắt buộc chọn lý do từ danh mục chuẩn hóa (`NCC báo hết hàng`, `NCC không liên lạc được`, `Cửa hàng thay đổi kế hoạch`, `Lỗi nhập sai số lượng`, `Khác`) khi thực hiện hủy đơn.
* **BR-22 (Supply Condition Snapshot & Forward-Looking Pricing Rule):** Đơn mua hàng bảo lưu nguyên vẹn đơn giá nhập và các điều kiện cam kết tại thời điểm duyệt đơn, không bị ảnh hưởng bởi các thay đổi giá sau này tại `UC-06`.
* **BR-23 (Supply Discontinuation & Active PO Guard Rule):** Chặn ngừng cung ứng hoặc xóa liên kết đối tác đối với các SKU đang có đơn hàng ở trạng thái `Approved`.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Quan hệ với UC-01 (Review & Approve Recommendations):**
  * `UC-02` phụ thuộc hoàn toàn vào dữ liệu do `UC-01` tạo ra.
  * Việc hủy PO tại `UC-02` tác động ngược trở lại `UC-01` thông qua cơ chế tự động cân đối lại biến tồn kho đang về (`On-order`), giúp đợt chạy DSS tiếp theo tự động phát hiện lại nhu cầu bổ sung hàng.
* **Quan hệ với UC-03 (Record Goods Receipt):**
  * `UC-02` chỉ theo dõi trạng thái. Hành vi cập nhật số lượng thực tế nhận, tính toán sai lệch giao hàng và hoàn tất đơn hàng thuộc quyền sở hữu duy nhất của `UC-03`.
