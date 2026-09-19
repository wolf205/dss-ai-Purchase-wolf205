import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. DSS Configuration
  const dssConfig = await prisma.dSSConfiguration.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      priceWeight: 0.4000,
      leadTimeWeight: 0.2000,
      moqWeight: 0.1500,
      historyWeight: 0.2500,
      targetServiceLevel: 0.9500,
      zFactor: 1.65,
      reviewPeriodDays: 7,
      updatedBy: 'Store Manager',
    },
  });
  console.log('Upserted DSSConfiguration with ID:', dssConfig.id);

  // 2. Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      passwordHash: passwordHash,
    },
    create: {
      username: 'admin',
      passwordHash: passwordHash,
      fullName: 'Store Admin',
      email: 'admin@dss.local',
      role: 'STORE_MANAGER',
      status: 'Active',
    },
  });
  console.log('Upserted user:', admin.username);

  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {
      passwordHash: passwordHash,
    },
    create: {
      username: 'staff',
      passwordHash: passwordHash,
      fullName: 'Purchasing Staff',
      email: 'staff@dss.local',
      role: 'PURCHASING_STAFF',
      status: 'Active',
    },
  });
  console.log('Upserted user:', staff.username);

  // 3. Categories
  const categories = [
    { categoryCode: 'BEV', categoryName: 'Đồ Uống', description: 'Nước giải khát, nước ngọt, bia' },
    { categoryCode: 'SNK', categoryName: 'Đồ Ăn Vặt', description: 'Bánh kẹo, bim bim, hạt' },
    { categoryCode: 'DAI', categoryName: 'Bơ Sữa', description: 'Sữa tươi, sữa chua, phô mai' },
  ];

  for (const cat of categories) {
    const upsertedCat = await prisma.category.upsert({
      where: { categoryCode: cat.categoryCode },
      update: {},
      create: cat,
    });
    console.log('Upserted category:', upsertedCat.categoryCode);
  }

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
