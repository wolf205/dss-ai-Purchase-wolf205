"""
Script trích xuất dữ liệu bán lẻ thực tế Walmart M5 (Store CA_1)
Chuẩn hóa sang mô hình chuỗi thời gian thực tế cho Hệ thống DSS Mua Hàng.

Sinh ra:
1. data/benchmark/sales_history_benchmark.csv (90 ngày Baseline)
2. data/benchmark/inventory_snapshot_benchmark.csv (Tồn kho đếm thực tế đầu kỳ)
3. data/demo_batches/ (8 đợt tuần: week_1..4 đối soát DB, week_5..8 demo tương lai)
4. data/demo_batches/README.md (Hướng dẫn sử dụng demo từng bước)
"""

import os
import sys
import zipfile
import csv
import urllib.request
from datetime import date, timedelta
import pandas as pd
import numpy as np

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 1. Định nghĩa 25 SKU thực tế ánh xạ từ các Item M5
SKU_MAPPINGS = [
    # --- Category: DAI (Bơ Sữa & Sản phẩm từ sữa) ---
    {
        "m5_item_id": "FOODS_1_099",
        "skuCode": "MILK-VNM-1L",
        "productName": "Sữa tươi tiệt trùng Vinamilk 100% 1L",
        "categoryCode": "DAI",
        "unit": "Hộp",
        "barcode": "8934673100012",
        "sellingPrice": 34000,
        "initialStockDays": 1.2, # Thiếu hàng (< ROP)
        "suppliers": [
            {"supplierCode": "NCC-VNM", "purchasePrice": 26000, "moq": 20, "leadTime": 2},
            {"supplierCode": "NCC-THM", "purchasePrice": 27500, "moq": 10, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_1_085",
        "skuCode": "MILK-TH-1L",
        "productName": "Sữa tươi tiệt trùng TH True Milk 1L",
        "categoryCode": "DAI",
        "unit": "Hộp",
        "barcode": "8934673200025",
        "sellingPrice": 37000,
        "initialStockDays": 2.5, # Cảnh báo (~ ROP)
        "suppliers": [
            {"supplierCode": "NCC-THM", "purchasePrice": 28500, "moq": 15, "leadTime": 2},
            {"supplierCode": "NCC-VNM", "purchasePrice": 30000, "moq": 10, "leadTime": 2},
        ],
    },
    {
        "m5_item_id": "FOODS_1_200",
        "skuCode": "YOG-VNM-100G",
        "productName": "Sữa chua Vinamilk có đường 100g",
        "categoryCode": "DAI",
        "unit": "Hộp",
        "barcode": "8934673100039",
        "sellingPrice": 8500,
        "initialStockDays": 8.0, # Dư dả (An toàn)
        "suppliers": [
            {"supplierCode": "NCC-VNM", "purchasePrice": 6200, "moq": 48, "leadTime": 2},
            {"supplierCode": "NCC-MAS", "purchasePrice": 6600, "moq": 24, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_1_195",
        "skuCode": "CHEESE-BOCU-120G",
        "productName": "Phô mai Con Bò Cười truyền thống 8 miếng",
        "categoryCode": "DAI",
        "unit": "Hộp",
        "barcode": "8934673100046",
        "sellingPrice": 42000,
        "initialStockDays": 2.0, # Cảnh báo
        "suppliers": [
            {"supplierCode": "NCC-VNM", "purchasePrice": 33000, "moq": 10, "leadTime": 2},
            {"supplierCode": "NCC-THM", "purchasePrice": 34500, "moq": 5, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_1_013",
        "skuCode": "BUTTER-PRES-200G",
        "productName": "Bơ lạt President nhập khẩu Pháp 200g",
        "categoryCode": "DAI",
        "unit": "Gói",
        "barcode": "8934673100053",
        "sellingPrice": 75000,
        "initialStockDays": 4.0, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-VNM", "purchasePrice": 59000, "moq": 6, "leadTime": 3},
            {"supplierCode": "NCC-KDO", "purchasePrice": 61000, "moq": 4, "leadTime": 2},
        ],
    },

    # --- Category: BEV (Nước giải khát & Đồ uống) ---
    {
        "m5_item_id": "FOODS_2_197",
        "skuCode": "PEPSI-330",
        "productName": "Nước ngọt Pepsi lon 330ml",
        "categoryCode": "BEV",
        "unit": "Lon",
        "barcode": "8934588012114",
        "sellingPrice": 11000,
        "initialStockDays": 1.5, # Thiếu hàng (< ROP)
        "suppliers": [
            {"supplierCode": "NCC-PEP", "purchasePrice": 7800, "moq": 48, "leadTime": 1},
            {"supplierCode": "NCC-MAS", "purchasePrice": 8200, "moq": 24, "leadTime": 2},
        ],
    },
    {
        "m5_item_id": "FOODS_2_019",
        "skuCode": "COCA-330",
        "productName": "Nước ngọt Coca-Cola vị nguyên bản lon 330ml",
        "categoryCode": "BEV",
        "unit": "Lon",
        "barcode": "8934588012121",
        "sellingPrice": 11000,
        "initialStockDays": 2.2, # Cảnh báo
        "suppliers": [
            {"supplierCode": "NCC-ORN", "purchasePrice": 7900, "moq": 48, "leadTime": 1},
            {"supplierCode": "NCC-MAS", "purchasePrice": 8300, "moq": 24, "leadTime": 2},
        ],
    },
    {
        "m5_item_id": "FOODS_2_379",
        "skuCode": "AQUAFINA-500",
        "productName": "Nước tinh khiết Aquafina chai 500ml",
        "categoryCode": "BEV",
        "unit": "Chai",
        "barcode": "8934588012138",
        "sellingPrice": 6500,
        "initialStockDays": 7.0, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-PEP", "purchasePrice": 4200, "moq": 48, "leadTime": 1},
            {"supplierCode": "NCC-ORN", "purchasePrice": 4500, "moq": 24, "leadTime": 2},
        ],
    },
    {
        "m5_item_id": "FOODS_2_106",
        "skuCode": "TEA-C2-360",
        "productName": "Trà xanh C2 hương chanh chai 360ml",
        "categoryCode": "BEV",
        "unit": "Chai",
        "barcode": "8934588012145",
        "sellingPrice": 9000,
        "initialStockDays": 1.0, # Thiếu hàng
        "suppliers": [
            {"supplierCode": "NCC-URC", "purchasePrice": 6400, "moq": 24, "leadTime": 2},
            {"supplierCode": "NCC-ORN", "purchasePrice": 6800, "moq": 12, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_2_028",
        "skuCode": "ENERGY-RED-250",
        "productName": "Nước tăng lực Red Bull lon 250ml",
        "categoryCode": "BEV",
        "unit": "Lon",
        "barcode": "8934588012152",
        "sellingPrice": 15000,
        "initialStockDays": 3.0, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-ORN", "purchasePrice": 11500, "moq": 24, "leadTime": 2},
            {"supplierCode": "NCC-PEP", "purchasePrice": 12000, "moq": 12, "leadTime": 1},
        ],
    },

    # --- Category: SNK (Bánh kẹo & Đồ ăn vặt) ---
    {
        "m5_item_id": "FOODS_3_586",
        "skuCode": "SNACK-LAYS-56G",
        "productName": "Snack khoai tây Lay's vị tự nhiên 56g",
        "categoryCode": "SNK",
        "unit": "Gói",
        "barcode": "8934688123014",
        "sellingPrice": 14000,
        "initialStockDays": 1.2, # Thiếu hàng (< ROP)
        "suppliers": [
            {"supplierCode": "NCC-PEP", "purchasePrice": 9800, "moq": 30, "leadTime": 1},
            {"supplierCode": "NCC-ORN", "purchasePrice": 10500, "moq": 15, "leadTime": 2},
        ],
    },
    {
        "m5_item_id": "FOODS_3_090",
        "skuCode": "BANH-COSY-136G",
        "productName": "Bánh quy sữa Cosy Marie Kinh Đô 136g",
        "categoryCode": "SNK",
        "unit": "Gói",
        "barcode": "8934688123021",
        "sellingPrice": 18000,
        "initialStockDays": 1.8, # Cảnh báo
        "suppliers": [
            {"supplierCode": "NCC-KDO", "purchasePrice": 13200, "moq": 20, "leadTime": 2},
            {"supplierCode": "NCC-ORN", "purchasePrice": 14000, "moq": 10, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_3_555",
        "skuCode": "CHOCO-KID-28G",
        "productName": "Socola sữa Kinder Joy trứng đồ chơi 20g",
        "categoryCode": "SNK",
        "unit": "Quả",
        "barcode": "8934688123038",
        "sellingPrice": 62000,
        "initialStockDays": 3.5, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-ORN", "purchasePrice": 48000, "moq": 12, "leadTime": 2},
            {"supplierCode": "NCC-KDO", "purchasePrice": 50000, "moq": 6, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_3_714",
        "skuCode": "CANDY-ALPEN-150",
        "productName": "Kẹo sữa caramen Alpenliebe thỏi 150g",
        "categoryCode": "SNK",
        "unit": "Thỏi",
        "barcode": "8934688123045",
        "sellingPrice": 19000,
        "initialStockDays": 5.0, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-ORN", "purchasePrice": 14200, "moq": 24, "leadTime": 1},
            {"supplierCode": "NCC-KDO", "purchasePrice": 14800, "moq": 12, "leadTime": 2},
        ],
    },
    {
        "m5_item_id": "FOODS_3_252",
        "skuCode": "SNACK-OISHI-40G",
        "productName": "Snack bắp ngọt Oishi gói 40g",
        "categoryCode": "SNK",
        "unit": "Gói",
        "barcode": "8934688123052",
        "sellingPrice": 7000,
        "initialStockDays": 6.0, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-ORN", "purchasePrice": 4800, "moq": 50, "leadTime": 2},
            {"supplierCode": "NCC-KDO", "purchasePrice": 5200, "moq": 25, "leadTime": 1},
        ],
    },

    # --- Category: INS (Mì ăn liền & Thực phẩm đóng gói) ---
    {
        "m5_item_id": "FOODS_3_080",
        "skuCode": "NOOD-HAOHAO-75",
        "productName": "Mì tôm Hảo Hảo tôm chua cay 75g",
        "categoryCode": "INS",
        "unit": "Gói",
        "barcode": "8934563123018",
        "sellingPrice": 4500,
        "initialStockDays": 1.0, # Thiếu hàng (< ROP)
        "suppliers": [
            {"supplierCode": "NCC-ACE", "purchasePrice": 3200, "moq": 60, "leadTime": 2},
            {"supplierCode": "NCC-MAS", "purchasePrice": 3400, "moq": 30, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_3_040",
        "skuCode": "NOOD-OMACHI-80",
        "productName": "Mì khoai tây Omachi sườn hầm ngũ quả 80g",
        "categoryCode": "INS",
        "unit": "Gói",
        "barcode": "8934563123025",
        "sellingPrice": 9500,
        "initialStockDays": 2.0, # Cảnh báo
        "suppliers": [
            {"supplierCode": "NCC-MAS", "purchasePrice": 7100, "moq": 30, "leadTime": 1},
            {"supplierCode": "NCC-ACE", "purchasePrice": 7400, "moq": 15, "leadTime": 2},
        ],
    },
    {
        "m5_item_id": "FOODS_3_300",
        "skuCode": "RICE-ST25-5KG",
        "productName": "Gạo đặc sản ST25 chính hãng túi 5kg",
        "categoryCode": "INS",
        "unit": "Túi",
        "barcode": "8934563123032",
        "sellingPrice": 185000,
        "initialStockDays": 2.5, # Cảnh báo
        "suppliers": [
            {"supplierCode": "NCC-MAS", "purchasePrice": 145000, "moq": 10, "leadTime": 2},
            {"supplierCode": "NCC-ORN", "purchasePrice": 152000, "moq": 5, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_3_200",
        "skuCode": "OIL-NEPTUNE-1L",
        "productName": "Dầu ăn thực vật cao cấp Neptune Light 1L",
        "categoryCode": "INS",
        "unit": "Chai",
        "barcode": "8934563123049",
        "sellingPrice": 56000,
        "initialStockDays": 3.5, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-KDO", "purchasePrice": 43000, "moq": 12, "leadTime": 2},
            {"supplierCode": "NCC-MAS", "purchasePrice": 45000, "moq": 6, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "FOODS_3_150",
        "skuCode": "SAUCE-NAMNGU-500",
        "productName": "Nước mắm Nam Ngư Đệ Nhị chai 500ml",
        "categoryCode": "INS",
        "unit": "Chai",
        "barcode": "8934563123056",
        "sellingPrice": 24000,
        "initialStockDays": 3.0, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-MAS", "purchasePrice": 18500, "moq": 15, "leadTime": 1},
            {"supplierCode": "NCC-ACE", "purchasePrice": 19500, "moq": 10, "leadTime": 2},
        ],
    },

    # --- Category: HPC (Hóa mỹ phẩm & Chăm sóc cá nhân) ---
    {
        "m5_item_id": "HOUSEHOLD_1_118",
        "skuCode": "DET-OMO-3KG",
        "productName": "Bột giặt OMO đỏ hệ bọt thông minh túi 3kg",
        "categoryCode": "HPC",
        "unit": "Túi",
        "barcode": "8934839124018",
        "sellingPrice": 165000,
        "initialStockDays": 1.5, # Thiếu hàng
        "suppliers": [
            {"supplierCode": "NCC-UNL", "purchasePrice": 132000, "moq": 8, "leadTime": 2},
            {"supplierCode": "NCC-MAS", "purchasePrice": 138000, "moq": 4, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "HOUSEHOLD_1_020",
        "skuCode": "DISH-SUNLIGHT-750",
        "productName": "Nước rửa chén Sunlight chanh túi 750g",
        "categoryCode": "HPC",
        "unit": "Túi",
        "barcode": "8934839124025",
        "sellingPrice": 28000,
        "initialStockDays": 2.0, # Cảnh báo
        "suppliers": [
            {"supplierCode": "NCC-UNL", "purchasePrice": 21000, "moq": 20, "leadTime": 2},
            {"supplierCode": "NCC-MAS", "purchasePrice": 22500, "moq": 10, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "HOUSEHOLD_2_300",
        "skuCode": "SOAP-LIFE-90G",
        "productName": "Xà bông cục Lifebuoy bảo vệ vượt trội 90g",
        "categoryCode": "HPC",
        "unit": "Cục",
        "barcode": "8934839124032",
        "sellingPrice": 16000,
        "initialStockDays": 5.0, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-UNL", "purchasePrice": 11500, "moq": 36, "leadTime": 2},
            {"supplierCode": "NCC-ORN", "purchasePrice": 12500, "moq": 12, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "HOUSEHOLD_1_086",
        "skuCode": "SHAMP-CLEAR-650",
        "productName": "Dầu gội sạch gàu Clear Men Bạc hà 650g",
        "categoryCode": "HPC",
        "unit": "Chai",
        "barcode": "8934839124049",
        "sellingPrice": 179000,
        "initialStockDays": 2.0, # Cảnh báo
        "suppliers": [
            {"supplierCode": "NCC-UNL", "purchasePrice": 142000, "moq": 6, "leadTime": 2},
            {"supplierCode": "NCC-MAS", "purchasePrice": 148000, "moq": 3, "leadTime": 1},
        ],
    },
    {
        "m5_item_id": "HOUSEHOLD_2_267",
        "skuCode": "TOOTH-PS-180G",
        "productName": "Kem đánh răng P/S Bảo vệ 123 Chăm sóc toàn diện 180g",
        "categoryCode": "HPC",
        "unit": "Tuýp",
        "barcode": "8934839124056",
        "sellingPrice": 36000,
        "initialStockDays": 4.0, # Bình thường
        "suppliers": [
            {"supplierCode": "NCC-UNL", "purchasePrice": 27000, "moq": 24, "leadTime": 2},
            {"supplierCode": "NCC-KDO", "purchasePrice": 28500, "moq": 12, "leadTime": 1},
        ],
    },
]


def ensure_m5_zip():
    raw_dir = "data/raw"
    os.makedirs(raw_dir, exist_ok=True)
    zip_path = os.path.join(raw_dir, "m5.zip")

    if not os.path.exists(zip_path):
        url = "https://github.com/Nixtla/m5-forecasts/raw/main/datasets/m5.zip"
        print(f"⏳ Đang tải m5.zip (~50MB) từ Nixtla Dataset Mirror ({url})...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as resp, open(zip_path, "wb") as f_out:
            total_size = int(resp.headers.get("Content-Length", 0))
            downloaded = 0
            chunk_size = 1024 * 1024
            while True:
                chunk = resp.read(chunk_size)
                if not chunk:
                    break
                f_out.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    pct = (downloaded / total_size) * 100
                    print(f"  -> Đã tải {downloaded // (1024*1024)}MB / {total_size // (1024*1024)}MB ({pct:.1f}%)", end="\r")
        print("\n✅ Tải m5.zip hoàn tất!")

    return zip_path


def extract_and_generate():
    print("=== BẮT ĐẦU TRÍCH XUẤT VÀ CHUẨN HÓA DỮ LIỆU THỰC TẾ WALMART M5 (146 NGÀY) ===")
    
    zip_path = ensure_m5_zip()

    # Đọc calendar và sales_train_validation từ zip
    with zipfile.ZipFile(zip_path, "r") as z:
        print("1. Đọc dữ liệu lịch calendar...")
        with z.open("calendar.csv") as f:
            cal_df = pd.read_csv(f)
        
        print("2. Đọc chuỗi bán hàng sales_train_validation cho Store CA_1...")
        with z.open("sales_train_validation.csv") as f:
            sales_df = pd.read_csv(f)
            ca1_df = sales_df[sales_df["store_id"] == "CA_1"].copy()

    # Tạo từ điển {item_id: row}
    ca1_dict = {row["item_id"]: row for _, row in ca1_df.iterrows()}

    # Kiểm tra tất cả m5_item_id có tồn tại không
    missing_items = []
    for mapping in SKU_MAPPINGS:
        if mapping["m5_item_id"] not in ca1_dict:
            missing_items.append(mapping["m5_item_id"])
    if missing_items:
        raise ValueError(f"Thiếu các item sau trong CA_1: {missing_items}")
    print(f"✅ Đã tìm thấy đầy đủ {len(SKU_MAPPINGS)} item trong Store CA_1!")

    # Tổng số ngày: 90 ngày Baseline + 4 tuần DB (28 ngày) + 4 tuần Demo tương lai (28 ngày) = 146 ngày
    BASELINE_DAYS = 90
    WEEK_DAYS = 7
    PAST_WEEKS = 4
    FUTURE_WEEKS = 4
    TOTAL_WEEKS = PAST_WEEKS + FUTURE_WEEKS
    TOTAL_DAYS = BASELINE_DAYS + TOTAL_WEEKS * WEEK_DAYS # 90 + 56 = 146 ngày

    # Lấy 146 ngày cuối cùng trong sales_train_validation: d_1768 đến d_1913
    d_indices = [f"d_{i}" for i in range(1913 - TOTAL_DAYS + 1, 1914)]
    assert len(d_indices) == TOTAL_DAYS

    # Thiết lập mốc ngày thực tế trong hệ thống DSS:
    # Baseline 90 ngày: 2026-07-07 đến 2026-10-04
    # 4 tuần tiếp nối lưu DB: 2026-10-05 đến 2026-11-01 (kết thúc đúng ngày hôm nay)
    # 4 tuần demo tương lai: 2026-11-02 đến 2026-11-29
    baseline_end_date = date(2026, 10, 4)
    start_date = baseline_end_date - timedelta(days=BASELINE_DAYS - 1)
    
    date_list = [start_date + timedelta(days=i) for i in range(TOTAL_DAYS)]

    print(f"Khoảng thời gian: từ {date_list[0]} đến {date_list[-1]}")
    print(f"- Baseline 90 ngày: {date_list[0]} -> {date_list[BASELINE_DAYS - 1]}")
    for w in range(1, TOTAL_WEEKS + 1):
        s_idx = BASELINE_DAYS + (w - 1) * WEEK_DAYS
        e_idx = s_idx + WEEK_DAYS - 1
        label = "DB" if w <= 4 else "Demo Tương Lai"
        print(f"- Tuần {w} ({label}): {date_list[s_idx]} -> {date_list[e_idx]}")

    # Thu thập chuỗi số lượng bán thực tế cho từng SKU
    sku_daily_series = {}
    for mapping in SKU_MAPPINGS:
        m5_id = mapping["m5_item_id"]
        row = ca1_dict[m5_id]
        raw_vals = [int(row[col]) for col in d_indices]
        sku_daily_series[mapping["skuCode"]] = raw_vals

    # Tạo thư mục đầu ra
    os.makedirs("data/benchmark", exist_ok=True)
    os.makedirs("data/demo_batches", exist_ok=True)

    # 1. Xuất Baseline Sales (90 ngày)
    baseline_sales_rows = [["Date", "SKU", "Quantity", "Revenue"]]
    for day_idx in range(BASELINE_DAYS):
        d_str = date_list[day_idx].strftime("%Y-%m-%d")
        for mapping in SKU_MAPPINGS:
            sku = mapping["skuCode"]
            qty = sku_daily_series[sku][day_idx]
            if qty > 0:  # UC-04 yêu cầu: Chỉ ghi nhận các dòng có phát sinh bán hàng (> 0)
                rev = int(qty * mapping["sellingPrice"])
                baseline_sales_rows.append([d_str, sku, qty, rev])

    baseline_csv_path = "data/benchmark/sales_history_benchmark.csv"
    with open(baseline_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(baseline_sales_rows)
    print(f"✅ Đã tạo {baseline_csv_path} ({len(baseline_sales_rows) - 1} dòng dữ liệu)")

    # 2. Xuất Initial Inventory Snapshot (tồn kho tại cuối baseline)
    init_inv_rows = [["SKU", "StockQuantity"]]
    current_stocks = {}
    for mapping in SKU_MAPPINGS:
        sku = mapping["skuCode"]
        baseline_vals = sku_daily_series[sku][:BASELINE_DAYS]
        daily_mean = max(1.0, float(np.mean(baseline_vals)))
        # Tính tồn kho ban đầu = daily_mean * initialStockDays
        stock_qty = max(2, int(round(daily_mean * mapping["initialStockDays"])))
        current_stocks[sku] = stock_qty
        init_inv_rows.append([sku, stock_qty])

    init_inv_csv_path = "data/benchmark/inventory_snapshot_benchmark.csv"
    with open(init_inv_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerows(init_inv_rows)
    print(f"✅ Đã tạo {init_inv_csv_path} ({len(init_inv_rows) - 1} SKU)")

    # 3. Xuất 8 Đợt Tuần (Demo Batches 1 đến 8)
    simulated_stock = current_stocks.copy()

    for week_num in range(1, TOTAL_WEEKS + 1):
        w_start_idx = BASELINE_DAYS + (week_num - 1) * WEEK_DAYS
        w_end_idx = w_start_idx + WEEK_DAYS

        # a. Sales CSV cho tuần
        w_sales_rows = [["Date", "SKU", "Quantity", "Revenue"]]
        week_sales_by_sku = {m["skuCode"]: 0 for m in SKU_MAPPINGS}

        for day_idx in range(w_start_idx, w_end_idx):
            d_str = date_list[day_idx].strftime("%Y-%m-%d")
            for mapping in SKU_MAPPINGS:
                sku = mapping["skuCode"]
                qty = sku_daily_series[sku][day_idx]
                if qty > 0:  # UC-04: Số lượng bán phải là số nguyên dương > 0
                    rev = int(qty * mapping["sellingPrice"])
                    w_sales_rows.append([d_str, sku, qty, rev])
                week_sales_by_sku[sku] += qty

        sales_batch_path = f"data/demo_batches/week_{week_num}_sales.csv"
        with open(sales_batch_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerows(w_sales_rows)

        # b. Mô phỏng tồn kho kiểm kê cho tuần tiếp theo:
        # Giả lập DSS đã đặt mua bù lượng tiêu thụ trung bình và hàng đã về kho
        w_inv_rows = [["SKU", "StockQuantity"]]
        for mapping in SKU_MAPPINGS:
            sku = mapping["skuCode"]
            sold = week_sales_by_sku[sku]
            baseline_vals = sku_daily_series[sku][:w_start_idx]
            d_mean = max(1.0, float(np.mean(baseline_vals)))
            replenished = int(round(d_mean * 7))
            new_stock = max(0, simulated_stock[sku] - sold + replenished)
            new_stock = max(new_stock, int(round(d_mean * 1.5)))
            simulated_stock[sku] = new_stock
            w_inv_rows.append([sku, new_stock])

        inv_batch_path = f"data/demo_batches/week_{week_num}_inventory.csv"
        with open(inv_batch_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerows(w_inv_rows)

        label = "DB Lưu Thực Tế" if week_num <= 4 else "Demo Tương Lai"
        print(f"✅ Đã tạo Đợt Tuần {week_num} ({label}): {sales_batch_path} & {inv_batch_path}")

    # 4. Tự động xóa file raw zip sau khi trích xuất xong
    try:
        if os.path.exists(zip_path):
            os.remove(zip_path)
            print("🧹 Đã dọn sạch data/raw/m5.zip sau khi trích xuất dữ liệu.")
    except Exception as e:
        print("Lưu ý: Không thể xóa m5.zip:", e)

    # 5. Tạo file README hướng dẫn sử dụng trong data/demo_batches/
    readme_content = """# Hướng Dẫn Sử Dụng Bộ Dữ Liệu Bán Lẻ Thực Tế (Walmart M5 Benchmark)

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
"""
    with open("data/demo_batches/README.md", "w", encoding="utf-8") as f:
        f.write(readme_content)
    print("✅ Đã tạo data/demo_batches/README.md")
    print("=== HOÀN TẤT TRÍCH XUẤT VÀ TẠO BỘ DỮ LIỆU BENCHMARK THỰC TẾ (146 NGÀY) ===")


if __name__ == "__main__":
    extract_and_generate()
