import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  const mockActivityLog = {
    id: 801n,
    userId: 1n,
    username: 'manager_an',
    action: 'DSS_APPROVE_RECOMMENDATION',
    entityType: 'RecommendationSession',
    entityId: '105',
    description: 'Phê duyệt phiên đề xuất mua hàng số 105',
    metadata: {
      poGeneratedCount: 2,
      totalAmount: 28400000.0,
      ipAddress: '192.168.1.15',
    },
    createdAt: new Date('2026-09-15T09:15:30.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: {
            activityLog: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLog', () => {
    it('should create an activity log record with proper fields and ipAddress merged in metadata', async () => {
      (prisma.activityLog.create as jest.Mock).mockResolvedValue(
        mockActivityLog,
      );

      const result = await service.createLog({
        userId: '1',
        username: 'manager_an',
        action: 'DSS_APPROVE_RECOMMENDATION',
        entityType: 'RecommendationSession',
        entityId: '105',
        description: 'Phê duyệt phiên đề xuất mua hàng số 105',
        metadata: { poGeneratedCount: 2, totalAmount: 28400000.0 },
        ipAddress: '192.168.1.15',
      });

      expect(result).toEqual(mockActivityLog);
      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 1n,
          username: 'manager_an',
          action: 'DSS_APPROVE_RECOMMENDATION',
          entityType: 'RecommendationSession',
          entityId: '105',
          description: 'Phê duyệt phiên đề xuất mua hàng số 105',
          metadata: {
            poGeneratedCount: 2,
            totalAmount: 28400000.0,
            ipAddress: '192.168.1.15',
          },
        },
      });
    });

    it('should apply fallback values when optional fields are omitted', async () => {
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({
        ...mockActivityLog,
        userId: null,
        entityType: 'SYSTEM',
        entityId: 'N/A',
      });

      await service.createLog({
        username: 'anonymous',
        action: 'PUBLIC_ACTION',
      });

      expect(prisma.activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: null,
          username: 'anonymous',
          action: 'PUBLIC_ACTION',
          entityType: 'SYSTEM',
          entityId: 'N/A',
          description: 'Thực hiện hành vi PUBLIC_ACTION',
          metadata: expect.anything(),
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated audit logs with mapped ipAddress and string ids', async () => {
      (prisma.activityLog.count as jest.Mock).mockResolvedValue(1);
      (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([
        mockActivityLog,
      ]);

      const query: QueryAuditLogDto = {
        page: 1,
        limit: 20,
      };

      const result = await service.findAll(query);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: '801',
        userId: '1',
        username: 'manager_an',
        action: 'DSS_APPROVE_RECOMMENDATION',
        entityType: 'RecommendationSession',
        entityId: '105',
        description: 'Phê duyệt phiên đề xuất mua hàng số 105',
        metadata: {
          poGeneratedCount: 2,
          totalAmount: 28400000.0,
          ipAddress: '192.168.1.15',
        },
        ipAddress: '192.168.1.15',
        createdAt: '2026-09-15T09:15:30.000Z',
      });

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply filters for action, username, and date ranges', async () => {
      (prisma.activityLog.count as jest.Mock).mockResolvedValue(0);
      (prisma.activityLog.findMany as jest.Mock).mockResolvedValue([]);

      const query: QueryAuditLogDto = {
        page: 2,
        limit: 10,
        action: 'AUTH_LOGIN',
        username: 'admin',
        fromDate: '2026-09-01T00:00:00.000Z',
        toDate: '2026-09-30T23:59:59.999Z',
      };

      const result = await service.findAll(query);

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
      });

      expect(prisma.activityLog.findMany).toHaveBeenCalledWith({
        where: {
          action: { contains: 'AUTH_LOGIN', mode: 'insensitive' },
          username: { contains: 'admin', mode: 'insensitive' },
          createdAt: {
            gte: new Date('2026-09-01T00:00:00.000Z'),
            lte: new Date('2026-09-30T23:59:59.999Z'),
          },
        },
        skip: 10,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
