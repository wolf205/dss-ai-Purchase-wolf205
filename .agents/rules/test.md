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
| **Unit Test** | Domain Engine pure functions | Jest (Backend), Pytest (AI) | 🔴 Bắt buộc |
| **Integration Test** | Controller layer + mock Service | `@nestjs/testing` | 🟡 Quan trọng |
| **API Test** | FastAPI endpoint + TestClient | Pytest + `httpx` | 🟡 Quan trọng |

## 2. Nguyên Tắc Test Domain Engine

Domain Engine phải viết được Unit Test **hoàn toàn độc lập**:
- **Không cần DB** (không mock Prisma)
- **Không cần HTTP** (không mock HttpService)
- Chỉ nhận input → trả output → verify output

Đây là lý do Domain Engine phải là pure functions / stateless classes.

## 3. Quy Tắc Mock

```
✅ Mock: PrismaService, HttpService (gọi Python/Gemini), External APIs
❌ Không mock: Business logic, Domain Engine functions, Math formulas
```

Nếu phải mock logic business để test → đó là dấu hiệu layering bị vi phạm.

## 4. Tiêu Chuẩn Tối Thiểu

Mỗi test file phải cover ít nhất:
1. **Happy Path** — Input hợp lệ, output đúng kỳ vọng
2. **Boundary Values** — Giá trị biên (0, âm, rỗng, null, max)
3. **Error Cases** — Input lỗi → Exception đúng type và message

## 5. File Naming & Coverage

- Backend: `<name>.spec.ts` cạnh file nguồn
- AI Service: `test_<name>.py` trong thư mục `tests/`
- Coverage target: Domain Engine functions phải đạt **100% line coverage**

## 6. Commands

```bash
# Backend
npm run test          # Chạy tất cả tests
npm run test:cov      # Với coverage report
npm run test:watch    # Watch mode

# AI Service
pytest -v             # Chạy tất cả tests
pytest --cov=src      # Với coverage report
```
