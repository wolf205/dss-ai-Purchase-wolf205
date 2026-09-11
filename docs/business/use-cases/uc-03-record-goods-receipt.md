# UC-03: Ghi Nhận Nhận Hàng (Record Goods Receipt)

## 1. Thông Tin Chung

* **Mã Use Case:** `UC-03`
* **Tên Use Case:** Ghi nhận nhận hàng (*Record Goods Receipt*)
* **Actor chính:** `Purchasing Staff` (Nhân viên mua hàng).
* **Actor kế thừa:** `Store Manager` (Quản lý cửa hàng có toàn quyền thực hiện).
* **Phân loại:** Supporting (Closed-Loop Feedback).
* **Mục tiêu nghiệp vụ (Goal):** 
  * Cập nhật số lượng tồn kho thực tế (`Current Inventory`) ngay khi hàng hóa vật lý được đưa vào cửa hàng.
  * Thu thập dữ liệu giao hàng thực tế (ngày giao, số lượng giao) để đóng kín vòng lặp dữ liệu (`Closed-Loop Feedback`), giúp hệ thống DSS đánh giá chính xác và khách quan hiệu suất của Nhà cung cấp (`Supplier Performance`) cho các đợt phân tích mua hàng tiếp theo.

---

## 2. Nguyên Tắc & Ranh Giới Nghiệp Vụ

* **Simple Goods Receipt:** Chỉ tập trung vào số lượng thực nhận và ngày nhận để phục vụ DSS, không mở rộng thành hệ thống quản lý kho chuyên sâu (WMS).
* **Mỗi PO nhận hàng 1 lần duy nhất (No Partial Delivery):** Mỗi Đơn mua hàng (PO) chỉ cho phép thao tác nhận hàng một lần duy nhất. Nếu nhà cung cấp giao thiếu, PO vẫn được đóng (`Completed`), phần thiếu hụt được xem là không hoàn thành cam kết và sẽ làm giảm điểm hiệu suất của nhà cung cấp. Lượng hàng thiếu sẽ do DSS tự động nhận diện và tính toán đặt bù vào đợt phân tích tiếp theo.
* **Xử lý khi từ chối nhận toàn bộ lô hàng (100% Rejection & Re-delivery):**
  * Trường hợp hàng hóa bị lỗi, hư hỏng hoặc giao sai chủng loại hoàn toàn mà cửa hàng từ chối nhận 100%, Actor **không thực hiện bấm nhận hàng trên hệ thống**.
  * Đơn mua hàng tiếp tục được **giữ nguyên ở trạng thái `Approved`** để nhân viên liên hệ yêu cầu Nhà cung cấp giao lại hàng đạt chuẩn ngoài đời thực.
  * Mốc thời gian giao hàng dự kiến ban đầu (`Expected Delivery Date`) **không được thay đổi**. Khi nhà cung cấp giao lại, nếu thời điểm giao thực tế muộn hơn ngày dự kiến ban đầu thì vẫn bị tính là **Giao trễ hạn**.
  * Trường hợp Nhà cung cấp không thể giao lại, Actor sang `UC-02` để thực hiện Hủy đơn hàng (`Cancel PO`).
* **Không luồng trả hàng riêng (No Return Flow):** Hệ thống không thiết kế Use Case trả hàng. Nếu có một số sản phẩm bị lỗi khi bốc dỡ, nhân viên trả lại ngay tại thời điểm giao và chỉ ghi nhận **số lượng hàng nguyên vẹn được đưa lên kệ** vào ô "Số lượng thực nhận".

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
* Nhà cung cấp vận chuyển hàng hóa vật lý đến giao tại cửa hàng.

### 3.2. Preconditions (Điều kiện tiên quyết)
* Tồn tại ít nhất một Đơn mua hàng (`Purchase Order`) tương ứng đang ở trạng thái `Approved`.

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Tồn kho khả dụng (`Current Inventory`) của các SKU được cập nhật tăng ngay lập tức theo đúng số lượng thực tế nhận được.
2. Số lượng hàng đang chờ về (`On-order quantity`) của các SKU tương ứng được giải phóng/giảm trừ đúng bằng số lượng đã đặt ban đầu trên PO.
3. Đơn mua hàng (`Purchase Order`) kết thúc vòng đời, chuyển trạng thái sang `Completed`.
4. Bản ghi lịch sử giao hàng của Nhà cung cấp (Tỷ lệ giao đúng hạn - `On-time Rate`, Tỷ lệ giao đủ hàng - `Fulfillment Rate`, Ngày giao thực tế, Ghi chú) được lưu vết vào cơ sở dữ liệu để phục vụ đánh giá xếp hạng NCC tại `UC-01` và theo dõi hồ sơ tại `UC-06`.

