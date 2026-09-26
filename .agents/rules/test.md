---
trigger: model_decision
description: >-
  Đọc khi viết file test (*.spec.ts, test_*.py), chạy test suite,
  debug test failures, hoặc cần xác định coverage của một module.
---

# Test — Tiêu Chuẩn Kiểm Thử

## 1. Phân Loại Test

| Loại | Đối tượng | Tool | Ưu tiên |
|---|---|---|---|
| **Unit Test** | Domain Engine pure functions (SS, ROP, SOQ, WSM, ABC-XYZ, OTIF) | Jest (Backend), Pytest (AI) | 🔴 Bắt buộc |
| **Integration Test** | Service layer + mock PrismaService | `@nestjs/testing` + Jest | 🟡 Quan trọng |
| **Controller Test** | Controller layer + mock Service | `@nestjs/testing` + Jest | 🟡 Quan trọng |
| **API Test** | FastAPI endpoint + TestClient | Pytest + `httpx` | 🟡 Quan trọng |

## 2. Nguyên Tắc Test Domain Engine (Zero Mocks)

Domain Engine phải viết được Unit Test **hoàn toàn độc lập**:
- **Không cần DB** (không mock Prisma)
- **Không cần HTTP** (không mock HttpService)
- Chỉ nhận input → trả output → verify output

Đây là lý do Domain Engine phải là pure functions.
Nếu phải mock business logic để test → đó là dấu hiệu layering bị vi phạm.

## 3. Business Rule Boundary Values Quan Trọng

Khi test các Domain Engine functions, phải cover các boundary values theo spec:

| Formula | Critical Boundaries |
|---|---|
| **SS = Z × σd × √L** | L=0, σd=0, Z từ bảng {1.28,1.65,2.05,2.33} |
| **ROP = d×L + SS** | IP ≤ ROP (trigger order) vs IP > ROP (no order) |
| **SOQ = max(MOQ, ⌈Base SOQ⌉)** | Base SOQ ≤ 0 → SOQ = 0; Base SOQ < MOQ → SOQ = MOQ |
| **WSM Score** | Single supplier (no normalization), tie-breaking by S_Price rồi S_History |
| **ABC**: 80%/95%/100% cumulative | Edge: SKU < 7 ngày → CZ mặc định |
| **OTIF OnTimeFactor** | Days_late=0 (1.0), =1 (0.67), =2 (0.33), ≥3 (0.0) |
| **Order Score** | (OnTimeFactor×50) + (FulfillmentRate×0.5) |
| **FulfillmentRate** | Khóa tối đa 100%, không thưởng giao dư |

## 4. Quy Tắc Mock

```
✅ Mock: PrismaService, HttpService (Python AI Service), @google/genai (Gemini API), External file upload
❌ Không mock: Business logic, Domain Engine functions, Math formulas
```

## 5. Tiêu Chuẩn Tối Thiểu Mỗi Test File

Mỗi test file phải cover ít nhất:
1. **Happy Path** — Input hợp lệ, output đúng kỳ vọng
2. **Boundary Values** — Giá trị biên theo bảng mục 3
3. **Error Cases** — Input lỗi → Exception đúng type và message

## 6. File Naming & Coverage

- Backend: `<name>.spec.ts` cạnh file nguồn
- AI Service: `test_<name>.py` trong thư mục `tests/`
- **Coverage target:** Domain Engine functions phải đạt **100% line coverage**

## 7. Commands

```bash
# Backend (trong thư mục backend/)
npm run test          # Chạy tất cả tests
npm run test:cov      # Với coverage report
npm run test:watch    # Watch mode

# AI Service (trong thư mục ai-service/)
pytest -v             # Chạy tất cả tests
pytest --cov=src --cov-report=term-missing -v  # Với coverage report
```
