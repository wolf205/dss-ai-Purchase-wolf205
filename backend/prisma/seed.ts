import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== BẮT ĐẦU KHỞI TẠO BỘ DỮ LIỆU BENCHMARK RETAIL THỰC TẾ (WALMART M5) ===');

  console.log('🧹 Dọn sạch toàn bộ dữ liệu cũ trong database...');
  await prisma.activityLog.deleteMany({});
  await prisma.receiptLineItem.deleteMany({});
  await prisma.goodsReceipt.deleteMany({});
  await prisma.pOLineItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.recommendationItem.deleteMany({});
  await prisma.recommendationSession.deleteMany({});
  await prisma.inventorySnapshot.deleteMany({});
  await prisma.salesRecord.deleteMany({});
  await prisma.supplyCondition.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.category.deleteMany({});

  // 1. DSS Configuration (Cấu hình tham số chuẩn UC-07)
  await prisma.dSSConfiguration.upsert({
    where: { id: 1 },
    update: {
      priceWeight: new Prisma.Decimal('0.4000'),
      leadTimeWeight: new Prisma.Decimal('0.2000'),
      moqWeight: new Prisma.Decimal('0.1500'),
      historyWeight: new Prisma.Decimal('0.2500'),
      targetServiceLevel: new Prisma.Decimal('0.9500'),
      zFactor: new Prisma.Decimal('1.65'),
      reviewPeriodDays: 7,
      updatedBy: 'Hệ thống Benchmark DSS',
    },
    create: {
      id: 1,
      priceWeight: new Prisma.Decimal('0.4000'),
      leadTimeWeight: new Prisma.Decimal('0.2000'),
      moqWeight: new Prisma.Decimal('0.1500'),
      historyWeight: new Prisma.Decimal('0.2500'),
      targetServiceLevel: new Prisma.Decimal('0.9500'),
      zFactor: new Prisma.Decimal('1.65'),
      reviewPeriodDays: 7,
      updatedBy: 'Hệ thống Benchmark DSS',
    },
  });
  console.log('✅ Đã nạp DSSConfiguration ID: 1');

  // 2. Tài khoản người dùng (Users)
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      username: 'manager',
      passwordHash,
      fullName: 'Quản Lý Cửa Hàng (Store Manager)',
      email: 'manager@dss.local',
      role: 'STORE_MANAGER' as const,
      status: 'Active' as const,
    },
    {
      username: 'manager_an',
      passwordHash,
      fullName: 'Nguyễn Văn An (Quản lý cửa hàng)',
      email: 'manager.an@dss-retail.vn',
      role: 'STORE_MANAGER' as const,
      status: 'Active' as const,
    },
    {
      username: 'staff',
      passwordHash,
      fullName: 'Nhân Viên Mua Hàng (Staff)',
      email: 'staff@dss.local',
      role: 'PURCHASING_STAFF' as const,
      status: 'Active' as const,
    },
    {
      username: 'staff_binh',
      passwordHash,
      fullName: 'Trần Thị Bình (Nhân viên mua hàng)',
      email: 'staff.binh@dss-retail.vn',
      role: 'PURCHASING_STAFF' as const,
      status: 'Active' as const,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: u,
      create: u,
    });
  }
  console.log(`✅ Đã nạp ${users.length} tài khoản người dùng`);

  // 3. Danh mục ngành hàng (Categories - 5 ngành)
  const categoriesData = [
    {
      categoryCode: 'DAI',
      categoryName: 'Bơ Sữa & Sản phẩm từ sữa',
      description: 'Sữa tươi, sữa chua, bơ, phô mai',
    },
    {
      categoryCode: 'BEV',
      categoryName: 'Nước giải khát & Đồ uống',
      description: 'Nước ngọt, nước tinh khiết, trà đóng chai, nước tăng lực',
    },
    {
      categoryCode: 'SNK',
      categoryName: 'Bánh kẹo & Đồ ăn vặt',
      description: 'Snack khoai tây, bánh quy, kẹo xốp',
    },
    {
      categoryCode: 'INS',
      categoryName: 'Mì ăn liền & Thực phẩm đóng gói',
      description: 'Mì tôm, cháo gói, gia vị, dầu ăn đóng chai',
    },
    {
      categoryCode: 'HPC',
      categoryName: 'Hóa mỹ phẩm & Chăm sóc cá nhân',
      description: 'Dầu gội, xà phòng, nước rửa chén, bột giặt, kem đánh răng',
    },
  ];

  const categoryMap = new Map<string, bigint>();
  for (const cat of categoriesData) {
    const upsertedCat = await prisma.category.upsert({
      where: { categoryCode: cat.categoryCode },
      update: cat,
      create: cat,
    });
    categoryMap.set(cat.categoryCode, upsertedCat.id);
  }
  console.log(`✅ Đã nạp ${categoryMap.size} ngành hàng`);

  // 4. Nhà cung cấp (Suppliers - 7 NCC uy tín)
  const suppliersData = [
    {
      supplierCode: 'NCC-VNM',
      supplierName: 'Công ty Cổ phần Sữa Vinamilk',
      contactPerson: 'Nguyễn Thị Hương',
      phoneNumber: '0901234567',
      email: 'contact@vinamilk.vn',
      address: 'Số 10 Tân Trào, P. Tân Phú, Quận 7, TP.HCM',
      committedLeadTimeDays: 2,
      performanceScore: new Prisma.Decimal('0.9250'),
      allTimePerformanceScore: new Prisma.Decimal('0.9100'),
      completedOrderCount: 22,
      status: 'Active',
    },
    {
      supplierCode: 'NCC-THM',
      supplierName: 'Công ty Cổ phần Chuỗi Thực phẩm TH',
      contactPerson: 'Phạm Minh Đức',
      phoneNumber: '0912345678',
      email: 'sales@thmilk.vn',
      address: 'Nghĩa Đàn, Nghệ An',
      committedLeadTimeDays: 2,
      performanceScore: new Prisma.Decimal('0.8800'),
      allTimePerformanceScore: new Prisma.Decimal('0.8750'),
      completedOrderCount: 16,
      status: 'Active',
    },
    {
      supplierCode: 'NCC-PEP',
      supplierName: 'Công ty TNHH Nước Giải Khát Suntory PepsiCo',
      contactPerson: 'Lê Hoàng Nam',
      phoneNumber: '0987654321',
      email: 'order@suntorypepsico.vn',
      address: 'Cao ốc Sheraton, 88 Đồng Khởi, Quận 1, TP.HCM',
      committedLeadTimeDays: 1,
      performanceScore: new Prisma.Decimal('0.9500'),
      allTimePerformanceScore: new Prisma.Decimal('0.9400'),
      completedOrderCount: 28,
      status: 'Active',
    },
    {
      supplierCode: 'NCC-KDO',
      supplierName: 'Công ty Cổ phần Tập đoàn KIDO',
      contactPerson: 'Vũ Quốc Toàn',
      phoneNumber: '0978123456',
      email: 'distribution@kido.vn',
      address: '138-142 Hai Bà Trưng, Phường Đa Kao, Quận 1, TP.HCM',
      committedLeadTimeDays: 2,
      performanceScore: new Prisma.Decimal('0.8500'),
      allTimePerformanceScore: new Prisma.Decimal('0.8400'),
      completedOrderCount: 14,
      status: 'Active',
    },
    {
      supplierCode: 'NCC-UNL',
      supplierName: 'Công ty TNHH Quốc tế Unilever Việt Nam',
      contactPerson: 'Hoàng Mai Phương',
      phoneNumber: '0908889999',
      email: 'b2b@unilever.com.vn',
      address: 'Khu công nghiệp Tây Bắc Củ Chi, TP.HCM',
      committedLeadTimeDays: 2,
      performanceScore: new Prisma.Decimal('0.9300'),
      allTimePerformanceScore: new Prisma.Decimal('0.9200'),
      completedOrderCount: 20,
      status: 'Active',
    },
    {
      supplierCode: 'NCC-MAS',
      supplierName: 'Công ty Cổ phần Hàng tiêu dùng Masan',
      contactPerson: 'Đặng Tuấn Anh',
      phoneNumber: '0919998888',
      email: 'sales@masangroup.com',
      address: 'Tầng 12, MPlaza Saigon, 39 Lê Duẩn, Quận 1, TP.HCM',
      committedLeadTimeDays: 1,
      performanceScore: new Prisma.Decimal('0.9100'),
      allTimePerformanceScore: new Prisma.Decimal('0.9050'),
      completedOrderCount: 25,
      status: 'Active',
    },
    {
      supplierCode: 'NCC-ORN',
      supplierName: 'Công ty TNHH Thực phẩm Orion Vina',
      contactPerson: 'Kim Dong Won',
      phoneNumber: '0933334444',
      email: 'support@orion.vn',
      address: 'Khu công nghiệp Mỹ Phước 2, Bến Cát, Bình Dương',
      committedLeadTimeDays: 2,
      performanceScore: new Prisma.Decimal('0.8900'),
      allTimePerformanceScore: new Prisma.Decimal('0.8850'),
      completedOrderCount: 15,
      status: 'Active',
    },
  ];

  const supplierMap = new Map<string, bigint>();
  for (const sup of suppliersData) {
    const upsertedSup = await prisma.supplier.upsert({
      where: { supplierCode: sup.supplierCode },
      update: sup,
      create: sup,
    });
    supplierMap.set(sup.supplierCode, upsertedSup.id);
  }
  console.log(`✅ Đã nạp ${supplierMap.size} nhà cung cấp`);

  // Đọc file tồn kho snapshot từ data/benchmark
  const benchmarkDir = path.resolve(__dirname, '../../data/benchmark');
  const invCsvPath = path.join(benchmarkDir, 'inventory_snapshot_benchmark.csv');
  const salesCsvPath = path.join(benchmarkDir, 'sales_history_benchmark.csv');

  const stockMap = new Map<string, number>();
  if (fs.existsSync(invCsvPath)) {
    const invContent = fs.readFileSync(invCsvPath, 'utf-8');
    const lines = invContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    // Bỏ qua header
    for (let i = 1; i < lines.length; i++) {
      const [sku, stockStr] = lines[i].split(',');
      if (sku && stockStr) {
        stockMap.set(sku.trim(), parseInt(stockStr.trim(), 10) || 0);
      }
    }
    console.log(`📖 Đã đọc ${stockMap.size} mức tồn kho từ inventory_snapshot_benchmark.csv`);
  }

  // 5. Danh mục 25 SKU chuẩn hóa (chuỗi thời gian thực từ Walmart M5 Store CA_1)
  const productsData = [
    // DAI (Bơ Sữa & Sản phẩm từ sữa)
    { skuCode: 'MILK-VNM-1L', productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L', categoryCode: 'DAI', unit: 'Hộp', barcode: '8934673100012', defaultStock: 14 },
    { skuCode: 'MILK-TH-1L', productName: 'Sữa tươi tiệt trùng TH True Milk 1L', categoryCode: 'DAI', unit: 'Hộp', barcode: '8934673200025', defaultStock: 22 },
    { skuCode: 'YOG-VNM-100G', productName: 'Sữa chua Vinamilk có đường 100g', categoryCode: 'DAI', unit: 'Hộp', barcode: '8934673100039', defaultStock: 150 },
    { skuCode: 'CHEESE-BOCU-120G', productName: 'Phô mai Con Bò Cười truyền thống 8 miếng', categoryCode: 'DAI', unit: 'Hộp', barcode: '8934673100046', defaultStock: 8 },
    { skuCode: 'BUTTER-PRES-200G', productName: 'Bơ lạt President nhập khẩu Pháp 200g', categoryCode: 'DAI', unit: 'Gói', barcode: '8934673100053', defaultStock: 10 },

    // BEV (Nước giải khát & Đồ uống)
    { skuCode: 'PEPSI-330', productName: 'Nước ngọt Pepsi lon 330ml', categoryCode: 'BEV', unit: 'Lon', barcode: '8934588012114', defaultStock: 35 },
    { skuCode: 'COCA-330', productName: 'Nước ngọt Coca-Cola vị nguyên bản lon 330ml', categoryCode: 'BEV', unit: 'Lon', barcode: '8934588012121', defaultStock: 25 },
    { skuCode: 'AQUAFINA-500', productName: 'Nước tinh khiết Aquafina 500ml', categoryCode: 'BEV', unit: 'Chai', barcode: '8934588012138', defaultStock: 280 },
    { skuCode: 'TEA-C2-360', productName: 'Trà xanh C2 hương chanh 360ml', categoryCode: 'BEV', unit: 'Chai', barcode: '8934588012145', defaultStock: 20 },
    { skuCode: 'ENERGY-RED-250', productName: 'Nước tăng lực Red Bull lon 250ml', categoryCode: 'BEV', unit: 'Lon', barcode: '8934588012152', defaultStock: 15 },

    // SNK (Bánh kẹo & Đồ ăn vặt)
    { skuCode: 'SNACK-LAYS-56G', productName: 'Snack khoai tây Lay\'s vị tự nhiên 56g', categoryCode: 'SNK', unit: 'Gói', barcode: '8934673400034', defaultStock: 25 },
    { skuCode: 'BANH-COSY-136G', productName: 'Bánh quy sữa Cosy Marie Kinh Đô 136g', categoryCode: 'SNK', unit: 'Gói', barcode: '8934673400041', defaultStock: 20 },
    { skuCode: 'CHOCO-KID-28G', productName: 'Bánh ChocoPie Orion hộp 12 cái 396g', categoryCode: 'SNK', unit: 'Hộp', barcode: '8934673400058', defaultStock: 8 },
    { skuCode: 'CANDY-ALPEN-150', productName: 'Kẹo sữa Caramen Alpenliebe túi 150g', categoryCode: 'SNK', unit: 'Gói', barcode: '8934673400065', defaultStock: 6 },
    { skuCode: 'SNACK-OISHI-40G', productName: 'Snack bắp ngọt Oishi gói 40g', categoryCode: 'SNK', unit: 'Gói', barcode: '8934688123052', defaultStock: 195 },

    // INS (Mì ăn liền & Thực phẩm đóng gói)
    { skuCode: 'NOOD-HAOHAO-75', productName: 'Mì tôm chua cay Hảo Hảo gói 75g', categoryCode: 'INS', unit: 'Gói', barcode: '8934563138164', defaultStock: 40 },
    { skuCode: 'NOOD-OMACHI-80', productName: 'Mì khoai tây Omachi sườn hầm ngũ quả 80g', categoryCode: 'INS', unit: 'Gói', barcode: '8934563138171', defaultStock: 25 },
    { skuCode: 'RICE-ST25-5KG', productName: 'Gạo đặc sản ST25 chính hãng túi 5kg', categoryCode: 'INS', unit: 'Túi', barcode: '8934563123032', defaultStock: 8 },
    { skuCode: 'OIL-NEPTUNE-1L', productName: 'Dầu ăn thượng hạng Neptune Light 1L', categoryCode: 'INS', unit: 'Chai', barcode: '8934563138195', defaultStock: 12 },
    { skuCode: 'SAUCE-NAMNGU-500', productName: 'Nước mắm Nam Ngư Đệ Nhị chai 500ml', categoryCode: 'INS', unit: 'Chai', barcode: '8934563138201', defaultStock: 15 },

    // HPC (Hóa mỹ phẩm & Chăm sóc cá nhân)
    { skuCode: 'DET-OMO-3KG', productName: 'Bột giặt OMO Comfort Tinh dầu thơm túi 3kg', categoryCode: 'HPC', unit: 'Túi', barcode: '8934839124018', defaultStock: 18 },
    { skuCode: 'DISH-SUNLIGHT-750', productName: 'Nước rửa chén Sunlight Chanh túi 750g', categoryCode: 'HPC', unit: 'Túi', barcode: '8934839124025', defaultStock: 20 },
    { skuCode: 'SOAP-LIFE-90G', productName: 'Xà bông cục Lifebuoy Bảo vệ vượt trội 90g', categoryCode: 'HPC', unit: 'Cục', barcode: '8934839124032', defaultStock: 35 },
    { skuCode: 'SHAMP-CLEAR-650', productName: 'Dầu gội sạch gàu Clear Men Bạc hà 650g', categoryCode: 'HPC', unit: 'Chai', barcode: '8934839124049', defaultStock: 6 },
    { skuCode: 'TOOTH-PS-180G', productName: 'Kem đánh răng P/S Bảo vệ 123 Chăm sóc toàn diện 180g', categoryCode: 'HPC', unit: 'Tuýp', barcode: '8934839124056', defaultStock: 15 },
  ];

  const productMap = new Map<string, bigint>();
  const snapshotDate = new Date('2026-10-16T00:00:00.000Z');

  for (const prod of productsData) {
    const categoryId = categoryMap.get(prod.categoryCode)!;
    const currentInventory = stockMap.get(prod.skuCode) ?? prod.defaultStock;

    const upsertedProd = await prisma.product.upsert({
      where: { skuCode: prod.skuCode },
      update: {
        productName: prod.productName,
        barcode: prod.barcode,
        unit: prod.unit,
        currentInventory,
        categoryId,
        status: 'Active',
      },
      create: {
        skuCode: prod.skuCode,
        productName: prod.productName,
        barcode: prod.barcode,
        unit: prod.unit,
        currentInventory,
        onOrderQuantity: 0,
        categoryId,
        status: 'Active',
      },
    });
    productMap.set(prod.skuCode, upsertedProd.id);

    // Lưu snapshot tồn kho khởi tạo
    await prisma.inventorySnapshot.upsert({
      where: {
        productId_snapshotDate: {
          productId: upsertedProd.id,
          snapshotDate,
        },
      },
      update: {
        countedQuantity: currentInventory,
        countedBy: 'Hệ thống Benchmark M5',
      },
      create: {
        productId: upsertedProd.id,
        snapshotDate,
        countedQuantity: currentInventory,
        countedBy: 'Hệ thống Benchmark M5',
      },
    });
  }
  console.log(`✅ Đã nạp ${productMap.size} sản phẩm SKU kèm tồn kho và snapshot khởi tạo`);

  // 6. Điều kiện cung ứng (Supply Conditions) - Đa dạng 2 NCC cho mỗi SKU
  const supplyConditionsData = [
    // DAI
    { skuCode: 'MILK-VNM-1L', supplierCode: 'NCC-VNM', purchasePrice: 26000, moq: 20 },
    { skuCode: 'MILK-VNM-1L', supplierCode: 'NCC-THM', purchasePrice: 27500, moq: 10 },
    { skuCode: 'MILK-TH-1L', supplierCode: 'NCC-THM', purchasePrice: 28500, moq: 15 },
    { skuCode: 'MILK-TH-1L', supplierCode: 'NCC-VNM', purchasePrice: 30000, moq: 10 },
    { skuCode: 'YOG-VNM-100G', supplierCode: 'NCC-VNM', purchasePrice: 6200, moq: 48 },
    { skuCode: 'YOG-VNM-100G', supplierCode: 'NCC-MAS', purchasePrice: 6600, moq: 24 },
    { skuCode: 'CHEESE-BOCU-120G', supplierCode: 'NCC-VNM', purchasePrice: 33000, moq: 10 },
    { skuCode: 'CHEESE-BOCU-120G', supplierCode: 'NCC-THM', purchasePrice: 34500, moq: 5 },
    { skuCode: 'BUTTER-PRES-200G', supplierCode: 'NCC-VNM', purchasePrice: 59000, moq: 6 },
    { skuCode: 'BUTTER-PRES-200G', supplierCode: 'NCC-KDO', purchasePrice: 61000, moq: 4 },

    // BEV
    { skuCode: 'PEPSI-330', supplierCode: 'NCC-PEP', purchasePrice: 7800, moq: 48 },
    { skuCode: 'PEPSI-330', supplierCode: 'NCC-MAS', purchasePrice: 8200, moq: 24 },
    { skuCode: 'COCA-330', supplierCode: 'NCC-PEP', purchasePrice: 7900, moq: 48 },
    { skuCode: 'COCA-330', supplierCode: 'NCC-MAS', purchasePrice: 8100, moq: 24 },
    { skuCode: 'AQUAFINA-500', supplierCode: 'NCC-PEP', purchasePrice: 4200, moq: 48 },
    { skuCode: 'AQUAFINA-500', supplierCode: 'NCC-MAS', purchasePrice: 4500, moq: 24 },
    { skuCode: 'TEA-C2-360', supplierCode: 'NCC-PEP', purchasePrice: 6400, moq: 24 },
    { skuCode: 'TEA-C2-360', supplierCode: 'NCC-MAS', purchasePrice: 6700, moq: 12 },
    { skuCode: 'ENERGY-RED-250', supplierCode: 'NCC-PEP', purchasePrice: 11000, moq: 24 },
    { skuCode: 'ENERGY-RED-250', supplierCode: 'NCC-MAS', purchasePrice: 11500, moq: 12 },

    // SNK
    { skuCode: 'SNACK-LAYS-56G', supplierCode: 'NCC-PEP', purchasePrice: 9800, moq: 30 },
    { skuCode: 'SNACK-LAYS-56G', supplierCode: 'NCC-ORN', purchasePrice: 10200, moq: 15 },
    { skuCode: 'BANH-COSY-136G', supplierCode: 'NCC-KDO', purchasePrice: 13200, moq: 20 },
    { skuCode: 'BANH-COSY-136G', supplierCode: 'NCC-ORN', purchasePrice: 13800, moq: 10 },
    { skuCode: 'CHOCO-KID-28G', supplierCode: 'NCC-ORN', purchasePrice: 46500, moq: 12 },
    { skuCode: 'CHOCO-KID-28G', supplierCode: 'NCC-KDO', purchasePrice: 48000, moq: 6 },
    { skuCode: 'CANDY-ALPEN-150', supplierCode: 'NCC-ORN', purchasePrice: 14000, moq: 20 },
    { skuCode: 'CANDY-ALPEN-150', supplierCode: 'NCC-KDO', purchasePrice: 14500, moq: 10 },
    { skuCode: 'SNACK-OISHI-40G', supplierCode: 'NCC-ORN', purchasePrice: 4800, moq: 50 },
    { skuCode: 'SNACK-OISHI-40G', supplierCode: 'NCC-KDO', purchasePrice: 5200, moq: 25 },

    // INS
    { skuCode: 'NOOD-HAOHAO-75', supplierCode: 'NCC-MAS', purchasePrice: 3200, moq: 60 },
    { skuCode: 'NOOD-HAOHAO-75', supplierCode: 'NCC-KDO', purchasePrice: 3400, moq: 30 },
    { skuCode: 'NOOD-OMACHI-80', supplierCode: 'NCC-MAS', purchasePrice: 7100, moq: 30 },
    { skuCode: 'NOOD-OMACHI-80', supplierCode: 'NCC-KDO', purchasePrice: 7500, moq: 15 },
    { skuCode: 'RICE-ST25-5KG', supplierCode: 'NCC-MAS', purchasePrice: 145000, moq: 10 },
    { skuCode: 'RICE-ST25-5KG', supplierCode: 'NCC-ORN', purchasePrice: 152000, moq: 5 },
    { skuCode: 'OIL-NEPTUNE-1L', supplierCode: 'NCC-KDO', purchasePrice: 42000, moq: 12 },
    { skuCode: 'OIL-NEPTUNE-1L', supplierCode: 'NCC-MAS', purchasePrice: 44000, moq: 6 },
    { skuCode: 'SAUCE-NAMNGU-500', supplierCode: 'NCC-MAS', purchasePrice: 18000, moq: 15 },
    { skuCode: 'SAUCE-NAMNGU-500', supplierCode: 'NCC-UNL', purchasePrice: 19000, moq: 10 },

    // HPC
    { skuCode: 'DET-OMO-3KG', supplierCode: 'NCC-UNL', purchasePrice: 132000, moq: 8 },
    { skuCode: 'DET-OMO-3KG', supplierCode: 'NCC-MAS', purchasePrice: 138000, moq: 4 },
    { skuCode: 'DISH-SUNLIGHT-750', supplierCode: 'NCC-UNL', purchasePrice: 21000, moq: 20 },
    { skuCode: 'DISH-SUNLIGHT-750', supplierCode: 'NCC-MAS', purchasePrice: 22500, moq: 10 },
    { skuCode: 'SOAP-LIFE-90G', supplierCode: 'NCC-UNL', purchasePrice: 11500, moq: 36 },
    { skuCode: 'SOAP-LIFE-90G', supplierCode: 'NCC-ORN', purchasePrice: 12500, moq: 12 },
    { skuCode: 'SHAMP-CLEAR-650', supplierCode: 'NCC-UNL', purchasePrice: 142000, moq: 6 },
    { skuCode: 'SHAMP-CLEAR-650', supplierCode: 'NCC-MAS', purchasePrice: 148000, moq: 3 },
    { skuCode: 'TOOTH-PS-180G', supplierCode: 'NCC-UNL', purchasePrice: 27000, moq: 24 },
    { skuCode: 'TOOTH-PS-180G', supplierCode: 'NCC-KDO', purchasePrice: 28500, moq: 12 },
  ];

  for (const sc of supplyConditionsData) {
    const productId = productMap.get(sc.skuCode);
    const supplierId = supplierMap.get(sc.supplierCode);
    if (!productId || !supplierId) continue;

    await prisma.supplyCondition.upsert({
      where: {
        productId_supplierId: {
          productId,
          supplierId,
        },
      },
      update: {
        purchasePrice: new Prisma.Decimal(sc.purchasePrice.toFixed(2)),
        moq: sc.moq,
        status: 'Active',
      },
      create: {
        productId,
        supplierId,
        purchasePrice: new Prisma.Decimal(sc.purchasePrice.toFixed(2)),
        moq: sc.moq,
        status: 'Active',
      },
    });
  }
  console.log(`✅ Đã nạp ${supplyConditionsData.length} điều kiện cung ứng (Supply Conditions)`);

  // 7. Nạp chuỗi lịch sử bán hàng 90 ngày chuẩn Benchmark từ file CSV
  console.log('⏳ Đang nạp chuỗi lịch sử bán hàng benchmark...');
  let totalLoadedSales = 0;

  if (fs.existsSync(salesCsvPath)) {
    const salesContent = fs.readFileSync(salesCsvPath, 'utf-8');
    const lines = salesContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

    const recordsToInsert: {
      productId: bigint;
      saleDate: Date;
      quantitySold: number;
      revenue: Prisma.Decimal;
    }[] = [];

    for (let i = 1; i < lines.length; i++) {
      const [dateStr, sku, qtyStr, revStr] = lines[i].split(',');
      if (!sku || !dateStr) continue;

      const pId = productMap.get(sku.trim());
      if (!pId) continue;

      const saleDate = new Date(`${dateStr.trim()}T00:00:00.000Z`);
      const quantitySold = parseInt(qtyStr.trim(), 10) || 0;
      const revenue = parseFloat(revStr.trim()) || 0.0;

      recordsToInsert.push({
        productId: pId,
        saleDate,
        quantitySold,
        revenue: new Prisma.Decimal(revenue.toFixed(2)),
      });
    }

    // Xóa dữ liệu salesRecord cũ của 25 SKU để tránh trùng lặp
    const allProductIds = Array.from(productMap.values());
    await prisma.salesRecord.deleteMany({
      where: { productId: { in: allProductIds } },
    });

    // Nạp theo lô (Chunk 500)
    const chunkSize = 500;
    for (let i = 0; i < recordsToInsert.length; i += chunkSize) {
      const chunk = recordsToInsert.slice(i, i + chunkSize);
      await prisma.salesRecord.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      totalLoadedSales += chunk.length;
    }

    console.log(`✅ Đã nạp thành công ${totalLoadedSales} bản ghi lịch sử bán hàng từ benchmark CSV!`);
  } else {
    console.warn(`⚠️ Không tìm thấy file ${salesCsvPath}, bỏ qua nạp sales records.`);
  }

  console.log('=== KHỞI TẠO BỘ DỮ LIỆU BENCHMARK RETAIL HOÀN TẤT THÀNH CÔNG! ===');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi khởi tạo dữ liệu mẫu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
