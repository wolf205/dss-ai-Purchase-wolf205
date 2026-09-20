---
name: test
description: >-
  Hướng dẫn viết và chạy unit tests: Jest cho NestJS (TestingModule, mock PrismaService),
  Pytest cho FastAPI AI Service (TestClient), patterns để test Domain Engine pure functions
  mà không cần DB hay HTTP. Sử dụng khi viết file *.spec.ts hoặc test_*.py,
  hoặc khi debug test failures.
---

# Test Skill — Jest (Backend) + Pytest (AI Service)

## 1. Jest Setup cho NestJS

```typescript
// <module>.service.spec.ts — Template cơ bản
import { Test, TestingModule } from '@nestjs/testing';
import { <Name>Service } from './<name>.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  <modelName>: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('<Name>Service', () => {
  let service: <Name>Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <Name>Service,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<<Name>Service>(<Name>Service);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Happy Path ---
  it('should return items successfully', async () => {
    const mockItems = [{ id: '1', name: 'Test' }];
    mockPrismaService.<modelName>.findMany.mockResolvedValue(mockItems);

    const result = await service.findAll();
    expect(result).toEqual(mockItems);
    expect(mockPrismaService.<modelName>.findMany).toHaveBeenCalledTimes(1);
  });

  // --- Error Case ---
  it('should throw NotFoundException when item not found', async () => {
    mockPrismaService.<modelName>.findUnique.mockResolvedValue(null);
    await expect(service.findById('non-existent')).rejects.toThrow('NOT_FOUND');
  });
});
```

## 2. Unit Test cho Domain Engine (Pure Functions — Zero Mocks)

```typescript
// src/modules/dss/engines/safety-stock.engine.spec.ts
import { calculateSafetyStock } from './safety-stock.engine';

describe('calculateSafetyStock', () => {
  // Happy Path
  it('should calculate correctly for standard inputs', () => {
    const result = calculateSafetyStock({
      zScore: 1.65,          // 95% service level
      stdDemandPerDay: 10,
      leadTimeDays: 7,
    });
    expect(result).toBeCloseTo(43.7, 1); // z * σ_d * √LT
  });

  // Boundary Values
  it('should return 0 when std demand is 0', () => {
    expect(calculateSafetyStock({ zScore: 1.65, stdDemandPerDay: 0, leadTimeDays: 7 })).toBe(0);
  });

  it('should handle lead time of 1 day', () => {
    expect(calculateSafetyStock({ zScore: 1.65, stdDemandPerDay: 10, leadTimeDays: 1 })).toBeCloseTo(16.5, 1);
  });

  // Error Cases
  it('should throw when lead time is negative', () => {
    expect(() => calculateSafetyStock({ zScore: 1.65, stdDemandPerDay: 10, leadTimeDays: -1 }))
      .toThrow('Lead time must be positive');
  });
});
```

## 3. Controller Test Template (mock Service)

```typescript
// <name>.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { <Name>Controller } from './<name>.controller';
import { <Name>Service } from './<name>.service';

const mock<Name>Service = {
  findAll: jest.fn(),
  create: jest.fn(),
};

describe('<Name>Controller', () => {
  let controller: <Name>Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [<Name>Controller],
      providers: [{ provide: <Name>Service, useValue: mock<Name>Service }],
    }).compile();

    controller = module.get<<Name>Controller>(<Name>Controller);
    jest.clearAllMocks();
  });

  it('should return all items', async () => {
    mock<Name>Service.findAll.mockResolvedValue([]);
    const result = await controller.findAll();
    expect(result.success).toBe(true);
  });
});
```

## 4. Pytest + FastAPI TestClient

```python
# tests/test_forecast.py
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)

# Happy Path
def test_forecast_valid_payload():
    payload = {
        "items": [{
            "sku_id": "SKU-001",
            "sales_history": [
                {"sale_date": "2024-01-01", "quantity_sold": 10.0},
                # ... ít nhất 30 ngày
            ],
            "forecast_horizon_days": 14,
            "lead_time_days": 7,
        }],
        "requested_at": "2024-02-01"
    }
    response = client.post("/api/v1/forecast", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert len(data["items"][0]["daily_forecasts"]) == 14

# Boundary Value
def test_forecast_empty_items():
    response = client.post("/api/v1/forecast", json={"items": [], "requested_at": "2024-02-01"})
    assert response.status_code == 422

# Health check
def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
```

## 5. Mock Patterns Thường Dùng

```typescript
// Mock một method cụ thể
jest.spyOn(service, 'findById').mockResolvedValue(mockProduct);

// Mock throw error
jest.spyOn(prisma.product, 'findUnique').mockRejectedValue(new Error('DB Error'));

// Verify call arguments
expect(prisma.product.update).toHaveBeenCalledWith(
  expect.objectContaining({ where: { id: '123' } })
);

// Reset giữa các tests
afterEach(() => jest.clearAllMocks());
```

## 6. Test Data Builder Pattern

```typescript
// Dùng builder functions thay vì hardcode fixtures
function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-001',
    name: 'Test Product',
    sku: 'SKU-001',
    currentStock: 100,
    reorderPoint: 20,
    safetyStock: 10,
    ...overrides,
  };
}

// Sử dụng
const product = buildProduct({ currentStock: 5 }); // Simulate low stock
```
