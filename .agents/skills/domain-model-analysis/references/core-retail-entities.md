# Tham Chiếu: Khung Gợi Ý Các Thực Thể Ứng Viên Trong DSS Bán Lẻ (Candidate Entities Guidance)

> [!IMPORTANT]
> **Tài liệu gợi ý tham khảo - Chưa phải quyết định chính thức (Guidance Only):**
> Danh mục dưới đây tập hợp các **thực thể ứng viên (Candidate Entities)** được gợi mở từ 7 Use Cases (`UC-01` đến `UC-07`) và 28 Business Rules (`BR-01` đến `BR-28`) nhằm hỗ trợ Agent và Người dùng trong quá trình động não (brainstorming), định hình phạm vi và phản biện cấu trúc nghiệp vụ.
> 
> **Tuyệt đối không coi đây là danh mục cố định đã chốt.** Việc quyết định thực thể nào cần mô hình hóa, gộp hay tách thực thể, và phạm vi thuộc tính cụ thể hoàn toàn phụ thuộc vào quá trình phân tích và thống nhất với Người dùng trong phiên thảo luận Domain Model.

---

## 1. Nhóm Dữ Liệu Nền Tảng (Master Data Entities)

### 1.1. `Product` (Sản phẩm / SKU)
* **Khái niệm:** Đại diện cho một mặt hàng thương mại được phép lưu thông tại cửa hàng.
* **Thuộc tính nghiệp vụ cốt lõi:**
  * `skuCode`: Mã định danh sản phẩm duy nhất toàn cục, bất biến sau khi tạo (`BR-17`).
  * `productName`: Tên thương mại của sản phẩm.
  * `barcode`: Mã vạch sản phẩm (tùy chọn, không trùng lặp).
  * `unit`: Đơn vị tính (hộp, chai, gói, kg).
  * `category`: Ngành hàng sản phẩm thuộc về (`BR-20`).
  * `status`: Trạng thái kinh doanh (`Active` hoặc `Inactive`, mặc định `Active`, `BR-18`, `BR-19`).
  * `currentInventory`: Số lượng tồn kho thực tế hiện tại trên kệ (mặc định 0 khi tạo, `BR-19`).
  * `onOrderQuantity`: Tổng lượng hàng đang chờ về trên các đơn PO `Approved` (mặc định 0 khi tạo, `BR-07`, `BR-19`).
* **Bất biến nghiệp vụ:**
  * Mã SKU là bất biến vĩnh viễn (`BR-17`).
  * Tuyệt đối cấm Hard Delete nếu đã có dữ liệu liên kết (`BR-18`).
  * Không cho phép chuyển `Inactive` nếu `onOrderQuantity > 0` (`BR-18`).

### 1.2. `Category` (Ngành hàng)
* **Khái niệm:** Phân nhóm ngành hàng kinh doanh để quản lý danh mục và hỗ trợ lọc dữ liệu trên không gian làm việc DSS (`UC-01`, `UC-05`, `BR-20`).
* **Thuộc tính cốt lõi:** `categoryCode`, `categoryName`.

### 1.3. `Supplier` (Nhà cung cấp)
* **Khái niệm:** Đối tác thương mại cung ứng hàng hóa cho cửa hàng (`UC-06`, `BR-21`).
* **Thuộc tính nghiệp vụ cốt lõi:**
  * `supplierCode`: Mã định danh đối tác duy nhất toàn cục, bất biến sau khi tạo (`BR-21`).
  * `supplierName`: Tên doanh nghiệp / Nhà cung cấp.
  * `contactPerson`: Tên người liên hệ đại diện.
  * `phoneNumber`, `email`, `address`: Thông tin liên lạc.
  * `status`: Trạng thái hợp tác (`Active` hoặc `Inactive`, mặc định `Active`).
  * `performanceScore`: Điểm hiệu suất giao hàng thực tế tính theo cửa sổ trượt 5 đơn gần nhất hoặc điểm khởi tạo 80% đối với đối tác mới (`BR-24`).
* **Bất biến nghiệp vụ:**
  * Mã NCC bất biến sau khi tạo (`BR-21`).
  * Không cho phép chuyển `Inactive` nếu đang có đơn PO ở trạng thái `Approved` chờ giao (`BR-24`).

### 1.4. `SupplyCondition` (Điều kiện Cung ứng / Báo giá NCC)
* **Khái niệm:** Thỏa thuận thương mại giữa Nhà cung cấp và Sản phẩm (`UC-06`, `BR-22`).
* **Thuộc tính cốt lõi:**
  * `product`: Sản phẩm được cung ứng.
  * `supplier`: Nhà cung cấp cung ứng.
  * `purchasePrice`: Đơn giá nhập hiện hành (VNĐ, $> 0$).
  * `committedLeadTime`: Thời gian giao hàng cam kết (ngày, $\ge 1$).
  * `moq`: Số lượng đặt hàng tối thiểu (đơn vị sản phẩm, $\ge 1$).
