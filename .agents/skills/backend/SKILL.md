---
name: backend
description: >-
  Hướng dẫn lập trình NestJS Modular Monolith: tạo module mới, viết Controller/Service/DTO,
  cấu hình Guards (JwtAuthGuard, RolesGuard), Interceptors (AuditLog), Filters (AllExceptions),
  Prisma ORM queries, ACID Transactions cho UC-01/UC-03/UC-04, Graceful Fallback sang Python AI Service.
  Sử dụng khi implement bất kỳ feature backend nào trong thư mục backend/src/.
---

# Backend Skill — NestJS Modular Monolith

## 1. Monorepo Map

```
backend/
├── prisma/
│   ├── schema.prisma          # 16 tables — khớp data-model.md
│   ├── migrations/            # Lịch sử migration vật lý
│   └── seed.ts                # Seed: users, categories, dss_config
├── src/
│   ├── common/
│   │   ├── filters/           # AllExceptionsFilter
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/      # AuditLogInterceptor, TransformInterceptor
│   │   ├── decorators/        # @Roles(), @CurrentUser()
│   │   └── enums/             # Role enum
│   ├── modules/
│   │   ├── auth/              # Login, Refresh Token Rotation, Cookie
│   │   ├── users/             # User management (MANAGER only)
│   │   ├── catalog/           # UC-05: Products, Categories
│   │   ├── suppliers/         # UC-06: Suppliers, Supply Conditions, OTIF
│   │   ├── dss/               # UC-01, UC-07: DSS Sessions, Calc Engine, LLM
│   │   ├── orders/            # UC-02: Purchase Orders
│   │   ├── receipts/          # UC-03: Goods Receipts, Stock update
│   │   ├── import/            # UC-04: Sales & Inventory Data Import
│   │   ├── config/            # UC-07: DSS Configuration singleton
│   │   ├── audit/             # Activity logs (Append-Only)
│   │   ├── health/            # Health check endpoint
│   │   └── prisma/            # PrismaModule & PrismaService
│   ├── app.module.ts
│   └── main.ts
```

## 2. Module Scaffold Template

```typescript
// src/modules/<name>/<name>.module.ts
import { Module } from '@nestjs/common';
import { <Name>Controller } from './<name>.controller';
import { <Name>Service } from './<name>.service';

@Module({
  imports: [],
  controllers: [<Name>Controller],
  providers: [<Name>Service],
  exports: [<Name>Service],
})
export class <Name>Module {}
```

```typescript
// src/modules/<name>/<name>.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { <Name>Service } from './<name>.service';
import { Create<Name>Dto } from './dto/create-<name>.dto';

@Controller('api/v1/<name>')
@UseGuards(JwtAuthGuard, RolesGuard)
export class <Name>Controller {
  constructor(private readonly <name>Service: <Name>Service) {}

  @Post()
  @Roles(Role.STORE_MANAGER)
  async create(@Body() dto: Create<Name>Dto) {
    const data = await this.<name>Service.create(dto);
    return { success: true, data, meta: { timestamp: new Date().toISOString() } };
  }
}
```

## 3. AllExceptionsFilter Template

```typescript
// src/common/filters/all-exceptions.filter.ts
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
      ? exception.getResponse() : null;

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

## 4. Tier 3 Transaction Pattern

```typescript
// UC-01: Approve DSS Session
await this.prisma.$transaction(async (tx) => {
  // 1. Chốt session
  await tx.recommendationSession.update({
    where: { id: sessionId },
    data: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
  });
  // 2. Sinh POs gom theo NCC
  for (const group of groupedBySupplier) {
    const po = await tx.purchaseOrder.create({ data: { ... } });
    // 3. Cập nhật on_order_quantity
    for (const item of group.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { onOrderQuantity: { increment: item.approvedQuantity } },
      });
    }
  }
});

// UC-04: All-or-Nothing Import
await this.prisma.$transaction(async (tx) => {
  // Validate trước (ngoài transaction) → throw nếu lỗi
  // Xóa dữ liệu ngày cũ trùng lặp
  await tx.dailySales.deleteMany({ where: { saleDate: { in: dates } } });
  // Insert batch mới
  await tx.dailySales.createMany({ data: validatedRows });
});
```

## 5. Graceful Fallback sang Python AI Service

```typescript
// Trong DssService
async getForecast(payload: ForecastPayload): Promise<ForecastResult> {
  try {
    const response = await firstValueFrom(
      this.httpService.post<ForecastResult>(
        `${this.configService.get('AI_SERVICE_URL')}/api/v1/forecast`,
        payload,
        { timeout: 3000 },
      )
    );
    return { ...response.data, is_fallback: false };
  } catch (error) {
    this.logger.warn('AI Service unavailable, falling back to SMA');
    const smaResult = await this.calculateSimpleMovingAverage(payload.skuIds);
    return { ...smaResult, is_fallback: true };
  }
}
```

## 6. Common Commands

```bash
# Trong thư mục backend/
npm run start:dev           # Dev server với hot reload
npx tsc --noEmit            # TypeScript type check
npm run lint                # ESLint
npm run test                # Jest tests
npm run test:cov            # Tests + coverage
npx prisma migrate dev --name <migration_name>   # Tạo migration mới
npx prisma db seed          # Nạp seed data
npx prisma studio           # GUI xem DB
```
