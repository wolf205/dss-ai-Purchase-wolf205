# UC-07: Thiết Lập Tham Số Phân Tích DSS (Configure DSS Parameters)

## 1. Thông Tin Chung

* **Mã Use Case:** `UC-07`
* **Tên Use Case:** Thiết lập tham số phân tích DSS (*Configure DSS Parameters*)
* **Actor chính:** `Store Manager` (Quản lý cửa hàng).
* **Actor tra cứu (Read-only):** `Purchasing Staff` (Nhân viên mua hàng có quyền xem cấu hình hiện tại để hiểu căn cứ tính toán của DSS).
* **Phân loại:** Core Config (Cấu hình lõi).
* **Mục tiêu nghiệp vụ (Goal):**
  * Cung cấp trung tâm điều khiển chính sách mua hàng và định hướng thuật toán phân tích DSS cho Quản lý cửa hàng.
  * Cho phép tùy chỉnh linh hoạt **Bộ trọng số đánh giá Nhà cung cấp** (Đơn giá, Lead Time, MOQ, Lịch sử giao hàng) để phản ánh đúng định hướng kinh doanh của cửa hàng trong từng giai đoạn (tiết kiệm chi phí, ưu tiên giao nhanh, hay ưu tiên độ tin cậy đối tác).
  * Cho phép tùy chỉnh các **Tham số kiểm soát tồn kho** (Mức độ phục vụ mong muốn `Target Service Level` và Chu kỳ rà soát mua hàng `Review Period`) để cân bằng giữa rủi ro đứt hàng (`Stockout`) và nguy cơ dư thừa tồn kho (`Overstock`).
  * Bảo đảm mọi khuyến nghị định lượng của DSS tại `UC-01` luôn bám sát chiến lược kinh doanh thực tế thay vì bị ấn định cứng trong mã nguồn hệ thống.

---

## 2. Nguyên Tắc & Ranh Giới Nghiệp Vụ

* **Phân định rõ Chính sách Kinh doanh vs Thuật toán Tự động:**
  * Con người (`Store Manager`) là chủ thể định hướng chính sách thông qua việc thiết lập các tham số mục tiêu và trọng số ưu tiên.
  * Hệ thống DSS chịu trách nhiệm tự động hóa toàn bộ các công thức tính toán toán học phức tạp dựa trên bộ tham số này tại `UC-01`.
* **Ràng buộc chuẩn hóa Tổng trọng số Nhà cung cấp (Weight Normalization):**
  * Bốn tiêu chí đánh giá Nhà cung cấp (Đơn giá, Lead Time, MOQ, Lịch sử giao hàng) phải có tổng tỷ trọng chính xác bằng **100%**.
  * Hệ thống áp dụng cơ chế xác thực tức thời và chặn hành động lưu nếu tổng tỷ trọng khác 100% theo `BR-25`.
* **Tính hợp lệ của Trọng số bằng 0% (Zero-Weight Allowance):**
  * Cửa hàng được phép gán trọng số của một tiêu chí thành phần bằng 0% (ví dụ: $w_{\text{MOQ}} = 0\%$ nếu cửa hàng không ưu tiên ràng buộc số lượng đặt tối thiểu), miễn là mỗi trọng số là số nguyên không âm ($w_i \ge 0\%$) và tổng 4 trọng số bằng đúng 100% theo `BR-25`.
* **Rời rạc hóa Mức độ phục vụ (Discrete Service Level Mapping):**
  * Mức độ phục vụ mong muốn (`Target Service Level`) được thiết kế dạng lựa chọn giữa các mốc chuẩn công nghiệp (90%, 95%, 98%, 99%).
  * Mỗi mốc được hệ thống tự động ánh xạ với một **Hệ số an toàn $Z$ tương ứng** trong phân phối chuẩn tắc (Normal Distribution) theo `BR-26`, giúp người dùng dễ dàng định hình mức độ rủi ro đứt hàng mà không đòi hỏi chuyên môn thống kê sâu.
* **Giới hạn vận hành của Chu kỳ rà soát (Review Period Bounds):**
  * Chu kỳ rà soát mua hàng được giới hạn trong khoảng hợp lý từ **1 đến 30 ngày** theo `BR-27` (phù hợp với chu kỳ đặt hàng thực tế của một cửa hàng bán lẻ đơn lẻ: theo ngày, tuần, nửa tháng hoặc tháng).
