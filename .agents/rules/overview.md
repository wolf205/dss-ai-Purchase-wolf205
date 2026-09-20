---
trigger: model_decision
description: >-
  Đọc khi bắt đầu một task mới chưa rõ hướng, khi cần xác định task thuộc
  Use Case nào, hoặc khi cần nhắc lại các ràng buộc cốt lõi của project.
---

# Overview — Định Hướng & Nguyên Tắc Cốt Lõi

## 1. 5 Bài Toán Mua Hàng Cốt Lõi (Scope Anchor)

Mọi task phải phục vụ trực tiếp hoặc gián tiếp một trong 5 bài toán:

| Bài toán | Use Cases liên quan |
|---|---|
| **What to Buy** — SKU nào rủi ro thiếu hụt? | UC-01, UC-04, UC-05 |
| **When to Buy** — Khi nào nên đặt hàng? | UC-01, UC-07 |
| **How Much** — Số lượng tối ưu? | UC-01, UC-07 |
| **Which Supplier** — NCC nào tốt nhất? | UC-01, UC-06 |
| **Why** — Lý do minh bạch để con người quyết định | UC-01 (LLM On-demand) |

## 2. Phân Tách 3 Tầng Xử Lý (Ranh Giới Không Được Gộp)

| Tầng | Bản chất | Ví dụ |
|---|---|---|
| **AI Layer** | Xác suất, dự báo | Demand Forecast, Trend detection |
| **Business Calc** | Tất định, công thức cố định | SS, ROP, SOQ, ABC-XYZ, WSM Score |
| **Human Decision** | Thẩm định & phê duyệt cuối cùng | Review đề xuất, chỉnh số lượng, approve PO |

> Không gộp 3 tầng này. Không tự động hóa tầng Human Decision.

## 3. Quy Tắc Scope Creep (Phòng Vệ)

- Chỉ implement đúng 7 UC đã chốt — không tự thêm feature mới dù "hợp lý".
- Không thêm công nghệ mới ngoài: NestJS · FastAPI · React+Vite · PostgreSQL 16 · Docker Compose.
- Phát hiện yêu cầu ngoài scope → thông báo rõ, đề xuất cách xử lý minimal, chờ xác nhận.

## 4. Feedback Loop (Khi Phát Hiện Mâu Thuẫn)

```
Phát hiện mâu thuẫn Spec vs thực tế
    ↓
Dừng coding
    ↓
Báo cáo: mâu thuẫn ở đâu, ảnh hưởng gì
    ↓
Đề xuất phương án (Option A vs B với khuyến nghị rõ)
    ↓
Chờ người dùng quyết định → tiếp tục
```
