import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadedFile } from './interfaces/uploaded-file.interface';
import { SalesValidateResponseDto } from './dto/sales-validate-response.dto';
import { SalesConfirmResponseDto } from './dto/sales-confirm-response.dto';
import { ConfirmSalesDto, SalesRecordItemDto } from './dto/confirm-sales.dto';
import { InventoryValidateResponseDto } from './dto/inventory-validate-response.dto';
import { InventoryConfirmResponseDto } from './dto/inventory-confirm-response.dto';
import {
  ConfirmInventoryDto,
  InventoryRecordItemDto,
} from './dto/confirm-inventory.dto';
import {
  SALES_TEMPLATE_CSV,
  INVENTORY_TEMPLATE_CSV,
} from './constants/data-import.constants';
import {
  DownloadTemplateResult,
  ParsedInventoryData,
  ParsedSalesData,
} from './interfaces/data-import.interface';
import {
  parseAndValidateSalesFile,
  validateSalesItems,
} from './helpers/sales-validator.helper';
import {
  parseAndValidateInventoryFile,
  validateInventoryItems,
} from './helpers/inventory-validator.helper';

// Re-export constants, interfaces và utils phục vụ tương thích ngược (Backward Compatibility)
export { SALES_TEMPLATE_CSV, INVENTORY_TEMPLATE_CSV };
export * from './interfaces/data-import.interface';
export { parseCsvLine } from './utils/csv-parser.util';

