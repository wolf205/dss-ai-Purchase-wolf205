import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu khởi tạo dữ liệu mẫu (Seeding Database) ---');

  // 1. DSS Configuration (Cấu hình trọng số WSM & Service Level)
  const dssConfig = await prisma.dSSConfiguration.upsert({
    where: { id: 1 },
    update: {
      priceWeight: new Prisma.Decimal('0.4000'),
      leadTimeWeight: new Prisma.Decimal('0.2000'),
      moqWeight: new Prisma.Decimal('0.1500'),
      historyWeight: new Prisma.Decimal('0.2500'),
      targetServiceLevel: new Prisma.Decimal('0.9500'),
      zFactor: new Prisma.Decimal('1.65'),
      reviewPeriodDays: 7,
      updatedBy: 'Hệ thống Khởi tạo',
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
      updatedBy: 'Hệ thống Khởi tạo',
    },
  });
  console.log('✅ Đã nạp DSSConfiguration ID: 1');

  // 2. Tài khoản người dùng (Users)
  const passwordHash = await bcrypt.hash('password123', 10);

  const manager = await prisma.user.upsert({
    where: { username: 'manager_an' },
    update: { passwordHash },
    create: {
      username: 'manager_an',
      passwordHash,
      fullName: 'Nguyễn Văn An (Quản lý cửa hàng)',
      email: 'manager.an@dss-retail.vn',
      role: 'STORE_MANAGER',
      status: 'Active',
    },
  });
  console.log(`✅ Đã nạp User: ${manager.username} (STORE_MANAGER)`);

  const staff = await prisma.user.upsert({
    where: { username: 'staff_binh' },
    update: { passwordHash },
    create: {
      username: 'staff_binh',
      passwordHash,
      fullName: 'Trần Thị Bình (Nhân viên mua hàng)',
      email: 'staff.binh@dss-retail.vn',
      role: 'PURCHASING_STAFF',
      status: 'Active',
    },
  });
  console.log(`✅ Đã nạp User: ${staff.username} (PURCHASING_STAFF)`);

  // 3. Danh mục ngành hàng (Categories)
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

  // 4. Nhà cung cấp (Suppliers)
  const suppliersData = [
    {
      supplierCode: 'NCC-VNM',
      supplierName: 'Công ty Cổ phần Sữa Vinamilk',
      contactPerson: 'Nguyễn Thị Hương',
      phoneNumber: '0901234567',
      email: 'contact@vinamilk.vn',
      address: 'Số 10 Tân Trào, P. Tân Phú, Quận 7, TP.HCM',
      committedLeadTimeDays: 2,
      performanceScore: new Prisma.Decimal('0.9250'), // OTIF 92.5%
      allTimePerformanceScore: new Prisma.Decimal('0.9100'),
      completedOrderCount: 18,
      status: 'Active',
    },
    {
      supplierCode: 'NCC-THM',
      supplierName: 'Công ty Cổ phần Chuỗi Thực phẩm TH',
      contactPerson: 'Phạm Minh Đức',
      phoneNumber: '0912345678',
      email: 'sales@thmilk.vn',
      address: 'Nghĩa Đàn, Nghệ An',
      committedLeadTimeDays: 3,
      performanceScore: new Prisma.Decimal('0.8800'), // OTIF 88.0%
      allTimePerformanceScore: new Prisma.Decimal('0.8750'),
      completedOrderCount: 12,
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
      performanceScore: new Prisma.Decimal('0.9500'), // OTIF 95.0%
      allTimePerformanceScore: new Prisma.Decimal('0.9400'),
      completedOrderCount: 25,
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
      performanceScore: new Prisma.Decimal('0.8500'), // OTIF 85.0%
      allTimePerformanceScore: new Prisma.Decimal('0.8400'),
      completedOrderCount: 9,
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

  // 5. Danh mục Sản phẩm SKU (Products) với các mức tồn kho thực tế
  const productsData = [
    {
      skuCode: 'MILK-VNM-1L',
      productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      barcode: '8934673100012',
      unit: 'Hộp',
      categoryCode: 'DAI',
      currentInventory: 12, // Tồn kho thấp (Critical)
      onOrderQuantity: 0,
      dailySalesAvg: 28,
      dailySalesStd: 3.5,
      unitPriceSelling: 34000,
    },
    {
      skuCode: 'MILK-TH-1L',
      productName: 'Sữa tươi tiệt trùng TH True Milk 1L',
      barcode: '8934673200025',
      unit: 'Hộp',
      categoryCode: 'DAI',
      currentInventory: 18, // Chạm ROP (Warning)
      onOrderQuantity: 0,
      dailySalesAvg: 22,
      dailySalesStd: 4.0,
      unitPriceSelling: 37000,
    },
    {
      skuCode: 'PEPSI-330',
      productName: 'Nước ngọt Pepsi lon 330ml',
      barcode: '8934588012114',
      unit: 'Lon',
      categoryCode: 'BEV',
      currentInventory: 120, // Tồn an toàn (Safe)
      onOrderQuantity: 0,
      dailySalesAvg: 20,
      dailySalesStd: 5.5,
      unitPriceSelling: 11000,
    },
    {
      skuCode: 'AQUAFINA-500',
      productName: 'Nước tinh khiết Aquafina 500ml',
      barcode: '8934588022120',
      unit: 'Chai',
      categoryCode: 'BEV',
      currentInventory: 260, // Tồn dư thừa (Overstock)
      onOrderQuantity: 0,
      dailySalesAvg: 14,
      dailySalesStd: 2.0,
      unitPriceSelling: 6500,
    },
    {
      skuCode: 'SNACK-LAYS-56G',
      productName: 'Snack khoai tây Lay\'s vị Tự nhiên 56g',
      barcode: '8934673300038',
      unit: 'Gói',
      categoryCode: 'SNK',
      currentInventory: 8, // Tồn kho thấp (Critical)
      onOrderQuantity: 0,
      dailySalesAvg: 9,
      dailySalesStd: 2.8,
      unitPriceSelling: 14000,
    },
    {
      skuCode: 'BANH-COSY-136G',
      productName: 'Bánh quy Cosy Marie Kinh Đô 136g',
      barcode: '8934673400041',
      unit: 'Gói',
      categoryCode: 'SNK',
      currentInventory: 22, // Chạm ROP (Warning)
      onOrderQuantity: 0,
      dailySalesAvg: 6,
      dailySalesStd: 2.5,
      unitPriceSelling: 18000,
    },
  ];

  const productMap = new Map<string, bigint>();
  for (const prod of productsData) {
    const categoryId = categoryMap.get(prod.categoryCode)!;
    const upsertedProd = await prisma.product.upsert({
      where: { skuCode: prod.skuCode },
      update: {
        productName: prod.productName,
        barcode: prod.barcode,
        unit: prod.unit,
        currentInventory: prod.currentInventory,
        onOrderQuantity: prod.onOrderQuantity,
        categoryId,
        status: 'Active',
      },
      create: {
        skuCode: prod.skuCode,
        productName: prod.productName,
        barcode: prod.barcode,
        unit: prod.unit,
        currentInventory: prod.currentInventory,
        onOrderQuantity: prod.onOrderQuantity,
        categoryId,
        status: 'Active',
      },
    });
    productMap.set(prod.skuCode, upsertedProd.id);
  }
  console.log(`✅ Đã nạp ${productMap.size} sản phẩm SKU`);

  // 6. Điều kiện cung ứng (Supply Conditions) - Đơn giá, MOQ, NCC
  const supplyConditionsData = [
    // Sữa Vinamilk 1L: NCC Vinamilk chào 28.000 (MOQ 20), NCC TH chào 29.500 (MOQ 15)
    {
      skuCode: 'MILK-VNM-1L',
      supplierCode: 'NCC-VNM',
      purchasePrice: 28000,
      moq: 20,
    },
    {
      skuCode: 'MILK-VNM-1L',
      supplierCode: 'NCC-THM',
      purchasePrice: 29500,
      moq: 15,
    },
    // Sữa TH 1L: NCC TH chào 31.000 (MOQ 20), NCC Vinamilk chào 32.500 (MOQ 25)
    {
      skuCode: 'MILK-TH-1L',
      supplierCode: 'NCC-THM',
      purchasePrice: 31000,
      moq: 20,
    },
    {
      skuCode: 'MILK-TH-1L',
      supplierCode: 'NCC-VNM',
      purchasePrice: 32500,
      moq: 25,
    },
    // Pepsi lon: NCC PepsiCo chào 8.200 (MOQ 48)
    {
      skuCode: 'PEPSI-330',
      supplierCode: 'NCC-PEP',
      purchasePrice: 8200,
      moq: 48,
    },
    // Aquafina chai: NCC PepsiCo chào 4.300 (MOQ 48)
    {
      skuCode: 'AQUAFINA-500',
      supplierCode: 'NCC-PEP',
      purchasePrice: 4300,
      moq: 48,
    },
    // Snack Lay's: NCC PepsiCo chào 10.500 (MOQ 20), NCC KIDO chào 11.200 (MOQ 15)
    {
      skuCode: 'SNACK-LAYS-56G',
      supplierCode: 'NCC-PEP',
      purchasePrice: 10500,
      moq: 20,
    },
    {
      skuCode: 'SNACK-LAYS-56G',
      supplierCode: 'NCC-KDO',
      purchasePrice: 11200,
      moq: 15,
    },
    // Bánh Cosy: NCC KIDO chào 13.800 (MOQ 24)
    {
      skuCode: 'BANH-COSY-136G',
      supplierCode: 'NCC-KDO',
      purchasePrice: 13800,
      moq: 24,
    },
  ];

  for (const sc of supplyConditionsData) {
    const productId = productMap.get(sc.skuCode)!;
    const supplierId = supplierMap.get(sc.supplierCode)!;

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

  // 7. Lịch sử bán hàng 90 ngày (Sales Records) từ T-90 đến T-1
  console.log('⏳ Đang tạo chuỗi lịch sử bán hàng 90 ngày cho các SKU...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalSalesRecordsCreated = 0;

  for (const prod of productsData) {
    const productId = productMap.get(prod.skuCode)!;

    for (let dayOffset = 90; dayOffset >= 1; dayOffset--) {
      const saleDate = new Date(today);
      saleDate.setDate(saleDate.getDate() - dayOffset);

      // Tạo số lượng ngẫu nhiên quanh mức trung bình với độ lệch chuẩn
      const randomFactor = (Math.random() - 0.5) * 2; // [-1, 1]
      const qty = Math.max(
        0,
        Math.round(prod.dailySalesAvg + randomFactor * prod.dailySalesStd),
      );
      const revenue = qty * prod.unitPriceSelling;

      await prisma.salesRecord.upsert({
        where: {
          productId_saleDate: {
            productId,
            saleDate,
          },
        },
        update: {
          quantitySold: qty,
          revenue: new Prisma.Decimal(revenue.toFixed(2)),
        },
        create: {
          productId,
          saleDate,
          quantitySold: qty,
          revenue: new Prisma.Decimal(revenue.toFixed(2)),
        },
      });

      totalSalesRecordsCreated++;
    }
  }

  console.log(`✅ Đã nạp thành công ${totalSalesRecordsCreated} bản ghi lịch sử bán hàng (Sales Records)`);
  console.log('--- KHỞI TẠO DỮ LIỆU MẪU HOÀN TẤT THÀNH CÔNG! ---');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi khởi tạo dữ liệu mẫu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
