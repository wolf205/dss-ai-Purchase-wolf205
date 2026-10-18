import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DssSessionQueryService } from './dss-session-query.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('DssSessionQueryService (UC-01 Session Query)', () => {
  let service: DssSessionQueryService;

  const mockPrisma = {
    recommendationSession: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DssSessionQueryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DssSessionQueryService>(DssSessionQueryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when session ID does not exist', async () => {
    mockPrisma.recommendationSession.findUnique.mockResolvedValue(null);

    await expect(service.getSessionById(999)).rejects.toThrow(
      NotFoundException,
    );
    expect(mockPrisma.recommendationSession.findUnique).toHaveBeenCalledWith({
      where: { id: BigInt(999) },
      include: expect.any(Object),
    });
  });

  it('should return session details with mapped items and snapshot fields', async () => {
    const mockSession = {
      id: BigInt(105),
      sessionCode: 'REC-20261004-001',
      status: 'Draft',
      categoryId: BigInt(1),
      scope: 'Hàng Tươi Sống',
      totalSuggestedAmount: new Prisma.Decimal(15000000.0),
      totalApprovedAmount: new Prisma.Decimal(15000000.0),
      createdAt: new Date('2026-10-04T15:30:00.000Z'),
      items: [
        {
          id: BigInt(1001),
          productId: BigInt(12),
          snapshotCurrentInventory: 15,
          snapshotOnOrderQuantity: 0,
          reorderPoint: 35,
          safetyStock: 12,
          stockRiskStatus: 'Critical',
          abcXyzGroup: 'AX',
          suggestedQuantity: 50,
          approvedQuantity: 50,
          suggestedSupplierId: BigInt(3),
          suggestedSupplierWsmScore: new Prisma.Decimal(92.5),
          approvedSupplierId: BigInt(3),
          isOverridden: false,
          whyBuyExplanation: null,
          product: {
            skuCode: 'MILK-TH-1L',
            productName: 'Sữa tươi TH True Milk 1L',
            category: { categoryName: 'Hàng Tươi Sống' },
          },
          suggestedSupplier: {
            id: BigInt(3),
            supplierCode: 'TH_TRUE_MILK',
            supplierName: 'Công ty Cổ phần Sữa TH',
            committedLeadTimeDays: 2,
          },
          dailyForecasts: [
            {
              date: '2026-10-05',
              predicted: 12.0,
              lower: 10.0,
              upper: 14.0,
            },
          ],
          supplierRankings: [
            {
              supplierId: 3,
              supplierName: 'TH True Milk',
              wsmScore: 92.5,
              purchasePrice: 32000,
              committedLeadTimeDays: 2,
              moq: 20,
            },
          ],
        },
      ],
    };

    mockPrisma.recommendationSession.findUnique.mockResolvedValue(mockSession);

    const result = await service.getSessionById(105);

    expect(result).toBeDefined();
    expect(result.sessionId).toBe(105);
    expect(result.sessionCode).toBe('REC-20261004-001');
    expect(result.status).toBe('Draft');
    expect(result.totalSuggestedAmount).toBe(15000000.0);
    expect(result.items.length).toBe(1);

    const item = result.items[0];
    expect(item.itemId).toBe(1001);
    expect(item.skuCode).toBe('MILK-TH-1L');
    expect(item.abcClassification).toBe('A');
    expect(item.xyzClassification).toBe('X');
    expect(item.abcXyzBadge).toBe('AX');
    expect(item.currentInventory).toBe(15);
    expect(item.reorderPoint).toBe(35);
    expect(item.suggestedSupplier).toBeDefined();
    expect(item.suggestedSupplier?.code).toBe('TH_TRUE_MILK');
    expect(item.suggestedSupplier?.wsmScore).toBe(92.5);
    expect(item.suggestedSupplier?.unitPrice).toBe(32000);
    expect(item.suggestedSupplier?.moq).toBe(20);
    expect(item.dailyForecasts.length).toBe(1);
    expect(item.supplierRankings.length).toBe(1);
  });
});
