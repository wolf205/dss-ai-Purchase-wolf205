import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DssCalculationEngineService } from './dss-calculation-engine.service';
import { AiForecastingClient } from '../clients/ai-forecasting.client';
import { AnalyzeSessionRequestDto } from '../dto/analyze-session.dto';
import { AnalyzeSessionResponseDto } from '../dto/analyze-session-response.dto';
import {
  SkuSalesMetricsInput,
  SupplierCandidateInput,
} from '../interfaces/dss-calculation.interface';
import {
  SkuForecastInput,
  SkuSalesHistoryItem,
} from '../interfaces/ai-forecasting.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class DssSessionAnalysisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiForecastingClient: AiForecastingClient,
    private readonly calcEngine: DssCalculationEngineService,
  ) {}

  /**
   * Khởi tạo và thực thi chuỗi phân tích đề xuất mua hàng DSS (UC-01 - Bước 2)
   * POST /api/v1/dss/sessions/analyze
   */
  async analyzeSession(
    dto: AnalyzeSessionRequestDto,
    username: string,
  ): Promise<AnalyzeSessionResponseDto> {
    // 1. Kiểm tra Category nếu được chỉ định
    let scope = 'All Categories';
    let targetCategoryId: bigint | undefined;

    if (dto.categoryId) {
      targetCategoryId = BigInt(dto.categoryId);
      const category = await this.prisma.category.findUnique({
        where: { id: targetCategoryId },
      });
      if (!category) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: `Không tìm thấy ngành hàng với ID ${dto.categoryId}`,
        });
      }
      scope = category.categoryName;
    }

    // 2. Tự động chuyển các phiên Draft cũ sang Discarded (INV-REC-03)
    await this.prisma.recommendationSession.updateMany({
      where: { status: 'Draft' },
      data: { status: 'Discarded' },
    });

    // 3. Đọc cấu hình tham số DSS (UC-07)
    const dssConfig = await this.prisma.dSSConfiguration.findFirst({
      where: { id: 1 },
    });

    const wsmWeights = {
      priceWeight: Number(dssConfig?.priceWeight ?? 0.4),
      leadTimeWeight: Number(dssConfig?.leadTimeWeight ?? 0.2),
      moqWeight: Number(dssConfig?.moqWeight ?? 0.15),
      historyWeight: Number(dssConfig?.historyWeight ?? 0.25),
    };
    const targetServiceLevel = Number(dssConfig?.targetServiceLevel ?? 0.95);
    const zFactor = Number(dssConfig?.zFactor ?? 1.65);
    const reviewPeriodDays = dssConfig?.reviewPeriodDays ?? 7;

    // 4. Lấy danh sách SKU Active trong phạm vi phân tích
    const productWhere: Prisma.ProductWhereInput = {
      status: 'Active',
      ...(targetCategoryId ? { categoryId: targetCategoryId } : {}),
    };

    const products = await this.prisma.product.findMany({
      where: productWhere,
      include: {
        category: true,
        supplyConditions: {
          where: { status: 'Active' },
          include: { supplier: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    if (products.length === 0) {
      throw new BadRequestException({
        code: 'NO_ACTIVE_PRODUCTS',
        message:
          'Không tìm thấy SKU nào ở trạng thái Active trong phạm vi phân tích',
      });
    }

    const productIds = products.map((p) => p.id);

    // 5. Lấy và tổng hợp toàn bộ lịch sử bán hàng tính đến thời điểm phân tích
    const effectiveDate = dto.asOfDate ? new Date(dto.asOfDate) : new Date();
    const salesDateFilter: Prisma.DateTimeFilter | undefined = dto.asOfDate
      ? {
          lt: new Date(
            Date.UTC(
              effectiveDate.getUTCFullYear(),
              effectiveDate.getUTCMonth(),
              effectiveDate.getUTCDate(),
            ),
          ),
        }
      : undefined;

    const salesRecords = await this.prisma.salesRecord.findMany({
      where: {
        productId: { in: productIds },
        ...(salesDateFilter ? { saleDate: salesDateFilter } : {}),
      },
      orderBy: { saleDate: 'asc' },
    });

    const salesByProduct = this.aggregateSalesRecords(products, salesRecords);

    // 5b. Thu thập các ngày tồn kho kiểm đếm = 0 trong toàn bộ lịch sử (Stockout Uncensoring)
    const stockoutSnapshots = await (this.prisma.inventorySnapshot?.findMany?.({
      where: {
        productId: { in: productIds },
        ...(salesDateFilter ? { snapshotDate: salesDateFilter } : {}),
        countedQuantity: 0,
      },
      select: {
        productId: true,
        snapshotDate: true,
      },
    }) ?? Promise.resolve([]));

    const stockoutDatesByProduct = new Map<string, string[]>();
    for (const snap of stockoutSnapshots) {
      const pKey = snap.productId.toString();
      const dStr = snap.snapshotDate.toISOString().split('T')[0];
      const existing = stockoutDatesByProduct.get(pKey) ?? [];
      existing.push(dStr);
      stockoutDatesByProduct.set(pKey, existing);
    }

    // Xác định mốc ngày bắt đầu (ngày bán sớm nhất thực tế) và ngày kết thúc của toàn bộ chuỗi lịch sử
    const historyEndDate = new Date(effectiveDate);
    historyEndDate.setUTCDate(historyEndDate.getUTCDate() - 1);
    const defaultEndDateStr = historyEndDate.toISOString().split('T')[0];

    const latestSaleDateStr =
      salesRecords.length > 0
        ? salesRecords[salesRecords.length - 1].saleDate
            .toISOString()
            .split('T')[0]
        : null;
    const historyEndDateStr =
      !dto.asOfDate &&
      latestSaleDateStr &&
      latestSaleDateStr > defaultEndDateStr
        ? latestSaleDateStr
        : defaultEndDateStr;

    const fallbackStartDate = new Date(effectiveDate);
    fallbackStartDate.setUTCDate(fallbackStartDate.getUTCDate() - 90);
    const historyStartDateStr =
      salesRecords.length > 0
        ? salesRecords[0].saleDate.toISOString().split('T')[0]
        : fallbackStartDate.toISOString().split('T')[0];

    const historyStartMs = new Date(`${historyStartDateStr}T00:00:00.000Z`).getTime();
    const historyEndMs = new Date(`${historyEndDateStr}T00:00:00.000Z`).getTime();
    const historyDays = Math.max(
      1,
      Math.round((historyEndMs - historyStartMs) / (1000 * 60 * 60 * 24)) + 1,
    );

    // 6. Lấy dự báo nhu cầu từ AI Client (kèm SMA fallback)
    const forecastInputs: SkuForecastInput[] = products.map((p) => {
      const sales = salesByProduct.get(p.id.toString())!;
      const records = [...sales.records];

      // Đảm bảo chuỗi có neo ngày bắt đầu và ngày kết thúc lịch sử để AI service xác định đúng chu kỳ
      if (
        records.length === 0 ||
        records[records.length - 1].date < historyEndDateStr
      ) {
        records.push({ date: historyEndDateStr, quantity: 0 });
      }
      if (records[0].date > historyStartDateStr) {
        records.unshift({ date: historyStartDateStr, quantity: 0 });
      }

      const stockoutDates = stockoutDatesByProduct.get(p.id.toString());
      return {
        productId: p.id,
        history: records,
        categoryCode: p.category?.categoryCode,
        ...(stockoutDates && stockoutDates.length > 0 ? { stockoutDates } : {}),
      };
    });

    const forecastMap =
      await this.aiForecastingClient.getForecasts(forecastInputs);

    // 7. Chạy 5A.1: Phân loại ma trận ABC - XYZ
    const abcXyzInputs: SkuSalesMetricsInput[] = products.map((p) => {
      const sales = salesByProduct.get(p.id.toString())!;
      const forecast = forecastMap.get(p.id.toString());
      const avgDemand = forecast
        ? forecast.dailyAverage
        : sales.totalQty / historyDays;
      const demandStd = forecast ? forecast.dailyDemandStd : 0;

      return {
        productId: p.id,
        skuCode: p.skuCode,
        totalRevenue: sales.totalRevenue,
        avgDailyDemand: avgDemand,
        demandStdDev: demandStd,
        salesDaysCount: sales.distinctDates.size,
      };
    });

    const abcXyzResults = this.calcEngine.classifyAbcXyz(abcXyzInputs);
    const abcMap = new Map<string, (typeof abcXyzResults)[0]>();
    for (const res of abcXyzResults) {
      abcMap.set(res.productId.toString(), res);
    }

    // 8. Chạy các engine còn lại (WSM, SS, ROP & SOQ, StockRisk) cho từng SKU
    let totalSuggestedAmount = 0;
    let suggestedOrderCount = 0;

    const itemsToCreate: Prisma.RecommendationItemCreateManySessionInput[] = [];

    for (const product of products) {
      const pIdStr = product.id.toString();
      const sales = salesByProduct.get(pIdStr)!;
      const forecast = forecastMap.get(pIdStr)!;
      const abcRes = abcMap.get(pIdStr)!;

      // 8a. Lọc NCC hợp lệ và xếp hạng WSM (5A.4)
      const validCandidates: SupplierCandidateInput[] = product.supplyConditions
        .filter((sc) => sc.supplier && sc.supplier.status === 'Active')
        .map((sc) => ({
          supplierId: sc.supplierId,
          supplierCode: sc.supplier.supplierCode,
          supplierName: sc.supplier.supplierName,
          purchasePrice: Number(sc.purchasePrice),
          committedLeadTimeDays: sc.supplier.committedLeadTimeDays,
          moq: sc.moq,
          performanceScore: Number(sc.supplier.performanceScore),
          completedOrderCount: sc.supplier.completedOrderCount,
        }));

      const wsmResult = this.calcEngine.rankSuppliersWsm(
        validCandidates,
        wsmWeights,
      );
      const suggestedSupplier = wsmResult.suggestedSupplier;

      const leadTime = suggestedSupplier
        ? suggestedSupplier.committedLeadTimeDays
        : 1;
      const moq = suggestedSupplier ? suggestedSupplier.moq : 1;
      const unitPrice = suggestedSupplier ? suggestedSupplier.purchasePrice : 0;

      // 8b. Tính Tồn kho an toàn Safety Stock (5A.2)
      const ssResult = this.calcEngine.calculateSafetyStock({
        avgDailyDemand: forecast.dailyAverage,
        demandStdDev: forecast.dailyDemandStd,
        leadTimeDays: leadTime,
        salesDaysCount: sales.distinctDates.size,
        targetServiceLevel,
        zFactor,
      });

      // 8c. Tính ROP & SOQ (5A.3)
      const ropSoqResult = this.calcEngine.calculateRopAndSoq({
        forecastedDemand: forecast.dailyAverage,
        leadTimeDays: leadTime,
        safetyStock: ssResult.safetyStock,
        currentInventory: product.currentInventory,
        onOrderQuantity: product.onOrderQuantity,
        reviewPeriodDays,
        moq,
      });

      // 8d. Phân loại rủi ro StockRiskStatus (5A.5)
      const riskResult = this.calcEngine.classifyStockRisk({
        currentInventory: product.currentInventory,
        onOrderQuantity: product.onOrderQuantity,
        reorderPoint: ropSoqResult.reorderPoint,
        forecastedDemand: forecast.dailyAverage,
        reviewPeriodDays,
      });

      const suggestedQty = ropSoqResult.suggestedQuantity;
      if (suggestedQty > 0) {
        suggestedOrderCount++;
        totalSuggestedAmount += suggestedQty * unitPrice;
      }

      itemsToCreate.push({
        productId: product.id,
        forecastedDemand: new Prisma.Decimal(forecast.dailyAverage.toFixed(2)),
        dailyForecasts:
          forecast.dailyForecasts as unknown as Prisma.InputJsonValue,
        snapshotCurrentInventory: product.currentInventory, // Snapshot bất biến
        snapshotOnOrderQuantity: product.onOrderQuantity, // Snapshot bất biến
        safetyStock: ssResult.safetyStock,
        reorderPoint: ropSoqResult.reorderPoint,
        abcXyzGroup: abcRes.badge,
        stockRiskStatus: riskResult.status,
        suggestedQuantity: suggestedQty,
        suggestedSupplierId: wsmResult.suggestedSupplierId
          ? BigInt(wsmResult.suggestedSupplierId)
          : null,
        suggestedSupplierWsmScore: wsmResult.suggestedSupplierScore
          ? new Prisma.Decimal(wsmResult.suggestedSupplierScore.toFixed(4))
          : null,
        supplierRankings:
          wsmResult.rankings as unknown as Prisma.InputJsonValue,
        approvedQuantity: suggestedQty, // Mặc định khởi tạo bằng suggestedQuantity
        approvedSupplierId: wsmResult.suggestedSupplierId
          ? BigInt(wsmResult.suggestedSupplierId)
          : null,
        isOverridden: false,
        whyBuyExplanation: null, // Chỉ kích hoạt on-demand tại 5B.4
      });
    }

    // 9. Lưu vào CSDL trong ACID Transaction (INV-REC-06)
    const sessionCode = await this.generateSessionCode(
      dto.asOfDate ? effectiveDate : undefined,
    );

    const createdSession = await this.prisma.$transaction(async (tx) => {
      const session = await tx.recommendationSession.create({
        data: {
          sessionCode,
          categoryId: targetCategoryId || null,
          scope,
          status: 'Draft',
          totalSuggestedAmount: new Prisma.Decimal(
            totalSuggestedAmount.toFixed(2),
          ),
          totalApprovedAmount: new Prisma.Decimal(
            totalSuggestedAmount.toFixed(2),
          ),
          createdBy: username,
          ...(dto.asOfDate ? { createdAt: effectiveDate } : {}),
        },
      });

      const itemsWithSessionId = itemsToCreate.map((item) => ({
        ...item,
        sessionId: session.id,
      }));

      await tx.recommendationItem.createMany({
        data: itemsWithSessionId,
      });

      return session;
    });

    return {
      sessionId: Number(createdSession.id),
      sessionCode: createdSession.sessionCode,
      totalSkusAnalyzed: products.length,
      suggestedOrderCount,
      createdAt: createdSession.createdAt.toISOString(),
    };
  }

  /**
   * Gom dữ liệu bán hàng toàn bộ lịch sử theo từng SKU
   */
  private aggregateSalesRecords(
    products: { id: bigint }[],
    salesRecords: {
      productId: bigint;
      revenue: Prisma.Decimal;
      quantitySold: number;
      saleDate: Date;
    }[],
  ): Map<
    string,
    {
      totalRevenue: number;
      totalQty: number;
      records: SkuSalesHistoryItem[];
      distinctDates: Set<string>;
    }
  > {
    const salesByProduct = new Map<
      string,
      {
        totalRevenue: number;
        totalQty: number;
        records: SkuSalesHistoryItem[];
        distinctDates: Set<string>;
      }
    >();

    for (const p of products) {
      salesByProduct.set(p.id.toString(), {
        totalRevenue: 0,
        totalQty: 0,
        records: [],
        distinctDates: new Set(),
      });
    }

    for (const record of salesRecords) {
      const pIdStr = record.productId.toString();
      const entry = salesByProduct.get(pIdStr);
      if (entry) {
        const rev = Number(record.revenue) || 0;
        const qty = record.quantitySold || 0;
        const dateStr = record.saleDate.toISOString().split('T')[0];

        entry.totalRevenue += rev;
        entry.totalQty += qty;
        entry.records.push({ date: dateStr, quantity: qty });
        entry.distinctDates.add(dateStr);
      }
    }

    return salesByProduct;
  }

  /**
   * Sinh mã phiên đề xuất theo quy chuẩn: REC-YYYYMMDD-XXX
   */
  private async generateSessionCode(asOfDate?: Date): Promise<string> {
    const today = asOfDate || new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `REC-${yyyy}${mm}${dd}-`;

    const countToday = await this.prisma.recommendationSession.count({
      where: {
        sessionCode: { startsWith: prefix },
      },
    });

    const seq = String(countToday + 1).padStart(3, '0');
    return `${prefix}${seq}`;
  }
}
