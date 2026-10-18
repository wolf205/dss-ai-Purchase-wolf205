import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DataImportErrorDetail,
  UploadedFile,
} from '../interfaces/uploaded-file.interface';
import {
  ParsedSalesData,
  ParsedSalesRow,
} from '../interfaces/data-import.interface';
import { SalesRecordItemDto } from '../dto/confirm-sales.dto';
import { parseCsvLine } from '../utils/csv-parser.util';

/**
 * Phân tích và thẩm định toàn bộ tệp CSV bán hàng in-memory theo nguyên tắc All-or-Nothing (UC-04, BR-14, BR-15, BR-18).
 */
export async function parseAndValidateSalesFile(
  file: UploadedFile,
  prisma: PrismaService,
): Promise<ParsedSalesData> {
  // 1. Kiểm tra tính hiện diện và định dạng của file
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

  // 2. Đọc nội dung CSV và phân tích dòng
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

  // 3. Kiểm tra dòng tiêu đề bắt buộc (Header)
  const headerCols = parseCsvLine(indexedLines[0].text).map((c) =>
    c.trim().toLowerCase(),
  );

  const dateIdx = headerCols.indexOf('date');
  const skuIdx = headerCols.indexOf('sku');
  const quantityIdx = headerCols.indexOf('quantity');
  const revenueIdx = headerCols.indexOf('revenue');

  if (
    dateIdx === -1 ||
    skuIdx === -1 ||
    quantityIdx === -1 ||
    revenueIdx === -1
  ) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message:
        'Cấu trúc tệp không hợp lệ. Tiêu đề bắt buộc gồm: Date, SKU, Quantity, Revenue.',
    });
  }

  const dataLines = indexedLines.slice(1);
  if (dataLines.length === 0) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Tệp không chứa dòng dữ liệu nào sau dòng tiêu đề.',
    });
  }

  // 4. Kiểm tra dữ liệu từng dòng theo quy tắc All-or-Nothing
  const errors: DataImportErrorDetail[] = [];
  const parsedRows: ParsedSalesRow[] = [];
  const seenPairKeys = new Set<string>();
  const skuCodesInFile = new Set<string>();
  const datesInFile = new Set<string>();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localTodayStr = `${year}-${month}-${day}`;

  for (const { lineNum, text } of dataLines) {
    const cols = parseCsvLine(text);
    const rawDate = cols[dateIdx]?.trim();
    const rawSku = cols[skuIdx]?.trim();
    const rawQty = cols[quantityIdx]?.trim();
    const rawRev = cols[revenueIdx]?.trim();

    // Kiểm tra khuyết thiếu dữ liệu ở bất kỳ cột nào
    if (!rawDate || !rawSku || !rawQty || !rawRev) {
      errors.push({
        row: lineNum,
        skuCode: rawSku || undefined,
        issue: 'Khuyết thiếu dữ liệu ở ô bắt buộc.',
      });
      continue;
    }

    // Kiểm tra định dạng ngày và ngày tương lai
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let isDateValid = false;
    if (!dateRegex.test(rawDate) || isNaN(new Date(rawDate).getTime())) {
      errors.push({
        row: lineNum,
        skuCode: rawSku,
        issue: 'Định dạng ngày không hợp lệ (yêu cầu YYYY-MM-DD).',
      });
    } else if (rawDate > localTodayStr) {
      errors.push({
        row: lineNum,
        skuCode: rawSku,
        issue: `Ngày bán hàng (${rawDate}) không được nằm trong tương lai.`,
      });
    } else {
      isDateValid = true;
      datesInFile.add(rawDate);
    }

    // Thu thập SKU để đối chiếu DB
    skuCodesInFile.add(rawSku);

    // Kiểm tra số lượng (Quantity > 0 và là số nguyên)
    const qtyNum = Number(rawQty);
    let isQtyValid = false;
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      errors.push({
        row: lineNum,
        skuCode: rawSku,
        issue: `Số lượng bán phải là số nguyên dương lớn hơn 0 (nhận được: ${rawQty}).`,
      });
    } else {
      isQtyValid = true;
    }

    // Kiểm tra doanh thu (Revenue >= 0)
    const revNum = Number(rawRev);
    let isRevValid = false;
    if (isNaN(revNum) || revNum < 0) {
      errors.push({
        row: lineNum,
        skuCode: rawSku,
        issue: `Doanh thu không được là số âm (nhận được: ${rawRev}).`,
      });
    } else {
      isRevValid = true;
    }

    // Kiểm tra trùng lặp nội bộ tệp cho cặp (Date, SKU)
    const pairKey = `${rawDate}__${rawSku.toUpperCase()}`;
    if (seenPairKeys.has(pairKey)) {
      errors.push({
        row: lineNum,
        skuCode: rawSku,
        issue: `Trùng lặp dữ liệu nội bộ tệp cho cặp (Date: ${rawDate}, SKU: ${rawSku}).`,
      });
    } else {
      seenPairKeys.add(pairKey);
    }

    if (isDateValid && isQtyValid && isRevValid) {
      parsedRows.push({
        row: lineNum,
        date: rawDate,
        skuCode: rawSku,
        quantity: qtyNum,
        revenue: revNum,
      });
    }
  }

  // 5. Đối chiếu danh mục SKU với CSDL (UC-05, BR-18: chấp nhận cả Active và Inactive)
  const existingProducts = await verifySkusInDb(
    skuCodesInFile,
    parsedRows,
    errors,
    prisma,
  );

  // 6. Xử lý nguyên tắc All-or-Nothing
  if (errors.length > 0) {
    errors.sort((a, b) => a.row - b.row);
    throw new BadRequestException({
      code: 'ALL_OR_NOTHING_IMPORT_FAILED',
      message:
        'File import chứa dữ liệu không hợp lệ. Vui lòng sửa lại toàn bộ trước khi nạp.',
      details: errors,
    });
  }

  // 7. Tìm các ngày trùng lặp đã tồn tại trong CSDL sales_records (BR-15)
  const duplicateDatesFound = await findDuplicateDates(datesInFile, prisma);

  // 8. Chuẩn bị danh sách xem trước (tối đa 10 dòng đầu)
  const previewRows = buildSalesPreviewRows(parsedRows);

  return {
    parsedRows,
    existingProducts,
    datesInFile,
    duplicateDatesFound,
    previewRows,
  };
}