---

## 5. Luồng Sự Kiện Chính (Main Flow)

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Tra cứu và chọn Đơn mua hàng (PO) khớp với phiếu giao hàng của nhà cung cấp (hoặc truy cập nhanh từ nút bấm tắt tại `UC-02`). |
| **2** | **Hệ thống** | Hiển thị giao diện Ghi nhận nhận hàng với thông tin đối chiếu:<br>- Thông tin chung: Mã PO, Tên Nhà cung cấp, Ngày duyệt PO, Ngày giao dự kiến ban đầu (`Expected Delivery Date`).<br>- Ngày nhận hàng thực tế: Mặc định hiển thị ngày hiện tại (cho phép Actor chọn lại ngày nếu nhập dữ liệu bổ sung sau đó).<br>- Danh sách mặt hàng: Mã SKU, Tên sản phẩm, Đơn vị tính, Số lượng đặt mua (`Ordered Qty`).<br>- Ô nhập liệu Số lượng thực nhận (`Received Qty`): Mặc định tự động điền sẵn bằng đúng Số lượng đặt mua ($Qty_{received} = Qty_{ordered}$) để tối ưu tốc độ thao tác cho nhân viên.<br>- Ô nhập Ghi chú nhận hàng (`Receipt Notes` - tùy chọn): Cho phép nhân viên nhập lý do nếu có sai lệch về số lượng hoặc chất lượng giao hàng. |
| **3** | **Actor** | Kiểm đếm hàng thực tế. Nếu số lượng thực nhận khớp với đơn đặt, Actor giữ nguyên. Nếu có chênh lệch (thiếu, dư, hàng hỏng trả lại), Actor chỉnh sửa lại ô Số lượng thực nhận của SKU tương ứng và nhập ghi chú ngắn (nếu cần). |
| **4** | **Actor** | Bấm xác nhận hoàn tất nhận hàng (`Confirm Goods Receipt`). |
| **5** | **Hệ thống** | Thực thi xử lý cập nhật tự động ngầm:<br>a. **Cập nhật tồn kho:** Tăng `Current Inventory` theo đúng số lượng thực nhận ($CurrentInventory + Qty_{received}$).<br>b. **Giải phóng hàng chờ về:** Giảm trừ `On-order quantity` theo số lượng đặt ban đầu ($OnOrder - Qty_{ordered}$).<br>c. **Đóng đơn hàng:** Chuyển trạng thái Đơn mua hàng sang `Completed`.<br>d. **Đánh giá hiệu suất NCC:** Tính toán tỷ lệ giao đủ hàng (`Fulfillment Rate`) và tỷ lệ giao đúng hạn (`On-time Rate`) của đơn hàng, lưu vào lịch sử giao dịch của Nhà cung cấp.<br>e. Lưu vết thời điểm nhận hàng, người thực hiện và nội dung ghi chú. |
| **6** | **Hệ thống** | Thông báo ghi nhận nhận hàng thành công và hiển thị tóm tắt kết quả (Tổng số lượng đã nhập kho, trạng thái đơn PO đã hoàn tất). |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Giao thiếu hàng (Under-delivery)
* **Điều kiện:** Tại Bước 3, Actor nhập Số lượng thực nhận nhỏ hơn Số lượng đặt trên PO ($Qty_{received} < Qty_{ordered}$) do nhà cung cấp không đủ hàng hoặc có hàng hỏng bị trả lại ngay lúc giao.
* **Xử lý:**
  1. Hệ thống tiếp nhận số lượng thực nhận và khuyến khích Actor nhập lý do vào ô Ghi chú.
  2. Tại Bước 5, Đơn mua hàng vẫn chuyển sang trạng thái `Completed`, hệ thống tuyệt đối không giữ trạng thái nợ hàng (`Partial`).
  3. Hệ thống ghi nhận Tỷ lệ giao đủ hàng của đơn này:
     $$Fulfillment Rate = \frac{Qty_{received}}{Qty_{ordered}} \times 100\% < 100\%$$
     làm giảm điểm uy tín giao hàng của Nhà cung cấp.
  4. Lượng hàng thiếu hụt ($Qty_{ordered} - Qty_{received}$) không bị treo ở `On-order` mà được giải phóng hoàn toàn. Ở đợt phân tích tiếp theo tại `UC-01`, hệ thống DSS sẽ tự động tính toán lại mức thiếu hụt tồn kho và đề xuất đặt bổ sung nếu cần thiết.

