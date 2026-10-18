import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiExplainerClient } from './gemini-explainer.client';
import { RecommendationExplanationContext } from '../interfaces/explanation-context.interface';

describe('GeminiExplainerClient (Gemini 1.5 Flash Integration)', () => {
  let client: GeminiExplainerClient;

  const mockConfigService = {
    get: jest.fn(),
  };

  const sampleContext: RecommendationExplanationContext = {
    skuCode: 'MILK-TH-1L',
    productName: 'Sữa tươi TH True Milk 1L',
    categoryName: 'Hàng Tươi Sống',
    unit: 'Hộp',
    abcXyzBadge: 'AX',
    currentInventory: 15,
    onOrderQuantity: 0,
    reorderPoint: 35,
    safetyStock: 12,
    stockRiskStatus: 'Critical',
    suggestedQuantity: 50,
    supplierName: 'Công ty Cổ phần Sữa TH',
    purchasePrice: 32000,
    leadTimeDays: 2,
    moq: 20,
    wsmScore: 92.5,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiExplainerClient,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    client = module.get<GeminiExplainerClient>(GeminiExplainerClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  it('should use deterministic fallback when GEMINI_API_KEY is not provided', async () => {
    mockConfigService.get.mockReturnValue('');

    const explanation = await client.explainRecommendation(sampleContext);

    expect(explanation).toContain('Mặt hàng Sữa tươi TH True Milk 1L');
    expect(explanation).toContain('MILK-TH-1L');
    expect(explanation).toContain('nhóm AX');
    expect(explanation).toContain('cạn kiệt nghiêm trọng');
    expect(explanation).toContain('Công ty Cổ phần Sữa TH');
  });

  it('should return Gemini generated explanation when API returns HTTP 200', async () => {
    mockConfigService.get.mockReturnValue('valid_gemini_api_key');

    const mockAiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: 'Sữa tươi TH True Milk 1L thuộc nhóm AX với nhu cầu tiêu thụ cao và ổn định. Tồn kho 15 hộp đã chạm ngưỡng nguy hiểm, đề xuất đặt 50 hộp từ TH True Milk với điểm WSM 92.5 để tối ưu chi phí và tránh đứt hàng.',
              },
            ],
          },
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockAiResponse),
    });

    const explanation = await client.explainRecommendation(sampleContext);

    expect(explanation).toContain('Sữa tươi TH True Milk 1L');
    expect(explanation).toContain('chạm ngưỡng nguy hiểm');
  });

  it('should fall back to deterministic template when Gemini API returns HTTP 500 error', async () => {
    mockConfigService.get.mockReturnValue('valid_gemini_api_key');

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const explanation = await client.explainRecommendation(sampleContext);

    expect(explanation).toContain('Mặt hàng Sữa tươi TH True Milk 1L');
    expect(explanation).toContain('nhóm AX');
  });

  it('should fall back to deterministic template when Gemini API times out (>3s)', async () => {
    mockConfigService.get.mockReturnValue('valid_gemini_api_key');

    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('AbortError: The operation was aborted'));

    const explanation = await client.explainRecommendation(sampleContext);

    expect(explanation).toContain('Mặt hàng Sữa tươi TH True Milk 1L');
    expect(explanation).toContain('50 Hộp');
  });
});
