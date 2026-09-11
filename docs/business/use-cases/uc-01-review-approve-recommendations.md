# UC-01: Xử Lý Và Phê Duyệt Đề Xuất Mua Hàng (Review & Approve Purchase Recommendations)

## 1. Thông Tin Chung

* **Mã Use Case:** `UC-01`
* **Tên Use Case:** Xử lý và phê duyệt đề xuất mua hàng (*Review & Approve Purchase Recommendations*)
* **Actor chính:** `Purchasing Staff` (Nhân viên mua hàng).
* **Actor kế thừa:** `Store Manager` (Quản lý cửa hàng có toàn quyền thực hiện).
* **Phân loại:** Core DSS.
* **Mục tiêu nghiệp vụ (Goal):** 
  * Phát hiện kịp thời các mặt hàng có nguy cơ thiếu hàng (`Stockout`) hoặc chạm điểm đặt hàng (`Reorder Point`).
  * Cung cấp các khuyến nghị mua hàng đa chiều dựa trên dữ liệu (`What`, `When`, `How Much`, `Which Supplier`, `Why Buy`).
  * Cho phép người dùng đối chiếu căn cứ tính toán, tùy chỉnh số lượng và nhà cung cấp theo nhận định thực tế.
  * Phê duyệt phương án mua hàng để hệ thống tự động sinh các Đơn mua hàng (`Purchase Order`) hợp lệ gửi đối tác.

---

## 2. Nguyên Tắc & Ranh Giới Nghiệp Vụ

* **Nguyên tắc cốt lõi:**
  > **AI recommends. Human decides.**
* **Ranh giới xử lý của AI / DSS:**
  * Dự báo nhu cầu, phân loại ma trận tồn kho ABC-XYZ, tính toán ngưỡng tồn kho, chấm điểm xếp hạng nhà cung cấp và tạo tóm tắt giải thích tự nhiên hoàn toàn là các **tác vụ xử lý ngầm bên trong hệ thống**.
  * AI không phải là Actor, không tự động đặt hàng và không tự ý gửi đơn khi chưa có phê duyệt từ con người.
* **Trách nhiệm của con người:**
  * Chủ động kích hoạt phân tích, xem xét đề xuất, tùy chỉnh khi cần thiết và chịu trách nhiệm ra quyết định phê duyệt cuối cùng.

---

## 3. Điều Kiện Kích Hoạt & Tiên Quyết

### 3.1. Trigger (Kích hoạt)
* Actor chủ động yêu cầu chạy phân tích đề xuất mua hàng theo nhu cầu (`On-demand`).
* Actor có thể lựa chọn phạm vi phân tích:
  * **Toàn bộ cửa hàng** *(mặc định)*; hoặc
  * **Một ngành hàng cụ thể** (ví dụ: Đồ uống, Hóa mỹ phẩm, Bánh kẹo...).

### 3.2. Preconditions (Điều kiện tiên quyết)
1. Dữ liệu lịch sử bán hàng (`Sales History`) và số liệu kiểm kê tồn kho mới nhất (`Current Inventory`) đã được cập nhật vào hệ thống (`UC-04`).
2. Danh mục sản phẩm (`SKU`) và quan hệ liên kết Nhà cung cấp (`Supplier`) kèm các điều kiện mua hàng (Giá nhập, `Lead Time`, `MOQ`) đã sẵn sàng (`UC-05`, `UC-06`).
3. Tham số phân tích DSS (trọng số đánh giá NCC, mức độ phục vụ mong muốn, chu kỳ rà soát tồn kho) đã được thiết lập (`UC-07`).

---

## 4. Kết Quả Nghiệp Vụ (Postconditions)

1. Phương án mua hàng của đợt phân tích được ghi nhận và lưu trữ lịch sử.
2. Hệ thống ghi nhận song song cả hai bộ số liệu:
   * Số liệu khuyến nghị gốc do DSS tính toán (`Suggested Quantity`, `Suggested Supplier`).
   * Số liệu thực tế do người dùng phê duyệt (`Approved Quantity`, `Approved Supplier`).
   *(Không bắt buộc người dùng phải nhập lý do văn bản để tối ưu tốc độ vận hành).*
3. Các Đơn mua hàng (`Purchase Order`) mới được tự động khởi tạo ở trạng thái `Approved`, sẵn sàng cho bước xuất/in gửi nhà cung cấp tại `UC-02`.
4. Số lượng hàng trên các đơn đã duyệt được ghi nhận vào trạng thái hàng đang về (`On-order quantity`) để loại trừ tính trùng lặp ở các đợt phân tích tiếp theo.

