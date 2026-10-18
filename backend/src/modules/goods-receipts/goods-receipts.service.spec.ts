import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GoodsReceiptsService } from './goods-receipts.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';

describe('GoodsReceiptsService', () => {
  let service: GoodsReceiptsService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPoRecord = {
    id: BigInt(201),
    poNumber: 'PO-20261015-001',
    sessionId: BigInt(105),
    supplierId: BigInt(3),
    status: 'Approved',
    approvalDate: new Date('2026-10-15T00:00:00.000Z'),
    historicalLeadTimeDays: 2,
    expectedDeliveryDate: new Date('2026-10-17T00:00:00.000Z'),
    totalAmount: new Prisma.Decimal('1600000.00'),
    cancellationReason: null,
    cancelledAt: null,
    lastExportedAt: null,
    createdAt: new Date('2026-10-15T08:00:00.000Z'),
    updatedAt: new Date('2026-10-15T08:00:00.000Z'),
    goodsReceipt: null,
    supplier: {
      id: BigInt(3),
      supplierCode: 'SUP-TH',
      supplierName: 'Công ty Cổ phần Sữa TH',
      contactPerson: 'Nguyễn Văn A',
      phoneNumber: '0901234567',
      email: 'th@milk.vn',
      address: 'Hà Nội',
      committedLeadTimeDays: 2,
      status: 'Active',
      performanceScore: new Prisma.Decimal('0.8000'),
      allTimePerformanceScore: new Prisma.Decimal('0.8000'),
      completedOrderCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    lineItems: [
      {
        id: BigInt(501),
        poId: BigInt(201),
        productId: BigInt(12),
        quantity: 50,
        historicalUnitPrice: new Prisma.Decimal('32000.00'),
        historicalMoq: 20,
        lineTotal: new Prisma.Decimal('1600000.00'),
        createdAt: new Date(),
        product: {
          id: BigInt(12),
          skuCode: 'MILK-TH-1L',
          productName: 'Sữa tươi TH True Milk 1L',
          barcode: '8934673200025',
          unit: 'Hộp',
          currentInventory: 10,
          onOrderQuantity: 50,
        },
      },
    ],
  };

  beforeEach(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockPrisma: any = {
      purchaseOrder: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      goodsReceipt: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        aggregate: jest.fn(),
      },
      receiptLineItem: {
        create: jest.fn(),
      },
      supplier: {
        update: jest.fn(),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPrisma.$transaction = jest.fn((callback: (tx: any) => Promise<any>) =>
      callback(mockPrisma),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodsReceiptsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GoodsReceiptsService>(GoodsReceiptsService);
    prismaService = module.get(PrismaService);
  });

  describe('getPendingPurchaseOrders (6B.1)', () => {
    it('nên trả về danh sách các đơn PO Approved chưa nhận hàng', async () => {
      (prismaService.purchaseOrder.findMany as jest.Mock).mockResolvedValue([
        mockPoRecord,
      ]);
      (prismaService.purchaseOrder.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getPendingPurchaseOrders({
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].poNumber).toBe('PO-20261015-001');
      expect(result.items[0].supplierName).toBe('Công ty Cổ phần Sữa TH');
      expect(result.items[0].lineItems).toHaveLength(1);
      expect(result.items[0].lineItems[0].orderedQuantity).toBe(50);
      expect(result.totalItems).toBe(1);
    });

    it('nên lọc theo từ khóa tìm kiếm và supplierId nếu có', async () => {
      (prismaService.purchaseOrder.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.purchaseOrder.count as jest.Mock).mockResolvedValue(0);

      await service.getPendingPurchaseOrders({
        page: 1,
        limit: 10,
        search: 'TH',
        supplierId: '3',
      });

      expect(prismaService.purchaseOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'Approved',
            goodsReceipt: null,
            supplierId: BigInt(3),
          }),
        }),
      );
    });
  });

  describe('confirmGoodsReceipt (6B.2, 6C - ACID Transaction)', () => {
    const validDto: CreateGoodsReceiptDto = {
      purchaseOrderId: 201,
      receiptDate: '2026-10-17',
      note: 'Giao hàng đúng hẹn, bao bì nguyên vẹn',
      lines: [
        {
          poLineItemId: 501,
          skuId: 12,
          receivedQuantity: 50,
        },
      ],
    };

    it('Scenario 1: Happy path - Đúng hẹn, đủ 100% số lượng (daysLate=0, onTimeFactor=1.0, score=1.0)', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );
      (prismaService.goodsReceipt.count as jest.Mock).mockResolvedValue(0);
      (prismaService.goodsReceipt.create as jest.Mock).mockResolvedValue({
        id: BigInt(301),
        receiptNumber: 'GR-20261017-001',
        poId: BigInt(201),
        actualDeliveryDate: new Date('2026-10-17'),
        daysLate: 0,
        onTimeFactor: new Prisma.Decimal('1.0000'),
        overallFulfillmentRate: new Prisma.Decimal('1.0000'),
        orderPerformanceScore: new Prisma.Decimal('1.0000'),
        notes: validDto.note,
        receivedBy: 'staff01',
        createdAt: new Date(),
      });
      (prismaService.receiptLineItem.create as jest.Mock).mockResolvedValue({
        id: BigInt(801),
        createdAt: new Date(),
      });
      (prismaService.product.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: BigInt(12),
        currentInventory: 10,
        onOrderQuantity: 50,
      });
      (prismaService.goodsReceipt.findMany as jest.Mock).mockResolvedValue([
        { orderPerformanceScore: new Prisma.Decimal('1.0000') },
      ]);
      (prismaService.goodsReceipt.aggregate as jest.Mock).mockResolvedValue({
        _avg: { orderPerformanceScore: new Prisma.Decimal('1.0000') },
        _count: { id: 1 },
      });

      const result = await service.confirmGoodsReceipt(validDto, 'staff01');

      expect(result.receiptNumber).toMatch(/^GR-/);
      expect(result.daysLate).toBe(0);
      expect(result.isOnTime).toBe(true);
      expect(result.onTimeFactor).toBe(1.0);
      expect(result.overallFulfillmentRate).toBe(1.0);
      expect(result.orderPerformanceScore).toBe(1.0);
      expect(result.lines[0].receivedQuantity).toBe(50);

      // Verify product stock update
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: BigInt(12) },
        data: {
          currentInventory: 60, // 10 + 50
          onOrderQuantity: 0, // 50 - 50
        },
      });

      // Verify PO status closed
      expect(prismaService.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: BigInt(201) },
        data: { status: 'Completed' },
      });

      // Verify Cold Start for supplier (< 3 orders => 0.8000)
      expect(prismaService.supplier.update).toHaveBeenCalledWith({
        where: { id: BigInt(3) },
        data: {
          completedOrderCount: 1,
          performanceScore: new Prisma.Decimal('0.8000'),
          allTimePerformanceScore: new Prisma.Decimal('1.0000'),
        },
      });
    });

    it('Scenario 2: Giao thiếu hàng (AF-1) - overallFulfillmentRate = 0.7000, onOrder vẫn giải phóng đủ 50', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );
      (prismaService.goodsReceipt.count as jest.Mock).mockResolvedValue(0);
      (prismaService.goodsReceipt.create as jest.Mock).mockResolvedValue({
        id: BigInt(301),
        receiptNumber: 'GR-20261017-001',
        poId: BigInt(201),
        actualDeliveryDate: new Date('2026-10-17'),
        daysLate: 0,
        onTimeFactor: new Prisma.Decimal('1.0000'),
        overallFulfillmentRate: new Prisma.Decimal('0.7000'),
        orderPerformanceScore: new Prisma.Decimal('0.8500'),
        notes: 'Thiếu 15 hộp do NCC hết hàng',
        receivedBy: 'staff01',
        createdAt: new Date(),
      });
      (prismaService.receiptLineItem.create as jest.Mock).mockResolvedValue({
        id: BigInt(801),
        createdAt: new Date(),
      });
      (prismaService.product.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: BigInt(12),
        currentInventory: 10,
        onOrderQuantity: 50,
      });
      (prismaService.goodsReceipt.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.goodsReceipt.aggregate as jest.Mock).mockResolvedValue({
        _avg: { orderPerformanceScore: new Prisma.Decimal('0.8500') },
        _count: { id: 1 },
      });

      const underDeliveryDto: CreateGoodsReceiptDto = {
        ...validDto,
        note: 'Thiếu 15 hộp do NCC hết hàng',
        lines: [{ poLineItemId: 501, skuId: 12, receivedQuantity: 35 }],
      };

      const result = await service.confirmGoodsReceipt(
        underDeliveryDto,
        'staff01',
      );

      expect(result.overallFulfillmentRate).toBe(0.7);
      // Product onOrder vẫn phải giảm đúng bằng số lượng đặt ban đầu (50)
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: BigInt(12) },
        data: {
          currentInventory: 45, // 10 + 35
          onOrderQuantity: 0, // max(0, 50 - 50)
        },
      });
    });

    it('Scenario 3: Giao dư hàng (AF-2) - Tồn kho tăng đủ 60, fulfillmentRate khóa trần 1.0000', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );
      (prismaService.goodsReceipt.count as jest.Mock).mockResolvedValue(0);
      (prismaService.goodsReceipt.create as jest.Mock).mockResolvedValue({
        id: BigInt(301),
        receiptNumber: 'GR-20261017-001',
        poId: BigInt(201),
        actualDeliveryDate: new Date('2026-10-17'),
        daysLate: 0,
        onTimeFactor: new Prisma.Decimal('1.0000'),
        overallFulfillmentRate: new Prisma.Decimal('1.0000'),
        orderPerformanceScore: new Prisma.Decimal('1.0000'),
        notes: 'NCC tặng thêm 10 hộp khuyến mãi',
        receivedBy: 'staff01',
        createdAt: new Date(),
      });
      (prismaService.receiptLineItem.create as jest.Mock).mockResolvedValue({
        id: BigInt(801),
        createdAt: new Date(),
      });
      (prismaService.product.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: BigInt(12),
        currentInventory: 10,
        onOrderQuantity: 50,
      });
      (prismaService.goodsReceipt.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.goodsReceipt.aggregate as jest.Mock).mockResolvedValue({
        _avg: { orderPerformanceScore: new Prisma.Decimal('1.0000') },
        _count: { id: 1 },
      });

      const overDeliveryDto: CreateGoodsReceiptDto = {
        ...validDto,
        note: 'NCC tặng thêm 10 hộp khuyến mãi',
        lines: [{ poLineItemId: 501, skuId: 12, receivedQuantity: 60 }],
      };

      const result = await service.confirmGoodsReceipt(
        overDeliveryDto,
        'staff01',
      );

      expect(result.overallFulfillmentRate).toBe(1.0); // Khóa trần 1.0
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: BigInt(12) },
        data: {
          currentInventory: 70, // 10 + 60
          onOrderQuantity: 0,
        },
      });
    });

    it('Scenario 4: Giao trễ 2 ngày (AF-3) - onTimeFactor = 0.3333', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue({
        ...mockPoRecord,
        expectedDeliveryDate: new Date('2026-10-15T00:00:00.000Z'),
        approvalDate: new Date('2026-10-13T00:00:00.000Z'),
      });
      (prismaService.goodsReceipt.count as jest.Mock).mockResolvedValue(0);
      (prismaService.goodsReceipt.create as jest.Mock).mockResolvedValue({
        id: BigInt(301),
        receiptNumber: 'GR-20261017-001',
        poId: BigInt(201),
        actualDeliveryDate: new Date('2026-10-17'),
        daysLate: 2,
        onTimeFactor: new Prisma.Decimal('0.3333'),
        overallFulfillmentRate: new Prisma.Decimal('1.0000'),
        orderPerformanceScore: new Prisma.Decimal('0.6667'),
        notes: null,
        receivedBy: 'staff01',
        createdAt: new Date(),
      });
      (prismaService.receiptLineItem.create as jest.Mock).mockResolvedValue({
        id: BigInt(801),
        createdAt: new Date(),
      });
      (prismaService.product.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: BigInt(12),
        currentInventory: 10,
        onOrderQuantity: 50,
      });
      (prismaService.goodsReceipt.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.goodsReceipt.aggregate as jest.Mock).mockResolvedValue({
        _avg: { orderPerformanceScore: new Prisma.Decimal('0.6667') },
        _count: { id: 1 },
      });

      const lateDto: CreateGoodsReceiptDto = {
        ...validDto,
        receiptDate: '2026-10-17', // Expected: 2026-10-15 => late 2 days
      };

      const result = await service.confirmGoodsReceipt(lateDto, 'staff01');

      expect(result.daysLate).toBe(2);
      expect(result.isOnTime).toBe(false);
      expect(result.onTimeFactor).toBeCloseTo(0.3333, 3);
    });

    it('Scenario 5: Chặn xác nhận khi 100% receivedQuantity = 0 (EF-2, ZERO_FULFILLMENT_RECEIPT)', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );

      const zeroFulfillmentDto: CreateGoodsReceiptDto = {
        ...validDto,
        lines: [{ poLineItemId: 501, skuId: 12, receivedQuantity: 0 }],
      };

      await expect(
        service.confirmGoodsReceipt(zeroFulfillmentDto, 'staff01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Scenario 6: Chặn ngày nhận hàng ở tương lai (EF-3, INVALID_FUTURE_DATE)', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );

      const futureDateDto: CreateGoodsReceiptDto = {
        ...validDto,
        receiptDate: '2099-12-31',
      };

      await expect(
        service.confirmGoodsReceipt(futureDateDto, 'staff01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Scenario 7: Chặn ngày nhận hàng nhỏ hơn ngày duyệt đơn (EF-3, VALIDATION_ERROR)', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );

      const beforeApprovalDto: CreateGoodsReceiptDto = {
        ...validDto,
        receiptDate: '2026-10-10', // Approval date is 2026-10-15
      };

      await expect(
        service.confirmGoodsReceipt(beforeApprovalDto, 'staff01'),
      ).rejects.toThrow(BadRequestException);
    });

    it('Scenario 8: Chặn khi đơn PO đã Closed hoặc đã nhận hàng (EF-5, PO_ALREADY_CLOSED)', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue({
        ...mockPoRecord,
        status: 'Completed',
      });

      await expect(
        service.confirmGoodsReceipt(validDto, 'staff01'),
      ).rejects.toThrow(ConflictException);
    });

    it('Scenario 9: Chặn khi không tìm thấy đơn PO (EF-1, RESOURCE_NOT_FOUND)', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.confirmGoodsReceipt(validDto, 'staff01'),
      ).rejects.toThrow(NotFoundException);
    });

    it('Scenario 10: Chặn khi danh sách mặt hàng không khớp dòng trên PO', async () => {
      (prismaService.purchaseOrder.findUnique as jest.Mock).mockResolvedValue(
        mockPoRecord,
      );

      const mismatchedDto: CreateGoodsReceiptDto = {
        ...validDto,
        lines: [
          { poLineItemId: 999, skuId: 12, receivedQuantity: 50 }, // wrong poLineItemId
        ],
      };

      await expect(
        service.confirmGoodsReceipt(mismatchedDto, 'staff01'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('nên trả về chi tiết phiếu nhận hàng nếu tồn tại', async () => {
      (prismaService.goodsReceipt.findUnique as jest.Mock).mockResolvedValue({
        id: BigInt(301),
        receiptNumber: 'GR-20261017-001',
        poId: BigInt(201),
        actualDeliveryDate: new Date('2026-10-17'),
        daysLate: 0,
        onTimeFactor: new Prisma.Decimal('1.0000'),
        overallFulfillmentRate: new Prisma.Decimal('1.0000'),
        orderPerformanceScore: new Prisma.Decimal('1.0000'),
        notes: 'Đúng hạn',
        receivedBy: 'staff01',
        createdAt: new Date(),
        po: {
          id: BigInt(201),
          poNumber: 'PO-20261015-001',
          expectedDeliveryDate: new Date('2026-10-17'),
          supplier: {
            id: BigInt(3),
            supplierCode: 'SUP-TH',
            supplierName: 'Công ty Cổ phần Sữa TH',
            completedOrderCount: 5,
            performanceScore: new Prisma.Decimal('0.9500'),
            allTimePerformanceScore: new Prisma.Decimal('0.9400'),
          },
        },
        lineItems: [
          {
            id: BigInt(801),
            poLineItemId: BigInt(501),
            productId: BigInt(12),
            orderedQuantity: 50,
            receivedQuantity: 50,
            historicalUnitPrice: new Prisma.Decimal('32000.00'),
            lineReceivedTotal: new Prisma.Decimal('1600000.00'),
            itemFulfillmentRate: new Prisma.Decimal('1.0000'),
            createdAt: new Date(),
            product: {
              skuCode: 'MILK-TH-1L',
              productName: 'Sữa tươi TH True Milk 1L',
              unit: 'Hộp',
            },
          },
        ],
      });

      const result = await service.findOne(301);

      expect(result.receiptNumber).toBe('GR-20261017-001');
      expect(result.poNumber).toBe('PO-20261015-001');
      expect(result.lines).toHaveLength(1);
      expect(result.supplierPerformance.performanceLabel).toBe(
        '[Phong độ 5 đơn gần nhất]',
      );
    });

    it('nên ném NotFoundException nếu phiếu nhận hàng không tồn tại', async () => {
      (prismaService.goodsReceipt.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
