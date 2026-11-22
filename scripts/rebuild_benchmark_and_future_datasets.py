"""
Script tái tạo bộ dữ liệu Walmart M5 Benchmark và Demo tương lai
Neo theo thời điểm hiện tại: 2026-11-22 (Chủ Nhật).

Khoảng thời gian:
1. Baseline 90 ngày lịch sử: 2026-08-03 đến 2026-10-31
   -> Lưu vào data/benchmark/sales_history_benchmark.csv
   -> Tồn kho snapshot đầu kỳ: data/benchmark/inventory_snapshot_benchmark.csv (2026-10-31)
2. 3 Tuần lịch sử đã vận hành (Phiên 1, 2, 3):
   - Tuần 1: 2026-11-01 -> 2026-11-07 (Phân tích tại 2026-11-01)
   - Tuần 2: 2026-11-08 -> 2026-11-14 (Phân tích tại 2026-11-08)
   - Tuần 3: 2026-11-15 -> 2026-11-21 (Phân tích tại 2026-11-15)
   -> Lưu vào data/demo_batches/ (week_1..3_sales.csv & week_1..3_inventory.csv)
3. Phiên 4 (Hôm nay 2026-11-22):
   - Phân tích tại 2026-11-22, giữ trạng thái Draft / Active trên UI.
4. Dữ liệu Demo Tương lai (2 tuần từ 2026-11-23 đến 2026-12-06):
   - data/demo_future/weekly/:
     + week_5_sales.csv & week_5_inventory.csv (2026-11-23 -> 2026-11-29)
     + week_6_sales.csv & week_6_inventory.csv (2026-11-30 -> 2026-12-06)
   - data/demo_future/daily/sales/: 14 files sales_YYYY-MM-DD.csv
   - data/demo_future/daily/inventory/: 14 files inventory_YYYY-MM-DD.csv
   - data/demo_future/README.md
"""

import os
import sys
import csv
from datetime import date, timedelta
import pandas as pd
import numpy as np

