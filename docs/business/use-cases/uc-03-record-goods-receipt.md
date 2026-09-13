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
  * Trường hợp hàng hóa bị lỗi, hư hỏng hoặc giao sai chủng loại hoàn toàn mà cửa hàng từ chối nhận 100%, Actor **không thực hiện ghi nhận nhận hàng trên hệ thống**.
  * Đơn mua hàng tiếp tục được **giữ nguyên ở trạng thái `Approved`** để nhân viên liên hệ yêu cầu Nhà cung cấp giao lại hàng đạt chuẩn ngoài đời thực.
  * Mốc thời gian giao hàng dự kiến ban đầu (`Expected Delivery Date`) **không được thay đổi**. Khi nhà cung cấp giao lại, nếu thời điểm giao thực tế muộn hơn ngày dự kiến ban đầu thì vẫn bị tính là **Giao trễ hạn**.
  * Trường hợp Nhà cung cấp không thể giao lại, Actor sang `UC-02` để thực hiện Hủy đơn hàng (`Cancel PO`).
* **Không luồng trả hàng riêng (No Return Flow):** Hệ thống không thiết kế Use Case trả hàng. Nếu có một số sản phẩm bị lỗi khi bốc dỡ, nhân viên trả lại ngay tại thời điểm giao và chỉ ghi nhận **số lượng hàng nguyên vẹn được đưa lên kệ** vào trường "Số lượng thực nhận".

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
4. Bản ghi lịch sử giao hàng của Nhà cung cấp (Trạng thái giao đúng hạn - `Is On-Time`, Tỷ lệ giao đủ hàng - `Fulfillment Rate`, Ngày giao thực tế, Ghi chú) được lưu vết vào lịch sử giao dịch của Nhà cung cấp để phục vụ đánh giá xếp hạng NCC tại `UC-01` và theo dõi hồ sơ tại `UC-06`.

---

## 5. Luồng Sự Kiện Chính (Main Flow)

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Tra cứu và chọn Đơn mua hàng (PO) khớp với phiếu giao hàng của nhà cung cấp (hoặc điều hướng nhanh từ Đơn mua hàng tương ứng tại `UC-02`). |
| **2** | **Hệ thống** | Hiển thị thông tin tiếp nhận đơn hàng với các dữ liệu đối chiếu:<br>- Thông tin chung: Mã PO, Tên Nhà cung cấp, Ngày duyệt PO, Ngày giao dự kiến ban đầu (`Expected Delivery Date`).<br>- Ngày nhận hàng thực tế: Mặc định hiển thị ngày hiện tại (cho phép Actor điều chỉnh nếu ghi nhận bổ sung cho đợt hàng trước đó).<br>- Danh sách mặt hàng: Mã SKU, Tên sản phẩm, Đơn vị tính, Số lượng đặt mua (`Ordered Qty`).<br>- Số lượng thực nhận (`Received Qty`): Mặc định tự động điền sẵn bằng đúng Số lượng đặt mua ($Qty_{received} = Qty_{ordered}$).<br>- Ghi chú nhận hàng (`Receipt Notes`): Cho phép ghi nhận lý do nếu có sai lệch về số lượng hoặc chất lượng hàng hóa (bắt buộc nhập nếu có chênh lệch số lượng). |
| **3** | **Actor** | Kiểm đếm hàng thực tế. Nếu số lượng thực nhận khớp với đơn đặt, Actor giữ nguyên. Nếu có chênh lệch (thiếu, dư, hàng hỏng trả lại), Actor điều chỉnh lại Số lượng thực nhận của SKU tương ứng và nhập ghi chú làm rõ lý do sai lệch. |
| **4** | **Actor** | Xác nhận hoàn tất nhận hàng (`Confirm Goods Receipt`). |
| **5** | **Hệ thống** | Thực hiện cập nhật nghiệp vụ:<br>a. **Cập nhật tồn kho:** Tăng `Current Inventory` theo đúng số lượng thực nhận ($CurrentInventory + Qty_{received}$).<br>b. **Giải phóng hàng chờ về:** Giảm trừ `On-order quantity` theo số lượng đặt ban đầu ($OnOrder - Qty_{ordered}$).<br>c. **Đóng đơn hàng:** Chuyển trạng thái Đơn mua hàng sang `Completed`.<br>d. **Đánh giá hiệu suất đơn hàng:** Xác định tỷ lệ giao đủ hàng (`Fulfillment Rate`), số ngày giao trễ ($Days_{late}$), trạng thái giao đúng hạn (`Is On-Time`), và hệ số thời gian (`On-Time Factor`) suy giảm theo số ngày trễ, lưu vết vào lịch sử giao dịch của Nhà cung cấp theo BR-13 và BR-24.<br>e. Lưu vết thời điểm nhận hàng, người thực hiện và nội dung ghi chú. |
| **6** | **Hệ thống** | Thông báo ghi nhận nhận hàng thành công và hiển thị tóm tắt kết quả (Tổng số lượng đã nhập kho, trạng thái đơn PO đã hoàn tất). |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Giao thiếu hàng (Under-delivery)
* **Điều kiện:** Tại Bước 3, Actor nhập Số lượng thực nhận nhỏ hơn Số lượng đặt trên PO ($Qty_{received} < Qty_{ordered}$) do nhà cung cấp không đủ hàng hoặc có hàng hỏng bị trả lại ngay lúc giao.
* **Xử lý:**
  1. Hệ thống tiếp nhận số lượng thực nhận và yêu cầu Actor bắt buộc nhập lý do vào trường Ghi chú nhận hàng (ví dụ: *"NCC hết hàng, hàng móp méo trả lại tại chỗ"*).
  2. Tại Bước 5, Đơn mua hàng vẫn chuyển sang trạng thái `Completed`, hệ thống tuyệt đối không giữ trạng thái nợ hàng (`Partial`).
  3. Hệ thống ghi nhận Tỷ lệ giao đủ hàng của đơn này:
     $$Fulfillment Rate = \frac{Qty_{received}}{Qty_{ordered}} \times 100\% < 100\%$$
     làm giảm điểm uy tín giao hàng của Nhà cung cấp theo BR-13 và BR-24.
  4. Lượng hàng thiếu hụt ($Qty_{ordered} - Qty_{received}$) không bị treo ở `On-order` mà được giải phóng hoàn toàn. Ở đợt phân tích tiếp theo tại `UC-01`, hệ thống DSS sẽ tự động tính toán lại mức thiếu hụt tồn kho và đề xuất đặt bổ sung nếu cần thiết.