---

## 5. Luồng Sự Kiện Chính (Main Flow)

| Bước | Chủ thể | Hành động nghiệp vụ |
| :---: | :--- | :--- |
| **1** | **Actor** | Yêu cầu kích hoạt đợt phân tích mua hàng mới và chọn phạm vi (Toàn bộ cửa hàng hoặc Một ngành hàng cụ thể). |
| **2** | **Hệ thống** | Tiếp nhận yêu cầu và thực thi chuỗi tính toán DSS tự động ngầm (thuần toán học & quy tắc, hoàn tất tức thì trong < 1s):<br>a. Dự báo nhu cầu tiêu thụ tương lai (`Demand Forecast`) cho từng mặt hàng trong chu kỳ rà soát.<br>b. Phân loại ma trận tồn kho `ABC - XYZ` tự động dựa trên doanh thu lũy kế (Pareto 80/15/5) và hệ số biến thiên nhu cầu $CV = \sigma / \mu$ ($CV \le 0.5$ / $1.0$ / $>1.0$).<br>c. Phân tích rủi ro tồn kho, xác định `Safety Stock`, `Reorder Point`, và tính số lượng mua đề xuất (`Suggested Order Quantity`). Số lượng đề xuất ban đầu tự động làm tròn lên bằng hoặc là bội số của mức `MOQ` do nhà cung cấp quy định.<br>d. Chấm điểm và xếp hạng các nhà cung cấp khả dụng cho từng SKU, chọn NCC có điểm tối ưu nhất. |
| **3** | **Hệ thống** | Hiển thị giao diện Không gian làm việc đề xuất mua hàng (Decision Cockpit) gồm 3 vùng thông tin liền mạch:<br>1. **Vùng đầu trang (Interactive Stat Cards kiêm Bộ lọc 1-Click):**<br>- Các thẻ chỉ số sức khỏe tồn kho: `🔴 Cần mua gấp / Hết hàng`, `🟠 Sắp hết / Chạm ROP`, `🟢 An toàn`, `⚪ Dư thừa`.<br>- Thẻ phân loại ma trận `ABC - XYZ` (AX, AY, BY, CZ...).<br>- *Tương tác:* Bấm trực tiếp vào từng thẻ để kích hoạt lọc nhanh bảng dữ liệu bên dưới.<br>2. **Vùng trung tâm (Bảng chi tiết đề xuất mua hàng):**<br>- Liệt kê danh sách SKU theo phạm vi phân tích, mặc định ưu tiên xếp các SKU rủi ro cao lên trên.<br>- Hiển thị đầy đủ: Mã SKU, Tên sản phẩm, Nhóm ABC-XYZ, Tồn hiện tại, Dự báo nhu cầu, Số lượng mua đề xuất, Đơn giá nhập, Thành tiền tạm tính, Nhà cung cấp gợi ý và Nút hành động xem giải thích AI (`[✨ Xem giải thích]`).<br>3. **Vùng đáy màn hình (Thanh tổng kết & Chốt đơn nổi cố định - Sticky Action Bar):**<br>- Luôn gắn cố định ở mép dưới màn hình khi cuộn trang, hiển thị tổng hợp theo thời gian thực:<br>`[ Số SKU chọn mua: X / Tổng số ] | [ Số đơn PO dự kiến sinh ra: Y ] | [ Tổng tiền tạm tính: Z VNĐ ]`<br>- Chứa hai nút hành động nghiệp vụ chính: **Lưu nháp** (`Save Draft`) và **Phê duyệt mua hàng** (`Approve Purchase`). |
| **4** | **Actor** | Xem xét danh sách tổng thể; chọn xem chi tiết từng SKU để đối chiếu căn cứ tính toán (so sánh điểm số các NCC khác nhau, lịch sử bán, dự báo chi tiết), hoặc bấm nút `[✨ Xem giải thích]` của SKU cần tìm hiểu thêm lý do. |
| **5** | **Hệ thống / Actor** | - Khi Actor bấm xem giải thích của SKU nào, **Hệ thống** mới kích hoạt mô hình ngôn ngữ (LLM) để sinh đoạn tóm tắt giải thích tự nhiên theo nhu cầu (`On-demand Explanation`) cho riêng SKU đó (kèm cơ chế lưu tạm/cache trong phiên làm việc để không phải gọi lại nếu mở lại).<br>- *(Tùy chọn)* **Actor** điều chỉnh số lượng đặt mua hoặc chọn lại Nhà cung cấp khác từ danh sách các NCC khả dụng của SKU đó. Hệ thống cập nhật lại các chỉ số dự kiến. |
| **6** | **Actor** | Xác nhận phê duyệt phương án mua hàng (toàn bộ hoặc các dòng SKU đã chọn). |
| **7** | **Hệ thống** | Thực thi ghi nhận và tạo đơn:<br>a. Lưu trữ phương án mua hàng đã được duyệt (ghi nhận cả số liệu gợi ý gốc và số liệu thực tế được duyệt).<br>b. Tự động gom nhóm các SKU theo từng Nhà cung cấp đã chọn để sinh các bản ghi Đơn mua hàng (`Purchase Order`) ở trạng thái `Approved`. |
| **8** | **Hệ thống** | Thông báo kết quả phê duyệt thành công (hiển thị danh sách các mã PO vừa được khởi tạo) và kết thúc phiên làm việc. |