# Thêm đường dẫn gốc để import SKU_MAPPINGS
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scripts.prepare_m5_real_dataset import SKU_MAPPINGS

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def build_datasets():
    print("=== BẮT ĐẦU TÁI TẠO BỘ DỮ LIỆU BENCHMARK VÀ DEMO TƯƠNG LAI ===")
    
    # 1. Thu thập chuỗi 146 ngày thực tế từ các file CSV hiện có
    print("1. Đọc dữ liệu bán hàng thực tế từ benchmark CSV và demo batches...")
    df_bench = pd.read_csv('data/benchmark/sales_history_benchmark.csv')
    
    # Tạo danh sách các ngày cũ
    old_bench_dates = sorted(df_bench['Date'].unique())
    print(f"   - Benchmark cũ có {len(old_bench_dates)} ngày (từ {old_bench_dates[0]} đến {old_bench_dates[-1]})")
    
    # Đọc 8 tuần demo cũ
    old_week_dfs = []
    for w in range(1, 9):
        w_df = pd.read_csv(f'data/demo_batches/week_{w}_sales.csv')
        old_week_dfs.append(w_df)
    
    # Ghép toàn bộ dữ liệu bán hàng cũ thành 1 DataFrame lớn
    df_all_old = pd.concat([df_bench] + old_week_dfs, ignore_index=True)
    
    # Lấy danh sách 146 ngày cũ liên tục (19/07/2026 -> 11/12/2026)
    start_old = date(2026, 7, 19)
    TOTAL_DAYS = 146
    old_date_list = [start_old + timedelta(days=i) for i in range(TOTAL_DAYS)]
    old_date_strs = [d.strftime('%Y-%m-%d') for d in old_date_list]
    
    # Xây dựng bảng ma trận daily quantity cho 25 SKU: {sku: [q_0, q_1, ..., q_145]}
    # Pivot df_all_old theo Date và SKU
    pivot_df = df_all_old.pivot_table(index='Date', columns='SKU', values='Quantity', fill_value=0)
    
    sku_daily_series = {}
    for mapping in SKU_MAPPINGS:
        sku = mapping['skuCode']
        series = []
        for d_str in old_date_strs:
            if d_str in pivot_df.index and sku in pivot_df.columns:
                series.append(int(pivot_df.loc[d_str, sku]))
            else:
                series.append(0)
        sku_daily_series[sku] = series
        assert len(series) == TOTAL_DAYS, f"SKU {sku} không đủ 146 ngày!"

    print(f"✅ Đã thu thập đủ chuỗi số lượng bán hàng thực tế 146 ngày cho {len(sku_daily_series)} SKU.")

    # 2. Thiết lập trục thời gian mới (Neo theo Hiện tại 2026-11-22):
    # - Baseline 90 ngày: 2026-08-03 đến 2026-10-31 (index 0 đến 89)
    # - Tuần 1: 2026-11-01 -> 2026-11-07 (index 90 đến 96)
    # - Tuần 2: 2026-11-08 -> 2026-11-14 (index 97 đến 103)
    # - Tuần 3: 2026-11-15 -> 2026-11-21 (index 104 đến 110)
    # - Phiên 4 (Hôm nay): 2026-11-22 (index 111)
    # - Tuần tương lai 1 (Tuần 5): 2026-11-23 -> 2026-11-29 (index 112 đến 118)
    # - Tuần tương lai 2 (Tuần 6): 2026-11-30 -> 2026-12-06 (index 119 đến 125)
    
    BASELINE_DAYS = 90
    new_start_date = date(2026, 8, 3)
    new_date_list = [new_start_date + timedelta(days=i) for i in range(TOTAL_DAYS)]
    new_date_strs = [d.strftime('%Y-%m-%d') for d in new_date_list]
    
    print("\nTrục thời gian mới:")
    print(f"- Baseline 90 ngày: {new_date_strs[0]} đến {new_date_strs[BASELINE_DAYS - 1]}")
    print(f"- Tuần 1: {new_date_strs[90]} đến {new_date_strs[96]}")
    print(f"- Tuần 2: {new_date_strs[97]} đến {new_date_strs[103]}")
    print(f"- Tuần 3: {new_date_strs[104]} đến {new_date_strs[110]}")
    print(f"- Phiên 4 (Hôm nay): {new_date_strs[111]}")
    print(f"- Demo Tương lai Tuần 5: {new_date_strs[112]} đến {new_date_strs[118]}")
    print(f"- Demo Tương lai Tuần 6: {new_date_strs[119]} đến {new_date_strs[125]}")
    
    sku_price_map = {m['skuCode']: m['sellingPrice'] for m in SKU_MAPPINGS}
    sku_mapping_map = {m['skuCode']: m for m in SKU_MAPPINGS}

    # 3. Tạo data/benchmark/sales_history_benchmark.csv
    os.makedirs('data/benchmark', exist_ok=True)
    baseline_rows = [['Date', 'SKU', 'Quantity', 'Revenue']]
    for day_idx in range(BASELINE_DAYS):
        d_str = new_date_strs[day_idx]
        for mapping in SKU_MAPPINGS:
            sku = mapping['skuCode']
            qty = sku_daily_series[sku][day_idx]
            if qty > 0:
                rev = int(qty * mapping['sellingPrice'])
                baseline_rows.append([d_str, sku, qty, rev])
                
    bench_sales_path = 'data/benchmark/sales_history_benchmark.csv'
    with open(bench_sales_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(baseline_rows)
    print(f"✅ Đã ghi {bench_sales_path} ({len(baseline_rows) - 1} dòng)")

    # 4. Tạo data/benchmark/inventory_snapshot_benchmark.csv (tồn kho tại 2026-10-31)
    init_inv_rows = [['SKU', 'StockQuantity']]
    current_stocks = {}
    for mapping in SKU_MAPPINGS:
        sku = mapping['skuCode']
        baseline_vals = sku_daily_series[sku][:BASELINE_DAYS]
        daily_mean = max(1.0, float(np.mean(baseline_vals)))
        stock_qty = max(2, int(round(daily_mean * mapping['initialStockDays'])))
        current_stocks[sku] = stock_qty
        init_inv_rows.append([sku, stock_qty])
        
    bench_inv_path = 'data/benchmark/inventory_snapshot_benchmark.csv'
    with open(bench_inv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerows(init_inv_rows)
    print(f"✅ Đã ghi {bench_inv_path} ({len(init_inv_rows) - 1} SKU)")

    # 5. Tạo data/demo_batches/ cho Tuần 1, 2, 3, 4
    os.makedirs('data/demo_batches', exist_ok=True)
    simulated_stock = current_stocks.copy()
    
    # 4 tuần (w = 1..4)
    for w in range(1, 5):
        w_start_idx = BASELINE_DAYS + (w - 1) * 7
        w_end_idx = w_start_idx + 7
        
        w_sales_rows = [['Date', 'SKU', 'Quantity', 'Revenue']]
        week_sales_by_sku = {m['skuCode']: 0 for m in SKU_MAPPINGS}
        
        for day_idx in range(w_start_idx, w_end_idx):
            d_str = new_date_strs[day_idx]
            for mapping in SKU_MAPPINGS:
                sku = mapping['skuCode']
                qty = sku_daily_series[sku][day_idx]
                if qty > 0:
                    rev = int(qty * mapping['sellingPrice'])
                    w_sales_rows.append([d_str, sku, qty, rev])
                week_sales_by_sku[sku] += qty
                
        sales_path = f'data/demo_batches/week_{w}_sales.csv'
        with open(sales_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(w_sales_rows)
            
        # Tính tồn kho cuối tuần w
        w_inv_rows = [['SKU', 'StockQuantity']]
        for mapping in SKU_MAPPINGS:
            sku = mapping['skuCode']
            sold = week_sales_by_sku[sku]
            baseline_vals = sku_daily_series[sku][:w_start_idx]
            d_mean = max(1.0, float(np.mean(baseline_vals)))
            replenished = int(round(d_mean * 7))
            new_stock = max(0, simulated_stock[sku] - sold + replenished)
            new_stock = max(new_stock, int(round(d_mean * 1.5)))
            simulated_stock[sku] = new_stock
            w_inv_rows.append([sku, new_stock])
            
        inv_path = f'data/demo_batches/week_{w}_inventory.csv'
        with open(inv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(w_inv_rows)
        print(f"✅ Đã ghi data/demo_batches/week_{w} (sales & inv)")

    # 6. Tạo data/demo_future/ (2 tuần tương lai từ 2026-11-23 đến 2026-12-06)
    os.makedirs('data/demo_future/weekly', exist_ok=True)
    os.makedirs('data/demo_future/daily/sales', exist_ok=True)
    os.makedirs('data/demo_future/daily/inventory', exist_ok=True)
    
    # Tuần 5: 2026-11-23 -> 2026-11-29 (index 112 -> 118)
    # Tuần 6: 2026-11-30 -> 2026-12-06 (index 119 -> 125)
    future_weeks = [
        {'weekNum': 5, 'startIdx': 112, 'endIdx': 119, 'name': 'week_5'},
        {'weekNum': 6, 'startIdx': 119, 'endIdx': 126, 'name': 'week_6'},
    ]
    
    future_simulated_stock = simulated_stock.copy()
    
    for fw in future_weeks:
        w_start_idx = fw['startIdx']
        w_end_idx = fw['endIdx']
        w_name = fw['name']
        
        w_sales_rows = [['Date', 'SKU', 'Quantity', 'Revenue']]
        week_sales_by_sku = {m['skuCode']: 0 for m in SKU_MAPPINGS}
        
        for day_idx in range(w_start_idx, w_end_idx):
            d_str = new_date_strs[day_idx]
            for mapping in SKU_MAPPINGS:
                sku = mapping['skuCode']
                qty = sku_daily_series[sku][day_idx]
                if qty > 0:
                    rev = int(qty * mapping['sellingPrice'])
                    w_sales_rows.append([d_str, sku, qty, rev])
                week_sales_by_sku[sku] += qty
                
        # File weekly sales
        w_sales_path = f'data/demo_future/weekly/{w_name}_sales.csv'
        with open(w_sales_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(w_sales_rows)
            
        # File weekly inventory
        w_inv_rows = [['SKU', 'StockQuantity']]
        for mapping in SKU_MAPPINGS:
            sku = mapping['skuCode']
            sold = week_sales_by_sku[sku]
            baseline_vals = sku_daily_series[sku][:w_start_idx]
            d_mean = max(1.0, float(np.mean(baseline_vals)))
            replenished = int(round(d_mean * 7))
            new_stock = max(0, future_simulated_stock[sku] - sold + replenished)
            new_stock = max(new_stock, int(round(d_mean * 1.5)))
            future_simulated_stock[sku] = new_stock
            w_inv_rows.append([sku, new_stock])
            
        w_inv_path = f'data/demo_future/weekly/{w_name}_inventory.csv'
        with open(w_inv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(w_inv_rows)
        print(f"✅ Đã ghi data/demo_future/weekly/{w_name} (sales & inv)")

    # 7. Sinh 14 file lẻ từng ngày (daily sales và daily inventory) từ 2026-11-23 đến 2026-12-06
    print("7. Tạo 14 file lẻ từng ngày cho demo...")
    daily_running_stock = simulated_stock.copy()
    
    for day_idx in range(112, 126):
        d_str = new_date_strs[day_idx]
        
        # a. Daily sales
        day_sales_rows = [['Date', 'SKU', 'Quantity', 'Revenue']]
        for mapping in SKU_MAPPINGS:
            sku = mapping['skuCode']
            qty = sku_daily_series[sku][day_idx]
            if qty > 0:
                rev = int(qty * mapping['sellingPrice'])
                day_sales_rows.append([d_str, sku, qty, rev])
                
        day_sales_path = f'data/demo_future/daily/sales/sales_{d_str}.csv'
        with open(day_sales_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(day_sales_rows)
            
        # b. Daily inventory: Tồn kho cuối ngày d_str
        # Giả lập: Hàng bán làm giảm kho; nếu là ngày thứ 2 hoặc thứ 4 (hàng PO về) thì cộng bổ sung
        day_of_week = (day_idx - 112) % 7 # 0 = Thứ 2, 6 = Chủ nhật
        day_inv_rows = [['SKU', 'StockQuantity']]
        for mapping in SKU_MAPPINGS:
            sku = mapping['skuCode']
            qty = sku_daily_series[sku][day_idx]
            d_mean = max(1.0, float(np.mean(sku_daily_series[sku][:day_idx])))
            
            # Giả định hàng nhập kho về vào Thứ Ba (day_of_week == 1) và Thứ Sáu (day_of_week == 4)
            replenish_day = int(round(d_mean * 3.5)) if day_of_week in (1, 4) else 0
            
            new_st = max(0, daily_running_stock[sku] - qty + replenish_day)
            new_st = max(new_st, int(round(d_mean * 1.2)))
            daily_running_stock[sku] = new_st
            day_inv_rows.append([sku, new_st])
            
        day_inv_path = f'data/demo_future/daily/inventory/inventory_{d_str}.csv'
        with open(day_inv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerows(day_inv_rows)

    print(f"✅ Đã tạo 14 file sales và 14 file inventory lẻ từng ngày tại data/demo_future/daily/")

    # 8. Tạo file README hướng dẫn sử dụng demo chi tiết
    readme_content = """# Dữ Liệu Demo Tương Lai (2 Tuần: 2026-11-23 đến 2026-12-06)

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
"""
    with open('data/demo_future/README.md', 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print("✅ Đã ghi data/demo_future/README.md")
    
    print("\n🎉 HOÀN TẤT TÁI TẠO BỘ DỮ LIỆU BENCHMARK VÀ DEMO TƯƠNG LAI!")

if __name__ == '__main__':
    build_datasets()