### AF-2: Giao dư hàng (Over-delivery)
* **Điều kiện:** Tại Bước 3, Actor nhập Số lượng thực nhận lớn hơn Số lượng đặt trên PO ($Qty_{received} > Qty_{ordered}$) do nhà cung cấp khuyến mãi tặng kèm, bù hao vỡ, hoặc quy cách đóng thùng.
* **Xử lý:**
  1. Khi Actor nhập số lớn hơn, hệ thống hiển thị **Cảnh báo nhắc nhở xác nhận**: *"Số lượng thực nhận đang lớn hơn số lượng đặt mua trên PO. Vui lòng xác nhận bạn không nhập nhầm số liệu."*
  2. Actor kiểm tra và xác nhận đây là số lượng giao dư thực tế; bắt buộc nhập ghi chú làm rõ lý do giao thừa (ví dụ: *"NCC tặng kèm 2 sản phẩm khuyến mãi"*).
  3. Tại Bước 5, hệ thống vẫn cộng toàn bộ số lượng thực tế nhận được vào `Current Inventory` để bảo đảm dữ liệu đầu vào cho DSS luôn chính xác nhất so với thực tế vật lý.
  4. Hệ thống ghi nhận Tỷ lệ giao đủ hàng của đơn này và khóa ở mức trần:
     $$Fulfillment Rate = 100\%$$
     *(Không cộng điểm thưởng vượt mức để tránh tạo động cơ thiên vị cho việc NCC ép giao thừa hàng).*

