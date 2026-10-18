import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PurchaseOrdersService', () => {
  let service: PurchaseOrdersService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPoRecord = {
    id: BigInt(201),
    poNumber: 'PO-20261018-001',
    sessionId: BigInt(105),
    supplierId: BigInt(3),
    status: 'Approved',
    approvalDate: new Date('2026-10-18'),
    historicalLeadTimeDays: 2,
    expectedDeliveryDate: new Date('2026-10-20'),
    totalAmount: new Prisma.Decimal('1550000.00'),
    cancellationReason: null,
    cancelledAt: null,
    lastExportedAt: null,
    createdAt: new Date('2026-10-18T08:00:00.000Z'),
    updatedAt: new Date('2026-10-18T08:00:00.000Z'),
    supplier: {
      id: BigInt(3),
      supplierCode: 'NCC-THM',
      supplierName: 'Công ty Cổ phần Sữa TH',
      contactPerson: 'Nguyễn Văn A',
      phoneNumber: '0901234567',
      email: 'th@milk.vn',
      address: 'Hà Nội',
      committedLeadTimeDays: 2,
      status: 'Active',
      performanceScore: new Prisma.Decimal('0.9000'),
      allTimePerformanceScore: new Prisma.Decimal('0.9000'),
      completedOrderCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: BigInt(105),
      sessionCode: 'REC-20261018-001',
    },
    lineItems: [
      {
        id: BigInt(1),
        poId: BigInt(201),
        productId: BigInt(12),
        quantity: 50,
        historicalUnitPrice: new Prisma.Decimal('31000.00'),
        historicalMoq: 20,
        lineTotal: new Prisma.Decimal('1550000.00'),
        createdAt: new Date(),
        product: {
          id: BigInt(12),
          skuCode: 'MILK-TH-1L',
          productName: 'Sữa tươi TH True Milk 1L',
          barcode: '8934673200025',
          unit: 'Hộp',
        },
      },
    ],
  };

  beforeEach(async () => {
    const mockPrisma = {
      purchaseOrder: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated list of purchase orders with isOverdue computed', async () => {
      (prismaService.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
        mockPoRecord,
      ]);
      (prismaService.purchaseOrder.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].poNumber).toBe('PO-20261018-001');
      expect(result.items[0].supplierName).toBe('Công ty Cổ phần Sữa TH');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      });
    });

    it('should apply filters for isOverdue true/false', async () => {
      (prismaService.purchaseOrder.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.purchaseOrder.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({ isOverdue: true });
      expect(prismaService.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'Approved',
            expectedDeliveryDate: expect.any(Object),
          }),
        }),
      );

      await service.findAll({ isOverdue: false });
      expect(prismaService.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should apply search filter for poNumber and supplierName', async () => {
      (prismaService.purchaseOrder.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.purchaseOrder.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({ search: 'TH Milk' });
      expect(prismaService.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.any(Array),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return purchase order detail with relations', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );

      const result = await service.findOne(201);

      expect(result.id).toBe('201');
      expect(result.supplier.supplierCode).toBe('NCC-THM');
      expect(result.lineItems).toHaveLength(1);
      expect(result.lineItems[0].skuCode).toBe('MILK-TH-1L');
      expect(result.lineItems[0].historicalUnitPrice).toBe(31000);
    });

    it('should throw NotFoundException if purchase order does not exist', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should cancel PO and revert on_order_quantity in transaction', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockPoRecord) // Check existence
        .mockResolvedValueOnce({
          ...mockPoRecord,
          status: 'Cancelled',
          cancellationReason: 'NCC báo hết hàng',
          cancelledAt: new Date(),
        }); // findOne after cancel

      (prismaService.$transaction as jest.Mock).mockImplementation(
        async (cb: (tx: any) => Promise<any>) => {
          const mockTx = {
            purchaseOrder: {
              update: jest.fn().mockResolvedValue({}),
            },
            product: {
              findUnique: jest.fn().mockResolvedValue({ onOrderQuantity: 100 }),
              update: jest.fn().mockResolvedValue({}),
            },
          };
          return await cb(mockTx);
        },
      );

      const result = await service.cancel(201, {
        cancellationReason: 'NCC báo hết hàng',
      });

      expect(result.status).toBe('Cancelled');
      expect(result.cancellationReason).toBe('NCC báo hết hàng');
      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException (PO_ALREADY_CLOSED) if status is not Approved', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue({
        ...mockPoRecord,
        status: 'Completed',
      });

      await expect(
        service.cancel(201, { cancellationReason: 'Test' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if PO to cancel does not exist', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.cancel(999, { cancellationReason: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('export', () => {
    it('should update lastExportedAt and return export buffer', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );
      (prismaService.purchaseOrder.update as jest.Mock).mockResolvedValue({
        ...mockPoRecord,
        lastExportedAt: new Date(),
      });

      const res = await service.export(201, 'excel');

      expect(prismaService.purchaseOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: BigInt(201) },
          data: { lastExportedAt: expect.any(Date) },
        }),
      );
      expect(res.fileName.endsWith('.csv')).toBe(true);
    });

    it('should throw NotFoundException if PO to export does not exist', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.export(999, 'pdf')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
