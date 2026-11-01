# Hướng Dẫn Sử Dụng Bộ Dữ Liệu Bán Lẻ Thực Tế (Walmart M5 Benchmark)

Bộ dữ liệu này được trích xuất 100% từ chuỗi dữ liệu bán hàng thực tế của **Walmart M5 (Siêu thị CA_1)**, chuẩn hóa sang 25 mặt hàng tiêu dùng nhanh (FMCG) quen thuộc tại Việt Nam và tuân thủ định dạng kiểm tra nghiêm ngặt của `UC-04: Nhập dữ liệu vận hành`.

## Cấu trúc các tệp tin

| Tệp tin | Khoảng thời gian | Mục đích sử dụng |
|---|---|---|
| `data/benchmark/sales_history_benchmark.csv` | 2026-07-07 đến 2026-10-04 (90 ngày) | Nạp sẵn vào cơ sở dữ liệu làm nền lịch sử bán hàng qua `npm run prisma:seed` |
| `data/benchmark/inventory_snapshot_benchmark.csv` | 2026-10-04 | Tồn kho ban đầu trước đợt phân tích Tuần 1 |
| `week_1_sales.csv` & `week_1_inventory.csv` | 2026-10-05 đến 2026-10-11 (Tuần 1) | Đã lưu vào CSDL qua chu kỳ phân tích & đối soát tự động |
| `week_2_sales.csv` & `week_2_inventory.csv` | 2026-10-12 đến 2026-10-18 (Tuần 2) | Đã lưu vào CSDL qua chu kỳ phân tích & đối soát tự động |
| `week_3_sales.csv` & `week_3_inventory.csv` | 2026-10-19 đến 2026-10-25 (Tuần 3) | Đã lưu vào CSDL qua chu kỳ phân tích & đối soát tự động |
| `week_4_sales.csv` & `week_4_inventory.csv` | 2026-10-26 đến 2026-11-01 (Tuần 4) | Đã lưu vào CSDL qua chu kỳ phân tích & đối soát tự động (Kết thúc hôm nay) |
| `week_5_sales.csv` & `week_5_inventory.csv` | 2026-11-02 đến 2026-11-08 (Tuần 5) | **Dành cho Demo Trực Tiếp**: Tải lên để kích hoạt chu kỳ tuần mới |
| `week_6_sales.csv` & `week_6_inventory.csv` | 2026-11-09 đến 2026-11-15 (Tuần 6) | **Dành cho Demo Trực Tiếp**: Vòng lặp tuần tiếp theo |
| `week_7_sales.csv` & `week_7_inventory.csv` | 2026-11-16 đến 2026-11-22 (Tuần 7) | **Dành cho Demo Trực Tiếp**: Vòng lặp tuần tiếp theo |
| `week_8_sales.csv` & `week_8_inventory.csv` | 2026-11-23 đến 2026-11-29 (Tuần 8) | **Dành cho Demo Trực Tiếp**: Vòng lặp tuần tiếp theo |

---

## Kịch bản Demo Trực Tiếp Cho Giảng Viên / Hội Đồng Tốt Nghiệp

1. Đăng nhập hệ thống bằng tài khoản Quản lý (`manager` / `password123`).
2. Mở màn hình **Đánh Giá & Hiệu Quả**: Xem lịch sử 4 tuần đã đối soát (`REC-...-W1` đến `W4`), quan sát các chỉ số WAPE, MAPE, Bias và biểu đồ đối soát thực tế.
3. Chuyển sang màn hình **Đề Xuất Mua Hàng DSS**:
   - Bấm **Phân tích mua hàng**: Hệ thống kết nối AI dự báo cho Tuần 5 (`2026-11-02` đến `2026-11-08`).
   - Xem bảng xếp hạng nhà cung cấp WSM, bấm **Giải thích (Why Buy)** để xem phân tích tự nhiên từ Google Gemini Flash.
   - Bấm **Phê duyệt mua hàng** để tự động tạo các đơn hàng POs.
4. Mở màn hình **Nhập Dữ Liệu**: Tải lên tệp `week_5_sales.csv` và `week_5_inventory.csv`.
5. Quay lại màn hình **Đánh Giá & Hiệu Quả**: Xem kết quả đối soát độ chính xác của Tuần 5 được cập nhật ngay lập tức!
