---
name: scope-analysis
description: >-
  Hướng dẫn phân tích và xác định System Scope cho DSS.
  Sử dụng khi thảo luận, xác định ranh giới hệ thống, In-Scope / Out-of-Scope.
---

# Scope Analysis Skill

## 1. Mục Đích

Xác định **System Scope** dựa trên Business Problem đã được xác nhận.

Mục tiêu là làm rõ:

* Hệ thống cần giải quyết vấn đề nào.
* Hệ thống cần cung cấp những năng lực nào.
* Ranh giới của hệ thống nằm ở đâu.
* Những nội dung nào cố ý không đưa vào project.

---

## 2. Quy Trình Phân Tích

Phân tích theo thứ tự:

```text
Business Problem
      ↓
Business Objective
      ↓
Core Decision / Workflow
      ↓
Necessary Capabilities
      ↓
Actors
      ↓
System Boundary
      ↓
In-Scope
      ↓
Out-of-Scope
```

---

## 3. Nguyên Tắc Xác Định Scope

Một Capability chỉ nên nằm trong Scope khi:

* Nó trực tiếp giải quyết Business Problem; hoặc
* Nó cần thiết cho Core Workflow.

Đặt câu hỏi:

> Nếu bỏ Capability này, hệ thống có còn giải quyết được Core Business Problem không?

Nếu câu trả lời là "Có", cần xem xét lại việc đưa Capability đó vào Scope.

---

## 4. Phân Loại Scope

### Core

Bắt buộc để giải quyết Business Problem.

### Supporting

Cần thiết để vận hành hoặc hỗ trợ Core Workflow.

### Optional

Có ích nhưng không bắt buộc.

### Out-of-Scope

Không cần thiết hoặc được loại bỏ để kiểm soát độ phức tạp.

---

## 5. Business Scope Không Phải Technical Scope

Scope nên mô tả Capability nghiệp vụ.

Ví dụ:

**Đúng:**

* Monitor Inventory Risk
* Forecast Demand
* Generate Purchase Recommendation
* Compare Suppliers
* Explain Recommendation

**Không nên viết trong Scope:**

* React Dashboard
* REST API
* PostgreSQL
* Docker
* Prophet
* LightGBM

Các nội dung này thuộc Technical Design.

---

## 6. AI Scope

Mỗi AI capability phải phân biệt:

```text
AI Prediction / Recommendation
        ↓
Business Calculation
        ↓
Human Review
        ↓
Human Decision
```

Không tự động giả định:

* Autonomous Purchasing
* Autonomous Approval
* Autonomous Supplier Selection

---

## 7. Complexity Control

Nếu hai phương án đều giải quyết được Business Problem:

> Ưu tiên phương án đơn giản hơn.

Không mở rộng Scope chỉ vì một chức năng có thể triển khai về mặt kỹ thuật.

---

## 8. Tài Liệu Tham Chiếu

Khi cần tham khảo chi tiết nguyên tắc xác định phạm vi hoặc ranh giới DSS, hãy tham khảo:

* [scope-definition.md](references/scope-definition.md): Chi tiết định nghĩa System Scope chuẩn mực và tiêu chí đánh giá Scope tốt.
* [project-boundary.md](references/project-boundary.md): Ranh giới trách nhiệm giữa System vs Human và kiểm soát phạm vi đồ án.