@Injectable()
export class DataImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cung cấp nội dung file mẫu CSV chuẩn cho Bán hàng hoặc Kiểm kê tồn kho (UC-04, BR-14, AF-1).
   */
  getTemplate(type: string): DownloadTemplateResult {
    const normalizedType = type?.trim().toLowerCase();

    if (normalizedType === 'sales') {
      return {
        filename: 'sales_template.csv',
        content: SALES_TEMPLATE_CSV,
      };
    }

    if (normalizedType === 'inventory') {
      return {
        filename: 'inventory_template.csv',
        content: INVENTORY_TEMPLATE_CSV,
      };
    }

    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message:
        'Loại file mẫu không hợp lệ. Chỉ chấp nhận type là "sales" hoặc "inventory".',
    });
  }

  /**
   * Thẩm định dữ liệu file CSV bán hàng theo nguyên tắc All-or-Nothing (UC-04, BR-14, BR-15, BR-18).
   */
  async validateSalesFile(
    file: UploadedFile,
  ): Promise<SalesValidateResponseDto> {
    const data = await this.parseAndValidateSalesFile(file);
    return {
      isValid: true,
      totalRows: data.parsedRows.length,
      duplicateDatesFound: data.duplicateDatesFound,
      previewRows: data.previewRows,
    };
  }

  async parseAndValidateSalesFile(
    file: UploadedFile,
  ): Promise<ParsedSalesData> {
    return await parseAndValidateSalesFile(file, this.prisma);
  }

  async validateSalesItems(
    items: SalesRecordItemDto[],
  ): Promise<ParsedSalesData> {
    return await validateSalesItems(items, this.prisma);
  }

  /**
   * Xác nhận ghi đè và nạp dữ liệu bán hàng trong Tier 3 ACID Transaction (UC-04, BR-14, BR-15, INV-SALE-04).
   * Xóa dữ liệu cũ các ngày trùng lặp (deleteMany) và chèn hàng loạt bản ghi mới (createMany).
   */
  async confirmSales(
    file?: UploadedFile,
    body?: ConfirmSalesDto,
  ): Promise<SalesConfirmResponseDto> {
    let data: ParsedSalesData;

    if (file && file.buffer && file.buffer.length > 0) {
      data = await this.parseAndValidateSalesFile(file);
    } else if (body?.items && body.items.length > 0) {
      data = await this.validateSalesItems(body.items);
    } else {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'Vui lòng tải lên tệp CSV hoặc cung cấp danh sách bản ghi bán hàng.',
      });
    }

    const { parsedRows, existingProducts, duplicateDatesFound } = data;

    const productMap = new Map<string, bigint>(
      existingProducts.map((p) => [p.skuCode.toUpperCase(), p.id]),
    );

    const txResult = await this.prisma.$transaction(async (tx) => {
      let deletedCount = 0;
      if (duplicateDatesFound.length > 0) {
        const duplicateDateObjs = duplicateDatesFound.map(
          (d) => new Date(`${d}T00:00:00.000Z`),
        );
        const deleteResult = await tx.salesRecord.deleteMany({
          where: {
            saleDate: { in: duplicateDateObjs },
          },
        });
        deletedCount = deleteResult.count;
      }

      const recordsToInsert = parsedRows.map((r) => {
        const productId = productMap.get(r.skuCode.toUpperCase());
        if (!productId) {
          throw new BadRequestException({
            code: 'ALL_OR_NOTHING_IMPORT_FAILED',
            message: `Mã SKU ${r.skuCode} không tồn tại trong hệ thống.`,
          });
        }

        return {
          productId,
          saleDate: new Date(`${r.date}T00:00:00.000Z`),
          quantitySold: r.quantity,
          revenue: new Prisma.Decimal(r.revenue),
        };
      });

      const createResult = await tx.salesRecord.createMany({
        data: recordsToInsert,
      });

      return {
        importedCount: createResult.count,
        deletedCount,
        overwrittenDates: duplicateDatesFound,
      };
    });

    return {
      importedCount: txResult.importedCount,
      deletedCount: txResult.deletedCount,
      overwrittenDates: txResult.overwrittenDates,
      message:
        txResult.overwrittenDates.length > 0
          ? `Nạp dữ liệu bán hàng thành công. Đã ghi đè ${txResult.overwrittenDates.length} ngày trùng lặp và lưu mới ${txResult.importedCount} bản ghi.`
          : `Nạp dữ liệu bán hàng thành công. Đã lưu mới ${txResult.importedCount} bản ghi.`,
    };
  }

  /**
   * Thẩm định dữ liệu file CSV kiểm kê tồn kho theo nguyên tắc All-or-Nothing (UC-04, BR-14, BR-16, BR-18).
   */
  async validateInventoryFile(
    file: UploadedFile,
  ): Promise<InventoryValidateResponseDto> {
    const data = await this.parseAndValidateInventoryFile(file);
    return {
      isValid: true,
      totalRows: data.parsedRows.length,
      previewRows: data.previewRows,
    };
  }

  async parseAndValidateInventoryFile(
    file: UploadedFile,
  ): Promise<ParsedInventoryData> {
    return await parseAndValidateInventoryFile(file, this.prisma);
  }

  async validateInventoryItems(
    items: InventoryRecordItemDto[],
  ): Promise<ParsedInventoryData> {
    return await validateInventoryItems(items, this.prisma);
  }

  /**
   * Xác nhận cập nhật số lượng tồn kho trên kệ trong Tier 3 ACID Transaction (UC-04, BR-16, INV-INV-04, INV-INV-05).
   * Cập nhật current_inventory cho các SKU có trong tệp, bảo lưu tồn kho các SKU vắng mặt và bảo lưu nguyên vẹn on_order_quantity.
   */
  async confirmInventory(
    file?: UploadedFile,
    body?: ConfirmInventoryDto,
    username?: string,
  ): Promise<InventoryConfirmResponseDto> {
    let data: ParsedInventoryData;

    if (file && file.buffer && file.buffer.length > 0) {
      data = await this.parseAndValidateInventoryFile(file);
    } else if (body?.items && body.items.length > 0) {
      data = await this.validateInventoryItems(body.items);
    } else {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message:
          'Vui lòng tải lên tệp CSV hoặc cung cấp danh sách bản ghi kiểm kê.',
      });
    }

    const { parsedRows, existingProducts } = data;

    const productMap = new Map<
      string,
      { id: bigint; skuCode: string; currentInventory: number }
    >(existingProducts.map((p) => [p.skuCode.toUpperCase(), p]));

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    await this.prisma.$transaction(async (tx) => {
      for (const row of parsedRows) {
        const product = productMap.get(row.skuCode.toUpperCase());
        if (!product) {
          throw new BadRequestException({
            code: 'ALL_OR_NOTHING_IMPORT_FAILED',
            message: `Mã SKU ${row.skuCode} không tồn tại trong hệ thống.`,
          });
        }

        // Cập nhật tồn kho kệ hiện hành (bảo lưu on_order_quantity)
        await tx.product.update({
          where: { id: product.id },
          data: { currentInventory: row.stockQuantity },
        });

        // Ghi vết bản ghi kiểm kê độc lập theo ngày (INV-INV-05)
        await tx.inventorySnapshot.upsert({
          where: {
            productId_snapshotDate: {
              productId: product.id,
              snapshotDate: todayDate,
            },
          },
          update: {
            countedQuantity: row.stockQuantity,
            countedBy: username || 'Store Manager',
          },
          create: {
            productId: product.id,
            snapshotDate: todayDate,
            countedQuantity: row.stockQuantity,
            countedBy: username || 'Store Manager',
          },
        });
      }
    });

    return {
      updatedCount: parsedRows.length,
      message: `Cập nhật số liệu kiểm kê thành công cho ${parsedRows.length} sản phẩm.`,
    };
  }
}
