import { Prisma } from '@prisma/client';

export interface SupplyConditionWithProduct {
  id: bigint;
  productId: bigint;
  supplierId: bigint;
  purchasePrice: Prisma.Decimal | number;
  moq: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: bigint;
    skuCode: string;
    productName: string;
    barcode: string | null;
    unit: string;
    status: string;
    category?: {
      categoryName: string;
    } | null;
  };
}

export interface SupplierWithRelations {
  id: bigint;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  committedLeadTimeDays: number;
  status: string;
  performanceScore: Prisma.Decimal | number;
  allTimePerformanceScore: Prisma.Decimal | number;
  completedOrderCount: number;
  createdAt: Date;
  updatedAt: Date;
  supplyConditions?: { id: bigint }[];
  purchaseOrders?: {
    id: bigint;
    goodsReceipt?: {
      daysLate: number;
      overallFulfillmentRate: Prisma.Decimal | number;
    } | null;
  }[];
}

export interface RollingOtifResult {
  score: number;
  historyStageLabel: string;
  completedOrderCount: number;
}
