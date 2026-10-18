import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DssItemAdjustmentService } from './dss-item-adjustment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('DssItemAdjustmentService (UC-01 Human Adjustment)', () => {
  let service: DssItemAdjustmentService;

  const mockPrisma = {
    recommendationItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    recommendationSession: {
      update: jest.fn(),
    },
    supplyCondition: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DssItemAdjustmentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DssItemAdjustmentService>(DssItemAdjustmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException when DTO has no fields to update', async () => {
    await expect(service.updateItem(1001, {})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw NotFoundException when itemId does not exist', async () => {
    mockPrisma.recommendationItem.findUnique.mockResolvedValue(null);

    await expect(
      service.updateItem(9999, { approvedQuantity: 20 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when session status is not Draft', async () => {
    mockPrisma.recommendationItem.findUnique.mockResolvedValue({
      id: BigInt(1001),
      session: { status: 'Approved' },
    });

    await expect(
      service.updateItem(1001, { approvedQuantity: 20 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when approvedSupplierId does not supply the product', async () => {
    mockPrisma.recommendationItem.findUnique.mockResolvedValue({
      id: BigInt(1001),
      session: { status: 'Draft' },
      product: {
        supplyConditions: [
          {
            supplierId: BigInt(10),
            status: 'Active',
            supplier: { status: 'Active' },
          },
        ],
      },
    });

    await expect(
      service.updateItem(1001, { approvedSupplierId: 99 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should update approvedQuantity and set isOverridden = true, updating session total in transaction', async () => {
    const mockExistingItem = {
      id: BigInt(1001),
      sessionId: BigInt(105),
      productId: BigInt(12),
      suggestedQuantity: 50,
      approvedQuantity: 50,
      suggestedSupplierId: BigInt(3),
      approvedSupplierId: BigInt(3),
      suggestedSupplierWsmScore: new Prisma.Decimal(92.5),
      snapshotCurrentInventory: 15,
      snapshotOnOrderQuantity: 0,
      reorderPoint: 35,
      safetyStock: 12,
      stockRiskStatus: 'Critical',
      abcXyzGroup: 'AX',
      supplierRankings: [
        {
          supplierId: 3,
          purchasePrice: 32000,
          committedLeadTimeDays: 2,
          moq: 20,
        },
      ],
      dailyForecasts: [],
      whyBuyExplanation: null,
      session: { status: 'Draft' },
      product: {
        skuCode: 'MILK-TH-1L',
        productName: 'Sữa tươi TH True Milk 1L',
        category: { categoryName: 'Hàng Tươi Sống' },
        supplyConditions: [
          {
            supplierId: BigInt(3),
            status: 'Active',
            supplier: {
              id: BigInt(3),
              supplierCode: 'TH_TRUE_MILK',
              supplierName: 'Công ty Cổ phần Sữa TH',
              committedLeadTimeDays: 2,
              status: 'Active',
            },
          },
        ],
      },
      suggestedSupplier: {
        id: BigInt(3),
        supplierCode: 'TH_TRUE_MILK',
        supplierName: 'Công ty Cổ phần Sữa TH',
        committedLeadTimeDays: 2,
      },
    };

    mockPrisma.recommendationItem.findUnique.mockResolvedValue(
      mockExistingItem,
    );

    const mockSavedItem = {
      ...mockExistingItem,
      approvedQuantity: 60,
      isOverridden: true,
    };

    mockPrisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const fakeTx = {
          recommendationItem: {
            update: jest.fn().mockResolvedValue(mockSavedItem),
            findMany: jest.fn().mockResolvedValue([
              {
                productId: BigInt(12),
                approvedQuantity: 60,
                approvedSupplierId: BigInt(3),
                supplierRankings: mockExistingItem.supplierRankings,
              },
            ]),
          },
          recommendationSession: {
            update: jest.fn().mockResolvedValue({}),
          },
          supplyCondition: {
            findFirst: jest.fn(),
          },
        };
        return cb(fakeTx);
      },
    );

    const result = await service.updateItem(1001, { approvedQuantity: 60 });

    expect(result).toBeDefined();
    expect(result.itemId).toBe(1001);
    expect(result.approvedQuantity).toBe(60);
    expect(result.isOverridden).toBe(true);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('should allow setting approvedQuantity to 0 (AF-2)', async () => {
    const mockExistingItem = {
      id: BigInt(1001),
      sessionId: BigInt(105),
      productId: BigInt(12),
      suggestedQuantity: 50,
      approvedQuantity: 50,
      suggestedSupplierId: BigInt(3),
      approvedSupplierId: BigInt(3),
      snapshotCurrentInventory: 15,
      snapshotOnOrderQuantity: 0,
      reorderPoint: 35,
      safetyStock: 12,
      stockRiskStatus: 'Critical',
      abcXyzGroup: 'AX',
      supplierRankings: [],
      dailyForecasts: [],
      whyBuyExplanation: null,
      session: { status: 'Draft' },
      product: {
        skuCode: 'MILK-TH-1L',
        productName: 'Sữa tươi TH True Milk 1L',
        category: { categoryName: 'Hàng Tươi Sống' },
        supplyConditions: [],
      },
      suggestedSupplier: null,
    };

    mockPrisma.recommendationItem.findUnique.mockResolvedValue(
      mockExistingItem,
    );

    const mockSavedItem = {
      ...mockExistingItem,
      approvedQuantity: 0,
      isOverridden: true,
    };

    mockPrisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const fakeTx = {
          recommendationItem: {
            update: jest.fn().mockResolvedValue(mockSavedItem),
            findMany: jest.fn().mockResolvedValue([]),
          },
          recommendationSession: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(fakeTx);
      },
    );

    const result = await service.updateItem(1001, { approvedQuantity: 0 });

    expect(result).toBeDefined();
    expect(result.approvedQuantity).toBe(0);
    expect(result.isOverridden).toBe(true);
  });

  it('should throw BadRequestException (SKU_HAS_NO_ACTIVE_SUPPLIER) when setting approvedQuantity > 0 for item without supplier', async () => {
    const mockItemWithoutSupplier = {
      id: BigInt(1002),
      sessionId: BigInt(105),
      productId: BigInt(20),
      approvedQuantity: 0,
      approvedSupplierId: null,
      suggestedSupplierId: null,
      suggestedQuantity: 0,
      session: { status: 'Draft' },
      product: {
        id: BigInt(20),
        productName: 'Sản phẩm chưa có NCC',
        skuCode: 'SKU-NO-SUP',
        supplyConditions: [],
      },
    };

    mockPrisma.recommendationItem.findUnique.mockResolvedValue(
      mockItemWithoutSupplier,
    );

    await expect(
      service.updateItem(1002, { approvedQuantity: 50 }),
    ).rejects.toThrow(BadRequestException);
  });
});
