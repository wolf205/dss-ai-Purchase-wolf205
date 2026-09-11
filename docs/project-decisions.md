# Project Decisions

File này lưu các quyết định quan trọng đã được người dùng xác nhận.

Chỉ ghi:

* Quyết định đã Confirmed.
* Các nguyên tắc ảnh hưởng đến nhiều tài liệu.
* Các quyết định cần được duy trì xuyên suốt project.

Không ghi:

* Ý tưởng tạm thời.
* Proposal chưa được xác nhận.
* Trao đổi chưa kết luận.

---

## Decision Template

```text
## [Decision Name]

Status: Confirmed

Decision:
...

Reason:
...

Impact:
...
```

---

## Current Decisions

### Project Type

Status: Confirmed

Decision:

Hệ thống là **Decision Support System (DSS)** cho một cửa hàng bán lẻ đơn lẻ.

---

### AI Decision Principle

Status: Confirmed

Decision:

> AI recommends. Human decides.

AI hỗ trợ dự báo, phân tích và khuyến nghị.

Người dùng nghiệp vụ đưa ra quyết định cuối cùng.

---

### Simple Goods Receipt & Closed-Loop Feedback

Status: Confirmed

Decision:

Hệ thống bổ sung bước ghi nhận Nhận hàng đơn giản (`Simple Goods Receipt`) sau khi tạo `Purchase Order` để ghi nhận ngày giao thực tế và số lượng thực nhận.

Reason:

Đóng kín vòng lặp dữ liệu thực tế giúp hệ thống đo lường hiệu suất giao hàng thực tế của nhà cung cấp (`Supplier Performance`), từ đó phục vụ đánh giá nhà cung cấp cho các đợt mua tiếp theo.

Impact:

Không mở rộng thành WMS chuyên sâu; chỉ ghi nhận các trường thông tin tối thiểu phục vụ cập nhật tồn kho và chỉ số nhà cung cấp.

---

### Supplier Evaluation Approach

Status: Confirmed

Decision:

Đánh giá và xếp hạng nhà cung cấp dựa trên bộ tiêu chí nghiệp vụ (Đơn giá, `Lead Time`, `MOQ`, Lịch sử giao hàng). Không áp dụng thuật toán tối ưu chia nhỏ đơn hàng cho nhiều nhà cung cấp.

Reason:

Minh bạch, dễ giải thích, phù hợp với quy mô vận hành của một cửa hàng bán lẻ đơn lẻ.

Impact:

Hệ thống gợi ý một nhà cung cấp có điểm số phù hợp nhất cho mỗi mặt hàng, đồng thời cho phép người dùng tùy chọn lại.

---

### Expiry Tracking Exclusion

Status: Confirmed

Decision:

Quản lý hạn sử dụng và phân lô chi tiết (`Batch / Expiry Tracking`) thuộc `Out-of-Scope` của đồ án.

Reason:

Kiểm soát độ phức tạp của đồ án tốt nghiệp, tập trung giải quyết bài toán cốt lõi về cân bằng giữa thiếu hàng (`Stockout`) và dư thừa (`Overstock`).

Impact:

Cấu trúc dữ liệu sản phẩm và tồn kho không cần quản lý thông tin lô hàng phức tạp.

---

### Explainability with On-Demand LLM Summary

Status: Confirmed

Decision:

Sử dụng mô hình ngôn ngữ (LLM) để tổng hợp thành đoạn tóm tắt giải thích tự nhiên lý do đề xuất (`Why Buy`) dựa trên các kết quả tính toán định lượng của hệ thống. Quá trình sinh giải thích này được thực hiện theo nhu cầu (`On-demand`) khi người dùng chủ động bấm xem giải thích cho một sản phẩm cụ thể trên bảng đề xuất, thay vì sinh hàng loạt đồng thời cho toàn bộ danh sách. Kết quả giải thích được lưu tạm (cache) trong phiên làm việc.

Reason:

Loại bỏ độ trễ lớn (latency 30-60s) khi tải bảng kết quả phân tích mua hàng ban đầu, tiết kiệm chi phí token/quota API và tránh chạm giới hạn tần suất gọi API (rate limit), đồng thời phản ánh đúng nhu cầu thực tế của người dùng (chỉ tra cứu sâu ở các mặt hàng có nghi vấn hoặc biến động lớn).

Impact:

Chuỗi tính toán DSS ban đầu tại UC-01 hoàn tất tức thì (< 1s) với đầy đủ số liệu định lượng (Dự báo, Tồn kho, ROP, Điểm NCC, ABC-XYZ). LLM chỉ được gọi riêng lẻ khi có tương tác click của người dùng, đảm bảo hệ thống phản hồi mượt mà và không bao giờ bị nghẽn quy trình phê duyệt.

