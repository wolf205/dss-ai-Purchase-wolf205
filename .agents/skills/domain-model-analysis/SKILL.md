---
name: domain-model-analysis
description: >-
  Hướng dẫn phân tích, nhận diện và đặc tả Domain Model (Thực thể nghiệp vụ, Thuộc tính khái niệm, Mối quan hệ và Business Invariants) cho hệ thống DSS bán lẻ.
  Sử dụng khi phân tích, xây dựng, đánh giá hoặc hoàn thiện tài liệu Domain Model.
---

# Domain Model Analysis Skill

## 1. Mục Đích

Tài liệu này định hướng cho Agent trong việc phân tích, định danh và đặc tả **Domain Model (Mô hình Miền Nghiệp vụ)** cho hệ thống AI-Powered Purchase Decision Support System for a Single Retail Store.

Domain Model giữ vai trò bản lề trong chuỗi phân tích:
```text
Business Problem → Scope → Use Cases → Business Rules → [Domain Model] → Data Model → Architecture → Implementation
```

Mục tiêu chính:
* Trừu tượng hóa các khái niệm thực tế từ 7 Use Cases (`UC-01` đến `UC-07`) và 28 Business Rules (`BR-01` đến `BR-28`) thành các thực thể nghiệp vụ có cấu trúc (**Domain Entities**).
* Làm rõ mối quan hệ khái niệm (**Relationships**) và bản số liên kết (**Multiplicity**) phản ánh đúng hoạt động mua hàng bán lẻ.
* Gắn kết chặt chẽ các quy tắc kinh doanh thành các bất biến nghiệp vụ (**Business Invariants**) của thực thể.
* Tạo lập nền móng khái niệm vững chắc trước khi chuyển sang thiết kế cơ sở dữ liệu kỹ thuật (**Data Model**).

---

## 2. Nguyên Tắc Cốt Lõi

### A. Ngôn Ngữ Nghiệp Vụ Thống Nhất (Ubiquitous Language)
Mọi thực thể, thuộc tính và hành vi trong Domain Model phải sử dụng ngôn ngữ chung của ngành bán lẻ và chuỗi cung ứng, hoàn toàn đồng nhất với các thuật ngữ đã xác lập ở tầng Use Cases và Business Rules (`SKU`, `MOQ`, `Lead Time`, `Safety Stock`, `Reorder Point`, `On-order`, `OTIF`).

### B. Nghiệp Vụ Khái Niệm, Không Phải Kỹ Thuật CSDL
* **Được phép:** Tên thực thể PascalCase, thuộc tính nghiệp vụ kèm đơn vị đo (ngày, cái, VNĐ, %), mô tả mối quan hệ bằng lời và sơ đồ Mermaid, các ràng buộc logic kinh doanh.
* **Tuyệt đối cấm:** Tên kiểu dữ liệu SQL (`VARCHAR`, `INT`), khóa chính/khóa ngoại kỹ thuật (`PK`, `FK`, `ID autoincrement`), bảng nối thuần kỹ thuật không có ý nghĩa nghiệp vụ, indexing hay ORM annotations.

### C. Gắn Kết Business Invariants
Mỗi thực thể không phải là một túi chứa dữ liệu vô tri (Anemic Model) mà luôn đi kèm với các **Business Invariants** kế thừa từ `BR-01` đến `BR-28`. Dữ liệu của thực thể chỉ hợp lệ khi thỏa mãn toàn bộ các Invariants này.

### D. Thảo Luận Trước, Chốt Sau (Collaborative Discovery & Confirmation)
Domain Entities không phải là một tập hợp cố định có sẵn để áp đặt. Việc xác định thực thể nào cần mô hình hóa, gộp hay tách thực thể, và phạm vi thuộc tính **bắt buộc phải qua quá trình trao đổi, phản biện và được người dùng xác nhận**. Mọi danh mục thực thể trong tài liệu tham khảo chỉ đóng vai trò là **gợi ý ứng viên ban đầu (Candidate Entities)**.

---

## 3. Khung Định Hướng Nhận Diện Thực Thể Ứng Viên (Candidate Entity Guidance - Tham Khảo Khi Thảo Luận)

> [!NOTE]
> Các nhóm thực thể dưới đây là **gợi ý xuất phát điểm (Candidate Entities)** được trích xuất sơ bộ từ 7 Use Cases và 28 Business Rules nhằm hỗ trợ Agent trong việc động não (brainstorming) và gợi mở thảo luận cùng người dùng. **Đây KHÔNG PHẢI là danh sách chính thức đã chốt.** Danh sách thực thể cuối cùng sẽ do người dùng quyết định qua phiên thảo luận Domain Model.

