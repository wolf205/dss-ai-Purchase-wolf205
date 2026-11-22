import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DssSessionAnalysisService } from './dss-session-analysis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DssCalculationEngineService } from './dss-calculation-engine.service';
import { AiForecastingClient } from '../clients/ai-forecasting.client';
import { Prisma } from '@prisma/client';

describe('DssSessionAnalysisService (UC-01 Session Orchestration)', () => {
  let service: DssSessionAnalysisService;

  const mockPrisma = {
    category: {
      findUnique: jest.fn(),
    },
    recommendationSession: {
      updateMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    recommendationItem: {
      createMany: jest.fn(),
    },
    dSSConfiguration: {
      findFirst: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    salesRecord: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAiForecastingClient = {
    getForecasts: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DssSessionAnalysisService,
        DssCalculationEngineService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiForecastingClient, useValue: mockAiForecastingClient },
      ],
    }).compile();

    service = module.get<DssSessionAnalysisService>(DssSessionAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeSession', () => {
    it('should throw NotFoundException when categoryId does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.analyzeSession({ categoryId: 999 }, 'testuser'),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(999) },
      });
    });

    it('should throw BadRequestException when no active products found', async () => {
      mockPrisma.recommendationSession.updateMany.mockResolvedValue({
        count: 1,
      });
      mockPrisma.dSSConfiguration.findFirst.mockResolvedValue(null);
      mockPrisma.product.findMany.mockResolvedValue([]);

      await expect(service.analyzeSession({}, 'testuser')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully orchestrate session analysis and persist in transaction', async () => {
      mockPrisma.recommendationSession.updateMany.mockResolvedValue({
        count: 1,
      });

      mockPrisma.dSSConfiguration.findFirst.mockResolvedValue({
        id: 1,
        priceWeight: new Prisma.Decimal(0.4),
        leadTimeWeight: new Prisma.Decimal(0.2),
        moqWeight: new Prisma.Decimal(0.15),
        historyWeight: new Prisma.Decimal(0.25),
        targetServiceLevel: new Prisma.Decimal(0.95),
        zFactor: new Prisma.Decimal(1.65),
        reviewPeriodDays: 7,
      });

      const mockProducts = [
        {
          id: BigInt(1),
          skuCode: 'SKU-001',
          productName: 'Sữa tươi Tiệt trùng',
          currentInventory: 10,
          onOrderQuantity: 0,
          category: { categoryName: 'Sữa & Sản phẩm từ sữa' },
          supplyConditions: [
            {
              supplierId: BigInt(10),
              purchasePrice: new Prisma.Decimal(25000),
              moq: 20,
              status: 'Active',
              supplier: {
                supplierCode: 'NCC-001',
                supplierName: 'Vinamilk Distribution',
                committedLeadTimeDays: 2,
                performanceScore: new Prisma.Decimal(92),
                completedOrderCount: 15,
                status: 'Active',
              },
            },
          ],
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      mockPrisma.salesRecord.findMany.mockResolvedValue([
        {
          productId: BigInt(1),
          revenue: new Prisma.Decimal(500000),
          quantitySold: 20,
          saleDate: new Date('2026-09-01'),
        },
      ]);

      const mockForecastResultMap = new Map();
      mockForecastResultMap.set('1', {
        dailyAverage: 20,
        dailyDemandStd: 3,
        modelUsed: 'AUTO_ARIMA',
        dailyForecasts: [
          { date: '2026-10-05', predicted: 20, lower: 15, upper: 25 },
        ],
      });
      mockAiForecastingClient.getForecasts.mockResolvedValue(
        mockForecastResultMap,
      );

      mockPrisma.recommendationSession.count.mockResolvedValue(0);

      const fakeCreatedSession = {
        id: BigInt(105),
        sessionCode: 'REC-20261004-001',
        createdAt: new Date('2026-10-04T15:30:00.000Z'),
      };

      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const fakeTx = {
            recommendationSession: {
              create: jest.fn().mockResolvedValue(fakeCreatedSession),
            },
            recommendationItem: {
              createMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          };
          return cb(fakeTx);
        },
      );

      const result = await service.analyzeSession({}, 'admin_user');

      expect(result).toBeDefined();
      expect(result.sessionId).toBe(105);
      expect(result.sessionCode).toBe('REC-20261004-001');
      expect(result.totalSkusAnalyzed).toBe(1);
      expect(mockPrisma.recommendationSession.updateMany).toHaveBeenCalledWith({
        where: { status: 'Draft' },
        data: { status: 'Discarded' },
      });
      expect(mockAiForecastingClient.getForecasts).toHaveBeenCalled();
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should query sales history constrained to 90-day window and anchor history start to 90 days ago', async () => {
      mockPrisma.recommendationSession.updateMany.mockResolvedValue({
        count: 0,
      });
      mockPrisma.dSSConfiguration.findFirst.mockResolvedValue({
        id: 1,
        priceWeight: new Prisma.Decimal(0.4),
        leadTimeWeight: new Prisma.Decimal(0.2),
        moqWeight: new Prisma.Decimal(0.15),
        historyWeight: new Prisma.Decimal(0.25),
        targetServiceLevel: new Prisma.Decimal(0.95),
        zFactor: new Prisma.Decimal(1.65),
        reviewPeriodDays: 7,
      });

      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: BigInt(1),
          skuCode: 'SKU-001',
          productName: 'Sữa tươi',
          currentInventory: 10,
          onOrderQuantity: 0,
          category: { categoryCode: 'DAI', categoryName: 'Sữa' },
          supplyConditions: [
            {
              supplierId: BigInt(10),
              purchasePrice: new Prisma.Decimal(25000),
              moq: 20,
              status: 'Active',
              supplier: {
                supplierCode: 'NCC-001',
                supplierName: 'Vinamilk',
                committedLeadTimeDays: 2,
                performanceScore: new Prisma.Decimal(0.92),
                completedOrderCount: 15,
                status: 'Active',
              },
            },
          ],
        },
      ]);

      mockPrisma.salesRecord.findMany.mockResolvedValue([
        {
          productId: BigInt(1),
          revenue: new Prisma.Decimal(680000),
          quantitySold: 20,
          saleDate: new Date('2026-11-13T00:00:00.000Z'),
        },
      ]);

      const mockForecastResultMap = new Map();
      mockForecastResultMap.set('1', {
        dailyAverage: 15,
        dailyDemandStd: 2,
        modelUsed: 'HybridEnsemble',
        dailyForecasts: [
          { date: '2026-11-14', predicted: 15, lower: 10, upper: 20 },
        ],
      });
      mockAiForecastingClient.getForecasts.mockResolvedValue(
        mockForecastResultMap,
      );
      mockPrisma.recommendationSession.count.mockResolvedValue(0);

      mockPrisma.$transaction.mockImplementation(
        async (cb: (tx: unknown) => Promise<unknown>) => {
          const fakeTx = {
            recommendationSession: {
              create: jest.fn().mockResolvedValue({
                id: BigInt(106),
                sessionCode: 'REC-20261114-001',
                createdAt: new Date('2026-11-14T00:00:00.000Z'),
              }),
            },
            recommendationItem: {
              createMany: jest.fn().mockResolvedValue({ count: 1 }),
            },
          };
          return cb(fakeTx);
        },
      );

      await service.analyzeSession({ asOfDate: '2026-11-14' }, 'manager');

      const findManyArg = mockPrisma.salesRecord.findMany.mock.calls[0][0];
      expect(findManyArg.where.saleDate).toEqual({
        gte: new Date('2026-08-16T00:00:00.000Z'),
        lt: new Date('2026-11-14T00:00:00.000Z'),
      });

      const forecastCallArg =
        mockAiForecastingClient.getForecasts.mock.calls[0][0];
      expect(forecastCallArg[0].history[0]).toEqual({
        date: '2026-08-16',
        quantity: 0,
      });
      expect(forecastCallArg[0].history[1]).toEqual({
        date: '2026-11-13',
        quantity: 20,
      });
    });
  });
});