---

## 6. Luồng Rẽ Nhánh (Alternative Flows)

### AF-1: Tồn kho an toàn, không phát sinh nhu cầu mua hàng
* **Điều kiện:** Tại Bước 2-3, sau khi tính toán, hệ thống ghi nhận toàn bộ SKU trong phạm vi phân tích đều có mức tồn kho an toàn trên `Reorder Point` trong suốt chu kỳ rà soát.
* **Xử lý:**
  1. Hệ thống hiển thị thông báo tình trạng tồn kho đang ở mức an toàn, không có mặt hàng nào cần đặt bổ sung.
  2. Actor xem xét tổng quan sức khỏe tồn kho và xác nhận đóng phiên. Flow kết thúc mà không phát sinh Đơn mua hàng.

### AF-2: Actor loại bỏ một số mặt hàng khỏi đợt mua
* **Điều kiện:** Tại Bước 5, Actor nhận thấy một số mặt hàng chưa cần nhập thêm hoặc muốn hoãn đợt mua.
* **Xử lý:**
  1. Actor bỏ chọn dòng SKU hoặc đặt số lượng mua về `0`.
  2. Tại Bước 7, hệ thống chỉ gom nhóm và sinh PO cho các SKU có số lượng duyệt lớn hơn `0`.

### AF-3: Lưu nháp phiên phân tích (Draft Session)
* **Điều kiện:** Tại Bước 4 hoặc 5, Actor đang rà soát nhưng bận công việc khác hoặc cần thêm thời gian tham khảo và chưa muốn chốt đơn ngay.
* **Xử lý:**
  1. Actor chọn chức năng **Lưu nháp phiên phân tích** (`Save Draft Session`).
  2. Hệ thống lưu lại trạng thái phân tích hiện tại cùng các tùy chỉnh dở dang của Actor.
  3. Hệ thống chưa sinh bất kỳ `Purchase Order` nào. Phiên phân tích có thể được mở lại để tiếp tục xem xét và phê duyệt sau.

### AF-4: Điều chỉnh số lượng vi phạm điều kiện MOQ của nhà cung cấp
* **Điều kiện:** Tại Bước 5, Actor nhập số lượng mua nhỏ hơn Số lượng đặt hàng tối thiểu (`MOQ`) do Nhà cung cấp quy định.
* **Xử lý:**
  1. Hệ thống hiển thị cảnh báo vi phạm ràng buộc MOQ của NCC được chọn.
  2. Hệ thống gợi ý:
     * Nâng số lượng mua lên bằng mức `MOQ`; hoặc
     * Chọn Nhà cung cấp khác có `MOQ` nhỏ hơn phù hợp với số lượng mong muốn.
  3. Actor điều chỉnh lại cho phù hợp trước khi tiếp tục phê duyệt.

---

## 7. Luồng Ngoại Lệ (Exception Flows)

### EF-1: Dữ liệu vận hành đầu vào thiếu hoặc không hợp lệ
* **Điều kiện:** Tại Bước 2, hệ thống phát hiện có SKU cần bổ sung hàng nhưng chưa được gán Nhà cung cấp khả dụng nào, hoặc thiếu dữ liệu tồn kho hiện tại.
* **Xử lý:**
  1. Hệ thống gắn cờ cảnh báo bất thường (`Missing Data`) cho SKU đó.
  2. SKU bị gắn cờ được loại trừ khỏi danh sách đề xuất mua tự động.
  3. Hệ thống thông báo rõ nội dung thiếu sót và hướng dẫn người dùng hoàn thiện dữ liệu ở `UC-05` (Sản phẩm) hoặc `UC-06` (Nhà cung cấp) trước khi có thể tạo đơn mua cho mặt hàng này.

