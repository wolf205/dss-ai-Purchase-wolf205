---
name: backend
description: >-
  Hướng dẫn lập trình NestJS Modular Monolith: tạo module mới, viết Controller/Service/DTO/Domain Engine,
  cấu hình Guards (JwtAuthGuard, RolesGuard), AuditLogInterceptor, AllExceptionsFilter,
  Prisma ORM queries, Tier 3 ACID Transactions (UC-01/UC-03/UC-04), Graceful Fallback sang Python AI Service,
  tích hợp Gemini Flash On-demand. Sử dụng khi implement bất kỳ feature backend nào trong thư mục backend/src/.
---

# Backend Skill — NestJS Modular Monolith

## 1. Directory Map (9 Modules)

```
backend/
├── prisma/
│   ├── schema.prisma          # 16 tables — khớp data-model.md
│   ├── migrations/            # Lịch sử migration vật lý
│   └── seed.ts                # Seed: users, categories, dss_configurations
├── src/
│   ├── common/
│   │   ├── filters/           # AllExceptionsFilter
│   │   ├── guards/            # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/      # AuditLogInterceptor, TransformInterceptor
│   │   ├── decorators/        # @Roles(), @CurrentUser()
│   │   └── enums/             # Role enum (STORE_MANAGER, PURCHASING_STAFF)
│   ├── modules/
│   │   ├── auth/              # Login, Refresh Token Rotation, Cookie HttpOnly
│   │   ├── catalog/           # UC-05: categories, products (CRUD + Soft Deactivate)
│   │   ├── suppliers/         # UC-06: suppliers, supply_conditions, OTIF tracking
│   │   ├── dss/               # UC-01, UC-07: sessions, calc engine, LLM on-demand
│   │   │   └── engines/       # DssCalculationEngineService (pure functions)
│   │   ├── purchase-orders/   # UC-02: PO lifecycle, export PDF/Excel, cancel + on-order reversal
│   │   ├── goods-receipts/    # UC-03: nhận hàng, OTIF calc, stock update
│   │   ├── data-import/       # UC-04: sales/inventory file import, All-or-Nothing
│   │   ├── configuration/     # UC-07: dss_configurations singleton
│   │   ├── audit/             # AuditLogInterceptor (Append-Only activity_logs)
│   │   └── prisma/            # PrismaModule & PrismaService
│   ├── app.module.ts
│   └── main.ts
```

## 2. Module Scaffold Template

```typescript
// src/modules/<name>/<name>.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [<Name>Controller],
  providers: [<Name>Service],
  exports: [<Name>Service],
})
export class <Name>Module {}
```

```typescript
// src/modules/<name>/<name>.controller.ts
@Controller('api/v1/<resource>')
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
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException
      ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse: any = exception instanceof HttpException
      ? exception.getResponse() : null;
    response.status(status).json({
      success: false,
      error: {
        code: exceptionResponse?.code || 'INTERNAL_SERVER_ERROR',
        message: Array.isArray(exceptionResponse?.message)
          ? exceptionResponse.message[0] : (exceptionResponse?.message || (exception as any).message),
        details: exceptionResponse?.details || [],
        timestamp: new Date().toISOString(),
        path: ctx.getRequest().url,
      },
    });
  }
}
```

## 4. Tier 3 Transaction Patterns

```typescript
// UC-01: Approve DSS Session — INV-24,25,26,27
await this.prisma.$transaction(async (tx) => {
  // 1. Chốt session
  await tx.recommendationSession.update({
    where: { id: sessionId },
    data: { status: 'Approved', approvedBy: username, approvedAt: new Date() },
  });
  // 2. Cập nhật approved_quantity + approved_supplier_id cho từng item
  for (const item of approvedItems) {
    await tx.recommendationItem.update({
      where: { id: item.id },
      data: { approvedQuantity: item.approvedQuantity, approvedSupplierId: item.approvedSupplierId },
    });
  }
  // 3. Tạo POs gom theo NCC + snapshot historical fields
  for (const group of groupedBySupplier) {
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber: generatePoNumber(),
        sessionId,
        supplierId: group.supplierId,
        status: 'Approved',
        expectedDeliveryDate: addDays(new Date(), group.committedLeadTimeDays),
      }
    });
    for (const item of group.items) {
      await tx.poLineItem.create({
        data: {
          purchaseOrderId: po.id,
          productId: item.productId,
          orderedQuantity: item.approvedQuantity,
          historicalUnitPrice: item.unitPrice,   // snapshot — không JOIN lại
          historicalMoq: item.moq,
          historicalLeadTimeDays: item.leadTimeDays,
        }
      });
    }
    // on_order_quantity tăng — xử lý tại Application Layer (không dùng DB Trigger)
    await tx.product.updateMany({
      where: { id: { in: group.items.map(i => i.productId) } },
      data: { onOrderQuantity: { increment: ... } },
    });
  }
});

// UC-04: All-or-Nothing Import — INV-14,22,23
// Validate 100% in-memory TRƯỚC khi mở transaction
if (errors.length > 0) throw new BadRequestException({ code: 'ALL_OR_NOTHING_IMPORT_FAILED', details: errors });
await this.prisma.$transaction(async (tx) => {
  await tx.salesRecord.deleteMany({ where: { saleDate: { in: duplicateDates } } });
  await tx.salesRecord.createMany({ data: validatedRows });
});
```

## 5. Graceful Fallback sang Python AI Service

```typescript
// DssService — gọi AI Service với timeout 3 giây
async getForecast(payload: ForecastPayload): Promise<ForecastResult> {
  try {
    const response = await firstValueFrom(
      this.httpService.post<ForecastResult>(
        `${this.configService.get('AI_SERVICE_URL')}/api/v1/forecast`,
        payload,
        { timeout: 3000 },
      )
    );
    return { ...response.data, isFallback: false };
  } catch (error) {
    this.logger.warn('AI Service unavailable, falling back to SQL SMA');
    const smaResult = await this.calculateSqlMovingAverage(payload);
    return { ...smaResult, isFallback: true };
  }
}
```

## 6. Gemini Flash — On-Demand Explain (UC-01 only)

```typescript
// POST /api/v1/dss/items/{itemId}/explain
async explainItem(itemId: number): Promise<string> {
  const item = await this.prisma.recommendationItem.findUniqueOrThrow({ where: { id: itemId } });
  // Cache hit
  if (item.whyBuyExplanation) return item.whyBuyExplanation;
  // Call Gemini
  const prompt = buildExplainPrompt(item); // inject quantitative data
  try {
    const result = await this.geminiClient.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });
    const explanation = result.text;
    await this.prisma.recommendationItem.update({
      where: { id: itemId },
      data: { whyBuyExplanation: explanation },
    });
    return explanation;
  } catch {
    return buildFallbackExplanation(item); // text tất định an toàn
  }
}
```

## 7. Common Commands

```bash
# Trong thư mục backend/
npm run start:dev                                        # Dev server hot reload
npx tsc --noEmit                                        # TypeScript type check
npm run lint                                             # ESLint
npm run test                                             # Jest tests
npm run test:cov                                         # Tests + coverage
npx prisma migrate dev --name <migration_name>           # Tạo migration mới
npx prisma db seed                                       # Nạp seed data
npx prisma studio                                        # GUI xem DB
```
