import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockResult = {
    items: [
      {
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
        },
        ipAddress: '192.168.1.15',
        createdAt: '2026-09-15T09:15:30.000Z',
      },
    ],
    pagination: {
      page: 1,
      limit: 20,
      totalItems: 1,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockResult),
          },
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAuditLogs', () => {
    it('should return audit logs and pagination meta', async () => {
      const query: QueryAuditLogDto = { page: 1, limit: 20 };
      const response = await controller.getAuditLogs(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(response).toEqual({
        data: mockResult.items,
        meta: {
          pagination: mockResult.pagination,
        },
      });
    });
  });
});
