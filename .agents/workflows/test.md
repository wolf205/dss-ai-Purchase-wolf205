---
description: Test Workflow — Viết và chạy test suite cho một module
---

# /run-tests — Quy Trình Kiểm Thử

---

## Bước 1: Xác Định Phạm Vi

Trước khi bắt đầu, làm rõ:
- **Module nào** cần test? (`auth`, `dss`, `catalog`, `ai-service`...)
- **Layer nào?** Unit test (Domain Engine) hay Integration test (Controller/Service)?
- **Trạng thái hiện tại?** Đã có test files chưa? Coverage hiện tại là bao nhiêu?

---

## Bước 2: Nạp Skill & Đọc Spec

1. Nạp `.agents/skills/test/SKILL.md` để có templates và patterns cụ thể.
2. Đọc lại logic nghiệp vụ liên quan trong `docs/business/business-rules.md` để xác định các boundary values và edge cases quan trọng.

---

## Bước 3: Viết / Cập Nhật Test Files

Ưu tiên theo thứ tự:
1. **Domain Engine pure functions** → Unit Tests (không cần mock, test trực tiếp)
2. **Service layer** → Integration Tests (mock PrismaService + HttpService)
3. **Controller layer** → Integration Tests (mock Service)
4. **FastAPI endpoints** → API Tests (TestClient)

Mỗi test function phải cover: Happy Path + Boundary Values + Error Cases.

---

## Bước 4: Chạy Test & Báo Cáo

```bash
# Backend — chạy và kiểm tra coverage
cd backend
npm run test:cov

# AI Service — chạy và kiểm tra coverage
cd ai-service
pytest --cov=src --cov-report=term-missing -v
```

Báo cáo kết quả:

```markdown
## Test Report — <Module Name>

### Kết quả
- Tests: X passed, Y failed, Z skipped
- Coverage: XX% (Domain Engine: XX%, Service: XX%, Controller: XX%)

### Failed Tests (nếu có)
- `<test name>`: [Nguyên nhân] → [Đã fix / Cần xem xét]

### Verdict
- ✅ PASS — sẵn sàng bàn giao
- ❌ FAIL — [action items]
```