---

### On-Demand Purchase Review Trigger

Status: Confirmed

Decision:

Đợt phân tích mua hàng được kích hoạt theo nhu cầu (`On-demand`) bởi người dùng, thay vì hệ thống tự động quét nền liên tục.

Reason:

Phù hợp với chu kỳ làm việc thực tế định kỳ của người quản trị cửa hàng bán lẻ.

Impact:

Giao diện cung cấp chức năng cho người dùng chủ động khởi tạo phiên phân tích và đề xuất mua hàng.

---

### Actors & Role Separation

Status: Confirmed

Decision:

Hệ thống phân định 2 Actor nghiệp vụ: `Purchasing Staff` (chuyên trách vận hành mua hàng hàng ngày) và `Store Manager` (quản trị danh mục, chính sách cung ứng, cấu hình tham số DSS). `Store Manager` có quyền kế thừa và thực hiện toàn bộ nghiệp vụ của `Purchasing Staff`.

Reason:

Phản ánh đúng thực tế phân công lao động trong một cửa hàng bán lẻ; vừa bảo đảm tính phân quyền kiểm soát dữ liệu gốc, vừa linh hoạt khi người quản lý cần trực tiếp xử lý đơn hàng.

Impact:

Thiết kế Use Case và phân quyền giao diện được chia rõ ràng theo 2 nhóm vai trò; không gộp chung một Actor mơ hồ.

---

### Use Case Model Scope & Granularity

Status: Confirmed

Decision:

Chốt danh mục 7 Use Cases cốt lõi và bổ trợ; tích hợp toàn bộ quy trình DSS (dự báo, tính tồn kho, chấm điểm NCC, giải thích LLM, điều chỉnh và duyệt) vào 1 Use Case cốt lõi duy nhất (UC-01); không tách nhỏ CRUD/Screen; không mở rộng sang MLOps/AutoML so sánh thuật toán hay hệ thống WMS chuyên sâu.

Reason:

Bảo đảm tính tập trung vào bài toán cốt lõi của DSS (What, When, How much, Which Supplier, Why buy); kiểm soát phạm vi và độ phức tạp phù hợp với đồ án tốt nghiệp.

Impact:

Các tài liệu Use Case và thiết kế hệ thống tiếp theo sẽ bám sát 7 Use Cases này làm khung phân tích chuẩn mực.

---

### Direct PO Creation with Approved Status & Draft Session

Status: Confirmed

Decision:

Khi người dùng phê duyệt phương án mua tại UC-01, hệ thống tự động sinh các Đơn mua hàng (`Purchase Order`) ở trạng thái `Approved`. Đồng thời, UC-01 cung cấp khả năng lưu nháp phiên phân tích (`Draft Session`) nếu người dùng chưa muốn chốt duyệt ngay.

Reason:

Loại bỏ hiện tượng "phê duyệt 2 lần" gây phiền toái cho nhân viên cửa hàng; phân định ranh giới rành mạch giữa Ra quyết định (UC-01) và Thực thi / Gửi đơn hàng (UC-02).

Impact:

UC-02 chỉ tập trung vào việc tra cứu, in/xuất file PO gửi đối tác và theo dõi tiến độ, không lặp lại thao tác duyệt đơn.

---

### Implicit Human Override Tracking

Status: Confirmed

Decision:

Hệ thống tự động ghi nhận song song cả số liệu đề xuất gốc của DSS và số liệu thực tế được con người phê duyệt (`Suggested` vs `Approved`), nhưng không bắt buộc người dùng phải nhập lý do giải thích bằng văn bản (`Override Reason`).

Reason:

Cung cấp đầy đủ dữ liệu định lượng để đánh giá độ chính xác và mức độ chấp thuận của người dùng đối với DSS (rất có giá trị cho đồ án tốt nghiệp) mà không gây cản trở hay tạo gánh nặng thao tác cho nhân viên cửa hàng.

Impact:

Cấu trúc lưu trữ phương án mua hàng sẽ có các trường đối chiếu ngầm; giao diện người dùng duy trì sự tối giản và nhanh gọn.

---

### PO Immutability & Cancellation with On-Order Reversal

Status: Confirmed

Decision:

Đơn mua hàng sau khi sinh ra từ UC-01 là cố định (không cho phép sửa số lượng hay đổi SKU trực tiếp tại UC-02). Cho phép Hủy đơn mua hàng (`Cancel PO`) khi ở trạng thái `Approved`; khi hủy, bắt buộc phải chọn/nhập lý do hủy đơn (`Cancellation Reason`) để phục vụ lưu vết lịch sử và đánh giá nhà cung cấp. Khi hủy, hệ thống tự động hoàn trả/giảm trừ lượng hàng đang về (`On-order quantity`) của các SKU tương ứng.

