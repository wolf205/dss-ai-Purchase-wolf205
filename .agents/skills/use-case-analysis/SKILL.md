---
name: use-case-analysis
description: >-
  Hướng dẫn phân tích và đặc tả Use Cases theo chuẩn Actor-Goal cho DSS.
  Sử dụng khi xác định, đánh giá, phản biện hoặc viết chi tiết Use Cases.
---

# Use Case Analysis Skill

## 1. Mục Đích

Xác định và mô tả các **Use Case** của hệ thống dựa trên:

* `Business Problem`
* `Scope`
* `Actors`
* `Business Goals`
* `Core Workflow`

Mục tiêu là xác định rõ:

* **Ai** tương tác với hệ thống.
* **Người đó muốn đạt được điều gì.**
* **Hệ thống hỗ trợ mục tiêu đó như thế nào.**
* **Kết quả nghiệp vụ sau khi Use Case hoàn thành.**

---

## 2. Nguyên Tắc Cốt Lõi

Use Case phải được xác định dựa trên:

```text
Actor
   ↓
Goal
   ↓
System Interaction
   ↓
Business Outcome
```

Không xác định Use Case chỉ dựa trên:

* Tên màn hình.
* Tên menu.
* Tên API.
* CRUD operation.
* Database table.
* UI component.

---

## 3. Input

Trước khi phân tích Use Case, phải đọc:

* `business-problem.md`
* `scope.md`
* `project-decisions.md`

và các tài liệu business liên quan.

Không xây Use Case độc lập với Scope đã được xác nhận.

---

## 4. Quy Trình Phân Tích

Thực hiện theo thứ tự:

```text
Business Problem
      ↓
Scope
      ↓
Actors
      ↓
Actor Goals
      ↓
Core Business Workflow
      ↓
Candidate Use Cases
      ↓
Use Case Boundary
      ↓
Use Case Relationships
      ↓
Validation
      ↓
Documentation
```

---

## 5. Xác Định Actor

Actor là đối tượng bên ngoài hệ thống có tương tác với hệ thống để đạt được một mục tiêu.

Ưu tiên xác định:

* Ai thực sự sử dụng hệ thống?
* Ai khởi tạo tương tác?
* Ai nhận kết quả?
* Ai đưa ra quyết định?
* Actor có mục tiêu nghiệp vụ rõ ràng nào?

Không tự động biến mọi external entity thành Actor.

Ví dụ:

`Supplier` có thể là external business entity nhưng không nhất thiết là Use Case Actor nếu không trực tiếp tương tác với hệ thống trong phạm vi project.

---

## 6. Xác Định Goal

Mỗi Use Case phải có một **Goal** rõ ràng của Actor.

Goal phải trả lời:

> Actor muốn đạt được kết quả gì thông qua hệ thống?

Goal nên mang ý nghĩa nghiệp vụ.

Ví dụ:

* Theo dõi rủi ro tồn kho.
* Xem khuyến nghị mua hàng.
* Đánh giá phương án nhà cung cấp.
* Xác nhận tạo Purchase Order.

Không nên coi các thao tác nhỏ như:

* Click button.
* Mở modal.
* Nhập dữ liệu.
* Chọn filter.

là Goal độc lập.

---

## 7. Xác Định Use Case

Một Use Case nên đại diện cho một **mục tiêu có ý nghĩa của Actor**.

Test nhanh:

> Nếu bỏ Use Case này, Actor có mất khả năng hoàn thành một mục tiêu nghiệp vụ quan trọng không?

Nếu không, cần xem xét liệu nó chỉ là:

* Một bước trong Use Case khác.
* Một UI interaction.
* Một internal system action.
* Một technical implementation detail.

---

## 8. Không Đồng Nhất Screen Với Use Case

Không áp dụng quy tắc:

```text
1 Screen = 1 Use Case
```

Một Screen có thể:

* Hỗ trợ nhiều Use Case.
* Chứa các bước của một Use Case lớn hơn.

Một Use Case có thể:

* Đi qua nhiều Screen.
* Bao gồm nhiều bước tương tác.

Use Case phải được xác định theo **Actor Goal**, không theo UI structure.

---

## 9. Không Đồng Nhất CRUD Với Use Case

Không tự động tạo:

```text
Create Product
Read Product
Update Product
Delete Product
```

thành các Use Case nghiệp vụ riêng.

Nếu một hoạt động CRUD chỉ là cơ chế quản lý dữ liệu và không đại diện cho một Business Goal độc lập, cần xem xét gộp vào một Use Case nghiệp vụ phù hợp.

---

## 10. Xác Định Granularity

Use Case không nên:

* Quá lớn đến mức trở thành toàn bộ hệ thống.
* Quá nhỏ đến mức chỉ mô tả một thao tác UI.

Mức độ phù hợp:

```text
Actor
  ↓
Meaningful Business Goal
  ↓
Complete Interaction
  ↓
Meaningful Business Outcome
```

---

## 11. Core Và Supporting Use Case

### Core Use Case

Trực tiếp phục vụ Core Business Problem.

### Supporting Use Case

Hỗ trợ vận hành hoặc cung cấp dữ liệu cho Core Use Case.

### Utility / Technical Function

Các hoạt động kỹ thuật hoặc tiện ích không nhất thiết phải trở thành Business Use Case.

Khi phân loại, ưu tiên Core trước rồi mới xác định Supporting.

---

## 12. Use Case Relationship

Chỉ sử dụng quan hệ giữa các Use Case khi thực sự có ý nghĩa.

Có thể xem xét:

* `include`
* `extend`
* `generalization`

Không sử dụng quan hệ chỉ để làm sơ đồ phức tạp hơn.