### AF-2: Giao dư hàng (Over-delivery)
* **Điều kiện:** Tại Bước 3, Actor nhập Số lượng thực nhận lớn hơn Số lượng đặt trên PO ($Qty_{received} > Qty_{ordered}$) do nhà cung cấp khuyến mãi tặng kèm, bù hao vỡ, hoặc quy cách đóng thùng.
* **Xử lý:**
  1. Khi Actor nhập số lớn hơn, hệ thống hiển thị **Cảnh báo (Soft Warning)**: *"Số lượng thực nhận đang lớn hơn số lượng đặt mua trên PO. Vui lòng xác nhận bạn không nhập nhầm số liệu."*
  2. Actor kiểm tra và xác nhận đây là số lượng giao dư thực tế; nhập ghi chú làm rõ (ví dụ: *"NCC tặng kèm 2 sản phẩm khuyến mãi"*).
  3. Tại Bước 5, hệ thống vẫn cộng toàn bộ số lượng thực tế nhận được vào `Current Inventory` để bảo đảm dữ liệu đầu vào cho DSS luôn chính xác nhất so với thực tế vật lý.
  4. Hệ thống ghi nhận Tỷ lệ giao đủ hàng của đơn này và khóa ở mức trần:
     $$Fulfillment Rate = 100\%$$
     *(Không cộng điểm thưởng vượt mức để tránh tạo động cơ thiên vị cho việc NCC ép giao thừa hàng).*

### AF-3: Giao hàng trễ hạn (Late-delivery)
* **Điều kiện:** Tại Bước 2, Ngày nhận thực tế vượt quá ngày giao cam kết ban đầu ($Ngày\_nhận > ExpectedDeliveryDate$).
* **Xử lý:**
  1. Quy trình nhận hàng vẫn tiến hành bình thường.
  2. Tại Bước 5, hệ thống tính toán khoảng thời gian giao trễ và ghi nhận Tỷ lệ giao đúng hạn (`On-time Rate`) $< 100\%$ làm giảm điểm uy tín thời gian của Nhà cung cấp.

### AF-4: Từ chối nhận toàn bộ lô hàng và yêu cầu giao lại (100% Rejection)
* **Điều kiện:** Tại Bước 3, toàn bộ hàng hóa bị hư hỏng, hết hạn, hoặc giao sai loại khiến cửa hàng từ chối nhận 100%.
* **Xử lý:**
  1. Actor **không thực hiện bấm xác nhận nhận hàng**.
  2. Actor thoát khỏi giao diện nhận hàng; Đơn mua hàng tiếp tục duy trì trạng thái `Approved`.
  3. Actor trao đổi với Nhà cung cấp ngoài hệ thống để hẹn đợt giao lại hàng đạt chuẩn.
  4. Khi đợt hàng giao lại tới, Actor mới truy cập `UC-03` để ghi nhận nhận hàng. Mốc so sánh tính thời gian giao hàng vẫn là `Expected Delivery Date` ban đầu của PO. Nếu đợt giao lại muộn hơn ngày này, hệ thống vẫn ghi nhận là giao trễ theo `AF-3`.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Không tìm thấy Đơn mua hàng hợp lệ
* **Điều kiện:** Nhà cung cấp vận chuyển hàng tới nhưng Actor tra cứu không thấy Đơn mua hàng nào ở trạng thái `Approved` khớp với thông tin giao hàng.
* **Xử lý:**
  1. Hệ thống hiển thị thông báo: *"Không tìm thấy đơn mua hàng ở trạng thái Đã duyệt (Approved) khớp với thông tin tra cứu"*.
  2. Actor không thể thực hiện thao tác nhận hàng trên hệ thống.
  3. Cửa hàng từ chối tiếp nhận hàng hóa hoặc tiến hành xác minh nội bộ ngoại tuyến.

