import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DataImportErrorDetail,
  UploadedFile,
} from '../interfaces/uploaded-file.interface';
import {
  ParsedInventoryData,
  ParsedInventoryRow,
} from '../interfaces/data-import.interface';
import { InventoryRecordItemDto } from '../dto/confirm-inventory.dto';
import { parseCsvLine } from '../utils/csv-parser.util';

/**
 * Phân tích và thẩm định toàn bộ tệp CSV kiểm kê tồn kho in-memory theo nguyên tắc All-or-Nothing (UC-04, BR-14, BR-16, BR-18).
 */
export async function parseAndValidateInventoryFile(
  file: UploadedFile,
  prisma: PrismaService,
): Promise<ParsedInventoryData> {
  if (!file || !file.buffer || file.buffer.length === 0) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Tệp tải lên bị rỗng hoặc không tìm thấy nội dung.',
    });
  }

  const filename = file.originalname?.toLowerCase() || '';
  if (!filename.endsWith('.csv')) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message:
        'Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp định dạng .csv.',
    });
  }

  const rawText = file.buffer.toString('utf-8').replace(/^\uFEFF/, '');
  const rawLines = rawText.split(/\r?\n/);

  const indexedLines: Array<{ lineNum: number; text: string }> = [];
  for (let i = 0; i < rawLines.length; i++) {
    if (rawLines[i].trim().length > 0) {
      indexedLines.push({ lineNum: i + 1, text: rawLines[i] });
    }
  }

  if (indexedLines.length === 0) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Tệp không chứa dữ liệu.',
    });
  }

  // Kiểm tra dòng tiêu đề: SKU, StockQuantity
  const headerCols = parseCsvLine(indexedLines[0].text).map((c) =>
    c.trim().toLowerCase(),
  );

  const skuIdx = headerCols.indexOf('sku');
  let qtyIdx = headerCols.indexOf('stockquantity');
  if (qtyIdx === -1) qtyIdx = headerCols.indexOf('stock_quantity');
  if (qtyIdx === -1) qtyIdx = headerCols.indexOf('quantity');

  if (skuIdx === -1 || qtyIdx === -1) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message:
        'Cấu trúc tệp không hợp lệ. Tiêu đề bắt buộc gồm: SKU, StockQuantity.',
    });
  }

  const dataLines = indexedLines.slice(1);
  if (dataLines.length === 0) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Tệp không chứa dòng dữ liệu nào sau dòng tiêu đề.',
    });
  }

  const errors: DataImportErrorDetail[] = [];
  const parsedRows: ParsedInventoryRow[] = [];
  const seenSkuCodes = new Set<string>();
  const skuCodesInFile = new Set<string>();

  for (const { lineNum, text } of dataLines) {
    const cols = parseCsvLine(text);
    const rawSku = cols[skuIdx]?.trim();
    const rawQty = cols[qtyIdx]?.trim();

    if (!rawSku || !rawQty) {
      errors.push({
        row: lineNum,
        skuCode: rawSku || undefined,
        issue: 'Khuyết thiếu dữ liệu ở ô bắt buộc.',
      });
      continue;
    }

    skuCodesInFile.add(rawSku);

    const qtyNum = Number(rawQty);
    let isQtyValid = false;
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      errors.push({
        row: lineNum,
        skuCode: rawSku,
        issue: `Số lượng tồn kho phải là số nguyên không âm (>= 0) (nhận được: ${rawQty}).`,
      });
    } else {
      isQtyValid = true;
    }

    // Trùng lặp SKU nội bộ tệp
    const normalizedSku = rawSku.toUpperCase();
    if (seenSkuCodes.has(normalizedSku)) {
      errors.push({
        row: lineNum,
        skuCode: rawSku,
        issue: `Trùng lặp mã SKU nội bộ tệp (SKU: ${rawSku}).`,
      });
    } else {
      seenSkuCodes.add(normalizedSku);
    }

    if (isQtyValid) {
      parsedRows.push({
        row: lineNum,
        skuCode: rawSku,
        stockQuantity: qtyNum,
      });
    }
  }

  // Đối chiếu SKU với CSDL
  const existingProducts = await verifyInventorySkusInDb(
    skuCodesInFile,
    parsedRows,
    errors,
    prisma,
  );

  if (errors.length > 0) {
    errors.sort((a, b) => a.row - b.row);
    throw new BadRequestException({
      code: 'ALL_OR_NOTHING_IMPORT_FAILED',
      message:
        'File import chứa dữ liệu không hợp lệ. Vui lòng sửa lại toàn bộ trước khi nạp.',
      details: errors,
    });
  }

  const previewRows = buildInventoryPreviewRows(parsedRows, existingProducts);

  return {
    parsedRows,
    existingProducts,
    previewRows,
  };
}

