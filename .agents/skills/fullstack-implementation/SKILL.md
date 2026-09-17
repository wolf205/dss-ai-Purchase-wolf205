---
name: fullstack-implementation
description: >-
  Hướng dẫn lập trình Full-stack (NestJS Modular Monolith, Python FastAPI AI Service, React+Vite UI, PostgreSQL 16+ Prisma ORM, Docker Compose) cho hệ thống DSS bán lẻ.
  Sử dụng khi lập trình, scaffolding dự án, xây dựng API, viết logic DSS, hoặc debug lỗi mã nguồn.
---

# Full-Stack Implementation Skill

## 1. Mục Đích & Vai Trò

Skill này cung cấp các hướng dẫn kỹ thuật thực chiến, mẫu cấu trúc mã nguồn (Code Templates) và quy chuẩn lập trình để triển khai hệ thống **AI-Powered Purchase Decision Support System for a Single Retail Store** theo đúng kiến trúc Polyglot Decoupled đã chốt.

Áp dụng trong chuỗi kỹ thuật:
```text
Business Problem → Scope → Use Cases → Business Rules → Domain Model → Data Model → Architecture → [Implementation]
```

---

## 2. Bản Đồ Thư Mục Monorepo Chuẩn

Hệ thống được tổ chức thành 3 ứng dụng độc lập trong thư mục gốc:

```text
dss-ai-Purchase-wolf205/
├── backend/                  # NestJS Modular Monolith (TypeScript, Port 3000)
│   ├── prisma/
│   │   ├── schema.prisma     # 16 bảng CSDL chuẩn khớp data-model.md
│   │   ├── migrations/       # Lịch sử migration vật lý
│   │   └── seed.ts           # Nạp tài khoản mẫu, danh mục, DSS config ban đầu
│   ├── src/
│   │   ├── common/           # DTOs dùng chung, Decorators, Filters, Interceptors
│   │   │   ├── filters/      # AllExceptionsFilter (Standard API Envelope)
│   │   │   ├── guards/       # JwtAuthGuard, RolesGuard
│   │   │   └── interceptors/ # AuditLogInterceptor, TransformInterceptor
│   │   ├── database/         # PrismaModule & PrismaService
│   │   └── modules/          # 9 Modules nghiệp vụ chuẩn hóa
│   │       ├── auth/         # Login, Refresh Token Rotation, Cookie
│   │       ├── catalog/      # UC-05: Products, Categories
│   │       ├── suppliers/    # UC-06: Suppliers, Supply Conditions, OTIF
│   │       ├── dss/          # UC-01, UC-07: DSS Sessions, Calculation, LLM
│   │       ├── orders/       # UC-02: Purchase Orders, PDF Export
│   │       ├── receipts/     # UC-03: Goods Receipts, Stock & OTIF update
│   │       ├── import/       # UC-04: Data Import (Sales & Inventory)
│   │       ├── config/       # UC-07: DSS Configuration singleton
│   │       └── audit/        # Activity logs
│   └── package.json
│
├── ai-service/               # Python AI Forecasting Service (FastAPI, Port 8000)
│   ├── src/
│   │   ├── api/              # Routers (POST /api/v1/forecast)
│   │   ├── models/           # Pydantic schemas (TimeSeriesPayload, ForecastResponse)
│   │   ├── services/         # Thuật toán: Croston, AutoARIMA, Holt-Winters, Moving Average
│   │   └── main.py           # FastAPI entrypoint
│   ├── requirements.txt      # fastapi, uvicorn, statsforecast, pydantic, numpy, pandas
│   └── Dockerfile
│
├── frontend/                 # React SPA (Vite + TypeScript, Port 5173)
│   ├── src/
│   │   ├── components/       # UI Primitives: Button, Table, Modal, Input, Badge, Toast
│   │   ├── features/         # 7 Use Cases features
│   │   │   ├── auth/         # Login page, AuthContext, ProtectedRoute
│   │   │   ├── dss-review/   # UC-01: Recommendation table, ABC-XYZ badges, Explain modal, Recharts
│   │   │   ├── orders/       # UC-02: PO List, Cancel PO, Export view
│   │   │   ├── receipts/     # UC-03: Goods receipt form, Over-delivery warning
│   │   │   ├── data-import/  # UC-04: File drag-drop, Error details table
│   │   │   ├── catalog/      # UC-05: Product table, Add/Edit modal, Category filter
│   │   │   ├── suppliers/    # UC-06: Supplier list, SKU pricing, OTIF 5-order badge
│   │   │   └── config/       # UC-07: DSS weights slider, Service Level slider
│   │   ├── services/api/     # Axios client, Interceptor tự động Refresh Token
│   │   └── hooks/            # TanStack Query custom hooks
│   └── package.json
│
├── docker-compose.yml        # Orchestration (postgres 16, backend, ai-service, frontend)
└── docs/                     # Nguồn sự thật tài liệu kỹ thuật & nghiệp vụ
```

---

## 3. Mẫu Code Chuẩn (Implementation Templates)

### 3.1. Standard API Envelope Filter (NestJS)
```typescript
// backend/src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException 
      ? exception.getStatus() 
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any = exception instanceof HttpException 
      ? exception.getResponse() 
      : null;

    const errorCode = exceptionResponse?.code || 'INTERNAL_SERVER_ERROR';
    const message = exceptionResponse?.message || (exception as any).message || 'Đã có lỗi xảy ra';
    const details = exceptionResponse?.details || [];

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: Array.isArray(message) ? message[0] : message,
        details: Array.isArray(details) ? details : [details],
      },
    });
  }
}
```

### 3.2. Tier 3 ACID Transaction Pattern (NestJS Service)
```typescript
// Ví dụ bọc transaction cho UC-01 Approve Recommendations
await this.prisma.$transaction(async (tx) => {
  // 1. Cập nhật Session -> Approved
  await tx.recommendationSession.update({
    where: { id: sessionId },
    data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
  });

  // 2. Chốt từng Line Item & Sinh đơn PO gom theo từng Nhà cung cấp
  for (const group of groupedBySupplier) {
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber: generatePoNumber(),
        supplierId: group.supplierId,
        status: 'APPROVED',
        totalAmount: group.totalAmount,
        createdBy: userId,
        lineItems: {
          create: group.items.map(item => ({
            productId: item.productId,
            orderQuantity: item.approvedQuantity,
            unitPrice: item.unitPrice,
            lineTotal: item.approvedQuantity * item.unitPrice,
          })),
        },
      },
    });

    // 3. Trigger vật lý hoặc cập nhật trực tiếp On-order
    for (const item of group.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { onOrderQuantity: { increment: item.approvedQuantity } },
      });
    }
  }
});
```

---

## 4. Các Lệnh Thường Dùng Khi Kiểm Thử & Chạy Mã Nguồn

| Mục đích | Thư mục | Lệnh thực thi |
| :--- | :--- | :--- |
| **Dựng CSDL PostgreSQL** | Thư mục gốc | `docker compose up -d postgres` |
| **Chạy Prisma Migration** | `backend/` | `npx prisma migrate dev --name init` |
| **Nạp Seed Data** | `backend/` | `npx prisma db seed` |
| **Chạy Backend Dev** | `backend/` | `npm run start:dev` |
| **Kiểm tra TypeScript Backend** | `backend/` | `npx tsc --noEmit` |
| **Cài đặt Python dependencies** | `ai-service/` | `pip install -r requirements.txt` |
| **Chạy AI Service Dev** | `ai-service/` | `uvicorn src.main:app --reload --port 8000` |
| **Chạy Frontend Dev** | `frontend/` | `npm run dev` |