* **Hiệu lực tức thì về sau (Forward-Looking Application):**
  * Tham số cấu hình sau khi lưu sẽ có hiệu lực ngay lập tức cho các đợt phân tích mua hàng (`UC-01`) kể từ thời điểm đó.
  * Tuyệt đối không làm thay đổi hồi tố các đơn mua hàng (`PO`) cũ đã được phê duyệt tại `UC-02` theo `BR-28`.
* **Ranh giới Tham số Cấu hình vs Hằng số Vận hành Hệ thống (Configurable vs System Constants):**
  * Các đòn bẩy chiến lược kinh doanh (Bộ trọng số NCC, Target Service Level, Review Period) cho phép Store Manager chủ động tùy biến.
  * Các tham số kỹ thuật và vận hành khác được ấn định làm **Hằng số hệ thống (System Constants)** cố định trong mã nguồn, bao gồm:
    * Điểm tín nhiệm khởi tạo NCC mới: `80 điểm` (Cold Start, áp dụng cho $< 3$ đơn hoàn tất theo `BR-24`).
    * Cửa sổ trượt đánh giá phong độ NCC: Đúng `5 đơn hoàn tất gần nhất` theo `BR-24`.
    * Ngưỡng phạt giao trễ tối đa: $T_{\text{grace}} = 3$ ngày theo `BR-13`.
    * Số ngày tồn kho an toàn dự phòng cho SKU mới bán $< 14$ ngày: `Safety Days = 5 ngày` theo `BR-01`.
    * Ngưỡng phân loại ma trận tồn kho `ABC-XYZ` (Doanh thu tích lũy 80/15/5% và Hệ số biến thiên CV 0.5/1.0 theo `BR-05`).
  * Việc cố định các hằng số này giúp giao diện UC-07 tập trung thuần túy vào các quyết sách kinh doanh cốt lõi, tránh gây quá tải tham số (`Parameter Bloat`).

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
* Cửa hàng thay đổi chiến lược mua hàng (ví dụ: chuyển từ ưu tiên Giá rẻ sang ưu tiên Giao hàng nhanh và Uy tín đối tác trước mùa lễ Tết).
* Store Manager muốn tối ưu lại tồn kho an toàn sau một giai đoạn theo dõi tỷ lệ phục vụ thực tế.
* Chu kỳ rà soát đặt hàng của cửa hàng thay đổi (ví dụ: chuyển từ đặt hàng 2 tuần/lần sang đặt hàng hàng tuần).
* Khởi tạo hệ thống lần đầu hoặc khi Store Manager muốn khôi phục về cấu hình khuyến nghị ban đầu.

### 3.2. Preconditions (Điều kiện tiên quyết)
* Actor đã đăng nhập vào hệ thống với vai trò phù hợp:
  * `Store Manager`: Toàn quyền xem, điều chỉnh, lưu thay đổi và khôi phục mặc định.
  * `Purchasing Staff`: Quyền xem cấu hình hiện tại ở chế độ Chỉ đọc (Read-only).
* Khi hệ thống khởi chạy lần đầu tiên và chưa từng có bản ghi cấu hình tùy chỉnh nào, hệ thống tự động nạp cấu hình mặc định ban đầu (`Default Baseline`) theo `BR-28` làm cấu hình hoạt động hiện hành.

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Bộ tham số cấu hình DSS mới được hệ thống ghi nhận chính thức và kích hoạt áp dụng làm chính sách hiện hành (`Active Configuration`).
2. Mọi đợt phân tích mua hàng theo nhu cầu tại `UC-01` sau đó sẽ tự động nạp bộ tham số mới này để tính toán tồn kho an toàn và xếp hạng nhà cung cấp.
3. Lịch sử thay đổi được lưu vết đầy đủ kèm thông tin thời gian cập nhật (`Last Updated At`) và người thực hiện (`Updated By`).

---

