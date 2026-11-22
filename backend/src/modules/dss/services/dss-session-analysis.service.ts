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
import { SkuSalesMetricsInput } from '../interfaces/dss-calculation.interface';
import { Prisma } from '@prisma/client';
import { DssDataPreparerHelper } from '../helpers/dss-data-preparer.helper';
import { DssItemBuilderHelper } from '../helpers/dss-item-builder.helper';
import { DssSessionCodeGenerator } from '../helpers/dss-session-code.generator';

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

    // 5. Chuẩn bị dữ liệu lịch sử bán hàng và ngày hết hàng trong cửa sổ 90 ngày
    const dateRange = DssDataPreparerHelper.resolveDateRange(dto.asOfDate);

    const salesRecords = await this.prisma.salesRecord.findMany({
      where: {
        productId: { in: productIds },
        saleDate: dateRange.salesDateFilter,
      },
      orderBy: { saleDate: 'asc' },
    });

    const salesByProduct = DssDataPreparerHelper.aggregateSalesRecords(
      products,
      salesRecords,
    );

    const stockoutSnapshots = await (this.prisma.inventorySnapshot?.findMany?.({
      where: {
        productId: { in: productIds },
        snapshotDate: dateRange.salesDateFilter,
        countedQuantity: 0,
      },
      select: {
        productId: true,
        snapshotDate: true,
      },
    }) ?? Promise.resolve([]));

    const stockoutDatesByProduct =
      DssDataPreparerHelper.mapStockoutDatesByProduct(stockoutSnapshots);

    // 6. Lấy dự báo nhu cầu từ AI Client (kèm Graceful Fallback)
    const forecastInputs = DssDataPreparerHelper.buildForecastInputs(
      products,
      salesByProduct,
      stockoutDatesByProduct,
      salesRecords,
      dateRange.effectiveDate,
      dto.asOfDate,
    );

    const forecastMap =
      await this.aiForecastingClient.getForecasts(forecastInputs);

    // 7. Chạy 5A.1: Phân loại ma trận ABC - XYZ
    const abcXyzInputs: SkuSalesMetricsInput[] = products.map((p) => {
      const sales = salesByProduct.get(p.id.toString())!;
      const forecast = forecastMap.get(p.id.toString());
      const avgDemand = forecast
        ? forecast.dailyAverage
        : sales.totalQty / dateRange.historyDays;
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

    // 8. Chạy các engine 5A còn lại (WSM, SS, ROP & SOQ, StockRisk) và đóng gói items
    const { itemsToCreate, suggestedOrderCount, totalSuggestedAmount } =
      DssItemBuilderHelper.buildRecommendationItems(
        products,
        salesByProduct,
        forecastMap,
        abcMap,
        wsmWeights,
        { targetServiceLevel, zFactor, reviewPeriodDays },
        this.calcEngine,
      );

    // 9. Sinh mã phiên đề xuất REC-YYYYMMDD-XXX
    const sessionCode = await DssSessionCodeGenerator.generate(
      this.prisma,
      dto.asOfDate ? dateRange.effectiveDate : undefined,
    );

    // 10. Lưu vào CSDL trong ACID Transaction toàn vẹn (INV-REC-06)
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
          ...(dto.asOfDate ? { createdAt: dateRange.effectiveDate } : {}),
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
}
