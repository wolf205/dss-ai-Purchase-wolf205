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

1. **All-or-Nothing Validation:** File dữ liệu nạp vào (Bán hàng hoặc Tồn kho) phải hợp lệ 100% mới được chấp thuận ghi nhận vào hệ thống (tự động loại bỏ các dòng hoàn toàn trống trước khi kiểm tra). Nếu có bất kỳ dòng nào vi phạm (SKU không tồn tại trong hệ thống, ô trống khuyết thiếu giá trị, số lượng âm, sai ngày, trùng lặp nội bộ tệp), từ chối nạp toàn bộ tệp và báo lỗi chi tiết theo từng dòng để người dùng sửa triệt để.
2. **Sales De-duplication & Date Overwrite:** Dữ liệu bán hàng quản lý theo mốc ngày `(Date, SKU, Quantity, Revenue)`. Nếu phát hiện tệp chứa các ngày đã có dữ liệu trong hệ thống, bắt buộc phải cảnh báo người dùng và thực hiện **ghi đè (overwrite)** số liệu của ngày đó sau khi người dùng xác nhận, tuyệt đối không tự động cộng dồn làm nhân đôi doanh số bán hàng.
3. **Physical Inventory Overwrite, Partial Counting & On-Order Preservation:** Nạp tệp kiểm kê tồn kho cập nhật số lượng đếm được trên kệ vào `Current Inventory` cho các SKU có trong tệp, bảo lưu nguyên vẹn tồn kho của các SKU vắng mặt trong tệp (hỗ trợ kiểm kê luân phiên theo ngành hàng), và hoàn toàn bảo lưu số lượng hàng đang về (`On-order quantity`) của các PO đang ở trạng thái `Approved`.
4. **Chuẩn hóa biểu mẫu:** Cung cấp sẵn file mẫu (`CSV`/`Excel`) chuẩn để người dùng tải về sử dụng.

Reason:

Bảo đảm nguyên tắc "Garbage In, Garbage Out" cho hệ thống DSS. Việc làm sạch dữ liệu 100% trước khi nạp và cơ chế ghi đè ngày trùng lặp giúp bảo vệ các mô hình AI dự báo nhu cầu (`Demand Forecast`) và phân loại tồn kho (`ABC-XYZ`) không bị méo mó bởi dữ liệu rác hoặc dữ liệu nhân đôi sai lệch.

Impact:

UC-04 được thiết kế tập trung vào xác thực và xem trước dữ liệu (Data Preview), loại trừ các cơ chế nhập dở dang phức tạp, đảm bảo luồng dữ liệu sạch và an toàn cho toàn bộ hệ thống.

---

### Product Master Data Lifecycle & Referential Integrity Protection

Status: Confirmed

Decision:

1. **SKU Code Immutability:** Mã SKU là định danh duy nhất toàn cục, không phân biệt hoa/thường, và **bất biến (Immutable) sau khi tạo**. Tuyệt đối không cho phép chỉnh sửa mã SKU.
2. **Soft Deactivation over Hard Delete & Sell-Off Continuity:**
   * Tuyệt đối cấm xóa vĩnh viễn (`Hard Delete`) đối với SKU đã phát sinh bất kỳ liên kết dữ liệu nào (bán hàng, tồn kho, đơn PO, hoặc nhà cung cấp).
   * Cửa hàng dừng kinh doanh thì chuyển trạng thái SKU sang `Inactive`.
   * SKU `Inactive` tự động bị **loại trừ 100%** khỏi bảng phân tích gợi ý mua hàng DSS tại `UC-01` (không bao giờ sinh đề xuất mua mới).
   * Tệp dữ liệu tại `UC-04` vẫn **tiếp nhận bình thường** các bản ghi bán hàng và kiểm kê của SKU `Inactive` để hỗ trợ xả nốt số tồn dư và theo dõi tồn kho thực tế cho đến khi về 0, không gây tắc nghẽn tệp nạp cuối ngày của cửa hàng.
   * Chỉ cho phép Hard Delete khi SKU vừa tạo mới và hoàn toàn chưa có liên kết dữ liệu nào.
3. **Deactivation with Pending On-Order (Cho phép ngừng kinh doanh khi có On-order để xả tồn):** Cho phép chuyển trạng thái SKU sang `Inactive` khi đang có hàng đang chờ về (`On-order > 0`) kèm cảnh báo. SKU `Inactive` bị loại trừ 100% khỏi các đợt gợi ý mua mới tại `UC-01`, nhưng lượng hàng đang về vẫn được nhập kho bình thường tại `UC-03` để cửa hàng bán xả nốt số hàng tồn.
4. **Initial Inventory Zeroing:** Khi tạo mới SKU, tồn kho ban đầu mặc định bằng 0 (`Current Inventory = 0`, `On-order = 0`). Tồn kho thực tế được cập nhật thông qua kiểm kê (`UC-04`) hoặc nhận hàng (`UC-03`).
5. **Form-only Catalog Management:** Quản lý danh mục sản phẩm qua Form giao diện trực quan; tính năng nạp hàng loạt danh mục từ tệp được đưa ra ngoài phạm vi ban đầu.

Reason:

Bảo vệ tính toàn vẹn của chuỗi dữ liệu lịch sử bán hàng và đơn hàng (đầu vào cốt lõi của các mô hình dự báo AI và phân loại ABC-XYZ trong DSS); tránh lỗi phân mảnh hoặc mồ côi dữ liệu (orphaned records); đồng thời duy trì tính thông suốt cho quy trình xả hàng và kiểm soát kho thực tế mà không làm ảnh hưởng đến quyết định mua hàng của DSS.

Impact:

UC-05 được đặc tả chặt chẽ với cơ chế bảo vệ tham chiếu (BR-17, BR-18, BR-19, BR-20), giao diện tối giản qua form nhập liệu trực tiếp, hỗ trợ tìm kiếm/lọc ngành hàng và phân quyền rõ ràng giữa Store Manager (toàn quyền) và Purchasing Staff (chỉ xem). Đồng bộ với UC-04 và UC-01.

---

### Supplier Master Data, Supply Conditions & Cold Start Scoring

Status: Confirmed

Decision:

1. **Supplier Code Immutability:** Mã Nhà cung cấp là định danh duy nhất toàn cục, không phân biệt hoa/thường, và **bất biến (Immutable) sau khi tạo**.
2. **PO Price & Terms Snapshot:** Mọi thay đổi về Đơn giá nhập, Lead Time cam kết, hoặc MOQ tại UC-06 chỉ có hiệu lực cho các lần chạy DSS trong tương lai; toàn bộ các Đơn mua hàng cũ đã duyệt tại UC-02 bảo lưu vĩnh viễn mức giá và điều kiện tại thời điểm tạo.
3. **Supply Discontinuation Constraints:**
   * Chặn cứng không cho ngừng cung ứng một SKU nếu đang có đơn PO `Approved` của chính NCC này chứa SKU đó.
   * Cảnh báo mềm nếu NCC này là đối tác duy nhất của một SKU để người dùng lường trước nguy cơ gián đoạn nguồn cung tại DSS.
4. **Supplier Deactivation Guard & Hard Delete Prohibition:**
   * Chặn Hard Delete nếu NCC đã từng có đơn PO hoặc có SKU liên kết; chuyển sang `Inactive` khi ngừng hợp tác.
   * Chặn chuyển sang `Inactive` nếu NCC đang có đơn PO `Approved` chờ giao.
   * NCC `Inactive` tự động bị loại trừ hoàn toàn khỏi thuật toán chấm điểm và xếp hạng tại UC-01.
5. **Cold Start Supplier Neutral Scoring (Điểm tín nhiệm 80% cho Đối tác mới):**
   * Đối tác mới chưa có lịch sử giao hàng (< 3 đơn `Completed POs` từ UC-03) được hệ thống tạm tính điểm tiêu chí Lịch sử giao hàng ở mức chuẩn **80% (mức Khá)** trong công thức xếp hạng BR-02 để có cơ hội cạnh tranh công bằng về Giá, Lead Time và MOQ.
   * Giao diện gắn nhãn nhận diện trực quan: `[NCC Mới - Điểm khởi tạo: 80%]`.
6. **Rolling 5-Order Performance Window (Cửa sổ trượt 5 đơn gần nhất):**
   * Khi NCC đã hoàn tất từ 5 đơn hàng trở lên, tiêu chí Lịch sử giao hàng phục vụ thuật toán DSS tại UC-01 được tính toán dựa trên **đúng 5 đơn hàng hoàn tất gần nhất** (thay vì tính tích lũy toàn bộ lịch sử) để phản ánh nhạy bén phong độ hiện tại của đối tác.
   * Giao diện UC-06 hiển thị song song cả 2 chỉ số: Phong độ 5 đơn gần nhất (cho DSS) và Tích lũy toàn thời gian (cho quản trị).

Reason:

Bảo đảm tính công bằng khi đánh giá đối tác mới mà không phá vỡ cấu trúc ma trận trọng số thống nhất của DSS; ngăn chặn triệt để xung đột trạng thái khi hàng đang trên đường về; loại bỏ hiện tượng quán tính lịch sử làm sai lệch khuyến nghị mua hàng bằng cơ chế cửa sổ trượt 5 đơn gần nhất; bảo vệ tính toàn vẹn của lịch sử mua hàng và snapshot giá đơn hàng.

Impact:

UC-06 được đặc tả toàn diện với các quy tắc chặt chẽ (BR-21, BR-22, BR-23, BR-24), liên kết mật thiết với UC-01 (cung cấp dữ liệu chấm điểm theo phong độ 5 đơn gần nhất), UC-03 (tiếp nhận chỉ số giao hàng thực tế) và UC-05 (sử dụng danh mục SKU Active).

---

### DSS Parameter Configuration Scope & Policy Baseline

Status: Confirmed

Decision:

1. **Focused Parameter Scope (Phạm vi tham số tập trung):**
   * UC-07 giới hạn chặt chẽ ở đúng 2 nhóm tham số cốt lõi: Bộ 4 trọng số đánh giá NCC ($w_{Price}, w_{LeadTime}, w_{MOQ}, w_{History}$) và Chính sách Tồn kho (`Target Service Level`, `Review Period`).
   * Các ngưỡng phân loại ABC-XYZ được cố định trong mã nguồn, không đưa vào giao diện cấu hình nhằm tránh hiện tượng quá tải tham số (`Parameter Bloat`).
2. **Supplier Weight Normalization Constraint:**
   * Bắt buộc $\sum w_i = 100\%$ ($w_i \ge 0\%$). Khóa nút Lưu nếu tổng tỷ trọng khác 100%.
3. **Discrete Service Level to Z-Factor Mapping:**
   * Mức phục vụ mong muốn được lựa chọn qua 4 mốc chuẩn công nghiệp (90% $\rightarrow Z=1.28$, 95% $\rightarrow Z=1.65$, 98% $\rightarrow Z=2.05$, 99% $\rightarrow Z=2.33$) để tự động hóa việc tính toán `Safety Stock` tại UC-01 mà không đòi hỏi người dùng có kiến thức thống kê chuyên sâu.
4. **Review Period Operational Bounds:**
   * Giới hạn chu kỳ rà soát đặt hàng trong khoảng $1 \le R \le 30$ ngày, phù hợp với nhịp độ vận hành thực tế của một cửa hàng bán lẻ đơn lẻ.
5. **Default Baseline & Reset Action:**
   * Cung cấp bộ cấu hình khuyến nghị ban đầu: Giá 40%, Lead Time 20%, MOQ 15%, Lịch sử 25%; Service Level 95%; Review Period 7 ngày.
   * Cung cấp nút "Khôi phục mặc định" (`Reset to Defaults`) để nhanh chóng quay về trạng thái an toàn.
6. **Forward-Looking Non-Retroactive Application:**
   * Cấu hình mới áp dụng tức thì cho các lần chạy DSS tại UC-01 tiếp theo, không áp dụng hồi tố cho các đơn PO cũ tại UC-02.

Reason:

Tối ưu hóa tính khả dụng và tính thực tiễn của DSS; trao quyền cho Quản lý cửa hàng định hướng chiến lược mua hàng một cách trực quan, minh bạch; bảo đảm tính toàn vẹn toán học của các thuật toán xếp hạng và tính tồn kho an toàn.