## 5. Luồng Sự Kiện Chính (Main Flow) - Tùy Chỉnh & Áp Dụng Tham Số DSS

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Yêu cầu truy cập chức năng **Thiết lập tham số DSS** từ menu quản trị hệ thống. |
| **2** | **Hệ thống** | Tải và hiển thị bộ tham số cấu hình đang áp dụng hiện hành (nếu là lần đầu khởi tạo, tự động hiển thị cấu hình mặc định ban đầu theo `BR-28`):<br>- **Phần 1: Trọng số đánh giá Nhà cung cấp (Tổng = 100%):**<br>  * Tỷ trọng Đơn giá (`Price Weight`, %)<br>  * Tỷ trọng Thời gian giao hàng (`Lead Time Weight`, %)<br>  * Tỷ trọng Số lượng đặt tối thiểu (`MOQ Weight`, %)<br>  * Tỷ trọng Lịch sử giao hàng (`Historical Performance Weight`, %)<br>  * Chỉ báo trạng thái hợp lệ của Tổng tỷ trọng (xác nhận hợp lệ khi $= 100\%$, cảnh báo khi $\ne 100\%$).<br>- **Phần 2: Chính sách Tồn kho & Đặt hàng:**<br>  * Mức độ phục vụ mong muốn (`Target Service Level`): Giá trị hiện tại kèm hệ số an toàn $Z$ tương ứng.<br>  * Chu kỳ rà soát mua hàng (`Review Period`): Số ngày hiện tại.<br>- Thông tin lưu vết: Thời gian cập nhật gần nhất (`Last Updated At`) và Người cập nhật (`Updated By`) (hoặc hiển thị *"Mặc định hệ thống"* nếu chưa từng phát sinh chỉnh sửa). |
| **3** | **Actor** | Thực hiện điều chỉnh các thông số theo chiến lược mới:<br>a. Điều chỉnh tỷ lệ phần trăm cho từng tiêu chí đánh giá NCC (nhập số nguyên không âm $\ge 0\%$).<br>b. Chọn mức độ phục vụ mong muốn từ danh mục chuẩn: `90%`, `95%`, `98%`, hoặc `99%`.<br>c. Điều chỉnh số ngày cho chu kỳ rà soát mua hàng (số nguyên từ 1 đến 30 ngày). |
| **4** | **Hệ thống** | Thực hiện kiểm tra tính hợp lệ tức thời (Real-time Validation):<br>- Tự động tính lại Tổng 4 trọng số NCC: $\text{Tổng} = w_{Price} + w_{LeadTime} + w_{MOQ} + w_{History}$.<br>- *Nếu Tổng $= 100\%$ và toàn bộ dữ liệu hợp lệ:* Hệ thống cho phép thực hiện lưu cấu hình.<br>- *Nếu Tổng $\ne 100\%$ hoặc có trường vi phạm:* Hệ thống thông báo rõ nguyên nhân sai lệch (ví dụ: *"Tổng trọng số hiện tại là [X]%. Vui lòng điều chỉnh để tổng bằng đúng 100%"*) và tạm thời chặn hành động lưu cấu hình. |
| **5** | **Actor** | Kiểm tra lại tổng thể các thông số đã điều chỉnh và xác nhận yêu cầu lưu cấu hình (`Save Configuration`). |
| **6** | **Hệ thống** | Xác thực toàn diện dữ liệu; chính thức ghi nhận bộ tham số cấu hình mới và kích hoạt áp dụng làm chính sách hiện hành, đồng thời cập nhật lịch sử thay đổi kèm thời gian thực hiện và định danh của Store Manager. |
| **7** | **Hệ thống** | Hiển thị thông báo thành công: *"Cấu hình tham số DSS đã được cập nhật thành công và sẽ áp dụng cho các đợt phân tích mua hàng tiếp theo."* |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Khôi phục cấu hình mặc định của hệ thống (Reset to Defaults)
* **Điều kiện:** Store Manager muốn quay về cấu hình khuyến nghị an toàn ban đầu của hệ thống sau một thời gian áp dụng các trọng số thử nghiệm.
* **Xử lý:**
  1. Tại màn hình cấu hình, Actor yêu cầu **Khôi phục mặc định** (`Reset to Defaults`).
  2. Hệ thống yêu cầu xác nhận hành động:
     > *"Bạn có chắc chắn muốn khôi phục toàn bộ tham số về cấu hình khuyến nghị ban đầu của hệ thống? Toàn bộ các tùy chỉnh hiện tại sẽ được thay thế."*
  3. Actor xác nhận khôi phục.
  4. Hệ thống tự động thiết lập lại bộ thông số chuẩn theo `BR-28`:
     * Tỷ trọng Đơn giá: `40%`
     * Tỷ trọng Thời gian giao hàng: `20%`
     * Tỷ trọng Số lượng đặt tối thiểu: `15%`
     * Tỷ trọng Lịch sử giao hàng: `25%`
     * Target Service Level: `95%` ($Z = 1.65$)
     * Review Period: `7 ngày`
  5. Dữ liệu được xác thực hợp lệ; Actor xác nhận lưu để kích hoạt lại cấu hình mặc định.

