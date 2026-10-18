import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DssExplainabilityService } from './dss-explainability.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GeminiExplainerClient } from '../clients/gemini-explainer.client';
import { Prisma } from '@prisma/client';

describe('DssExplainabilityService (UC-01 Gemini Explainability)', () => {
  let service: DssExplainabilityService;
  let geminiClient: GeminiExplainerClient;

  const mockPrisma = {
    recommendationItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockGeminiClient = {
    explainRecommendation: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DssExplainabilityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GeminiExplainerClient, useValue: mockGeminiClient },
      ],
    }).compile();

    service = module.get<DssExplainabilityService>(DssExplainabilityService);
    geminiClient = module.get<GeminiExplainerClient>(GeminiExplainerClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when itemId does not exist', async () => {
    mockPrisma.recommendationItem.findUnique.mockResolvedValue(null);

    await expect(service.explainItem(9999)).rejects.toThrow(NotFoundException);
  });

  it('should return cached explanation directly when whyBuyExplanation is already stored in DB', async () => {
    const cachedText =
      'Đoạn văn giải thích đã có sẵn trong cơ sở dữ liệu từ trước.';
    mockPrisma.recommendationItem.findUnique.mockResolvedValue({
      id: BigInt(1001),
      whyBuyExplanation: cachedText,
      product: { skuCode: 'SKU-001', productName: 'Sản phẩm 1' },
    });

    const result = await service.explainItem(1001);

    expect(result).toBeDefined();
    expect(result.itemId).toBe(1001);
    expect(result.llmExplanation).toBe(cachedText);
    expect(geminiClient.explainRecommendation).not.toHaveBeenCalled();
    expect(mockPrisma.recommendationItem.update).not.toHaveBeenCalled();
  });

  it('should call geminiClient and persist result to DB when cache is empty', async () => {
    const mockItem = {
      id: BigInt(1002),
      whyBuyExplanation: null,
      abcXyzGroup: 'AX',
      snapshotCurrentInventory: 10,
      snapshotOnOrderQuantity: 0,
      reorderPoint: 25,
      safetyStock: 8,
      stockRiskStatus: 'Critical',
      suggestedQuantity: 40,
      suggestedSupplierId: BigInt(5),
      suggestedSupplierWsmScore: new Prisma.Decimal(90.5),
      supplierRankings: [
        {
          supplierId: 5,
          purchasePrice: 20000,
          moq: 10,
          committedLeadTimeDays: 2,
        },
      ],
      product: {
        skuCode: 'SKU-002',
        productName: 'Bánh mỳ Sandwich',
        unit: 'Gói',
        category: { categoryName: 'Bánh tươi' },
      },
      suggestedSupplier: {
        supplierName: 'Công ty Thực phẩm Á Châu',
        committedLeadTimeDays: 2,
      },
    };

    mockPrisma.recommendationItem.findUnique.mockResolvedValue(mockItem);
    mockGeminiClient.explainRecommendation.mockResolvedValue(
      'Mặt hàng Bánh mỳ Sandwich cần đặt gấp 40 gói do tồn kho cạn kiệt.',
    );
    mockPrisma.recommendationItem.update.mockResolvedValue({});

    const result = await service.explainItem(1002);

    expect(result).toBeDefined();
    expect(result.itemId).toBe(1002);
    expect(result.llmExplanation).toBe(
      'Mặt hàng Bánh mỳ Sandwich cần đặt gấp 40 gói do tồn kho cạn kiệt.',
    );
    expect(geminiClient.explainRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({
        skuCode: 'SKU-002',
        productName: 'Bánh mỳ Sandwich',
        currentInventory: 10,
        suggestedQuantity: 40,
        supplierName: 'Công ty Thực phẩm Á Châu',
      }),
    );
    expect(mockPrisma.recommendationItem.update).toHaveBeenCalledWith({
      where: { id: BigInt(1002) },
      data: {
        whyBuyExplanation:
          'Mặt hàng Bánh mỳ Sandwich cần đặt gấp 40 gói do tồn kho cạn kiệt.',
      },
    });
  });
});