### EF-2: Chặn xác nhận khi toàn bộ số lượng thực nhận bằng 0
* **Điều kiện:** Tại Bước 4, Actor chỉnh sửa toàn bộ số lượng thực nhận của tất cả các SKU về `0` và bấm "Xác nhận nhận hàng".
* **Xử lý:**
  1. Hệ thống chặn thao tác và hiển thị thông báo nghiệp vụ:
     > *"Bạn đang ghi nhận số lượng thực nhận bằng 0 cho toàn bộ đơn hàng. Nếu từ chối nhận hàng do hàng lỗi/giao sai, vui lòng không xác nhận nhận hàng mà giữ đơn ở trạng thái Chờ giao để Nhà cung cấp giao lại. Trường hợp Nhà cung cấp không thể giao lại hàng, vui lòng sang chức năng Quản lý đơn hàng (UC-02) để thực hiện Hủy đơn."*
  2. Hệ thống không thay đổi trạng thái đơn hàng và không cập nhật dữ liệu tồn kho.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-11 (Goods Receipt Execution & Pre-fill Rule):** 
  * Chỉ các Đơn mua hàng ở trạng thái `Approved` mới được phép thao tác nhận hàng.
  * Mỗi Đơn mua hàng chỉ được ghi nhận nhận hàng một lần duy nhất trong toàn bộ vòng đời.
  * Giao diện nhận hàng mặc định tự động điền sẵn số lượng thực nhận bằng số lượng đặt ($Qty_{received} = Qty_{ordered}$).
  * Hệ thống chặn xác nhận nhận hàng nếu toàn bộ số lượng thực nhận đều bằng 0.
* **BR-12 (Inventory & On-Order Synchronization on Receipt):** 
  * Khi nhận hàng thành công:
    $$CurrentInventory_{new} = CurrentInventory_{old} + Qty_{received}$$
  * Giải phóng lượng hàng chờ về tương ứng:
    $$OnOrder_{new} = OnOrder_{old} - Qty_{ordered}$$
    *(Lưu ý: Luôn trừ theo số lượng đặt ban đầu $Qty_{ordered}$ để bảo đảm không bị treo số liệu On-order khi nhà cung cấp giao thiếu).*
* **BR-13 (Supplier Performance Calculation on Receipt):**
  * Tỷ lệ giao đủ hàng cho từng mặt hàng trong đơn:
    $$Fulfillment Rate = \min\left(100\%, \frac{Qty_{received}}{Qty_{ordered}} \times 100\%\right)$$
  * Tỷ lệ giao đúng hạn (`On-time Rate`):
    * Được tính toán bằng cách đối chiếu Ngày nhận thực tế với Ngày giao dự kiến ban đầu ($ExpectedDeliveryDate = ApprovalDate + LeadTime$).
    * Nếu nhận hàng giao lại sau khi từng bị từ chối, mốc ngày dự kiến vẫn giữ nguyên ban đầu để đánh giá đúng tác động chậm trễ của NCC.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Mối quan hệ với UC-01 (Review & Approve Purchase Recommendations):**
  * `UC-03` cung cấp dữ liệu phản hồi thực tế (`Closed-Loop Feedback`) cho thuật toán DSS tại `UC-01`.
  * Khi `UC-03` hoàn tất, tồn kho thực tế (`Current Inventory`) tăng lên và `On-order` giảm về 0, giúp đợt phân tích mua hàng tiếp theo tại `UC-01` nhận diện chính xác vị thế tồn kho mới nhất để không tính trùng nhu cầu đặt hàng.
  * Các chỉ số hiệu suất (`On-time Rate`, `Fulfillment Rate`) được tính từ `UC-03` sẽ trực tiếp cập nhật vào thành phần điểm lịch sử giao hàng (`Historical Performance`) của Nhà cung cấp trong thuật toán xếp hạng NCC tại `UC-01`.
* **Mối quan hệ với UC-02 (Manage Purchase Orders):**
  * `UC-02` cung cấp nút tắt điều hướng (`Shortcut`) chuyển thẳng sang `UC-03` khi Actor đang xem chi tiết đơn hàng mà có hàng giao tới.
  * Khi `UC-03` hoàn tất, trạng thái PO chuyển từ `Approved` sang `Completed`, hiển thị đồng bộ sang danh sách theo dõi của `UC-02`.
  * Nếu hàng bị lỗi toàn bộ mà NCC không thể giao lại, Actor quay lại `UC-02` để thực hiện Hủy đơn hàng (`Cancel PO`).
* **Mối quan hệ với UC-06 (Manage Suppliers & Supply Conditions):**
  * Dữ liệu giao hàng thực tế (ngày giao, mức độ sai lệch số lượng, ghi chú) lưu lại từ `UC-03` sẽ được hiển thị trong mục lịch sử giao dịch và hồ sơ năng lực của Nhà cung cấp tại `UC-06`.