### AF-3: Giao hàng trễ hạn (Late-delivery)
* **Điều kiện:** Tại Bước 2, Ngày nhận thực tế vượt quá ngày giao cam kết ban đầu ($Ngày\_nhận > ExpectedDeliveryDate$).
* **Xử lý:**
  1. Quy trình nhận hàng vẫn tiến hành bình thường.
  2. Tại Bước 5, hệ thống tính toán số ngày trễ thực tế ($Days_{late} = Date_{actual} - Date_{expected} > 0$) và ghi nhận trạng thái `Is On-Time = False`.
  3. Hệ thống áp dụng cơ chế phạt trễ hạn suy giảm tuyến tính (với ngưỡng trễ tối đa 3 ngày):
     * Trễ 1 ngày: `On-Time Factor` $\approx 0.67$ (đạt 33/50 điểm thời gian, giảm nhẹ điểm uy tín).
     * Trễ 2 ngày: `On-Time Factor` $\approx 0.33$ (đạt 17/50 điểm thời gian).
     * Trễ $\ge 3$ ngày: `On-Time Factor` $= 0.0$ (mất toàn bộ 50 điểm thời gian do rủi ro đứt hàng nghiêm trọng).
  4. Lưu vết kết quả vào lịch sử giao dịch của Nhà cung cấp để phục vụ thuật toán đánh giá tại `UC-01` theo BR-13 và BR-24.

### AF-4: Từ chối nhận toàn bộ lô hàng và yêu cầu giao lại (100% Rejection)
* **Điều kiện:** Tại Bước 3, toàn bộ hàng hóa bị hư hỏng, hết hạn, hoặc giao sai loại khiến cửa hàng từ chối nhận 100%.
* **Xử lý:**
  1. Actor **không thực hiện xác nhận nhận hàng và hủy bỏ phiên làm việc**.
  2. Đơn mua hàng tiếp tục duy trì trạng thái `Approved`.
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
* **Điều kiện:** Tại Bước 4, Actor chỉnh sửa toàn bộ số lượng thực nhận của tất cả các SKU về `0` và thực hiện xác nhận nhận hàng.
* **Xử lý:**
  1. Hệ thống chặn thao tác và hiển thị thông báo nghiệp vụ:
     > *"Bạn đang ghi nhận số lượng thực nhận bằng 0 cho toàn bộ đơn hàng. Nếu từ chối nhận hàng do hàng lỗi/giao sai, vui lòng không xác nhận nhận hàng mà giữ đơn ở trạng thái Chờ giao để Nhà cung cấp giao lại. Trường hợp Nhà cung cấp không thể giao lại hàng, vui lòng sang chức năng Quản lý đơn hàng (UC-02) để thực hiện Hủy đơn."*
  2. Hệ thống không thay đổi trạng thái đơn hàng và không cập nhật dữ liệu tồn kho.

### EF-3: Ngày nhận hàng thực tế không hợp lệ
* **Điều kiện:** Tại Bước 2 hoặc Bước 4, trường Ngày nhận hàng bị bỏ trống, hoặc Actor nhập ngày lớn hơn ngày hiện tại ($Date_{actual} > Today$), hoặc nhỏ hơn ngày phê duyệt đơn ($Date_{actual} < ApprovalDate$).
* **Xử lý:**
  1. Hệ thống chặn thao tác xác nhận và hiển thị thông báo: *"Ngày nhận hàng thực tế không hợp lệ. Vui lòng chọn ngày nằm trong khoảng từ ngày duyệt đơn mua hàng đến ngày hiện tại."*
  2. Hệ thống yêu cầu Actor chọn lại ngày hợp lệ trước khi cho phép tiếp tục.

### EF-4: Số lượng thực nhận để trống hoặc không hợp lệ
* **Điều kiện:** Tại Bước 3 hoặc Bước 4, Actor xóa trắng trường số lượng thực nhận của một mặt hàng (để trống/null) hoặc nhập số âm ($Qty_{received} < 0$).
* **Xử lý:**
  1. Hệ thống chặn thao tác xác nhận và hiển thị thông báo: *"Số lượng thực nhận của mỗi mặt hàng phải là số nguyên không âm ($\ge 0$)."*
  2. Nếu một mặt hàng không được giao, Actor bắt buộc phải nhập số `0` cho dòng đó kèm ghi chú giải trình lý do thiếu hàng.

