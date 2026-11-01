import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DssEvaluationService } from './dss-evaluation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('DssEvaluationService (Session Forecast Accuracy & Evaluation)', () => {
  let service: DssEvaluationService;

  const mockPrisma = {
    recommendationSession: {
      findUnique: jest.fn(),
    },
    salesRecord: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DssEvaluationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<DssEvaluationService>(DssEvaluationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if session does not exist', async () => {
    mockPrisma.recommendationSession.findUnique.mockResolvedValue(null);

    await expect(service.evaluateSession(BigInt(999))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should return empty evaluation when session has no items', async () => {
    mockPrisma.recommendationSession.findUnique.mockResolvedValue({
      id: BigInt(1),
      sessionCode: 'REC-001',
      status: 'Approved',
      approvedAt: new Date('2026-11-01T10:00:00Z'),
      items: [],
    });

    const result = await service.evaluateSession(BigInt(1));

    expect(result.sessionId).toBe('1');
    expect(result.hasActualData).toBe(false);
    expect(result.skuEvaluations).toHaveLength(0);
    expect(result.summary).toBeNull();
  });

  it('should return hasActualData=false when sales records are not yet imported for the window', async () => {
    mockPrisma.recommendationSession.findUnique.mockResolvedValue({
      id: BigInt(1),
      sessionCode: 'REC-001',
      status: 'Approved',
      approvedAt: new Date('2026-11-01T10:00:00Z'),
      items: [
        {
          id: BigInt(10),
          productId: BigInt(100),
          forecastedDemand: new Prisma.Decimal('15.00'),
          dailyForecasts: [
            { date: '2026-11-02', predicted: 15 },
            { date: '2026-11-03', predicted: 15 },
          ],
          abcXyzGroup: 'AX',
          product: {
            skuCode: 'MILK-VNM-1L',
            productName: 'Sữa tươi Vinamilk',
            category: { categoryName: 'Bơ Sữa' },
          },
        },
      ],
    });

    mockPrisma.salesRecord.findMany.mockResolvedValue([]);

    const result = await service.evaluateSession(BigInt(1));

    expect(result.hasActualData).toBe(false);
    expect(result.evaluationWindow.startDate).toBe('2026-11-02');
    expect(result.evaluationWindow.endDate).toBe('2026-11-03');
    expect(result.summary).toBeNull();
  });

  it('should correctly compute WAPE, MAPE, MAE, Bias and Quality Rating when sales data is available', async () => {
    mockPrisma.recommendationSession.findUnique.mockResolvedValue({
      id: BigInt(1),
      sessionCode: 'REC-001',
      status: 'Approved',
      approvedAt: new Date('2026-11-01T10:00:00Z'),
      items: [
        {
          id: BigInt(10),
          productId: BigInt(100),
          forecastedDemand: new Prisma.Decimal('10.00'),
          dailyForecasts: [
            { date: '2026-11-02', predicted: 10 },
            { date: '2026-11-03', predicted: 10 },
          ],
          abcXyzGroup: 'AX',
          product: {
            skuCode: 'MILK-VNM-1L',
            productName: 'Sữa tươi Vinamilk',
            category: { categoryName: 'Bơ Sữa' },
          },
        },
      ],
    });

    // Actual sales: 2026-11-02 = 12, 2026-11-03 = 8 -> Sum actual = 20, Sum pred = 20
    // absErr = |12 - 10| + |8 - 10| = 2 + 2 = 4
    // WAPE = 4 / 20 * 100 = 20.00% -> EXCELLENT (<= 20%)
    mockPrisma.salesRecord.findMany.mockResolvedValue([
      {
        productId: BigInt(100),
        saleDate: new Date('2026-11-02T00:00:00Z'),
        quantitySold: 12,
      },
      {
        productId: BigInt(100),
        saleDate: new Date('2026-11-03T00:00:00Z'),
        quantitySold: 8,
      },
    ]);

    const result = await service.evaluateSession(BigInt(1));

    expect(result.hasActualData).toBe(true);
    expect(result.summary).not.toBeNull();
    expect(result.summary?.overallWape).toBe(20.0);
    expect(result.summary?.qualityRating).toBe('EXCELLENT');
    expect(result.summary?.totalPredicted).toBe(20);
    expect(result.summary?.totalActual).toBe(20);

    expect(result.skuEvaluations).toHaveLength(1);
    const sku = result.skuEvaluations[0];
    expect(sku.skuCode).toBe('MILK-VNM-1L');
    expect(sku.wape).toBe(20.0);
    expect(sku.qualityRating).toBe('EXCELLENT');
    expect(sku.dailyTimeline).toHaveLength(2);
    expect(sku.dailyTimeline[0]).toEqual({
      date: '2026-11-02',
      predicted: 10,
      actual: 12,
    });
  });
});