/**
 * Thẩm định danh sách bản ghi kiểm kê dạng JSON theo nguyên tắc All-or-Nothing.
 */
export async function validateInventoryItems(
  items: InventoryRecordItemDto[],
  prisma: PrismaService,
): Promise<ParsedInventoryData> {
  if (!items || items.length === 0) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Danh sách bản ghi kiểm kê không được để trống.',
    });
  }

  const errors: DataImportErrorDetail[] = [];
  const parsedRows: ParsedInventoryRow[] = [];
  const seenSkuCodes = new Set<string>();
  const skuCodesInFile = new Set<string>();

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const rowNum = idx + 1;
    const rawSku = item.skuCode?.trim();
    const qtyNum = item.stockQuantity;

    if (!rawSku || qtyNum == null) {
      errors.push({
        row: rowNum,
        skuCode: rawSku || undefined,
        issue: 'Khuyết thiếu dữ liệu ở ô bắt buộc.',
      });
      continue;
    }

    skuCodesInFile.add(rawSku);

    let isQtyValid = false;
    if (!Number.isInteger(qtyNum) || qtyNum < 0) {
      errors.push({
        row: rowNum,
        skuCode: rawSku,
        issue: `Số lượng tồn kho phải là số nguyên không âm (>= 0) (nhận được: ${qtyNum}).`,
      });
    } else {
      isQtyValid = true;
    }

    const normalizedSku = rawSku.toUpperCase();
    if (seenSkuCodes.has(normalizedSku)) {
      errors.push({
        row: rowNum,
        skuCode: rawSku,
        issue: `Trùng lặp mã SKU nội bộ tệp (SKU: ${rawSku}).`,
      });
    } else {
      seenSkuCodes.add(normalizedSku);
    }

    if (isQtyValid) {
      parsedRows.push({
        row: rowNum,
        skuCode: rawSku,
        stockQuantity: qtyNum,
      });
    }
  }

  const existingProducts = await verifyInventorySkusInDb(
    skuCodesInFile,
    parsedRows,
    errors,
    prisma,
  );

  if (errors.length > 0) {
    errors.sort((a, b) => a.row - b.row);
    throw new BadRequestException({
      code: 'ALL_OR_NOTHING_IMPORT_FAILED',
      message:
        'File import chứa dữ liệu không hợp lệ. Vui lòng sửa lại toàn bộ trước khi nạp.',
      details: errors,
    });
  }

  const previewRows = buildInventoryPreviewRows(parsedRows, existingProducts);

  return {
    parsedRows,
    existingProducts,
    previewRows,
  };
}

async function verifyInventorySkusInDb(
  skuCodesInFile: Set<string>,
  parsedRows: ParsedInventoryRow[],
  errors: DataImportErrorDetail[],
  prisma: PrismaService,
): Promise<Array<{ id: bigint; skuCode: string; currentInventory: number }>> {
  if (skuCodesInFile.size === 0) return [];

  const existingProducts = await prisma.product.findMany({
    where: {
      skuCode: {
        in: Array.from(skuCodesInFile),
      },
    },
    select: {
      id: true,
      skuCode: true,
      currentInventory: true,
    },
  });

  const existingSkuSet = new Set(
    existingProducts.map((p) => p.skuCode.toUpperCase()),
  );

  for (const row of parsedRows) {
    if (!existingSkuSet.has(row.skuCode.toUpperCase())) {
      errors.push({
        row: row.row,
        skuCode: row.skuCode,
        issue: 'Mã SKU không tồn tại trong hệ thống.',
      });
    }
  }

  return existingProducts;
}

function buildInventoryPreviewRows(
  parsedRows: ParsedInventoryRow[],
  existingProducts: Array<{
    id: bigint;
    skuCode: string;
    currentInventory: number;
  }>,
) {
  const prodMap = new Map<string, number>(
    existingProducts.map((p) => [p.skuCode.toUpperCase(), p.currentInventory]),
  );

  return parsedRows.slice(0, 10).map((r) => {
    const current = prodMap.get(r.skuCode.toUpperCase()) ?? 0;
    return {
      skuCode: r.skuCode,
      stockQuantity: r.stockQuantity,
      currentInventory: current,
      difference: r.stockQuantity - current,
    };
  });
}