Impact:

UC-07 hoàn tất chuỗi 7 Use Cases của dự án, cung cấp bộ quy tắc chuẩn hóa (BR-25, BR-26, BR-27, BR-28), phân quyền rõ ràng (Store Manager cấu hình, Purchasing Staff xem Read-only), kết nối trực tiếp với logic tính toán tại UC-01.

---

### Deterministic Inventory Formulas & Hybrid Fallback Strategy

Status: Confirmed

Decision:

Hệ thống sử dụng các công thức học thuật chuẩn chuỗi cung ứng làm nòng cốt cho tầng tính toán nghiệp vụ tất định (Business Calculation):
1. **Safety Stock:** $SS = Z \times \sigma_d \times \sqrt{L}$ với $Z$ ánh xạ từ Service Level và $\sigma_d$ đo lường biến động nhu cầu lịch sử.
2. **Reorder Point:** $ROP = (d_{\text{forecast}} \times L) + SS$.
3. **Suggested Order Quantity:** Bù đắp lượng hàng thiếu hụt đến mức mục tiêu trong khoảng thời gian bảo vệ $(L + R)$ trừ đi tồn kho khả dụng $(I_{\text{on\_hand}} + I_{\text{on\_order}})$, tự động nâng lên theo MOQ và làm tròn số nguyên.
4. **Cơ chế Fallback:** Đối với SKU mới bán $< 14$ ngày chưa đủ mẫu tính $\sigma_d$ tin cậy, áp dụng ước lượng nhanh $SS_{\text{fallback}} = \bar{d} \times \text{Safety Days}$ (với Safety Days mặc định 5 ngày).

Reason:

Bảo đảm tính khoa học và cơ sở học thuật vững chắc cho đồ án tốt nghiệp ngành Hệ thống thông tin / Chuỗi cung ứng; đồng thời giải quyết triệt để bài toán thiếu dữ liệu thực tế tại cửa hàng bán lẻ mà không làm gián đoạn chu trình phân tích của DSS.

Impact:

Toàn bộ 28 Business Rules (đặc biệt là BR-01) có cơ sở toán học rõ ràng, vận hành tất định (cùng đầu vào luôn cho cùng đầu ra), minh bạch và giải thích được (Explainability), loại bỏ hoàn toàn hiện tượng "hộp đen" trong đề xuất mua hàng.

---

### Supplier Performance On-Time Penalty Decay Model

Status: Confirmed

Decision:

Hệ thống áp dụng mô hình phạt trễ hạn suy giảm tuyến tính (Linear Penalty Decay) để tính hệ số thời gian (`On-Time Factor`) khi đánh giá đơn hàng hoàn tất tại UC-03, thay vì sử dụng mô hình nhị phân (0-1) cứng nhắc:
1. Xác định số ngày trễ thực tế: $Days_{\text{late}} = \max(0, Date_{\text{actual}} - Date_{\text{expected}})$.
2. Thiết lập ngưỡng trễ tối đa cho phép là $T_{\text{grace}} = 3$ ngày (tương đương khoảng 50% mức tồn kho an toàn chuẩn của cửa hàng).
3. Công thức tính hệ số thời gian:
   $$\text{On-Time Factor} = \begin{cases} 1.0 & \text{khi } Days_{\text{late}} = 0 \text{ (Đúng hạn)} \\ \max\left(0, 1 - \frac{Days_{\text{late}}}{3}\right) & \text{khi } Days_{\text{late}} > 0 \text{ (Trễ hạn)} \end{cases}$$
   * Trễ 0 ngày: $\text{On-Time Factor} = 1.0 \rightarrow 50$ điểm thời gian.
   * Trễ 1 ngày: $\text{On-Time Factor} \approx 0.67 \rightarrow 33$ điểm thời gian.
   * Trễ 2 ngày: $\text{On-Time Factor} \approx 0.33 \rightarrow 17$ điểm thời gian.
   * Trễ $\ge 3$ ngày: $\text{On-Time Factor} = 0.0 \rightarrow 0$ điểm thời gian.
4. Điểm hiệu suất của một đơn hàng thành phần: $\text{Order Score} = (\text{On-Time Factor} \times 50) + (\text{Fulfillment Rate} \times 0.5)$.

Reason:

Phản ánh chính xác mức độ tác động thực tế của sự chậm trễ lên kệ hàng: trễ 1 ngày thì tồn kho an toàn (Safety Stock) vẫn hấp thụ được (chưa gây đứt hàng), trong khi trễ từ 3 ngày trở lên sẽ gây nguy cơ đứt hàng và mất doanh thu nghiêm trọng. Đồng thời, mô hình loại bỏ nghịch lý quản trị (perverse incentive), duy trì động lực cho nhà cung cấp khắc phục và giao hàng khẩn cấp ngay vào ngày hôm sau thay vì buông xuôi do bị mất trắng điểm. Đây cũng là điểm nhấn học thuật và giá trị thực tế quan trọng cho đồ án DSS.

Impact:

Đồng bộ công thức tính toán xuyên suốt BR-13, BR-24, UC-03 và thuật toán WSM tại UC-01/UC-06. Giao diện UC-03 và UC-06 ghi nhận số ngày trễ và điểm hiệu suất tương ứng, tạo cơ sở dữ liệu minh bạch cho đánh giá nhà cung cấp.

---

### Domain Model Architecture & Three-Tier Bounded Contexts

Status: Confirmed

Decision:

Xác lập Mô hình Miền Nghiệp vụ (Domain Model) gồm chính xác 13 thực thể khái niệm được phân bổ chặt chẽ theo 3 phân vùng nghiệp vụ (Bounded Contexts) phản ánh đúng chu trình vận hành bán lẻ và triết lý "AI recommends. Human decides":
1. **Dữ liệu Nền tảng (Master Data - 4 thực thể):** `Category`, `Product`, `Supplier`, `SupplyCondition`. Ràng buộc bất biến toàn cục của mã định danh; mô hình hóa quan hệ thương mại qua `SupplyCondition` (bảo lưu snapshot giá); hỗ trợ Inactive SKU khi còn hàng đang về trên PO để xả tồn.
2. **Dữ liệu Vận hành & Cấu hình (Operational & Configuration - 3 thực thể):** `SalesRecord`, `InventorySnapshot`, `DSSConfiguration`. Dữ liệu bán hàng nạp nuôi AI dự báo (không tự động trừ tồn kho kệ, quy ước Zero-Demand); phân định rạch ròi giữa Trạng thái hiện hành trên kệ (`Product.currentInventory`) và Bản ghi kiểm toán lịch sử kiểm đếm (`InventorySnapshot.countedQuantity`); cấu hình Singleton toàn cửa hàng (tổng trọng số 100%, bảo đảm mặc định an toàn).
3. **Động cơ Ra Quyết Định & Vòng Đời Mua Hàng Khép Kín (Decision Core & Procurement Lifecycle - 6 thực thể theo 3 cặp Cha-Con):**
   * *Đề xuất DSS:* `RecommendationSession` *-- `RecommendationItem` (Mô hình Giỏ hàng kế hoạch thông minh; lưu vết song song số liệu gợi ý gốc vs thực tế chốt; tóm tắt LLM sinh On-demand tùy chọn).
   * *Đơn mua hàng:* `PurchaseOrder` *-- `POLineItem` (Sinh ra ở trạng thái `Approved` từ DSS; vòng đời 1 chiều; cấm sửa lẻ dòng, chỉ cho phép Hủy cả đơn PO; tự động đồng bộ biến `On-order`).
   * *Nhận hàng kho & Phản hồi khép kín:* `GoodsReceipt` *-- `ReceiptLineItem` (Đối chiếu 1:1 đơn nhất với PO; cập nhật tồn kho kệ và tất toán On-order; tính toán điểm OTIF suy giảm tuyến tính cập nhật phong độ 5 đơn gần nhất của NCC).

Reason:

Loại bỏ tư duy kế toán/ERP thụ động (nhập liệu thủ công từ đầu); tối ưu hóa luồng làm việc thành một chu trình khép kín mượt mà; bảo đảm tính toàn vẹn toán học và cơ chế kiểm toán đối soát minh bạch; chuẩn hóa 44 Business Invariants làm cầu nối vững chắc cho tầng thiết kế cơ sở dữ liệu kỹ thuật (Data Model).

Impact:

Toàn bộ 13 thực thể và 44 Bất biến nghiệp vụ được chuẩn hóa chính thức tại `docs/business/domain-model.md`, làm cơ sở duy nhất để bước sang thiết kế Data Model (CSDL vật lý), API Contracts và Kiến trúc hệ thống.

---

### Supplier-Level Committed Lead Time

Status: Confirmed

Decision:

Thời gian giao hàng cam kết (`Committed Lead Time`) được quản lý ở cấp độ **Nhà cung cấp (`Supplier.committedLeadTime`)**, thay vì quản lý phân mảnh theo từng sản phẩm cụ thể (`SupplyCondition`). `SupplyCondition` giữa NCC và SKU chỉ quản lý `purchasePrice` (Đơn giá nhập) và `moq` (Số lượng đặt tối thiểu).

Toàn bộ các mặt hàng do cùng một Nhà cung cấp phân phối khi được phê duyệt mua tại UC-01 sẽ được gom vào **duy nhất 1 Đơn mua hàng (`Purchase Order`)** với ngày giao hàng dự kiến được xác định thống nhất:
$$\text{Expected Delivery Date} = \text{Approval Date} + \text{Supplier.committedLeadTime (ngày)}$$

Reason:

1. **Phù hợp bản chất logistics bán lẻ thực tế (Single Retail Store):** Cửa hàng bán lẻ nhập hàng từ các Nhà phân phối (NPP) theo tuyến giao nhận cố định hoặc theo lịch chuyến xe tải của đối tác tới cửa hàng. Toàn bộ các mặt hàng lấy từ một đối tác luôn được vận chuyển chung trên một chuyến xe, do đó Lead Time về bản chất phụ thuộc vào khoảng cách địa lý và lịch trình của NPP tới cửa hàng.
2. **Loại bỏ xung đột gom đơn & nhận hàng:** Bảo toàn nguyên tắc "1 NCC = 1 PO duy nhất" và "Mỗi PO nhận hàng 1 lần duy nhất (No Partial Delivery)". Loại bỏ hoàn toàn nghịch lý lệch pha thời gian giao hàng giữa các SKU trong cùng một đơn PO, đảm bảo việc xác định ngày giao dự kiến và tính toán phạt trễ hạn (`BR-13`, `BR-24`) diễn ra minh bạch, không mâu thuẫn.
3. **Tối ưu trải nghiệm nhập liệu (UX):** Người dùng chỉ cần khai báo Lead Time một lần duy nhất khi tạo/sửa hồ sơ NCC tại UC-06, thay vì phải gõ lặp lại trường này cho hàng chục hoặc hàng trăm SKU được gán.
4. **Xử lý ngoại lệ chuẩn mực:** Trường hợp một đối tác cung ứng cả hai ngành hàng có chuỗi cung ứng độc lập (ví dụ hàng tươi sống giao trong ngày vs hàng khô giao sau vài ngày), cửa hàng sẽ đăng ký thành hai mã đối tác riêng biệt (ví dụ `VINAMILK-FRESH` và `VINAMILK-DRY`) tương ứng với 2 hợp đồng và 2 chuyến xe giao nhận tách biệt, phản ánh đúng chuẩn quản trị chuỗi cung ứng thực tế.

Impact:

- `domain-model.md`: Chuyển thuộc tính `committedLeadTime` từ `SupplyCondition` sang `Supplier`. Cập nhật công thức `PurchaseOrder.expectedDeliveryDate`.
- `business-rules.md`: Cập nhật BR-02 (lấy Lead Time từ Supplier), BR-08 (công thức ngày giao dự kiến), và BR-22 (phạm vi điều kiện báo giá).
- `uc-06-manage-suppliers.md`: Thêm trường `committedLeadTime` vào thông tin hồ sơ Nhà cung cấp; bỏ trường này khỏi bảng gán SKU.

---