/**
 * Thẩm định danh sách bản ghi bán hàng dạng JSON theo nguyên tắc All-or-Nothing.
 */
export async function validateSalesItems(
  items: SalesRecordItemDto[],
  prisma: PrismaService,
): Promise<ParsedSalesData> {
  if (!items || items.length === 0) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Danh sách bản ghi bán hàng không được để trống.',
    });
  }

  const errors: DataImportErrorDetail[] = [];
  const parsedRows: ParsedSalesRow[] = [];
  const seenPairKeys = new Set<string>();
  const skuCodesInFile = new Set<string>();
  const datesInFile = new Set<string>();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localTodayStr = `${year}-${month}-${day}`;

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const rowNum = idx + 1;
    const rawDate = item.date?.trim();
    const rawSku = item.skuCode?.trim();
    const qtyNum = item.quantity;
    const revNum = item.revenue;

    if (!rawDate || !rawSku || qtyNum == null || revNum == null) {
      errors.push({
        row: rowNum,
        skuCode: rawSku || undefined,
        issue: 'Khuyết thiếu dữ liệu ở ô bắt buộc.',
      });
      continue;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    let isDateValid = false;
    if (!dateRegex.test(rawDate) || isNaN(new Date(rawDate).getTime())) {
      errors.push({
        row: rowNum,
        skuCode: rawSku,
        issue: 'Định dạng ngày không hợp lệ (yêu cầu YYYY-MM-DD).',
      });
    } else if (rawDate > localTodayStr) {
      errors.push({
        row: rowNum,
        skuCode: rawSku,
        issue: `Ngày bán hàng (${rawDate}) không được nằm trong tương lai.`,
      });
    } else {
      isDateValid = true;
      datesInFile.add(rawDate);
    }

    skuCodesInFile.add(rawSku);

    let isQtyValid = false;
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) {
      errors.push({
        row: rowNum,
        skuCode: rawSku,
        issue: `Số lượng bán phải là số nguyên dương lớn hơn 0 (nhận được: ${qtyNum}).`,
      });
    } else {
      isQtyValid = true;
    }

    let isRevValid = false;
    if (isNaN(revNum) || revNum < 0) {
      errors.push({
        row: rowNum,
        skuCode: rawSku,
        issue: `Doanh thu không được là số âm (nhận được: ${revNum}).`,
      });
    } else {
      isRevValid = true;
    }

    const pairKey = `${rawDate}__${rawSku.toUpperCase()}`;
    if (seenPairKeys.has(pairKey)) {
      errors.push({
        row: rowNum,
        skuCode: rawSku,
        issue: `Trùng lặp dữ liệu nội bộ cho cặp (Date: ${rawDate}, SKU: ${rawSku}).`,
      });
    } else {
      seenPairKeys.add(pairKey);
    }

    if (isDateValid && isQtyValid && isRevValid) {
      parsedRows.push({
        row: rowNum,
        date: rawDate,
        skuCode: rawSku,
        quantity: qtyNum,
        revenue: revNum,
      });
    }
  }

  const existingProducts = await verifySkusInDb(
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

  const duplicateDatesFound = await findDuplicateDates(datesInFile, prisma);
  const previewRows = buildSalesPreviewRows(parsedRows);

  return {
    parsedRows,
    existingProducts,
    datesInFile,
    duplicateDatesFound,
    previewRows,
  };
}

async function verifySkusInDb(
  skuCodesInFile: Set<string>,
  parsedRows: ParsedSalesRow[],
  errors: DataImportErrorDetail[],
  prisma: PrismaService,
): Promise<Array<{ id: bigint; skuCode: string }>> {
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

async function findDuplicateDates(
  datesInFile: Set<string>,
  prisma: PrismaService,
): Promise<string[]> {
  if (datesInFile.size === 0) return [];

  const datesArray = Array.from(datesInFile).map(
    (d) => new Date(`${d}T00:00:00.000Z`),
  );

  const existingRecords = await prisma.salesRecord.findMany({
    where: {
      saleDate: { in: datesArray },
    },
    select: { saleDate: true },
    distinct: ['saleDate'],
  });

  return existingRecords
    .map((r) => r.saleDate.toISOString().slice(0, 10))
    .sort();
}

function buildSalesPreviewRows(parsedRows: ParsedSalesRow[]) {
  return parsedRows.slice(0, 10).map((r) => ({
    date: r.date,
    skuCode: r.skuCode,
    quantity: r.quantity,
    revenue: r.revenue,
  }));
}