* **Bất biến nghiệp vụ:**
  * Cấm ngừng cung ứng một SKU nếu đang có đơn PO `Approved` của chính NCC đó chứa SKU này (`BR-23`).
  * Mọi thay đổi về giá hoặc Lead Time áp dụng tiến về trước, không ảnh hưởng đơn PO cũ (`BR-22`).

---

## 2. Nhóm Giao Dịch & Vòng Đời Mua Hàng (Transactional & Lifecycle Entities)

### 2.1. `RecommendationSession` (Phiên Đề Xuất Mua Hàng DSS)
* **Khái niệm:** Một đợt phân tích và ra quyết định mua hàng được kích hoạt on-demand bởi con người tại `UC-01`.
* **Thuộc tính cốt lõi:** `sessionDate`, `scope` (toàn cửa hàng hoặc theo ngành hàng), `triggeredBy` (Actor thực hiện), `status` (`Draft`, `Approved`, `Discarded`).

### 2.2. `RecommendationItem` (Dòng Chi Tiết Đề Xuất DSS)
* **Khái niệm:** Kết quả phân tích định lượng và gợi ý mua hàng cho từng SKU trong phiên (`UC-01`, `BR-01`, `BR-02`, `BR-05`).
* **Thuộc tính cốt lõi:**
  * `product`: Mặt hàng được phân tích.
  * `abcXyzGroup`: Nhóm ma trận tồn kho (`AX`, `BY`, `CZ`... từ `BR-05`).
  * `stockRiskStatus`: Mức độ rủi ro (`🔴 Cần mua gấp`, `🟠 Sắp hết`, `🟢 An toàn`, `⚪ Dư thừa`).
  * `forecastedDemand`: Nhu cầu dự báo tiêu thụ trong chu kỳ rà soát.
  * `safetyStock`, `reorderPoint`: Mức tồn kho an toàn và điểm đặt hàng lại (`BR-01`).
  * `suggestedQuantity`: Số lượng hệ thống đề xuất ban đầu (đã làm tròn theo MOQ, `BR-01`, `BR-03`).
  * `suggestedSupplier`: Nhà cung cấp có điểm WSM tối ưu nhất (`BR-02`).
  * `approvedQuantity`: Số lượng thực tế do con người phê duyệt (`UC-01`).
  * `approvedSupplier`: Nhà cung cấp thực tế do con người lựa chọn (`UC-01`).
  * `whyBuyExplanation`: Đoạn tóm tắt lý do đề xuất do LLM sinh theo nhu cầu và cache trong phiên (`UC-01`).

### 2.3. `PurchaseOrder` (Đơn Mua Hàng)
* **Khái niệm:** Chứng từ đặt hàng chính thức sinh ra tự động sau khi con người phê duyệt tại `UC-01` để gửi cho Nhà cung cấp (`UC-02`, `BR-04`, `BR-06`).
* **Thuộc tính cốt lõi:**
  * `poNumber`: Mã đơn mua hàng duy nhất (ví dụ: `PO-20261025-001`).
  * `supplier`: Nhà cung cấp nhận đơn (`BR-04`).
  * `approvalDate`: Ngày giờ phê duyệt đơn mua hàng.
  * `expectedDeliveryDate`: Ngày giao hàng dự kiến ($= \text{ApprovalDate} + \text{LeadTime}$, `BR-08`).
  * `totalAmount`: Tổng giá trị đơn hàng (VNĐ).
  * `status`: Trạng thái vòng đời (`Approved`, `Completed`, `Cancelled`, `BR-06`).
  * `cancellationReason`: Lý do hủy đơn (bắt buộc khi trạng thái là `Cancelled`, `BR-10`).
  * `lastExportedAt`: Thời điểm in/xuất file PO gần nhất (`UC-02`).
* **Bất biến nghiệp vụ:**
  * 100% PO sinh ra ở trạng thái `Approved` từ `UC-01` (`BR-04`, `BR-06`).
  * Vòng đời 1 chiều, cấm khôi phục đơn đã `Completed` hoặc `Cancelled` (`BR-06`).
  * Khi duyệt PO tăng On-order; khi Hủy PO hoàn trả On-order (`BR-07`).

### 2.4. `POLineItem` (Dòng Chi Tiết Đơn Mua Hàng)
* **Khái niệm:** Từng mặt hàng cụ thể được đặt mua trong Đơn mua hàng (`UC-02`).
* **Thuộc tính cốt lõi:** `product`, `orderedQuantity` ($> 0$), `unitPrice` (snapshot giá nhập tại thời điểm duyệt, `BR-22`), `lineTotal`.