### Technical Data Model Specification (PostgreSQL 16+)

Status: Confirmed

Decision:

Thiết lập mô hình dữ liệu quan hệ vật lý chính thức cho hệ thống trên nền tảng **PostgreSQL 16+**, bao gồm **13 Tables** được chia theo 3 Bounded Contexts, hiện thực hóa trực tiếp 13 Domain Entities và 44 Business Invariants:

1. **Khóa & Toàn vẹn tham chiếu (Keys & Referential Integrity):**
   * Sử dụng khóa chính kỹ thuật vô nghĩa `id BIGINT GENERATED ALWAYS AS IDENTITY` cho toàn bộ 13 bảng.
   * Toàn bộ mã định danh tự nhiên (`sku_code`, `supplier_code`, `po_number`, `receipt_number`, `category_code`, `session_code`) được bảo vệ bằng `UNIQUE NOT NULL` và Functional Index `UPPER(...)` chống trùng lặp không phân biệt hoa/thường.
   * Chính sách khóa ngoại: Mặc định áp dụng `ON DELETE RESTRICT` để bảo vệ nguyên tắc Zero-Link Hard Delete. Chỉ áp dụng `ON DELETE CASCADE` cho 3 bảng con phụ thuộc 100% vòng đời cha (`recommendation_items`, `po_line_items`, `receipt_line_items`).

2. **Bảo tồn Bất biến Lịch sử & Khả năng Giải trình (Historical Immutability & Auditability):**
   * Áp dụng lưu thừa có kiểm soát (`Controlled Denormalization`): Sao chép snapshot giá (`historical_unit_price`), MOQ (`historical_moq`) và thời gian giao cam kết (`historical_lead_time_days`) tại thời điểm duyệt đơn PO.
   * Bảng `recommendation_items` lưu snapshot tồn kho kệ (`snapshot_current_inventory`) và hàng đang về (`snapshot_on_order_quantity`) tại thời điểm phân tích để bảo tồn 100% căn cứ tính toán nhu cầu của thuật toán DSS khi kiểm toán lại các phiên cũ.

3. **Lưu trữ Bán cấu trúc JSONB Cho Trực quan hóa & LLM Explainability:**
   * Bổ sung cột `daily_forecasts JSONB` vào `recommendation_items` lưu mảng điểm dự báo từng ngày tương lai kèm biên độ tin cậy để Frontend vẽ biểu đồ chuỗi thời gian biến động chi tiết.
   * Bổ sung cột `supplier_rankings JSONB` vào `recommendation_items` lưu bảng điểm so sánh WSM của các NCC khả dụng tại thời điểm chạy để hiển thị modal so sánh và cung cấp ngữ cảnh cho LLM giải thích.

4. **Chuyển hóa 44 Business Invariants sang Cơ chế 3 Tầng Kỹ thuật:**
   * *Tier 1 (Database Constraints):* 33 Invariants được khóa cứng vật lý ngay tại schema (`NOT NULL`, `CHECK`, `UNIQUE`, Generated Stored Columns).
   * *Tier 2 (Database Triggers):* 5 Triggers cốt lõi tự động đồng bộ tồn kho kệ từ kiểm kê, đồng bộ On-order khi PO duyệt/hủy, tất toán On-order và hoàn tất PO khi nhận hàng, cập nhật điểm phong độ OTIF trượt 5 đơn gần nhất của NCC, và chặn sửa đổi PO đã đóng.
   * *Tier 3 (Application Transaction Layer):* 6 Invariants phức hợp (All-or-Nothing khi Import lô file, đối chiếu tập SKU nhận hàng với đơn PO gốc, và cảnh báo Inactive SKU).

Reason:

Đảm bảo tính toàn vẹn vật lý tuyệt đối cho dữ liệu giao dịch bán lẻ; triệt tiêu hoàn toàn lỗi làm tròn số thực bằng `NUMERIC(15, 2)` và `NUMERIC(5, 4)`; tối ưu hóa hiệu năng truy vấn cho AI Forecasting và DSS Engine thông qua B-Tree, Composite Time-series và Partial Indexes; đồng thời phục vụ trọn vẹn trải nghiệm người dùng trực quan trên giao diện mà không làm phình to số lượng bảng quan hệ không cần thiết.

Impact:

- Xuất bản tài liệu kỹ thuật chính thức `docs/technical/data-model.md` kèm mã DDL SQL hoàn chỉnh cho PostgreSQL 16+.
- Đóng vai trò là nguồn sự thật kỹ thuật (Technical Source of Truth) duy nhất cho việc thiết kế Schema Migrations, Data Access Layer (Repository / ORM Models), và API Data Contracts ở các bước tiếp theo.

---

### Identity, Access Management & System Audit Specification (users, refresh_tokens, activity_logs)

Status: Confirmed

Decision:

Mở rộng mô hình dữ liệu quan hệ vật lý chính thức trên PostgreSQL 16+ từ 13 bảng lên **16 bảng**, bổ sung **Phân Vùng 4: Identity, Access Management & System Audit (IAM & Audit)** gồm 3 bảng hạ tầng:

1. **Bảng `users` (Quản trị tài khoản & Phân quyền RBAC):**
   * Quản lý tài khoản đăng nhập với khóa chính `id BIGINT GENERATED ALWAYS AS IDENTITY`, tên tài khoản `username VARCHAR(50) UNIQUE NOT NULL` (kèm Functional Index `UPPER(username)` chống trùng lặp hoa thường), mật khẩu băm an toàn `password_hash VARCHAR(255) NOT NULL` (Bcrypt/Argon2).
   * Phân quyền cứng 2 vai trò nghiệp vụ chuẩn hóa: `'STORE_MANAGER'` (Quản lý cửa hàng kiêm System Admin) và `'PURCHASING_STAFF'` (Nhân viên mua hàng tác nghiệp).
   * Trạng thái tài khoản: `'Active'` hoặc `'Inactive'`.