Đặc biệt:

* `include` dùng khi một hành vi luôn cần được thực hiện trong Use Case khác.
* `extend` dùng khi hành vi bổ sung xảy ra trong một điều kiện cụ thể.
* Không dùng `include` chỉ vì một Use Case "có liên quan" đến Use Case khác.

---

## 13. AI Trong Use Case

AI không mặc định là một Actor.

Các hoạt động như:

* Demand Forecast
* Risk Detection
* Purchase Recommendation
* Supplier Recommendation

thường nên được xem là **system capability / processing** bên trong Use Case nếu không có một hệ thống AI bên ngoài thực sự tương tác với hệ thống.

Phải phân biệt:

```text
Actor
    ↓
System
    ├── AI Prediction
    ├── Business Calculation
    └── Recommendation
    ↓
Actor Decision
```

Không biến AI thành Actor chỉ vì hệ thống có thành phần AI.

---

## 14. Human-in-the-Loop

Đối với các Use Case liên quan đến Purchase Decision:

```text
System
→ Analyze
→ Predict
→ Recommend
→ Explain

Purchasing Staff
→ Review
→ Adjust
→ Approve
→ Decide
```

Use Case phải phản ánh rõ ranh giới này.

Không giả định:

* AI tự quyết định mua hàng.
* AI tự phê duyệt.
* AI tự tạo giao dịch mà không có quyền của Actor.

---

## 15. Validation

Mỗi Candidate Use Case phải được kiểm tra:

### Scope Consistency

Có nằm trong Scope không?

### Business Relevance

Có giải quyết Business Problem hoặc Core Workflow không?

### Actor Relevance

Có Actor cụ thể không?

### Goal Clarity

Goal có rõ ràng không?

### Outcome

Có kết quả nghiệp vụ xác định không?

### Granularity

Có quá lớn hoặc quá nhỏ không?

### Duplication

Có trùng hoặc chồng lấn với Use Case khác không?

---

## 16. Quy Tắc Trao Đổi Với Người Dùng

Trong quá trình xác định Use Case:

**Không tự động chốt danh sách Use Case.**

Agent phải:

1. Đề xuất Candidate Use Cases.
2. Giải thích lý do đưa từng Use Case vào.
3. Chỉ ra Use Case có thể gộp hoặc loại bỏ.
4. Phát hiện điểm chưa rõ.
5. Trao đổi với người dùng.
6. Cập nhật understanding.
7. Lặp lại cho đến khi danh sách ổn định.

---

## 17. Không Tạo Tài Liệu Quá Sớm

Trong giai đoạn thảo luận:

Có thể tạo:

* Candidate Use Case List
* Proposed
* Draft

Nhưng chưa coi đó là tài liệu chính thức.

Chỉ tạo hoặc cập nhật tài liệu chính thức sau khi:

* Actor đã rõ.
* Goal đã rõ.
* Use Case Boundary đã rõ.
* Các Use Case chính đã được xác nhận.
* Không còn mâu thuẫn quan trọng.
* Người dùng xác nhận understanding cuối cùng.

---

## 18. Output

Sau khi Use Case Overview được xác nhận, tạo:

```text
docs/business/use-case-overview.md
```

Tài liệu Overview chỉ nên tập trung vào:

* Actor.
* Use Case.
* Mục tiêu ngắn gọn.
* Quan hệ chính nếu cần.

Chi tiết từng Use Case được thực hiện ở bước tiếp theo.

---

## 19. Nguyên Tắc Cuối Cùng

Mục tiêu của Use Case Analysis không phải tạo ra **nhiều Use Case nhất**.

Mục tiêu là tạo ra **danh sách Use Case nhỏ gọn, rõ ràng và đủ để mô tả cách Actor đạt được các mục tiêu nghiệp vụ trong phạm vi hệ thống**.


## Use Case Detail

Sau khi Use Case Overview được xác nhận, phân tích từng Use Case.

### Use Case Detail phải xác định

- Actor
- Goal
- Trigger
- Preconditions
- Main Flow
- Alternative Flow
- Exception Flow
- Postconditions / Business Outcome
- Business Rules Involved

### Nguyên tắc

Use Case Detail mô tả **behavior của hệ thống từ góc nhìn Actor**.

Không đưa vào:

- API
- Database schema
- Framework
- Class
- Service
- UI implementation details

### Business Rules trong Use Case Detail

Có thể xác định và tham chiếu Business Rule trong quá trình detail.

Nhưng không biến Use Case Detail thành tài liệu Business Rules.

Ví dụ:

Main Flow:
1. System checks inventory status.
2. System identifies reorder candidates according to BR-001.

Không cần mô tả toàn bộ công thức BR-001 trong Main Flow.

Nếu quá trình detail một Use Case phát hiện mâu thuẫn
với Scope hoặc Use Case Overview đã được xác nhận,
không tự sửa tài liệu cũ.

Phải báo rõ:
- Conflict
- Tác động
- Phương án đề xuất

và chờ người dùng chốt trước khi cập nhật.

---

## 20. Tài Liệu Tham Chiếu

Khi cần tìm hiểu sâu hơn về tiêu chuẩn và ranh giới Use Case, hãy tham khảo:

* [use-case-definition.md](references/use-case-definition.md): Khái niệm cốt lõi và tiêu chuẩn của một Use Case có ý nghĩa.
* [actor-and-goal.md](references/actor-and-goal.md): Hướng dẫn xác định Actor và phân biệt Business Goal với thao tác UI.
* [use-case-boundary.md](references/use-case-boundary.md): Phân biệt phạm vi Use Case với các bước xử lý thuật toán/xử lý ngầm (internal processing).