### 2.5. `GoodsReceipt` (Phiếu Nhận Hàng)
* **Khái niệm:** Bản ghi nhận hàng thực tế tại kho khi Nhà cung cấp vận chuyển hàng tới (`UC-03`, `BR-11`, `BR-12`, `BR-13`).
* **Thuộc tính cốt lõi:**
  * `receiptNumber`: Mã phiếu nhận hàng.
  * `purchaseOrder`: Đơn mua hàng được đối chiếu (Bản số $1 : 1$, nhận 1 lần duy nhất, `BR-11`).
  * `actualDeliveryDate`: Ngày nhận hàng thực tế tại kho.
  * `notes`: Ghi chú tình trạng hàng hóa / giao nhận.
* **Bất biến nghiệp vụ:**
  * Chỉ nhận hàng cho đơn PO đang ở trạng thái `Approved` (`BR-11`).
  * Mỗi đơn PO chỉ được nhận hàng 1 lần duy nhất trong toàn bộ vòng đời (`BR-11`).
  * Chặn hoàn tất nếu toàn bộ số lượng thực nhận bằng 0 (`BR-11`).
  * Nhận hàng tự động chuyển PO sang `Completed`, cộng tồn kho thực tế và tất toán toàn bộ On-order theo số lượng đặt (`BR-12`).

### 2.6. `ReceiptLineItem` (Dòng Chi Tiết Nhận Hàng)
* **Khái niệm:** Số lượng thực nhận của từng SKU trong đợt giao hàng (`UC-03`, `BR-13`).
* **Thuộc tính cốt lõi:**
  * `product`: Sản phẩm nhận.
  * `orderedQuantity`: Số lượng đặt ban đầu trên PO.
  * `receivedQuantity`: Số lượng thực nhận nguyên vẹn vào kho ($\ge 0$).
  * `fulfillmentRate`: Tỷ lệ giao đủ hàng ($= \min(100\%, \frac{received}{ordered} \times 100\%)$, `BR-13`).
  * `isOntime`: Trạng thái đúng hạn đối chiếu với ngày giao dự kiến ban đầu (`BR-13`).

---

## 3. Nhóm Vận Hành & Cấu Hình (Operational & Configuration Entities)

### 3.1. `SalesRecord` (Bản Ghi Bán Hàng)
* **Khái niệm:** Dữ liệu tiêu thụ hàng ngày nạp vào từ tệp để làm đầu vào cho dự báo AI và phân loại ABC-XYZ (`UC-04`, `BR-14`, `BR-15`).
* **Thuộc tính cốt lõi:** `date` ($\le$ Ngày hiện tại), `product`, `quantity` ($> 0$), `revenue` ($\ge 0$).
* **Bất biến:** Khóa duy nhất là cặp `(date, product)`; nạp trùng ngày sẽ thực hiện ghi đè toàn bộ, không cộng dồn (`BR-15`).

### 3.2. `InventorySnapshot` (Bản Ghi Kiểm Kê Tồn Kho)
* **Khái niệm:** Số liệu kiểm kê đếm được trên kệ kho nạp vào từ tệp (`UC-04`, `BR-14`, `BR-16`).
* **Thuộc tính cốt lõi:** `product`, `stockQuantity` ($\ge 0$), `snapshotDate`.
* **Bất biến:** Nạp file chỉ ghi đè `currentInventory` trên kệ, bảo lưu nguyên vẹn `onOrderQuantity` (`BR-16`).

### 3.3. `DSSConfiguration` (Cấu Hình Tham Số DSS)
* **Khái niệm:** Chính sách vận hành và trọng số chiến lược do Quản lý cửa hàng thiết lập để điều khiển hành vi của DSS (`UC-07`, `BR-25`, `BR-26`, `BR-27`, `BR-28`).
* **Thuộc tính cốt lõi:**
  * `priceWeight`: Trọng số Đơn giá ($w_{\text{Price}}$, mặc định 40%).
  * `leadTimeWeight`: Trọng số Thời gian giao ($w_{\text{LeadTime}}$, mặc định 20%).
  * `moqWeight`: Trọng số MOQ ($w_{\text{MOQ}}$, mặc định 15%).
  * `historyWeight`: Trọng số Lịch sử giao ($w_{\text{History}}$, mặc định 25%).
  * `targetServiceLevel`: Mức phục vụ mong muốn (90%, 95%, 98%, 99%, mặc định 95%, `BR-26`).
  * `reviewPeriod`: Chu kỳ rà soát đặt hàng (1–30 ngày, mặc định 7 ngày, `BR-27`).
* **Bất biến:** Bắt buộc tổng 4 trọng số $= 100\%$ (`BR-25`). Áp dụng tiến về trước, không ảnh hưởng đơn cũ (`BR-28`).
