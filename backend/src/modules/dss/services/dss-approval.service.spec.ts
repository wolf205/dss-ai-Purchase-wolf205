import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DssApprovalService } from './dss-approval.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('DssApprovalService (UC-01 Session Approval & PO Generation)', () => {
  let service: DssApprovalService;

  const mockPrisma = {
    recommendationSession: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    purchaseOrder: {
      count: jest.fn(),
      create: jest.fn(),
    },
    pOLineItem: {
      createMany: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DssApprovalService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DssApprovalService>(DssApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when sessionId does not exist', async () => {
    mockPrisma.recommendationSession.findUnique.mockResolvedValue(null);

    await expect(service.approveSession(999)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw BadRequestException when session status is not Draft', async () => {
    mockPrisma.recommendationSession.findUnique.mockResolvedValue({
      id: BigInt(105),
      status: 'Approved',
      items: [],
    });

    await expect(service.approveSession(105)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should approve session, group items by supplier, create POs and increment onOrderQuantity in transaction', async () => {
    const mockSession = {
      id: BigInt(105),
      sessionCode: 'REC-20261004-001',
      status: 'Draft',
      items: [
        {
          id: BigInt(1001),
          productId: BigInt(10),
          approvedQuantity: 50,
          approvedSupplierId: BigInt(3),
          supplierRankings: [
            {
              supplierId: 3,
              purchasePrice: 20000,
              moq: 10,
            },
          ],
          product: {
            skuCode: 'SKU-001',
            productName: 'Mặt hàng 1',
            supplyConditions: [],
          },
          approvedSupplier: {
            id: BigInt(3),
            supplierCode: 'NCC-001',
            supplierName: 'Nhà cung cấp TH Milk',
            committedLeadTimeDays: 2,
          },
        },
        {
          id: BigInt(1002),
          productId: BigInt(11),
          approvedQuantity: 30,
          approvedSupplierId: BigInt(3),
          supplierRankings: [
            {
              supplierId: 3,
              purchasePrice: 15000,
              moq: 10,
            },
          ],
          product: {
            skuCode: 'SKU-002',
            productName: 'Mặt hàng 2',
            supplyConditions: [],
          },
          approvedSupplier: {
            id: BigInt(3),
            supplierCode: 'NCC-001',
            supplierName: 'Nhà cung cấp TH Milk',
            committedLeadTimeDays: 2,
          },
        },
        {
          id: BigInt(1003),
          productId: BigInt(12),
          approvedQuantity: 0, // Mặt hàng không đặt (AF-2)
          approvedSupplierId: BigInt(5),
          supplierRankings: [],
          product: {
            skuCode: 'SKU-003',
            productName: 'Mặt hàng 3',
            supplyConditions: [],
          },
          approvedSupplier: null,
        },
      ],
    };

    mockPrisma.recommendationSession.findUnique.mockResolvedValue(mockSession);

    const mockCreatedPo = {
      id: BigInt(201),
      poNumber: 'PO-20261004-001',
      supplierId: BigInt(3),
      totalAmount: new Prisma.Decimal(1450000.0),
    };

    mockPrisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const fakeTx = {
          recommendationSession: {
            update: jest.fn().mockResolvedValue({}),
          },
          purchaseOrder: {
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue(mockCreatedPo),
          },
          pOLineItem: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
          product: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(fakeTx);
      },
    );

    const result = await service.approveSession(105);

    expect(result).toBeDefined();
    expect(result.sessionId).toBe(105);
    expect(result.generatedPurchaseOrders.length).toBe(1);
    expect(result.generatedPurchaseOrders[0].poId).toBe(201);
    expect(result.generatedPurchaseOrders[0].poNumber).toBe('PO-20261004-001');
    expect(result.generatedPurchaseOrders[0].supplierName).toBe(
      'Nhà cung cấp TH Milk',
    );
    expect(result.generatedPurchaseOrders[0].totalLines).toBe(2);
    expect(result.generatedPurchaseOrders[0].totalAmount).toBe(1450000.0);
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it('should approve session but return empty POs when all approved quantities are 0', async () => {
    const mockSession = {
      id: BigInt(106),
      status: 'Draft',
      items: [
        {
          id: BigInt(1004),
          productId: BigInt(20),
          approvedQuantity: 0,
          approvedSupplierId: BigInt(3),
          product: { supplyConditions: [] },
          approvedSupplier: null,
        },
      ],
    };

    mockPrisma.recommendationSession.findUnique.mockResolvedValue(mockSession);

    mockPrisma.$transaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) => {
        const fakeTx = {
          recommendationSession: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(fakeTx);
      },
    );

    const result = await service.approveSession(106);

    expect(result).toBeDefined();
    expect(result.sessionId).toBe(106);
    expect(result.generatedPurchaseOrders.length).toBe(0);
  });
});
