# Business Problem

## Hệ Thống Hỗ Trợ Ra Quyết Định Mua Hàng Tích Hợp AI

---

## 1. Business Context

**Mô hình:** `Single Retail Store`

Cửa hàng bán lẻ phải duy trì đủ hàng để đáp ứng nhu cầu nhưng đồng thời phải hạn chế lượng tồn kho dư thừa.

Đặc thù:

* Nhiều `SKU` với tốc độ bán khác nhau.
* `Demand` thay đổi theo ngày, tuần và mùa vụ.
* Không gian lưu trữ có giới hạn.
* Một SKU có thể có nhiều `Supplier`.

Vì vậy, hoạt động mua hàng phải liên tục đưa ra các quyết định:

* **What to Buy** - Mua mặt hàng nào?
* **When to Buy** - Khi nào mua?
* **How Much to Buy** - Mua bao nhiêu?
* **Which Supplier** - Mua từ nhà cung cấp nào?
* **Why Buy** - Vì sao cần mua?

---

## 2. Core Business Problem

Vấn đề cốt lõi là:

> Cửa hàng **khó đưa ra quyết định mua hàng dựa trên dữ liệu một cách kịp thời và nhất quán**.

Nhân viên phải kết hợp nhiều loại thông tin:

* `Sales History`
* `Current Inventory`
* `Demand Trend`
* `Supplier Performance`
* `Lead Time`
* `Purchase Price`
* `MOQ`

Nhưng quá trình tổng hợp và đánh giá phần lớn vẫn dựa vào **kiểm tra thủ công và kinh nghiệm cá nhân**.

---

## 3. Root Causes

### 3.1. Thiếu khả năng dự báo nhu cầu

* Khó ước lượng `Future Demand` từ dữ liệu bán hàng lịch sử.
* Khó nhận biết `Trend` và `Seasonality`.
* Khó chủ động chuẩn bị hàng trước giai đoạn nhu cầu tăng.

### 3.2. Thiếu phân tích tồn kho chủ động

* Khó phát hiện sớm `Stockout Risk`.
* Khó xác định khi nào cần `Reorder`.
* Khó cân bằng giữa `Stock Availability` và `Inventory Level`.

### 3.3. Dữ liệu phân tán

* Dữ liệu bán hàng, tồn kho và nhà cung cấp nằm ở nhiều nguồn.
* Nhân viên phải tự tổng hợp thông tin trước khi quyết định.
* Quá trình xử lý tốn thời gian và dễ xảy ra sai sót.

### 3.4. Đánh giá nhà cung cấp chưa có tính hệ thống

* Thường dựa vào `Price` hoặc kinh nghiệm.
* Khó so sánh nhiều `Supplier`.
* Chưa đánh giá đầy đủ `Lead Time`, `Reliability`, `Quality`, `MOQ`.

### 3.5. Thiếu cơ sở giải thích cho quyết định

* Nhân viên có thể biết **cần mua**, nhưng khó biết **vì sao cần mua**.
* Khó kiểm tra các yếu tố dẫn đến một đề xuất mua hàng.
* Khó kết hợp `Data-driven Recommendation` với `Human Judgment`.

---

## 4. Business Impact

### `Stockout`

* Mất doanh thu do không có hàng khi khách có nhu cầu.
* Giảm khả năng phục vụ khách hàng.

### `Overstock`

* Vốn bị giữ trong hàng tồn kho.
* Tăng chi phí và nhu cầu lưu trữ.
* Tăng rủi ro `Near Expiry`, `Expiry`, `Damage` và hàng bán chậm.

### `Poor Supplier Decision`

* Giao hàng chậm hoặc không ổn định.
* Giá mua không phù hợp.
* Tăng nguy cơ thiếu hàng hoặc nhận hàng không đạt yêu cầu.

### `Manual Operation`

* Tốn nhiều thời gian kiểm tra và tính toán.
* Tăng `Human Error`.
* Phụ thuộc vào kinh nghiệm của từng nhân viên.

---

## 5. Business Need

Cửa hàng cần một phương pháp hỗ trợ ra quyết định có khả năng:

* **Phân tích** dữ liệu bán hàng và tồn kho.
* **Dự báo** nhu cầu hàng hóa trong tương lai.
* **Phát hiện sớm** nguy cơ thiếu hàng và tồn kho dư thừa.
* **Đánh giá** các phương án nhà cung cấp.
* **Đề xuất** phương án mua hàng phù hợp.
* **Giải thích** các yếu tố dẫn đến đề xuất.

Mục tiêu không phải để AI tự quyết định mua hàng, mà để **cung cấp cơ sở dữ liệu và khuyến nghị cho người ra quyết định**.

---

## 6. Problem Statement

> Trong mô hình cửa hàng bán lẻ đơn lẻ, việc ra quyết định mua hàng hiện còn phụ thuộc nhiều vào **kinh nghiệm và xử lý thủ công**, trong khi dữ liệu về **bán hàng, tồn kho, nhu cầu và nhà cung cấp** chưa được khai thác đồng bộ.
>
> Điều này khiến cửa hàng khó xác định **mua gì, khi nào mua, mua bao nhiêu, mua từ ai và vì sao nên mua**, dẫn đến nguy cơ **Stockout, Overstock, lựa chọn nhà cung cấp chưa phù hợp và giảm hiệu quả vận hành**.
>
> Do đó, cần có một **Decision Support System** có khả năng khai thác dữ liệu và AI để cung cấp **dự báo, phân tích, cảnh báo và khuyến nghị mua hàng có thể giải thích**, hỗ trợ con người đưa ra quyết định tốt hơn.