### EF-5: Trạng thái Đơn mua hàng không còn khả dụng (Xung đột trạng thái)
* **Điều kiện:** Tại Bước 4, khi Actor xác nhận, Đơn mua hàng đã bị Hủy (`Cancelled`) hoặc đã hoàn tất (`Completed`) bởi một người dùng khác trước đó.
* **Xử lý:**
  1. Hệ thống từ chối cập nhật và hiển thị thông báo: *"Đơn mua hàng không còn ở trạng thái Đã duyệt (Approved) để ghi nhận nhận hàng. Vui lòng kiểm tra lại danh sách đơn hàng."*
  2. Hệ thống hủy bỏ phiên làm việc và điều hướng Actor về danh sách quản lý đơn hàng (`UC-02`).

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-11 (Goods Receipt Execution & Pre-fill Rule):** 
  * Chỉ các Đơn mua hàng ở trạng thái `Approved` mới được phép thao tác nhận hàng.
  * Mỗi Đơn mua hàng chỉ được ghi nhận nhận hàng một lần duy nhất trong toàn bộ vòng đời.
  * Hệ thống mặc định tự động điền sẵn số lượng thực nhận bằng số lượng đặt ($Qty_{received} = Qty_{ordered}$).
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
  * Trạng thái giao đúng hạn (`Is On-Time`) & Số ngày trễ ($Days_{late}$):
    $$Days_{late} = \max(0, Date_{\text{actual}} - Date_{\text{expected}})$$
    $$\text{Is On-Time} = \begin{cases} \text{True (Đúng hạn)} & \text{khi } Days_{\text{late}} = 0 \\ \text{False (Trễ hạn)} & \text{khi } Days_{\text{late}} > 0 \end{cases}$$
    *(Lưu ý: Nếu nhận hàng giao lại sau khi từng bị từ chối 100%, mốc ngày dự kiến vẫn giữ nguyên ban đầu để đánh giá đúng tác động chậm trễ của NCC).*
  * Hệ số thời gian suy giảm theo số ngày trễ (`On-Time Factor`):
    $$\text{On-Time Factor} = \begin{cases} 1.0 & \text{khi } Days_{\text{late}} = 0 \\ \max\left(0, 1 - \frac{Days_{\text{late}}}{3}\right) & \text{khi } Days_{\text{late}} > 0 \end{cases}$$
    *(Trễ 0 ngày $\rightarrow 1.0$ [50 điểm]; Trễ 1 ngày $\rightarrow 0.67$ [33 điểm]; Trễ 2 ngày $\rightarrow 0.33$ [17 điểm]; Trễ $\ge 3$ ngày $\rightarrow 0.0$ [0 điểm]).*
  * Kết hợp $FulfillmentRate$ và $On-Time Factor$ để tính điểm hiệu suất đơn hàng $\text{Order Score} = (\text{On-Time Factor} \times 50) + (\text{Fulfillment Rate} \times 0.5)$ theo BR-24.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Mối quan hệ với UC-01 (Review & Approve Purchase Recommendations):**
  * `UC-03` cung cấp dữ liệu phản hồi thực tế (`Closed-Loop Feedback`) cho thuật toán DSS tại `UC-01`.
  * Khi `UC-03` hoàn tất, tồn kho thực tế (`Current Inventory`) tăng lên và `On-order` giảm về 0, giúp đợt phân tích mua hàng tiếp theo tại `UC-01` nhận diện chính xác vị thế tồn kho mới nhất để không tính trùng nhu cầu đặt hàng.
  * Các chỉ số hiệu suất (`Is On-Time`, `Fulfillment Rate`) được tính từ `UC-03` sẽ trực tiếp cập nhật vào thành phần điểm lịch sử giao hàng (`Historical Performance`) của Nhà cung cấp trong thuật toán xếp hạng NCC tại `UC-01` (qua BR-24 và BR-02).
* **Mối quan hệ với UC-02 (Manage Purchase Orders):**
  * `UC-02` cung cấp đường dẫn điều hướng nhanh chuyển thẳng sang `UC-03` khi Actor đang xem chi tiết đơn hàng mà có hàng giao tới.
  * Khi `UC-03` hoàn tất, trạng thái PO chuyển từ `Approved` sang `Completed`, hiển thị đồng bộ sang danh sách theo dõi của `UC-02`.
  * Nếu hàng bị lỗi toàn bộ mà NCC không thể giao lại, Actor quay lại `UC-02` để thực hiện Hủy đơn hàng (`Cancel PO`).
* **Mối quan hệ với UC-06 (Manage Suppliers & Supply Conditions):**
  * Dữ liệu giao hàng thực tế (ngày giao, mức độ sai lệch số lượng, ghi chú) lưu lại từ `UC-03` sẽ được hiển thị trong mục lịch sử giao dịch và hồ sơ năng lực của Nhà cung cấp tại `UC-06`.