### EF-2: Dịch vụ LLM tạo giải thích gặp sự cố (Timeout hoặc mất kết nối)
* **Điều kiện:** Tại Bước 5, khi Actor bấm xem giải thích AI cho một SKU, quá trình gọi mô hình ngôn ngữ không phản hồi hoặc trả về lỗi.
* **Xử lý:**
  1. Hệ thống hiển thị thông báo lỗi cục bộ ngay tại vùng/panel giải thích của SKU đó: *"Không thể tạo giải thích tự nhiên lúc này. Vui lòng thử lại sau."*
  2. Bảng kết quả tổng thể và toàn bộ các chỉ số định lượng (Dự báo nhu cầu, Mức tồn kho, Số lượng đề xuất, Bảng xếp hạng NCC) vẫn hoạt động bình thường.
  3. **Tiến trình nghiệp vụ xem xét, điều chỉnh và phê duyệt mua hàng của Actor không bị gián đoạn, vẫn tiếp diễn bình thường.**

---

## 8. Quy Tắc Nghiệp Vụ Liên Quan (Business Rules)

* **BR-01 (Inventory & Demand Calculation):** Quy tắc tính toán nhu cầu mua (dự báo bán, `Safety Stock`, `Reorder Point`, và `Suggested Order Quantity` có tính đến tồn kho hiện tại và hàng đang trên đường về). Số lượng đề xuất ban đầu của hệ thống luôn tự động làm tròn tối thiểu bằng hoặc là bội số của `MOQ` của nhà cung cấp được chọn.
* **BR-02 (Supplier Scoring & Ranking):** Quy tắc chuẩn hóa dữ liệu và tính điểm xếp hạng Nhà cung cấp dựa trên 4 tiêu chí trọng số: Đơn giá, `Lead Time`, `MOQ`, và Lịch sử giao hàng thực tế.
* **BR-03 (Order Constraints & MOQ Check):** Quy tắc kiểm tra ràng buộc điều kiện đặt hàng:
  * Hệ thống tự động làm tròn theo MOQ trong đề xuất ban đầu (BR-01).
  * Khi người dùng tự tay điều chỉnh số lượng mua nhỏ hơn `MOQ`, hệ thống hiển thị cảnh báo vi phạm và gợi ý nâng số lượng hoặc chọn NCC khác.
* **BR-04 (Purchase Order Grouping):** Quy tắc gom các SKU có cùng Nhà cung cấp đã chọn vào duy nhất một bản ghi `Purchase Order` trong cùng một phiên phê duyệt.
* **BR-05 (ABC-XYZ Classification):** Quy tắc phân loại mặt hàng dựa trên dữ liệu bán hàng lịch sử:
  * Phân loại ABC theo tỷ trọng đóng góp doanh thu tích lũy: Nhóm A (~80%), Nhóm B (~15%), Nhóm C (~5%).
  * Phân loại XYZ theo hệ số biến thiên nhu cầu $CV = \sigma / \mu$: Nhóm X ($CV \le 0.5$), Nhóm Y ($0.5 < CV \le 1.0$), Nhóm Z ($CV > 1.0$).
  * Ngưỡng phân loại được cố định chuẩn công nghiệp trong mã nguồn hệ thống, phục vụ hiển thị nhãn ưu tiên và làm ngữ cảnh cho LLM Explainability khi được kích hoạt.

---

## 9. Ràng Buộc & Yêu Cầu Đặc Thù

* **Khả năng giải thích theo nhu cầu (On-Demand Explainability):** Mỗi khuyến nghị mua hàng phải cung cấp tối thiểu 2 tầng thông tin:
  * Tầng định lượng: Số liệu tồn kho, dự báo bán, điểm số so sánh NCC (hiển thị tức thì trên bảng).
  * Tầng tự nhiên: Đoạn tóm tắt ngắn gọn do LLM sinh theo nhu cầu (`On-demand`) khi người dùng bấm yêu cầu giải thích cho SKU cụ thể, chỉ ra lý do cốt lõi (*Vì sao cần mua*, *Vì sao chọn NCC này*).
* **Khả năng chịu lỗi của AI (AI Resiliency):** Mô hình LLM đóng vai trò hỗ trợ diễn đạt và tổng hợp theo nhu cầu, tuyệt đối không được trở thành điểm nghẽn đơn lẻ (*Single Point of Failure*) làm chậm trễ hoặc tê liệt quy trình mua hàng của cửa hàng.

