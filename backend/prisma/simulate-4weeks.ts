import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DssSessionAnalysisService } from '../src/modules/dss/services/dss-session-analysis.service';
import { DssApprovalService } from '../src/modules/dss/services/dss-approval.service';
import { DssEvaluationService } from '../src/modules/dss/services/dss-evaluation.service';
import { GoodsReceiptsService } from '../src/modules/goods-receipts/goods-receipts.service';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

interface WeekConfig {
  weekNum: number;
  asOfDate: string; // Ngày phân tích DSS (Thứ Hai)
  weekEndDate: string; // Ngày kết thúc tuần (Chủ Nhật)
}

const WEEKS: WeekConfig[] = [
  { weekNum: 1, asOfDate: '2026-10-05', weekEndDate: '2026-10-11' },
  { weekNum: 2, asOfDate: '2026-10-12', weekEndDate: '2026-10-18' },
  { weekNum: 3, asOfDate: '2026-10-19', weekEndDate: '2026-10-25' },
  { weekNum: 4, asOfDate: '2026-10-26', weekEndDate: '2026-11-01' },
];

async function main() {
  console.log(
    '================================================================',
  );
  console.log('🚀 BẮT ĐẦU CHẠY MÔ PHỎNG 4 TUẦN PHÂN TÍCH VÀ ĐÁNH GIÁ DSS');
  console.log(
    '================================================================\n',
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const prisma = app.get(PrismaService);
  const sessionAnalysisService = app.get(DssSessionAnalysisService);
  const approvalService = app.get(DssApprovalService);
  const goodsReceiptsService = app.get(GoodsReceiptsService);
  const evaluationService = app.get(DssEvaluationService);

  // Lấy ánh xạ danh sách sản phẩm theo skuCode
  const products = await prisma.product.findMany({
    select: { id: true, skuCode: true, productName: true },
  });
  const skuToProduct = new Map<
    string,
    { id: bigint; skuCode: string; productName: string }
  >();
  for (const p of products) {
    skuToProduct.set(p.skuCode, p);
  }

  const projectRoot = path.resolve(__dirname, '../..');
  const demoBatchesDir = path.join(projectRoot, 'data', 'demo_batches');

  const summaryResults: any[] = [];

  for (const week of WEEKS) {
    console.log(
      `\n----------------------------------------------------------------`,
    );
    console.log(
      `📌 TUẦN ${week.weekNum}: Phân tích tại ${week.asOfDate} -> Kỳ đối soát đến ${week.weekEndDate}`,
    );
    console.log(
      `----------------------------------------------------------------`,
    );

    // 1. Kích hoạt phân tích đề xuất mua hàng DSS (UC-01 Analyze)
    console.log(`⏳ Đang chạy phân tích DSS tại ngày ${week.asOfDate}...`);
    const analysisRes = await sessionAnalysisService.analyzeSession(
      { asOfDate: week.asOfDate },
      'store_manager',
    );
    const sessionId = BigInt(analysisRes.sessionId);
    console.log(
      `✅ Đã tạo phiên DSS: ${analysisRes.sessionCode} (ID: ${sessionId})`,
    );
    console.log(`   - Tổng số SKU phân tích: ${analysisRes.totalSkusAnalyzed}`);
    console.log(`   - Số SKU cần đặt hàng: ${analysisRes.suggestedOrderCount}`);

    // 2. Phê duyệt phiên đề xuất mua hàng (UC-01 Approve -> sinh POs)
    console.log(`⏳ Phê duyệt phiên đề xuất ${analysisRes.sessionCode}...`);
    const approvalRes = await approvalService.approveSession(
      Number(sessionId),
      new Date(`${week.asOfDate}T08:00:00.000Z`),
    );
    console.log(`✅ Phiên đã được duyệt thành công!`);
    console.log(
      `   - Số đơn PO tự động sinh: ${approvalRes.generatedPurchaseOrders.length}`,
    );
    for (const po of approvalRes.generatedPurchaseOrders) {
      console.log(
        `     * Đơn hàng ${po.poNumber} | NCC: ${po.supplierName} | Tổng tiền: ${po.totalAmount.toLocaleString()} VND`,
      );
    }

    // 3. Nhập kho hàng đã đặt (UC-03 Goods Receipt) khi hàng tới
    const pos = await prisma.purchaseOrder.findMany({
      where: { sessionId },
      include: { lineItems: true },
    });

    for (const po of pos) {
      const receiptDateStr = po.expectedDeliveryDate.toISOString().slice(0, 10);
      try {
        await goodsReceiptsService.confirmGoodsReceipt(
          {
            purchaseOrderId: Number(po.id),
            receiptDate: receiptDateStr,
            note: `Nhập kho tự động theo PO ${po.poNumber} cho tuần ${week.weekNum}`,
            lines: po.lineItems.map((li) => ({
              poLineItemId: Number(li.id),
              skuId: Number(li.productId),
              receivedQuantity: li.quantity,
            })),
          },
          'warehouse_staff',
        );
        console.log(
          `   📦 Đã nhận hàng kho cho PO ${po.poNumber} ngày ${receiptDateStr}`,
        );
      } catch (err: any) {
        console.warn(
          `   ⚠️ Không thể nhận hàng PO ${po.poNumber}: ${err.message}`,
        );
      }
    }

    // 4. Nạp dữ liệu bán hàng thực tế của Tuần w (UC-04 Sales Records)
    const salesFilePath = path.join(
      demoBatchesDir,
      `week_${week.weekNum}_sales.csv`,
    );
    if (fs.existsSync(salesFilePath)) {
      const content = fs.readFileSync(salesFilePath, 'utf-8');
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const header = lines[0]; // Date,SKU,Quantity,Revenue
      const recordsToInsert: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const [dateStr, sku, qtyStr, revStr] = lines[i].split(',');
        const prod = skuToProduct.get(sku.trim());
        if (prod) {
          recordsToInsert.push({
            productId: prod.id,
            saleDate: new Date(`${dateStr.trim()}T00:00:00.000Z`),
            quantitySold: parseInt(qtyStr.trim(), 10),
            revenue: parseFloat(revStr.trim()),
          });
        }
      }

      if (recordsToInsert.length > 0) {
        await prisma.salesRecord.createMany({
          data: recordsToInsert,
          skipDuplicates: true,
        });
        console.log(
          `   📊 Đã nạp ${recordsToInsert.length} bản ghi bán hàng thực tế tuần ${week.weekNum}`,
        );
      }
    }

    // 5. Cập nhật tồn kho cuối tuần từ week_{w}_inventory.csv
    const invFilePath = path.join(
      demoBatchesDir,
      `week_${week.weekNum}_inventory.csv`,
    );
    if (fs.existsSync(invFilePath)) {
      const invContent = fs.readFileSync(invFilePath, 'utf-8');
      const invLines = invContent
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0);
      const snapshotDate = new Date(`${week.weekEndDate}T00:00:00.000Z`);

      for (let i = 1; i < invLines.length; i++) {
        const [sku, stockStr] = invLines[i].split(',');
        const prod = skuToProduct.get(sku.trim());
        if (prod) {
          const stock = parseInt(stockStr.trim(), 10);
          await prisma.product.update({
            where: { id: prod.id },
            data: {
              currentInventory: stock,
              onOrderQuantity: 0, // Reset hàng đang về sau khi hoàn thành tuần
            },
          });

          await prisma.inventorySnapshot.upsert({
            where: {
              productId_snapshotDate: {
                productId: prod.id,
                snapshotDate,
              },
            },
            create: {
              productId: prod.id,
              snapshotDate,
              countedQuantity: stock,
              countedBy: 'inventory_staff',
            },
            update: {
              countedQuantity: stock,
            },
          });
        }
      }
      console.log(
        `   📋 Đã cập nhật tồn kho cuối tuần và lưu snapshot kiểm kê ngày ${week.weekEndDate}`,
      );
    }

    // 6. Thực hiện đánh giá dự báo DSS so với thực tế (UC Evaluation)
    console.log(
      `⏳ Đang chạy thuật toán đối soát độ chính xác dự báo (UC Evaluation)...`,
    );
    const evalRes = await evaluationService.evaluateSession(sessionId);

    console.log(
      `🎯 KẾT QUẢ ĐỐI SOÁT TUẦN ${week.weekNum} (${analysisRes.sessionCode}):`,
    );
    console.log(
      `   - Khung thời gian đánh giá: ${evalRes.evaluationWindow.startDate} -> ${evalRes.evaluationWindow.endDate} (${evalRes.evaluationWindow.totalDays} ngày)`,
    );
    console.log(
      `   - Có dữ liệu thực tế: ${evalRes.hasActualData ? 'CÓ (True)' : 'CHƯA (False)'}`,
    );
    if (evalRes.summary) {
      console.log(
        `   - Tổng số lượng dự báo: ${evalRes.summary.totalPredicted}`,
      );
      console.log(
        `   - Tổng số lượng bán thực tế: ${evalRes.summary.totalActual}`,
      );
      console.log(
        `   - WAPE Theo Ngày (Daily WAPE): ${evalRes.summary.overallWape.toFixed(2)}% [${evalRes.summary.qualityRating}]`,
      );
      console.log(`   - MAPE: ${evalRes.summary.overallMape.toFixed(2)}%`);
      console.log(
        `   - BIAS (Độ lệch thiên kiến): ${evalRes.summary.overallBias.toFixed(2)}%`,
      );
    }
    if (evalRes.weeklySummary) {
      console.log(
        `   🌟 WAPE CHU KỲ TUẦN (Weekly Horizon): ${evalRes.weeklySummary.overallWape.toFixed(2)}% [${evalRes.weeklySummary.qualityRating}]`,
      );
    }

    summaryResults.push({
      week: `Tuần ${week.weekNum}`,
      sessionCode: analysisRes.sessionCode,
      startDate: week.asOfDate,
      endDate: week.weekEndDate,
      dailyWape: evalRes.summary
        ? `${evalRes.summary.overallWape.toFixed(2)}%`
        : 'N/A',
      weeklyWape: evalRes.weeklySummary
        ? `${evalRes.weeklySummary.overallWape.toFixed(2)}%`
        : 'N/A',
      mape: evalRes.summary
        ? `${evalRes.summary.overallMape.toFixed(2)}%`
        : 'N/A',
      bias: evalRes.summary
        ? `${evalRes.summary.overallBias.toFixed(2)}%`
        : 'N/A',
      predQty: evalRes.summary?.totalPredicted ?? 0,
      actQty: evalRes.summary?.totalActual ?? 0,
      poCount: approvalRes.generatedPurchaseOrders.length,
    });
  }

  console.log(
    '\n================================================================',
  );
  console.log('🏆 BẢNG TỔNG HỢP KẾT QUẢ ĐỐI SOÁT 4 TUẦN VẬN HÀNH DSS');
  console.log(
    '================================================================',
  );
  console.table(summaryResults);

  await app.close();
  console.log(
    '\n🎉 ĐÃ HOÀN TẤT TOÀN BỘ QUÁ TRÌNH MÔ PHỎNG VÀ LƯU DỮ LIỆU VÀO DB!\n',
  );
}

main().catch((err) => {
  console.error('❌ Lỗi trong quá trình mô phỏng 4 tuần:', err);
  process.exit(1);
});