### AF-2: Tra cứu cấu hình hiện tại (Purchasing Staff)
* **Điều kiện:** Nhân viên mua hàng cần xem cấu hình tham số để hiểu căn cứ vì sao DSS lại ưu tiên một nhà cung cấp nào đó hoặc vì sao mức tồn kho an toàn lại tăng cao.
* **Xử lý:**
  1. Actor yêu cầu truy cập màn hình Cấu hình tham số DSS.
  2. Hệ thống nhận diện vai trò `Purchasing Staff` và hiển thị màn hình ở **chế độ Chỉ đọc (Read-only)**:
     * Toàn bộ các thông số được hiển thị trực quan nhưng không cho phép chỉnh sửa.
     * Chức năng lưu cấu hình và khôi phục mặc định không khả dụng đối với vai trò này.
  3. Actor xem các thông số hiện hành và rời khỏi màn hình.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Tổng trọng số đánh giá Nhà cung cấp khác 100%
* **Điều kiện:** Tại Bước 4 của Main Flow, tổng 4 trọng số đánh giá NCC cộng lại nhỏ hơn hoặc lớn hơn 100% (ví dụ: 95% hoặc 105%).
* **Xử lý:**
  1. Hệ thống thông báo cảnh báo sai lệch tổng trọng số và nêu rõ giá trị chênh lệch hiện tại.
  2. Hệ thống chặn hành động lưu cấu hình.
  3. Actor điều chỉnh lại tỷ trọng giữa các tiêu chí cho đến khi tổng bằng chính xác 100%.

### EF-2: Chu kỳ rà soát mua hàng khuyết thiếu hoặc không hợp lệ
* **Điều kiện:** Actor để trống trường `Review Period`, hoặc nhập số âm, hoặc nhập số thập phân, hoặc nhập giá trị nằm ngoài khoảng từ 1 đến 30 ngày theo `BR-27`.
* **Xử lý:**
  1. Hệ thống thông báo lỗi vi phạm điều kiện hợp lệ:
     > *"Chu kỳ rà soát mua hàng là thông tin bắt buộc, phải là số nguyên trong khoảng từ 1 đến 30 ngày."*
  2. Hệ thống chặn hành động lưu cấu hình cho đến khi giá trị được điều chỉnh hợp lệ.

### EF-3: Trọng số đánh giá NCC khuyết thiếu hoặc không hợp lệ
* **Điều kiện:** Một trong các ô tỷ trọng NCC bị để trống, hoặc bị nhập số âm ($< 0\%$), hoặc nhập số thập phân, hoặc nhập ký tự không phải số nguyên theo `BR-25`.
* **Xử lý:**
  1. Hệ thống từ chối giá trị không hợp lệ và thông báo quy chuẩn:
     > *"Tỷ trọng đánh giá phải là số nguyên không âm (từ 0% đến 100%) và không được để trống."*
  2. Hệ thống chặn hành động lưu cấu hình cho đến khi toàn bộ 4 trọng số được nhập hợp lệ.

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-25 (Supplier Evaluation Weight Normalization & Integrity Rule):**
  * Bộ trọng số đánh giá Nhà cung cấp gồm 4 tiêu chí thành phần: $w_{Price}$ (Đơn giá), $w_{LeadTime}$ (Thời gian giao hàng), $w_{MOQ}$ (Số lượng đặt tối thiểu), và $w_{History}$ (Lịch sử giao hàng).
  * Mỗi trọng số thành phần phải thỏa mãn: $w_i \ge 0\%$ và $w_i \in \mathbb{Z}$ (số nguyên). Cho phép một hoặc nhiều trọng số bằng 0% nếu cửa hàng muốn bỏ qua tiêu chí đó trong giai đoạn nhất định.
  * Ràng buộc chuẩn hóa bắt buộc:
    $$\sum_{i=1}^{4} w_i = w_{Price} + w_{LeadTime} + w_{MOQ} + w_{History} = 100\%$$
  * Hệ thống tuyệt đối từ chối lưu cấu hình nếu tổng 4 trọng số khác 100%.
