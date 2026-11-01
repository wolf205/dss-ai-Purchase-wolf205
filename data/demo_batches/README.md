# Hướng Dẫn Sử Dụng Bộ Dữ Liệu Bán Lẻ Thực Tế (Walmart M5 Benchmark)

Bộ dữ liệu này được trích xuất 100% từ chuỗi dữ liệu bán hàng thực tế của **Walmart M5 (Siêu thị CA_1)**, chuẩn hóa sang 25 mặt hàng tiêu dùng nhanh (FMCG) quen thuộc tại Việt Nam và tuân thủ định dạng kiểm tra nghiêm ngặt của `UC-04: Nhập dữ liệu vận hành`.

## Cấu trúc các tệp tin

| Tệp tin | Khoảng thời gian | Mục đích sử dụng |
|---|---|---|
| `data/benchmark/sales_history_benchmark.csv` | 2026-07-07 đến 2026-10-04 (90 ngày) | Nạp sẵn vào cơ sở dữ liệu làm nền lịch sử bán hàng qua `npm run prisma:seed` |
| `data/benchmark/inventory_snapshot_benchmark.csv` | 2026-10-04 | Tồn kho ban đầu trước đợt phân tích Tuần 1 |
| `week_1_sales.csv` & `week_1_inventory.csv` | 2026-10-05 đến 2026-10-11 (Tuần 1) | Tải lên sau khi hoàn thành phiên DSS Tuần 1 để đối soát |
| `week_2_sales.csv` & `week_2_inventory.csv` | 2026-10-12 đến 2026-10-18 (Tuần 2) | Tải lên sau khi hoàn thành phiên DSS Tuần 2 |
| `week_3_sales.csv` & `week_3_inventory.csv` | 2026-10-19 đến 2026-10-25 (Tuần 3) | Tải lên sau khi hoàn thành phiên DSS Tuần 3 |
| `week_4_sales.csv` & `week_4_inventory.csv` | 2026-10-26 đến 2026-11-01 (Tuần 4) | Tải lên sau khi hoàn thành phiên DSS Tuần 4 |

---

## Kịch bản Demo Từng Bước (Walkthrough)

### Vòng lặp 1 (Tuần 1):
1. Chạy lệnh nạp dữ liệu nền: `cd backend && npm run prisma:seed`
2. Đăng nhập hệ thống (tài khoản `manager` / mật khẩu `password123`).
3. Truy cập màn hình **Đề xuất mua hàng (DSS Review)**, bấm **Phân tích mua hàng**.
4. Hệ thống AI dự báo nhu cầu cho 7 ngày tiếp theo và gợi ý SOQ, nhà cung cấp tối ưu.
5. Xem giải thích (Why Buy), duyệt phiên để sinh Đơn đặt hàng PO.
6. Sang màn hình **Quản lý đơn hàng (Purchase Orders)** & **Nhận hàng (Goods Receipt)** để duyệt và xác nhận nhập kho PO.

### Vòng lặp 2 (Đối soát Tuần 1 & Phân tích Tuần 2):
1. Sau khi vận hành xong tuần 1, truy cập **Nhập dữ liệu (Data Import)**.
2. Tải lên tệp `data/demo_batches/week_1_sales.csv` và `data/demo_batches/week_1_inventory.csv`.
3. Truy cập trang **Đánh giá & Hiệu quả DSS** -> Chọn phiên Tuần 1 vừa duyệt -> Hệ thống tự động so khớp dự báo với doanh số bán thực tế của `week_1_sales.csv` và hiển thị chỉ số WAPE, MAPE, Service Level thực tế kèm biểu đồ Recharts!
4. Quay lại trang DSS Review để bấm **Phân tích mua hàng** cho Tuần 2!