2. **Bảng `refresh_tokens` (Bảo mật phiên làm việc & JWT Lifecycle):**
   * Quản lý Refresh Token theo chuẩn OWASP: Lưu chuỗi băm SHA-256 `token_hash VARCHAR(255) UNIQUE NOT NULL` (không lưu raw token).
   * Khóa ngoại `user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE`.
   * Hỗ trợ cơ chế quay vòng token (Token Rotation) và thu hồi token lập tức (`revoked_at TIMESTAMPTZ`) khi người dùng Đăng xuất hoặc bị khóa tài khoản.

3. **Bảng `activity_logs` (Nhật ký hoạt động & Lưu vết kiểm toán toàn diện - Audit Trail):**
   * Thiết kế theo nguyên tắc `APPEND-ONLY` bảo tồn tính pháp lý và minh bạch: Không cho phép chỉnh sửa (`UPDATE`) hay xóa (`DELETE`) trong quy trình thông thường.
   * Ghi nhận toàn bộ các hành vi trọng yếu: Xác thực (`AUTH_LOGIN`, `AUTH_LOGOUT`), Quản lý tài khoản (`USER_CREATE`, `USER_UPDATE`), Nhập liệu vận hành (`DATA_IMPORT_SALES`, `DATA_IMPORT_INVENTORY` tại UC-04), Phê duyệt mua hàng (`DSS_APPROVE_RECOMMENDATION` tại UC-01), Thao tác đơn PO (`PO_CANCEL`, `PO_EXPORT` tại UC-02), Nhận hàng kho (`RECEIPT_CONFIRM` tại UC-03), Cập nhật cấu hình DSS (`CONFIG_UPDATE_PARAMETERS` tại UC-07).
   * Khóa ngoại `user_id BIGINT NULL REFERENCES users(id) ON DELETE SET NULL` kết hợp snapshot `username VARCHAR(50) NOT NULL` để bảo toàn 100% lịch sử kiểm toán ngay cả khi tài khoản nhân viên bị vô hiệu hóa hoặc xóa bỏ.
   * Cột `metadata JSONB` lưu trữ động chi tiết payload (số dòng import, diff cấu hình cũ/mới, IP...).

4. **Chính sách liên kết phân tách lỏng lẻo (Loose Coupling Architecture):**
   * Toàn bộ các bảng thuộc Core Purchasing Domain (`recommendation_sessions.created_by`, `goods_receipts.received_by`, `inventory_snapshots.counted_by`, `dss_configurations.updated_by`) tiếp tục duy trì kiểu `VARCHAR(50)` lưu snapshot `username`.
   * Quyết định này bảo vệ nguyên tắc **Bất biến lịch sử (Historical Immutability)** và **Decoupling** — tránh việc tạo khóa ngoại cứng liên tầng gây thắt nút cổ chai (tight coupling) giữa nghiệp vụ mua hàng và phân hệ định danh người dùng.

Reason:

1. **Hiện thực hóa quyền hạn thực tế của 2 Actor:** Phục vụ trực tiếp việc triển khai Middleware Auth & Guards trong ứng dụng backend, cho phép phân biệt quyền hạn Store Manager vs Purchasing Staff theo đúng tài liệu `scope.md` và các Use Cases.
2. **Bảo mật chuẩn mực & Kiểm toán minh bạch:** Triệt tiêu hoàn toàn rủi ro hardcode tài khoản; hỗ trợ thu hồi token khi đăng xuất; cung cấp bảng nhật ký kiểm toán `activity_logs` giúp giải trình rõ ràng "Ai đã làm gì, vào thời điểm nào, với dữ liệu nào".
3. **Phù hợp quy mô Single Store:** Giữ phân quyền tinh gọn ở 2 vai trò (Store Manager kiêm System Admin), không làm phình to độ phức tạp ngoài phạm vi (Scope Creep) nhưng vẫn đạt chuẩn cao về mặt kỹ thuật cho đồ án tốt nghiệp.

Impact:

- Cập nhật tài liệu kỹ thuật [docs/technical/data-model.md](file:///d:/projects/dss-ai-Purchase-wolf205/docs/technical/data-model.md) lên 16 bảng (bổ sung ERD, Data Dictionary, Indexing Strategy và mã DDL SQL hoàn chỉnh cho PostgreSQL 16+).
- Cung cấp nền tảng CSDL hoàn chỉnh để thiết kế API Authentication (Login, Refresh, Logout), RBAC Guards và Audit Interceptor ở giai đoạn thiết kế kiến trúc (`docs/technical/architecture.md`).

---

### Technical Data Model Production Hardening & Bug Fixes

Status: Confirmed

Decision:

Tiến hành rà soát chuyên sâu và thực hiện 7 tinh chỉnh kỹ thuật nhằm triệt tiêu hoàn toàn rủi ro văng lỗi CSDL trong môi trường thực tế (PostgreSQL 16+):

1. **Khắc phục lỗi Non-immutable Function trong `CHECK` Constraint:**
   * Loại bỏ các ràng buộc `CHECK (date <= CURRENT_DATE)` trên 3 bảng `sales_records`, `inventory_snapshots`, `goods_receipts` do PostgreSQL không cho phép hàm biến thiên (STABLE) trong DDL schema.
   * Chuyển hóa toàn bộ việc kiểm tra ngày không vượt quá hiện tại lên **Tier 3 (Application Service Validation / DTOs)**.

2. **Khắc phục lỗi khóa cứng `NOT NULL` trên Nhà cung cấp ở `recommendation_items`:**
   * Chuyển `suggested_supplier_id` và `approved_supplier_id` sang kiểu `BIGINT NULL`.
   * Bổ sung ràng buộc logic: `CHECK ((approved_quantity > 0 AND approved_supplier_id IS NOT NULL) OR (approved_quantity = 0))`.
   * Đảm bảo thuật toán DSS Engine không bị crash khi chạy phân tích toàn cửa hàng cho những SKU chưa kịp gán NCC hoặc khi mặt hàng ở trạng thái an toàn không cần mua.

3. **Khắc phục Trigger 5 chặn xuất/in lại đơn PO cũ (`trg_prevent_immutable_po_modification`):**
   * Cho phép cập nhật cột `last_exported_at` trên đơn PO đã `Completed` hoặc `Cancelled` để phục vụ tác vụ in lại đơn hoặc xuất file PDF/Excel gửi đối tác và kế toán đối soát theo `UC-02`. Vẫn khóa cứng 100% các cột dữ liệu nghiệp vụ còn lại.

4. **Khắc phục Trigger 1 ghi đè tồn kho khi nạp dữ liệu kiểm kê lịch sử (`trg_sync_inventory_on_snapshot`):**
   * Bổ sung điều kiện `IF (NEW.snapshot_date >= CURRENT_DATE)` trước khi gán đè `products.current_inventory = NEW.counted_quantity`.
   * Bảo vệ tồn kho thực tế trên kệ không bị ghi đè bởi các bản ghi kiểm kê cũ trong quá khứ khi thực hiện Import hàng loạt tại `UC-04`.

5. **Hiện thực hóa Trigger bảo vệ dòng hàng đơn PO đã phát hành (`INV-34`):**
   * Bổ sung Function & Trigger `trg_prevent_po_line_items_modification` chặn mọi thao tác `UPDATE` hoặc `DELETE` trên `po_line_items` khi đơn PO cha đã ở trạng thái `Approved`, `Completed`, hoặc `Cancelled`.

6. **Bổ sung Trigger chặn nhận hàng cho đơn PO đã bị Hủy (`INV-38`):**
   * Bổ sung Function & Trigger `trg_validate_po_status_before_receipt` trên `goods_receipts` (BEFORE INSERT): Yêu cầu đơn PO tương ứng bắt buộc phải đang ở trạng thái `Approved`.

7. **Bổ sung Dữ liệu mồi chuẩn hóa (Seed Data Baseline):**
   * Bổ sung script nạp bản ghi Singleton mặc định cho `dss_configurations (id = 1)` và tài khoản quản trị viên khởi tạo `users` (`username = 'admin'`, role `'STORE_MANAGER'`).

Reason:

Đảm bảo script DDL chạy thành công 100% trên PostgreSQL 16+ chuẩn, loại trừ triệt để các lỗi runtime tiềm ẩn, bảo toàn tính toàn vẹn nghiệp vụ và sẵn sàng triển khai mã nguồn Backend ở các giai đoạn tiếp theo.

Impact:

- Cập nhật đồng bộ các mục Data Dictionary, Bảng ma trận 44 Invariants (Tier 2 & 3), và toàn văn DDL SQL trong [docs/technical/data-model.md](file:///d:/projects/dss-ai-Purchase-wolf205/docs/technical/data-model.md).

---

### Polyglot Decoupled Architecture & Tech Stack Selection

Status: Confirmed

Decision:

Xác lập mô hình kiến trúc kỹ thuật chính thức cho hệ thống là **Polyglot Decoupled Architecture** được đóng gói trọn gói qua Docker Compose gồm 4 containers độc lập:
1. **Frontend Web App:** React 18+ + Vite + TailwindCSS + TanStack Query (Single Page Application, Port 80 / 5173).
2. **Backend Web API:** NestJS (TypeScript) + Prisma ORM (Modular Monolith chuẩn Enterprise, Port 3000).
3. **AI Forecasting Service:** Python 3.11+ + FastAPI + Statsforecast/LightGBM (Stateless Compute Service, Port 8000).
4. **Database:** PostgreSQL 16+ (16 Tables, DDL Constraints, Triggers, Indexes, Port 5432).
5. **External LLM:** Google Gemini 1.5 Flash API (qua SDK chính thức `@google/genai`).

Reason:

Tối ưu hóa thế mạnh của từng công nghệ: Python mạnh nhất về xử lý chuỗi thời gian AI/ML; NestJS cung cấp cấu trúc Clean Architecture, Guards, Interceptors và Swagger mạnh mẽ nhất cho backend doanh nghiệp; React+Vite đem lại trải nghiệm giao diện mượt mà và trực quan; Prisma ORM đảm bảo Type-safe tuyệt đối và kiểm soát transaction ACID chặt chẽ. Đóng gói Docker Compose giúp triển khai tinh gọn, loại bỏ over-engineering của Microservices/Kafka đối với quy mô một cửa hàng bán lẻ đơn lẻ.

Impact:

- Định hình toàn bộ cấu trúc dự án và môi trường phát triển mã nguồn ở giai đoạn Implementation tiếp theo.
- Xuất bản tài liệu kiến trúc toàn cảnh [docs/technical/architecture.md](file:///d:/projects/dss-ai-Purchase-wolf205/docs/technical/architecture.md).

---

### Hub & Spoke Technical Documentation Architecture

Status: Confirmed

Decision:

Phân tách tài liệu kỹ thuật kiến trúc thành 2 tài liệu tương hỗ theo mô hình **Hub & Spoke**:
1. **Hub (Tài liệu Trung tâm):** [docs/technical/architecture.md](file:///d:/projects/dss-ai-Purchase-wolf205/docs/technical/architecture.md) — Bản thiết kế kiến trúc toàn cảnh (C4 Model, Tech Stack Rationale, Phân rã Component, Bảo mật, Quản lý giao dịch Tier 3, Docker Compose).
2. **Spoke (Tài liệu Vệ tinh):** [docs/technical/api-specification.md](file:///d:/projects/dss-ai-Purchase-wolf205/docs/technical/api-specification.md) — Hợp đồng giao tiếp chi tiết (100% Endpoints, Request/Response DTOs, API Envelope, Error Taxonomy cho 7 Use Cases + Auth).

Reason:

Tối ưu hóa ngữ cảnh (Context Window) cho AI Agent và lập trình viên khi bước vào giai đoạn Implementation: Khi code Frontend/Backend, lập trình viên chỉ cần mở đúng hợp đồng API, không bị quá tải bởi các sơ đồ C4 hay Docker. Đồng thời, `architecture.md` giữ được sự mạch lạc, súc tích và đạt chuẩn cao phục vụ báo cáo và bảo vệ đồ án tốt nghiệp.

Impact:

Loại bỏ hiện tượng file kiến trúc phình to quá tải (> 2.000 dòng); thiết lập nguồn sự thật kỹ thuật chuẩn mực cho cả Frontend và Backend.

---

### Three-Engine DSS Isolation & Non-blocking On-Demand LLM

Status: Confirmed

Decision:

Hệ thống phân lập rạch ròi 3 động cơ tính toán độc lập:
1. **AI Demand Forecasting Engine (Python):** Nhận payload chuỗi thời gian, tự động bù trừ Zero-Demand, chạy AutoARIMA / Croston dự báo 14 ngày tới; hỗ trợ Graceful Fallback sang trung bình lịch sử khi mất kết nối mạng.
2. **Deterministic Business Calculation Engine (NestJS):** Chạy 100% tất định trong bộ nhớ Backend (Ma trận ABC-XYZ theo ngưỡng cố định 80/15/5% và CV, tính SS, ROP, SOQ khớp MOQ, và chấm điểm WSM xếp hạng NCC).
3. **On-Demand LLM Explainability Service (Google Gemini 1.5 Flash):** Chỉ kích hoạt khi người dùng bấm xem chi tiết giải thích cho một SKU cụ thể tại UC-01; tuyệt đối không nằm trên critical path khi phân tích bảng đề xuất ban đầu; kết quả được lưu cache vào `recommendation_items.llm_explanation` (0ms và 0 token cho các lần đọc sau); timeout 3.0 giây kèm fallback text tất định an toàn.

Reason:

Đảm bảo chu kỳ phân tích mua hàng ban đầu phản hồi tức thì (< 1 giây); bảo vệ hệ thống không bao giờ bị nghẽn quy trình phê duyệt do phụ thuộc vào mạng ngoài; tiết kiệm chi phí token và minh bạch hóa 100% cơ sở ra quyết định của DSS.

Impact:

UC-01 hoạt động siêu tốc, mượt mà và tin cậy tuyệt đối; giao diện người dùng hiển thị trực quan badge ABC-XYZ, biểu đồ chuỗi thời gian Recharts và tóm tắt diễn giải thông minh từ LLM.

---

### JWT Token Rotation, httpOnly Cookie & RBAC Security Model

Status: Confirmed

Decision:

1. **Xác thực Stateless 2 Tầng:** Access Token (JWT 15 phút) mang claims `sub, username, role`; Refresh Token (7 ngày) dạng chuỗi ngẫu nhiên bảo mật cao được băm SHA-256 lưu trong bảng `refresh_tokens`.
2. **Lưu trữ Client Miễn Nhiễm XSS:** Refresh Token được truyền và lưu trữ độc quyền qua Cookie `Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`. JavaScript phía Client không thể truy cập, chống rò rỉ token tuyệt đối.
3. **Cơ chế Token Rotation:** Mỗi khi gọi `/auth/refresh` thành công, hệ thống thu hồi Refresh Token cũ (`revoked_at = now()`) và phát hành cặp token mới. Thu hồi toàn bộ session nếu phát hiện token bị tái sử dụng (chống Replay Attack).
4. **Phân Quyền Cứng RBAC:** Áp dụng `@UseGuards(JwtAuthGuard, RolesGuard)` trên các Controller NestJS:
   * `STORE_MANAGER`: Toàn quyền trên toàn bộ hệ thống.
   * `PURCHASING_STAFF`: Toàn quyền tác nghiệp (UC-01, UC-02, UC-03, UC-04); Chế độ Chỉ xem (Read-only) trên Danh mục SKU (UC-05), NCC (UC-06), Cấu hình DSS (UC-07); Chặn hoàn toàn truy cập Audit Logs.
5. **Nhật Ký Kiểm Toán Append-Only:** `AuditLogInterceptor` tự động ghi nhận các hành vi thành công vào bảng `activity_logs` (User, Action, Entity, Metadata diff, IP) dưới dạng background promise không gây trễ response.

Reason:

Bảo mật chuẩn mực theo khuyến nghị OWASP; phân định đúng quyền hạn vận hành thực tế của cửa hàng; bảo toàn tính pháp lý và kiểm toán minh bạch của các giao dịch mua bán hàng hóa.

Impact:

Bảo vệ an toàn tuyệt đối cho hệ thống; cung cấp cơ sở dữ liệu kiểm toán đầy đủ cho Quản lý cửa hàng.

---

### Tier 3 Application Transaction Defense & Error Taxonomy

Status: Confirmed

Decision:

1. **Ranh Giới Giao Dịch ACID (`prisma.$transaction`):** Bắt buộc bọc trong một transaction duy nhất đối với 3 nghiệp vụ phức hợp:
   * *UC-01 Approve PO:* Cập nhật session Approved $\rightarrow$ Chốt items $\rightarrow$ Sinh đơn POs gom theo NCC $\rightarrow$ Trigger tự động tăng On-order.
   * *UC-03 Goods Receipt:* Kiểm tra PO Approved $\rightarrow$ Tạo Receipt $\rightarrow$ Trigger tăng tồn kệ, trừ On-order, đóng đơn PO $\rightarrow$ Trigger tính OTIF linear penalty decay và cập nhật phong độ 5 đơn gần nhất của NCC.
   * *UC-04 Data Import:* Thẩm định tệp 100%; nếu có trùng lặp ngày cũ thì xóa sạch dữ liệu cũ rồi mới chèn dữ liệu mới theo cơ chế All-or-Nothing.
2. **Quét Lỗi Toàn Diện File Nạp:** Khi nạp file bán hàng/kiểm kê bị lỗi, hệ thống quét toàn bộ tệp và trả về danh sách chi tiết tất cả các dòng vi phạm (`row`, `field`, `issue`) trong phản hồi HTTP 400 `ALL_OR_NOTHING_IMPORT_FAILED` để người dùng sửa một lần.
3. **Chuẩn Hóa API Envelope & Error Taxonomy:** Mọi phản hồi API đều đóng gói theo cấu trúc `{ success, data, meta }` hoặc `{ success, error: { code, message, details } }`.

Reason:

Bảo vệ triệt để tính toàn vẹn dữ liệu ở tầng ứng dụng cho các bất biến không thể khóa bằng DDL/Trigger; tối ưu hóa trải nghiệm người dùng khi nạp dữ liệu vận hành.

Impact:

Triệt tiêu hoàn toàn rủi ro sai lệch tồn kho, nhân đôi doanh số hoặc rác dữ liệu; chuẩn hóa hợp đồng giao tiếp cho Frontend React.






