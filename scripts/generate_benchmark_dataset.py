"""
Script sinh bộ dữ liệu Benchmark Bán lẻ Chuẩn Quốc tế (M5/Kaggle Retail Demand Profile)
Dành cho Hệ thống Hỗ trợ Ra Quyết Định Mua Hàng (DSS)

Sinh ra:
1. data/benchmark/sales_history_benchmark.csv (Date,SKU,Quantity,Revenue)
2. data/benchmark/inventory_snapshot_benchmark.csv (SKU,StockQuantity)
3. Xuất cấu hình dữ liệu cho seed.ts
"""

import os
import sys
import csv
from datetime import date, timedelta
import random

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Thiết lập seed để đảm bảo tính tái lập (Reproducibility)
random.seed(42)

# Danh sách 25 SKU với các đặc tính phân phối thống kê thực nghiệm
SKU_DEFINITIONS = [
    # --- Category: DAI (Bơ Sữa & Sản phẩm từ sữa) ---
    {
        "skuCode": "MILK-VNM-1L",
        "productName": "Sữa tươi tiệt trùng Vinamilk 100% 1L",
        "categoryCode": "DAI",
        "unit": "Hộp",
        "barcode": "8934673100012",
        "sellingPrice": 34000,
        "baseDailyMean": 32.0,
        "demandType": "STABLE_HIGH", # AutoARIMA / Holt-Winters (AX)
        "weekendFactor": 1.40,
        "currentInventory": 14, # Critical (< ROP)
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "MILK-TH-1L",
        "productName": "Sữa tươi tiệt trùng TH True Milk 1L",
        "categoryCode": "DAI",
        "unit": "Hộp",
        "barcode": "8934673200025",
        "sellingPrice": 37000,
        "baseDailyMean": 26.0,
        "demandType": "STABLE_HIGH", # AutoARIMA (AX)
        "weekendFactor": 1.35,
        "currentInventory": 22, # Warning (~ ROP)
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "YOG-VNM-100G",
        "productName": "Sữa chua Vinamilk có đường 100g",
        "categoryCode": "DAI",
        "unit": "Hộp",
        "barcode": "8934673100039",
        "sellingPrice": 8500,
        "baseDailyMean": 45.0,
        "demandType": "VARIABLE_MODERATE", # Holt-Winters (AY)
        "weekendFactor": 1.50,
        "currentInventory": 150, # Normal
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "CHEESE-BOCU-120G",
        "productName": "Phô mai Con Bò Cười truyền thống 8 miếng",
        "categoryCode": "DAI",
        "unit": "Hộp",
        "barcode": "8934673100046",
        "sellingPrice": 42000,
        "baseDailyMean": 4.0,
        "demandType": "INTERMITTENT", # Croston / TSB (BZ, ADI ~ 1.8)
        "weekendFactor": 1.20,
        "zeroProbability": 0.50,
        "currentInventory": 8, # Warning
        "onOrderQuantity": 0,
    },

    # --- Category: BEV (Nước giải khát & Đồ uống) ---
    {
        "skuCode": "PEPSI-330",
        "productName": "Nước ngọt Pepsi lon 330ml",
        "categoryCode": "BEV",
        "unit": "Lon",
        "barcode": "8934588012114",
        "sellingPrice": 11000,
        "baseDailyMean": 38.0,
        "demandType": "STABLE_HIGH", # AutoARIMA / Holt-Winters (AX)
        "weekendFactor": 1.55,
        "currentInventory": 35, # Warning
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "COCA-330",
        "productName": "Nước ngọt Coca-Cola vị nguyên bản lon 330ml",
        "categoryCode": "BEV",
        "unit": "Lon",
        "barcode": "8934588012121",
        "sellingPrice": 11000,
        "baseDailyMean": 42.0,
        "demandType": "STABLE_HIGH", # AutoARIMA / Holt-Winters (AX)
        "weekendFactor": 1.60,
        "currentInventory": 25, # Critical
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "AQUAFINA-500",
        "productName": "Nước tinh khiết Aquafina 500ml",
        "categoryCode": "BEV",
        "unit": "Chai",
        "barcode": "8934588022120",
        "sellingPrice": 6500,
        "baseDailyMean": 28.0,
        "demandType": "STABLE_MODERATE", # Holt-Winters (BX)
        "weekendFactor": 1.25,
        "currentInventory": 280, # Overstock
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "TEA-C2-360",
        "productName": "Trà xanh C2 hương chanh 360ml",
        "categoryCode": "BEV",
        "unit": "Chai",
        "barcode": "8934588022137",
        "sellingPrice": 9000,
        "baseDailyMean": 18.0,
        "demandType": "VARIABLE_MODERATE", # AutoARIMA (BY)
        "weekendFactor": 1.30,
        "currentInventory": 60, # Normal
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "ENERGY-RED-250",
        "productName": "Nước tăng lực Red Bull lon 250ml",
        "categoryCode": "BEV",
        "unit": "Lon",
        "barcode": "8934588022144",
        "sellingPrice": 15000,
        "baseDailyMean": 16.0,
        "demandType": "STABLE_MODERATE", # Holt-Winters (BX)
        "weekendFactor": 1.20,
        "currentInventory": 45, # Normal
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "WINE-DALAT-750",
        "productName": "Rượu vang Đà Lạt Classic Red 750ml",
        "categoryCode": "BEV",
        "unit": "Chai",
        "barcode": "8934588022151",
        "sellingPrice": 125000,
        "baseDailyMean": 1.5,
        "demandType": "INTERMITTENT", # Croston / TSB (AZ, ADI ~ 2.4, giá cao)
        "weekendFactor": 1.80,
        "zeroProbability": 0.65,
        "currentInventory": 2, # Critical
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "NEW-ENERGY-COFFEE",
        "productName": "Cà phê sữa lon Highlands Coffee 235ml (Mới)",
        "categoryCode": "BEV",
        "unit": "Lon",
        "barcode": "8934588022168",
        "sellingPrice": 16000,
        "baseDailyMean": 12.0,
        "demandType": "COLD_START", # SMA (Lịch sử 10 ngày < 14)
        "weekendFactor": 1.25,
        "historyDays": 10,
        "currentInventory": 15, # Warning
        "onOrderQuantity": 0,
    },

    # --- Category: SNK (Bánh kẹo & Đồ ăn vặt) ---
    {
        "skuCode": "SNACK-LAYS-56G",
        "productName": "Snack khoai tây Lay's vị Tự nhiên 56g",
        "categoryCode": "SNK",
        "unit": "Gói",
        "barcode": "8934673300038",
        "sellingPrice": 14000,
        "baseDailyMean": 15.0,
        "demandType": "STABLE_MODERATE", # AutoARIMA (BX)
        "weekendFactor": 1.60,
        "currentInventory": 10, # Critical
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "BANH-COSY-136G",
        "productName": "Bánh quy Cosy Marie Kinh Đô 136g",
        "categoryCode": "SNK",
        "unit": "Gói",
        "barcode": "8934673400041",
        "sellingPrice": 18000,
        "baseDailyMean": 8.0,
        "demandType": "VARIABLE_MODERATE", # Holt-Winters (BY)
        "weekendFactor": 1.25,
        "currentInventory": 20, # Normal
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "CHOCO-KID-28G",
        "productName": "Bánh ChocoPie Orion hộp 12 cái 396g",
        "categoryCode": "SNK",
        "unit": "Hộp",
        "barcode": "8934673400058",
        "sellingPrice": 62000,
        "baseDailyMean": 11.0,
        "demandType": "STABLE_HIGH", # AutoARIMA (AX)
        "weekendFactor": 1.45,
        "currentInventory": 8, # Critical
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "CANDY-ALPEN-150",
        "productName": "Kẹo sữa Caramen Alpenliebe túi 150g",
        "categoryCode": "SNK",
        "unit": "Gói",
        "barcode": "8934673400065",
        "sellingPrice": 19000,
        "baseDailyMean": 3.0,
        "demandType": "INTERMITTENT", # Croston (CZ, ADI ~ 1.9)
        "weekendFactor": 1.20,
        "zeroProbability": 0.55,
        "currentInventory": 6, # Warning
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "GUM-COOL-58G",
        "productName": "Kẹo cao su không đường Cool Air hũ 58.4g",
        "categoryCode": "SNK",
        "unit": "Hũ",
        "barcode": "8934673400072",
        "sellingPrice": 28000,
        "baseDailyMean": 4.5,
        "demandType": "VARIABLE_LOW", # Holt-Winters (CY)
        "weekendFactor": 1.15,
        "currentInventory": 18, # Normal
        "onOrderQuantity": 0,
    },

    # --- Category: INS (Mì ăn liền & Thực phẩm đóng gói) ---
    {
        "skuCode": "NOOD-HAOHAO-75",
        "productName": "Mì tôm chua cay Hảo Hảo gói 75g",
        "categoryCode": "INS",
        "unit": "Gói",
        "barcode": "8934563138164",
        "sellingPrice": 4500,
        "baseDailyMean": 85.0,
        "demandType": "STABLE_HIGH", # AutoARIMA (AX - Volume cực lớn)
        "weekendFactor": 1.30,
        "currentInventory": 40, # Critical
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "NOOD-OMACHI-80",
        "productName": "Mì khoai tây Omachi sườn hầm ngũ quả 80g",
        "categoryCode": "INS",
        "unit": "Gói",
        "barcode": "8934563138171",
        "sellingPrice": 9500,
        "baseDailyMean": 25.0,
        "demandType": "STABLE_MODERATE", # AutoARIMA (BX)
        "weekendFactor": 1.35,
        "currentInventory": 30, # Warning
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "CHILI-CHINSU-250",
        "productName": "Tương ớt Chinsu chai 250g",
        "categoryCode": "INS",
        "unit": "Chai",
        "barcode": "8934563138188",
        "sellingPrice": 14500,
        "baseDailyMean": 7.0,
        "demandType": "VARIABLE_MODERATE", # Holt-Winters (BY)
        "weekendFactor": 1.20,
        "currentInventory": 22, # Normal
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "OIL-NEPTUNE-1L",
        "productName": "Dầu ăn thượng hạng Neptune Light 1L",
        "categoryCode": "INS",
        "unit": "Chai",
        "barcode": "8934563138195",
        "sellingPrice": 56000,
        "baseDailyMean": 8.0,
        "demandType": "STABLE_MODERATE", # AutoARIMA (BX)
        "weekendFactor": 1.30,
        "currentInventory": 12, # Warning
        "onOrderQuantity": 0,
    },

    # --- Category: HPC (Hóa mỹ phẩm & Chăm sóc cá nhân) ---
    {
        "skuCode": "SHAMP-CLEAR-650",
        "productName": "Dầu gội sạch gàu Clear Men mát lạnh 650g",
        "categoryCode": "HPC",
        "unit": "Chai",
        "barcode": "8934839121015",
        "sellingPrice": 185000,
        "baseDailyMean": 2.2,
        "demandType": "INTERMITTENT", # Croston / TSB (BZ, ADI ~ 2.1)
        "weekendFactor": 1.50,
        "zeroProbability": 0.58,
        "currentInventory": 3, # Critical
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "SOAP-LIFE-90G",
        "productName": "Xà bông cục Lifebuoy bảo vệ vượt trội 90g",
        "categoryCode": "HPC",
        "unit": "Cục",
        "barcode": "8934839121022",
        "sellingPrice": 16000,
        "baseDailyMean": 6.0,
        "demandType": "STABLE_MODERATE", # Holt-Winters (CX)
        "weekendFactor": 1.20,
        "currentInventory": 35, # Normal
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "DISH-SUNLIGHT-750",
        "productName": "Nước rửa chén Sunlight chanh túi 750g",
        "categoryCode": "HPC",
        "unit": "Túi",
        "barcode": "8934839121039",
        "sellingPrice": 29000,
        "baseDailyMean": 3.5,
        "demandType": "INTERMITTENT", # Croston / TSB (BZ, ADI ~ 2.3)
        "weekendFactor": 1.30,
        "zeroProbability": 0.60,
        "currentInventory": 5, # Warning
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "DET-OMO-3KG",
        "productName": "Bột giặt OMO đỏ hệ bọt thông minh túi 3kg",
        "categoryCode": "HPC",
        "unit": "Túi",
        "barcode": "8934839121046",
        "sellingPrice": 165000,
        "baseDailyMean": 1.8,
        "demandType": "INTERMITTENT", # Croston / TSB (AZ, ADI ~ 2.8)
        "weekendFactor": 1.60,
        "zeroProbability": 0.70,
        "currentInventory": 2, # Critical
        "onOrderQuantity": 0,
    },
    {
        "skuCode": "TOOTH-PS-180G",
        "productName": "Kem đánh răng P/S bảo vệ 123 chăm sóc toàn diện 180g",
        "categoryCode": "HPC",
        "unit": "Tuýp",
        "barcode": "8934839121053",
        "sellingPrice": 36000,
        "baseDailyMean": 5.0,
        "demandType": "VARIABLE_MODERATE", # Holt-Winters (BY)
        "weekendFactor": 1.25,
        "currentInventory": 25, # Normal
        "onOrderQuantity": 0,
    },
]