* **BR-26 (Service Level to Safety Factor Mapping Rule):**
  * Mức độ phục vụ mong muốn (`Target Service Level`) được giới hạn trong 4 mốc rời rạc chuẩn công nghiệp, tự động ánh xạ với Hệ số an toàn $Z$ theo bảng phân phối chuẩn tắc:
    * Mức `90%`: $Z = 1.28$ (Rủi ro đứt hàng 10%, tồn kho an toàn tinh giản).
    * Mức `95%`: $Z = 1.65$ (Rủi ro đứt hàng 5%, mức khuyến nghị mặc định).
    * Mức `98%`: $Z = 2.05$ (Rủi ro đứt hàng 2%, ưu tiên bảo đảm hàng).
    * Mức `99%`: $Z = 2.33$ (Rủi ro đứt hàng 1%, mức bảo vệ tối đa).
  * Giá trị $Z$ này là đầu vào trực tiếp cho công thức tính Tồn kho an toàn tại `BR-01`: $SafetyStock = Z \times \sigma_d \times \sqrt{L}$.
* **BR-27 (Review Period Operational Bounds Rule):**
  * Chu kỳ rà soát mua hàng (`Review Period`, ký hiệu: $R$) phải là số nguyên thỏa mãn:
    $$1 \le R \le 30 \text{ (ngày)}$$
  * Khoảng thời gian bảo vệ nhu cầu của một chu kỳ đặt hàng tại `BR-01` được xác định bằng $LeadTime + R$.
* **BR-28 (DSS Parameter Baseline & Forward-Looking Application Rule):**
  * **Bộ giá trị mặc định hệ thống (Default Baseline):**
    * $w_{Price} = 40\%$, $w_{LeadTime} = 20\%$, $w_{MOQ} = 15\%$, $w_{History} = 25\%$.
    * $TargetServiceLevel = 95\%$ ($Z = 1.65$).
    * $ReviewPeriod = 7$ ngày.
  * **Khởi tạo lần đầu:** Tự động áp dụng bộ giá trị mặc định làm cấu hình ban đầu khi hệ thống mới vận hành.
  * **Nguyên tắc áp dụng tiến về trước:** Mọi thay đổi cấu hình tham số chỉ có hiệu lực kể từ thời điểm lưu thành công trở về sau. Không áp dụng hồi tố để tính lại các đơn PO cũ hoặc các phiên phân tích đã chốt trong quá khứ.

---

## 9. Ràng Buộc & Mối Quan Hệ Với Các Use Case Khác

* **Quan hệ mật thiết với UC-01 (Review & Approve Recommendations):**
  * `UC-07` cung cấp toàn bộ các biến số đầu vào cho chuỗi thuật toán xử lý ngầm tại `UC-01`:
    * Mức phục vụ ($SL \rightarrow Z$) và Chu kỳ rà soát ($R$) cung cấp cho `BR-01` để tính `Safety Stock`, `Reorder Point (ROP)` và số lượng mua đề xuất.
    * Bộ 4 trọng số ($w_i$) cung cấp cho `BR-02` để chấm điểm và xếp hạng danh sách Nhà cung cấp cho từng SKU.
* **Quan hệ với UC-02 (Manage Purchase Orders):**
  * Tham số cấu hình mới không làm thay đổi các bản ghi `Purchase Order` đã sinh ra tại `UC-02`. Đơn mua hàng bảo lưu dữ liệu lịch sử độc lập.
* **Quan hệ với UC-06 (Manage Suppliers & Supply Conditions):**
  * `UC-06` cung cấp số liệu thực tế của từng đối tác (Đơn giá, Lead Time cam kết, MOQ, Tỷ lệ giao hàng 5 đơn gần nhất), còn `UC-07` quyết định "sức nặng" của từng số liệu đó thông qua bộ trọng số.