### Nhóm Ứng Viên 1: Dữ liệu Nền tảng (Master Data Candidates)
Các khái niệm mô tả thông tin gốc của cửa hàng có thể cần quản lý:
* **Product (SKU):** Mặt hàng kinh doanh tại cửa hàng (gợi ý từ `UC-05`, `BR-17`, `BR-18`, `BR-19`).
* **Category:** Phân loại ngành hàng phục vụ quản lý và lọc đề xuất (gợi ý từ `UC-05`, `BR-20`).
* **Supplier:** Đối tác cung ứng hàng hóa cho cửa hàng (gợi ý từ `UC-06`, `BR-21`, `BR-24`).
* **SupplyCondition:** Mối quan hệ thương mại/báo giá giữa Nhà cung cấp và Sản phẩm kèm giá, Lead Time, MOQ (gợi ý từ `UC-06`, `BR-22`, `BR-23`).

### Nhóm Ứng Viên 2: Giao Dịch & Vòng Đời Mua Hàng (Transactional & Lifecycle Candidates)
Các khái niệm phát sinh theo chu trình vận hành mua hàng và nhận hàng:
* **RecommendationSession & RecommendationItem:** Phiên phân tích DSS và chi tiết khuyến nghị mua cho từng SKU kèm giải thích AI (gợi ý từ `UC-01`, `BR-01`, `BR-02`, `BR-03`, `BR-05`).
* **PurchaseOrder & POLineItem:** Đơn mua hàng chính thức gửi cho NCC và các dòng sản phẩm chi tiết (gợi ý từ `UC-01`, `UC-02`, `BR-04`, `BR-06`, `BR-07`, `BR-08`, `BR-09`, `BR-10`).
* **GoodsReceipt & ReceiptLineItem:** Phiếu ghi nhận nhận hàng thực tế tại kho và đối soát thực nhận vs đặt hàng (gợi ý từ `UC-03`, `BR-11`, `BR-12`, `BR-13`).

### Nhóm Ứng Viên 3: Vận Hành & Cấu Hình (Operational & Configuration Candidates)
Các khái niệm dữ liệu đầu vào biến đổi và chính sách điều khiển:
* **SalesRecord:** Bản ghi doanh số tiêu thụ hàng ngày của SKU (gợi ý từ `UC-04`, `BR-14`, `BR-15`).
* **InventorySnapshot:** Bản ghi kiểm kê thực tế tại kệ kho (gợi ý từ `UC-04`, `BR-14`, `BR-16`).
* **DSSConfiguration:** Bộ tham số trọng số và chính sách tồn kho chi phối thuật toán gợi ý (gợi ý từ `UC-07`, `BR-25`, `BR-26`, `BR-27`, `BR-28`).


---

## 4. Kỹ Thuật Trực Quan Hóa Bằng Mermaid Class Diagram

Trong tài liệu Domain Model, sử dụng sơ đồ Mermaid Class Diagram để mô tả cấu trúc quan hệ:
* Biểu diễn quan hệ sở hữu chặt chẽ (Composition `*--`): ví dụ `PurchaseOrder` và `POLineItem`.
* Biểu diễn quan hệ liên kết nghiệp vụ (Association `-->` hoặc `--`): ví dụ `PurchaseOrder` thuộc về `Supplier`.
* Ghi rõ bản số nghiệp vụ (Multiplicity): `1`, `0..1`, `1..*`, `*`.
* Chỉ liệt kê các thuộc tính khái niệm cốt lõi, không liệt kê phương thức code hay kiểu dữ liệu CSDL.

---

## 5. Quy Trình Phân Tích & Hoàn Thiện

```text
Đọc Use Cases (UC-01 → UC-07) & Business Rules (BR-01 → BR-28)
       ↓
Định danh các Domain Entities & Thuộc tính khái niệm
       ↓
Xác định Mối quan hệ & Bản số nghiệp vụ (Relationships & Multiplicity)
       ↓
Đặc tả các Bất biến nghiệp vụ (Business Invariants) cho từng Entity
       ↓
Kiểm tra tính nhất quán (Feedback Loop)
       ↓
Confirmation Gate với Người dùng
       ↓
Tạo tài liệu chính thức: docs/business/domain-model.md
```

---

## 6. Tài Liệu Tham Chiếu

* [domain-specification-template.md](references/domain-specification-template.md): Mẫu khung chuẩn để biên soạn tài liệu `domain-model.md`.
* [domain-vs-data-model.md](references/domain-vs-data-model.md): Bảng đối chiếu chi tiết ranh giới giữa Domain Model và Data Model.
* [core-retail-entities.md](references/core-retail-entities.md): Khung gợi ý các thực thể ứng viên (Candidate Entities) tham khảo khi thảo luận phân tích Domain Model.