def generate_daily_quantity(sku_def, cur_date):
    """
    Sinh sản lượng bán theo ngày dựa trên cấu hình thống kê thực nghiệm
    """
    weekday = cur_date.weekday() # 0 = Monday, 6 = Sunday
    is_weekend = weekday in (5, 6) # Saturday or Sunday
    
    demand_type = sku_def["demandType"]
    base_mean = sku_def["baseDailyMean"]
    weekend_factor = sku_def.get("weekendFactor", 1.0)
    
    target_mean = base_mean * (weekend_factor if is_weekend else 0.95)
    
    if demand_type == "INTERMITTENT":
        # Chuỗi ngắt quãng: xác suất cao ngày bán = 0
        zero_prob = sku_def.get("zeroProbability", 0.55)
        if random.random() < zero_prob:
            return 0
        # Nếu có bán, lượng bán thường gom thành đợt (2 - 6 món)
        return max(1, round(random.gauss(target_mean * (1 / (1 - zero_prob)), target_mean * 0.4)))
        
    elif demand_type == "STABLE_HIGH":
        # Chuỗi nhu cầu cao và đều (CV < 0.3)
        std = target_mean * 0.18
        qty = round(random.gauss(target_mean, std))
        return max(1, qty)
        
    elif demand_type == "STABLE_MODERATE":
        # Chuỗi nhu cầu vừa và đều (CV ~ 0.35)
        std = target_mean * 0.25
        qty = round(random.gauss(target_mean, std))
        return max(1, qty)
        
    elif demand_type in ("VARIABLE_MODERATE", "VARIABLE_LOW"):
        # Chuỗi biến động vừa (CV ~ 0.55 - 0.75)
        std = target_mean * 0.50
        qty = round(random.gauss(target_mean, std))
        return max(0, qty)
        
    elif demand_type == "COLD_START":
        # Chuỗi mới ra mắt
        std = target_mean * 0.30
        qty = round(random.gauss(target_mean, std))
        return max(1, qty)
        
    return max(0, round(target_mean))


