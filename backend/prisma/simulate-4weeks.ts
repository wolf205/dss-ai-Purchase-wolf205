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
  asOfDate: string; // Ngày phân tích DSS (Chủ Nhật)
  weekEndDate: string; // Ngày kết thúc tuần
}

const WEEKS: WeekConfig[] = [
  { weekNum: 1, asOfDate: '2026-11-01', weekEndDate: '2026-11-07' },
  { weekNum: 2, asOfDate: '2026-11-08', weekEndDate: '2026-11-14' },
  { weekNum: 3, asOfDate: '2026-11-15', weekEndDate: '2026-11-21' },
  { weekNum: 4, asOfDate: '2026-11-22', weekEndDate: '2026-11-28' },
];

async function main() {
  console.log(
    '================================================================',
  );
  console.log('🚀 BẮT ĐẦU CHẠY MÔ PHỎNG 4 TUẦN PHÂN TÍCH VÀ ĐÁNH GIÁ DSS');
  console.log('   Neo theo mốc thời gian hiện tại: 2026-11-22 (Chủ Nhật)');
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

    // ĐỐI VỚI TUẦN 4 (HÔM NAY 2026-11-22):
    // Giữ nguyên ở trạng thái Draft / Active để người dùng và hội đồng xem xét trực tiếp trên UI!
    if (week.weekNum === 4) {
      console.log(
        `\n🌟 [CHÚ Ý QUAN TRỌNG] TUẦN 4 (${analysisRes.sessionCode}) LÀ THỜI ĐIỂM HIỆN TẠI (2026-11-22)!`,
      );
      console.log(
        `   👉 Phiên đề xuất được giữ ở trạng thái DRAFT (Chờ phê duyệt).`,
      );
      console.log(
        `   👉 Người dùng có thể đăng nhập Web UI để: xem biểu đồ dự báo, bấm Explain AI on-demand, và phê duyệt POs trực tiếp!`,
      );
      const recItems = await prisma.recommendationItem.findMany({
        where: { sessionId },
        select: { suggestedQuantity: true },
      });
      const totalSuggestedQty = recItems.reduce(
        (acc, item) => acc + (item.suggestedQuantity || 0),
        0,
      );

      summaryResults.push({
        week: `Tuần ${week.weekNum} (Hiện tại)`,
        sessionCode: analysisRes.sessionCode,
        startDate: week.asOfDate,
        endDate: week.weekEndDate,
        status: 'Draft (Chờ duyệt)',
        dailyWape: 'Chờ thực tế',
        weeklyWape: 'Chờ thực tế',
        mape: 'Chờ thực tế',
        bias: 'Chờ thực tế',
        predQty: totalSuggestedQty,
        actQty: 'Chưa phát sinh',
        poCount: 0,
      });
      break;
    }

    // 2. Phê duyệt phiên đề xuất mua hàng (UC-01 Approve -> sinh POs) cho các tuần 1, 2, 3
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

    // 3. Nhập kho hàng đã đặt (UC-03 Goods Receipt) theo kịch bản ĐA DẠNG:
    //    - On-Time & In-Full (OTIF chuẩn)
    //    - Late Delivery (Giao trễ 1-2 ngày)
    //    - Partial Delivery (Giao thiếu một phần số lượng)
    const pos = await prisma.purchaseOrder.findMany({
      where: { sessionId },
      include: { lineItems: true, supplier: true },
      orderBy: { id: 'asc' },
    });

    for (let poIdx = 0; poIdx < pos.length; poIdx++) {
      const po = pos[poIdx];
      const expectedDate = new Date(po.expectedDeliveryDate);
      let receiptDate = new Date(expectedDate);
      let scenarioLabel = 'On-time & In-full (100%)';

      // Mô phỏng nhận hàng đa dạng:
      // Tuần 1: PO thứ 2 giao trễ 1 ngày (Late)
      // Tuần 2: PO thứ 2 giao thiếu 15% mặt hàng đầu tiên (Partial)
      // Tuần 3: PO thứ 2 giao trễ 1 ngày + thiếu 10% (Late & Partial)
      let isLate = false;
      let isPartial = false;

      if (week.weekNum === 1 && poIdx === 1) {
        isLate = true;
        scenarioLabel = 'Giao trễ 1 ngày (Late Delivery)';
      } else if (week.weekNum === 2 && poIdx === 1) {
        isPartial = true;
        scenarioLabel = 'Giao thiếu hàng (Partial Delivery)';
      } else if (week.weekNum === 3 && poIdx === 1) {
        isLate = true;
        isPartial = true;
        scenarioLabel = 'Giao trễ 1 ngày & Giao thiếu (Late & Partial)';
      }

      if (isLate) {
        receiptDate.setUTCDate(receiptDate.getUTCDate() + 1);
      }

      const receiptDateStr = receiptDate.toISOString().slice(0, 10);

      const linesToReceive = po.lineItems.map((li, lineIdx) => {
        let qty = li.quantity;
        if (isPartial && lineIdx === 0 && qty > 5) {
          qty = Math.max(1, Math.floor(qty * 0.85)); // Giao thiếu 15% cho dòng đầu
        }
        return {
          poLineItemId: Number(li.id),
          skuId: Number(li.productId),
          receivedQuantity: qty,
        };
      });

      try {
        const gr = await goodsReceiptsService.confirmGoodsReceipt(
          {
            purchaseOrderId: Number(po.id),
            receiptDate: receiptDateStr,
            note: `Nhập kho đơn hàng ${po.poNumber} [${scenarioLabel}]`,
            lines: linesToReceive,
          },
          'warehouse_staff',
        );
        console.log(
          `   📦 Đã nhận hàng cho PO ${po.poNumber} (Phiếu: ${gr.receiptNumber}) ngày ${receiptDateStr} -> ${scenarioLabel}`,
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
              onOrderQuantity: 0, // Reset hàng đang về sau khi hoàn thành nhận hàng tuần
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
      status: 'Approved & Evaluated',
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
  console.log('🏆 BẢNG TỔNG HỢP KẾT QUẢ VẬN HÀNH 4 PHIÊN DSS (CHU KỲ 2026-11-22)');
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
