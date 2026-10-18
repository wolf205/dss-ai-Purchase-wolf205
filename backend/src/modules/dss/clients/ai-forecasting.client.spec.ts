import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiForecastingClient } from './ai-forecasting.client';
import { SkuForecastInput } from '../interfaces/ai-forecasting.interface';

describe('AiForecastingClient (Python AI Service Integration)', () => {
  let client: AiForecastingClient;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'AI_SERVICE_URL') return 'http://localhost:8000';
      return null;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiForecastingClient,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    client = module.get<AiForecastingClient>(AiForecastingClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  it('should return forecasts from AI service when response is successful', async () => {
    const mockApiResponse = {
      results: [
        {
          skuId: 101,
          dailyAverage: 25.5,
          dailyDemandStd: 4.2,
          modelUsed: 'AUTO_ARIMA',
          dailyForecasts: [
            { date: '2026-10-05', predicted: 26, lower: 20, upper: 32 },
          ],
        },
      ],
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockApiResponse),
    });

    const inputs: SkuForecastInput[] = [
      {
        productId: 101,
        history: [{ date: '2026-10-01', quantity: 25 }],
      },
    ];

    const result = await client.getForecasts(inputs, 14);

    expect(result.size).toBe(1);
    const sku101 = result.get('101');
    expect(sku101).toBeDefined();
    expect(sku101?.dailyAverage).toBe(25.5);
    expect(sku101?.dailyDemandStd).toBe(4.2);
    expect(sku101?.modelUsed).toBe('AUTO_ARIMA');
  });

  it('should trigger SMA fallback when AI service returns HTTP 500 error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const inputs: SkuForecastInput[] = [
      {
        productId: 102,
        history: [
          { date: '2026-10-01', quantity: 10 },
          { date: '2026-10-02', quantity: 20 },
        ],
      },
    ];

    const result = await client.getForecasts(inputs, 14);

    expect(result.size).toBe(1);
    const sku102 = result.get('102');
    expect(sku102).toBeDefined();
    expect(sku102?.modelUsed).toBe('SMA_FALLBACK');
    expect(sku102?.dailyAverage).toBe(15);
    expect(sku102?.dailyForecasts.length).toBe(14);
  });

  it('should trigger SMA fallback when AI service times out or throws an error', async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('AbortError: The operation was aborted'));

    const inputs: SkuForecastInput[] = [
      {
        productId: 103,
        history: [{ date: '2026-10-01', quantity: 30 }],
      },
    ];

    const result = await client.getForecasts(inputs, 14);

    expect(result.size).toBe(1);
    const sku103 = result.get('103');
    expect(sku103).toBeDefined();
    expect(sku103?.modelUsed).toBe('SMA_FALLBACK');
    expect(sku103?.dailyAverage).toBe(30);
    expect(sku103?.dailyDemandStd).toBe(0);
  });

  it('should handle empty history by defaulting to 0 demand in fallback', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Connection refused'));

    const inputs: SkuForecastInput[] = [
      {
        productId: 104,
        history: [],
      },
    ];

    const result = await client.getForecasts(inputs, 14);

    expect(result.size).toBe(1);
    const sku104 = result.get('104');
    expect(sku104).toBeDefined();
    expect(sku104?.modelUsed).toBe('SMA_FALLBACK');
    expect(sku104?.dailyAverage).toBe(0);
  });
});