def main():
    today = date.today()
    out_dir = os.path.join(os.getcwd(), "data", "benchmark")
    os.makedirs(out_dir, exist_ok=True)
    
    sales_file = os.path.join(out_dir, "sales_history_benchmark.csv")
    inv_file = os.path.join(out_dir, "inventory_snapshot_benchmark.csv")
    
    print(f"Bắt đầu sinh dữ liệu benchmark bán lẻ tại: {out_dir}")
    
    # 1. Sinh sales_history_benchmark.csv (Date,SKU,Quantity,Revenue)
    sales_rows = []
    total_sales_records = 0
    total_revenue = 0.0
    
    for sku in SKU_DEFINITIONS:
        sku_code = sku["skuCode"]
        price = sku["sellingPrice"]
        max_days = sku.get("historyDays", 90)
        
        for offset in range(max_days, 0, -1):
            sale_date = today - timedelta(days=offset)
            qty = generate_daily_quantity(sku, sale_date)
            rev = qty * price
            
            sales_rows.append({
                "Date": sale_date.isoformat(),
                "SKU": sku_code,
                "Quantity": qty,
                "Revenue": rev,
            })
            total_sales_records += 1
            total_revenue += rev
            
    # Sắp xếp theo Date, SKU
    sales_rows.sort(key=lambda r: (r["Date"], r["SKU"]))
    
    with open(sales_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Date", "SKU", "Quantity", "Revenue"])
        writer.writeheader()
        writer.writerows(sales_rows)
        
    print(f"Đã tạo file {sales_file} ({total_sales_records} dòng, tổng doanh số: {total_revenue:,.0f} đ)")
    
    # 2. Sinh inventory_snapshot_benchmark.csv (SKU,StockQuantity)
    inv_rows = []
    for sku in SKU_DEFINITIONS:
        inv_rows.append({
            "SKU": sku["skuCode"],
            "StockQuantity": sku["currentInventory"],
        })
        
    with open(inv_file, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["SKU", "StockQuantity"])
        writer.writeheader()
        writer.writerows(inv_rows)
        
    print(f"Đã tạo file {inv_file} ({len(inv_rows)} SKUs)")
    print("Hoàn tất sinh tệp CSV chuẩn UC-04!")

if __name__ == "__main__":
    main()
