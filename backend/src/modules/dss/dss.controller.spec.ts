import { Test, TestingModule } from '@nestjs/testing';
import { DssController } from './dss.controller';
import { DssSessionAnalysisService } from './services/dss-session-analysis.service';
import { DssSessionQueryService } from './services/dss-session-query.service';
import { DssItemAdjustmentService } from './services/dss-item-adjustment.service';
import { DssExplainabilityService } from './services/dss-explainability.service';
import { DssApprovalService } from './services/dss-approval.service';
import { DssEvaluationService } from './services/dss-evaluation.service';
import { AuthenticatedUser } from '../auth/interfaces/auth-payload.interface';
import { Role } from '../../common/enums/role.enum';

describe('DssController', () => {
  let controller: DssController;
  let analysisService: DssSessionAnalysisService;
  let queryService: DssSessionQueryService;
  let adjustmentService: DssItemAdjustmentService;
  let explainabilityService: DssExplainabilityService;
  let approvalService: DssApprovalService;
  let evaluationService: DssEvaluationService;

  const mockSessionAnalysisService = {
    analyzeSession: jest.fn(),
  };

  const mockSessionQueryService = {
    getSessionById: jest.fn(),
  };

  const mockItemAdjustmentService = {
    updateItem: jest.fn(),
  };

  const mockExplainabilityService = {
    explainItem: jest.fn(),
  };

  const mockApprovalService = {
    approveSession: jest.fn(),
  };

  const mockEvaluationService = {
    evaluateSession: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DssController],
      providers: [
        {
          provide: DssSessionAnalysisService,
          useValue: mockSessionAnalysisService,
        },
        {
          provide: DssSessionQueryService,
          useValue: mockSessionQueryService,
        },
        {
          provide: DssItemAdjustmentService,
          useValue: mockItemAdjustmentService,
        },
        {
          provide: DssExplainabilityService,
          useValue: mockExplainabilityService,
        },
        {
          provide: DssApprovalService,
          useValue: mockApprovalService,
        },
        {
          provide: DssEvaluationService,
          useValue: mockEvaluationService,
        },
      ],
    }).compile();

    controller = module.get<DssController>(DssController);
    analysisService = module.get<DssSessionAnalysisService>(
      DssSessionAnalysisService,
    );
    queryService = module.get<DssSessionQueryService>(DssSessionQueryService);
    adjustmentService = module.get<DssItemAdjustmentService>(
      DssItemAdjustmentService,
    );
    explainabilityService = module.get<DssExplainabilityService>(
      DssExplainabilityService,
    );
    approvalService = module.get<DssApprovalService>(DssApprovalService);
    evaluationService = module.get<DssEvaluationService>(DssEvaluationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('analyze', () => {
    it('should call sessionAnalysisService.analyzeSession and return response', async () => {
      const mockUser: AuthenticatedUser = {
        id: '1',
        username: 'manager',
        role: Role.STORE_MANAGER,
      };

      const mockResponse = {
        sessionId: 105,
        sessionCode: 'REC-20261004-001',
        totalSkusAnalyzed: 50,
        suggestedOrderCount: 12,
        createdAt: '2026-10-04T15:30:00.000Z',
      };

      mockSessionAnalysisService.analyzeSession.mockResolvedValue(mockResponse);

      const result = await controller.analyze({ categoryId: 1 }, mockUser);

      expect(analysisService.analyzeSession).toHaveBeenCalledWith(
        { categoryId: 1 },
        'manager',
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSessionById', () => {
    it('should call sessionQueryService.getSessionById and return session detail', async () => {
      const mockResponse = {
        sessionId: 105,
        sessionCode: 'REC-20261004-001',
        status: 'Draft',
        categoryId: 1,
        scope: 'Hàng Tươi Sống',
        totalSuggestedAmount: 15000000.0,
        totalApprovedAmount: 15000000.0,
        createdAt: '2026-10-04T15:30:00.000Z',
        items: [],
      };

      mockSessionQueryService.getSessionById.mockResolvedValue(mockResponse);

      const result = await controller.getSessionById(105);

      expect(queryService.getSessionById).toHaveBeenCalledWith(105);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateItem', () => {
    it('should call itemAdjustmentService.updateItem and return updated item', async () => {
      const mockDto = { approvedQuantity: 60, approvedSupplierId: 3 };
      const mockItemResponse = {
        itemId: 1001,
        skuId: 12,
        skuCode: 'MILK-TH-1L',
        approvedQuantity: 60,
        approvedSupplierId: 3,
        isOverridden: true,
      };

      mockItemAdjustmentService.updateItem.mockResolvedValue(mockItemResponse);

      const result = await controller.updateItem(1001, mockDto);

      expect(adjustmentService.updateItem).toHaveBeenCalledWith(1001, mockDto);
      expect(result).toEqual(mockItemResponse);
    });
  });

  describe('explainItem', () => {
    it('should call explainabilityService.explainItem and return explanation', async () => {
      const mockResponse = {
        itemId: 1001,
        llmExplanation:
          'Mặt hàng cần bổ sung ngay do tồn kho chạm ngưỡng cảnh báo.',
      };

      mockExplainabilityService.explainItem.mockResolvedValue(mockResponse);

      const result = await controller.explainItem(1001);

      expect(explainabilityService.explainItem).toHaveBeenCalledWith(1001);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('approveSession', () => {
    it('should call approvalService.approveSession and return generated purchase orders', async () => {
      const mockResponse = {
        sessionId: 105,
        generatedPurchaseOrders: [
          {
            poId: 201,
            poNumber: 'PO-20261004-001',
            supplierName: 'Công ty Cổ phần Sữa TH',
            totalLines: 5,
            totalAmount: 12500000.0,
            expectedDeliveryDate: '2026-10-06T00:00:00.000Z',
          },
        ],
      };

      mockApprovalService.approveSession.mockResolvedValue(mockResponse);

      const result = await controller.approveSession(105);

      expect(approvalService.approveSession).toHaveBeenCalledWith(105);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('evaluateSession', () => {
    it('should call evaluationService.evaluateSession and return evaluation details', async () => {
      const mockResponse = {
        sessionId: '105',
        sessionCode: 'REC-20261101-001',
        sessionStatus: 'Approved',
        hasActualData: true,
        evaluationWindow: {
          startDate: '2026-11-02',
          endDate: '2026-11-08',
          totalDays: 7,
        },
        summary: {
          overallWape: 15.5,
          overallMape: 18.2,
          overallMae: 2.1,
          overallBias: 1.2,
          totalPredicted: 100,
          totalActual: 105,
          qualityRating: 'EXCELLENT',
          evaluatedDaysCount: 7,
          totalDaysHorizon: 7,
          dailyAggregateTimeline: [],
        },
        skuEvaluations: [],
      };

      mockEvaluationService.evaluateSession.mockResolvedValue(mockResponse);

      const result = await controller.evaluateSession(105);

      expect(evaluationService.evaluateSession).toHaveBeenCalledWith(
        BigInt(105),
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