Khi xuất file hoặc in đơn mua hàng tại UC-02, hệ thống tự động ghi nhận thời điểm xuất file gần nhất (`Last Exported At`) dưới dạng metadata mà vẫn giữ nguyên trạng thái cốt lõi của đơn là `Approved`.

Reason:

Bảo vệ tính toàn vẹn của kết quả tối ưu DSS; việc giảm trừ `On-order` khi hủy đơn giúp thuật toán DSS ở UC-01 tự động nhận diện lại nhu cầu thiếu hụt trong đợt phân tích tiếp theo mà không cần xử lý thủ công; việc ghi nhận lý do hủy và thời điểm xuất file hỗ trợ giám sát tiến độ và kiểm soát chất lượng cung ứng mà không làm phức tạp hóa vòng đời trạng thái PO.

Impact:

Mọi sai lệch giao hàng thực tế sẽ ghi nhận tại UC-03; UC-02 hỗ trợ nút Hủy đơn (yêu cầu lý do hủy), tự động kích hoạt logic cập nhật `On-order`, hiển thị cảnh báo quá hạn giao (`Overdue Alert`), và lưu vết `Last Exported At` khi xuất đơn.

---

### Exclusion of Manual PO Creation

Status: Confirmed

Decision:

100% Đơn mua hàng trong hệ thống đều phải bắt nguồn từ phương án mua được phê duyệt tại UC-01. Không hỗ trợ tính năng tạo PO thủ công ("nhập chay") ngoài hệ thống.

Reason:

Tập trung tối đa vào bài toán cốt lõi của đồ án tốt nghiệp là Decision Support System (DSS); tránh mở rộng phạm vi sang phần mềm quản lý kho/bán hàng ERP thông thường.

Impact:

Loại bỏ form tạo PO thủ công tại UC-02, giảm thiểu độ phức tạp và nguy cơ dữ liệu không được kiểm soát qua DSS.

---

### ABC-XYZ Inventory Classification for Prioritization and LLM Context

Status: Confirmed

Decision:

Tích hợp ma trận phân loại tồn kho ABC-XYZ tự động ngầm dựa trên lịch sử bán hàng (`Sales History`) trong chu trình phân tích tại UC-01. Cố định các ngưỡng phân loại chuẩn công nghiệp trong mã nguồn hệ thống (ABC: 80% / 15% / 5% doanh thu; XYZ: hệ số biến thiên $CV \le 0.5$ / $1.0$ / $>1.0$).

Kết quả phân loại được sử dụng cho hai mục đích chính:
1. Hiển thị trực quan nhãn phân loại (Badge) và bộ lọc/sắp xếp theo nhóm ABC-XYZ trên bảng đề xuất tại UC-01 để hỗ trợ người dùng ưu tiên xem xét các mặt hàng trọng yếu.
2. Cung cấp ngữ cảnh phong phú cho mô hình ngôn ngữ (LLM) để sinh nội dung giải thích lý do đề xuất (`Why Buy`) mang tính nghiệp vụ quản trị chuỗi cung ứng.

Phân loại ABC-XYZ không làm thay đổi công thức tính tồn kho cơ bản (`Safety Stock` và `Reorder Point` vẫn áp dụng mức `Target Service Level` chung từ UC-07) và không mở thêm màn hình cấu hình ngưỡng tại UC-07. Không tạo Use Case riêng cho chức năng này.

Reason:

Gia tăng tính học thuật và giá trị thực tế của giải pháp DSS trong đồ án tốt nghiệp ngành Hệ thống thông tin / Chuỗi cung ứng, nâng cao chất lượng diễn đạt lý do đề xuất của LLM mà không làm phát sinh sự phức tạp về mặt vận hành hay phá vỡ ranh giới Use Case đã tinh gọn.

Impact:

UC-01 bổ sung bước xử lý tính toán ABC-XYZ ngầm, hiển thị badge phân loại và bộ lọc trên giao diện đề xuất, đồng thời đưa nhãn phân loại vào prompt của LLM. Phạm vi hệ thống vẫn duy trì 7 Use Cases cốt lõi.

---

### Goods Receipt Constraints (Partial Delivery, Over-delivery, Rejection & Returns)

Status: Confirmed

Decision:

1. **Không Partial Delivery:** Mỗi PO chỉ nhận hàng 1 lần duy nhất. Giao thiếu vẫn đóng PO sang `Completed`, phần thiếu hụt làm giảm điểm Fulfillment Rate. DSS sẽ tự bù đắp thiếu hụt vào đợt tính toán sau.
2. **Cho phép Over-delivery có cảnh báo:** Cho phép nhập thực nhận > số lượng đặt để tồn kho thực tế luôn chính xác, nhưng có cảnh báo (Soft Warning) để tránh gõ nhầm. Điểm Fulfillment Rate bị khóa ở mức tối đa 100% (không thưởng điểm cho giao dư).
3. **Từ chối nhận 100% & Giao lại (100% Rejection):** Nếu từ chối nhận toàn bộ hàng tại thời điểm giao, nhân viên không bấm xác nhận nhận hàng, giữ PO ở trạng thái `Approved` để NCC giao lại ngoài đời thực. Không reset ngày giao dự kiến ban đầu (nếu giao lại muộn vẫn tính là trễ hạn). Chặn không cho xác nhận nhận hàng nếu số lượng thực nhận của toàn bộ SKU bằng 0.
4. **Không luồng Return riêng:** Hàng lỗi/hư hỏng trả lại ngay lúc giao; nhân viên chỉ nhập số lượng hàng nguyên vẹn thực tế nhận vào hệ thống. Màn hình nhận hàng mặc định điền sẵn số lượng đặt để tối ưu thao tác, và hỗ trợ ô Ghi chú tùy chọn.

Reason:

Giữ quy trình nhận hàng ở mức cơ bản ("Simple Goods Receipt") phục vụ khép kín vòng lặp dữ liệu DSS mà không làm phình to scope hệ thống thành WMS chuyên sâu. Việc cho phép Over-delivery đảm bảo tồn kho (đầu vào của DSS) luôn chính xác nhất. Cơ chế giữ PO Approved khi từ chối nhận 100% phản ánh đúng bản chất thời gian giao hàng và phạt trễ hạn chính xác mà không cần tạo thêm trạng thái phức tạp.

Impact:

UC-03 được thiết kế tinh gọn, tập trung vào cập nhật tồn kho (`Current Inventory`) và giải phóng hàng đang về (`On-order`). Tỷ lệ giao đủ hàng (`Fulfillment Rate`) có công thức cap ở 100%. Không có Use Case phụ cho việc quản lý hàng lỗi hoặc theo dõi nợ đọng PO.

---

### Operational Data Import Strategy (All-or-Nothing & De-duplication Overwrite)

Status: Confirmed

Decision:

1. **All-or-Nothing Validation:** File dữ liệu nạp vào (Bán hàng hoặc Tồn kho) phải hợp lệ 100% mới được chấp thuận ghi vào cơ sở dữ liệu. Nếu có bất kỳ dòng nào vi phạm, từ chối nạp toàn bộ tệp và báo lỗi chi tiết theo từng dòng để người dùng sửa triệt để.
2. **Sales De-duplication & Date Overwrite:** Dữ liệu bán hàng quản lý theo mốc ngày `(Date, SKU, Quantity, Revenue)`. Nếu phát hiện tệp chứa các ngày đã có dữ liệu trong hệ thống, bắt buộc phải cảnh báo người dùng và thực hiện **ghi đè (overwrite)** số liệu của ngày đó sau khi người dùng xác nhận, tuyệt đối không tự động cộng dồn làm nhân đôi doanh số bán hàng.
3. **Physical Inventory Overwrite & On-Order Preservation:** Nạp tệp kiểm kê tồn kho chỉ ghi đè số lượng đếm được trên kệ vào `Current Inventory`, hoàn toàn bảo lưu số lượng hàng đang về (`On-order quantity`) của các PO đang ở trạng thái `Approved`.
4. **Chuẩn hóa biểu mẫu:** Cung cấp sẵn file mẫu (`CSV`/`Excel`) chuẩn để người dùng tải về sử dụng.

Reason:

Bảo đảm nguyên tắc "Garbage In, Garbage Out" cho hệ thống DSS. Việc làm sạch dữ liệu 100% trước khi nạp và cơ chế ghi đè ngày trùng lặp giúp bảo vệ các mô hình AI dự báo nhu cầu (`Demand Forecast`) và phân loại tồn kho (`ABC-XYZ`) không bị méo mó bởi dữ liệu rác hoặc dữ liệu nhân đôi sai lệch.

Impact:

UC-04 được thiết kế tập trung vào xác thực và xem trước dữ liệu (Data Preview), loại trừ các cơ chế nhập dở dang phức tạp, đảm bảo luồng dữ liệu sạch và an toàn cho toàn bộ hệ thống.
