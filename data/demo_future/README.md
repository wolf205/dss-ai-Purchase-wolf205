# Dữ Liệu Demo Tương Lai (2 Tuần: 2026-11-23 đến 2026-12-06)

Thư mục này chứa dữ liệu bán lẻ tương lai trích xuất từ **Walmart M5 (Siêu thị CA_1)**, chuẩn hóa cho 25 SKU thực phẩm tiêu dùng nhanh (FMCG), phục vụ việc thuyết minh và demo trực tiếp cho Giảng viên hướng dẫn và Hội đồng bảo vệ Đồ án tốt nghiệp.

---

## 1. Cấu Trúc Thư Mục

```
data/demo_future/
├── weekly/                              # Dữ liệu gộp theo chu kỳ tuần (7 ngày)
│   ├── week_5_sales.csv                 # Doanh số bán hàng Tuần 5 (2026-11-23 -> 2026-11-29)
│   ├── week_5_inventory.csv             # Tồn kho kiểm kê cuối Tuần 5 (2026-11-29)
│   ├── week_6_sales.csv                 # Doanh số bán hàng Tuần 6 (2026-11-30 -> 2026-12-06)
│   └── week_6_inventory.csv             # Tồn kho kiểm kê cuối Tuần 6 (2026-12-06)
│
└── daily/                               # Dữ liệu lẻ từng ngày (14 ngày liên tiếp)
    ├── sales/                           # 14 file sales_YYYY-MM-DD.csv
    │   ├── sales_2026-11-23.csv
    │   ├── sales_2026-11-24.csv
    │   └── ... (đến sales_2026-12-06.csv)
    └── inventory/                       # 14 file inventory_YYYY-MM-DD.csv
        ├── inventory_2026-11-23.csv
        ├── inventory_2026-11-24.csv
        └── ... (đến inventory_2026-12-06.csv)
```

---

## 2. Các Kịch Bản Demo Trực Tiếp

### Kịch bản 1: Demo Phê Duyệt Phiên Hiện Tại (Hôm nay: 2026-11-22)
1. Đăng nhập hệ thống bằng tài khoản Quản lý cửa hàng (`manager` / `password123`).
2. Mở menu **Đề Xuất Mua Hàng**:
   - Hệ thống hiển thị sẵn phiên đang chờ duyệt: `REC-20261122-001` (Trạng thái: **Draft**).
   - Nhấn vào từng SKU (ví dụ: `MILK-VNM-1L`, `PEPSI-330`, `NOOD-HAOHAO-75`) để xem biểu đồ dự báo nhu cầu và khoảng tin cậy asymmetric CI 95%.
   - Bấm nút **Giải thích (AI Explain - Gemini Flash)** để xem phân tích tự nhiên on-demand giải thích 5 câu hỏi cốt lõi (*What, When, How Much, Which Supplier, Why*).
   - Bấm **Phê duyệt đề xuất mua hàng**: Hệ thống chuyển phiên sang `Approved` và tự động sinh các Đơn mua hàng POs tương ứng cho các Nhà cung cấp theo thuật toán chấm điểm WSM.

### Kịch bản 2: Demo Nhập Kho Hàng Đã Đặt (Goods Receipt)
1. Mở menu **Nhận Hàng Kho** (hoặc danh sách Đơn đặt hàng POs).
2. Kiểm tra danh sách các PO vừa sinh ra ở trạng thái `Approved`.
3. Bấm **Xác nhận nhận hàng kho** cho từng PO:
   - Điền ngày nhận hàng (ngày hôm nay hoặc ngày dự kiến).
   - Xác nhận số lượng thực nhận (có thể thử nghiệm nhận đủ hoặc nhận thiếu để quan sát cập nhật điểm đánh giá nhà cung cấp OTIF).
   - Sau khi xác nhận, tồn kho hệ thống (`currentInventory`) tự động tăng lên và trạng thái PO chuyển sang `Completed`.

### Kịch bản 3: Demo Nhập Dữ Liệu Tuần Mới (Gộp Nguyên Tuần)
1. Mở menu **Nhập Dữ Liệu (Data Import)**:
   - Tải lên tệp `data/demo_future/weekly/week_5_sales.csv` vào ô Tải tệp Bán hàng.
   - Bấm **Kiểm tra (Validate)**: Quan sát hệ thống thẩm định cấu trúc CSV, tính hợp lệ từng dòng theo nguyên tắc All-or-Nothing.
   - Bấm **Xác nhận lưu**: Hệ thống ghi nhận doanh số tuần 5 vào database.
   - Tiếp tục tải lên tệp `data/demo_future/weekly/week_5_inventory.csv` vào ô Tải tệp Kiểm kê tồn kho và xác nhận lưu.
2. Mở menu **Đánh Giá & Hiệu Quả**:
   - Quan sát phiên `REC-20261122-001` đã tự động được tính toán đối soát độ chính xác (WAPE, MAPE, Bias) so với dữ liệu bán hàng thực tế vừa nạp!

### Kịch bản 4: Demo Nhập Dữ Liệu Từng Ngày Lẻ (Daily Import)
1. Nếu Giảng viên muốn kiểm tra khả năng nhập dữ liệu vận hành hàng ngày:
   - Chọn từng file ngày lẻ trong `data/demo_future/daily/sales/sales_YYYY-MM-DD.csv` để nạp vào hệ thống.
   - Hệ thống chấp nhận việc nạp bù hoặc nạp tiến độ theo từng ngày mà không gây xung đột hay trùng lặp dữ liệu (`skipDuplicates` / `upsert`).
