import { SalesPreviewRowDto } from '../dto/sales-validate-response.dto';
import { InventoryPreviewRowDto } from '../dto/inventory-validate-response.dto';

export interface DownloadTemplateResult {
  filename: string;
  content: string;
}

export interface ParsedSalesRow {
  row: number;
  date: string;
  skuCode: string;
  quantity: number;
  revenue: number;
}

export interface ParsedSalesData {
  parsedRows: ParsedSalesRow[];
  existingProducts: Array<{ id: bigint; skuCode: string }>;
  datesInFile: Set<string>;
  duplicateDatesFound: string[];
  previewRows: SalesPreviewRowDto[];
}

export interface ParsedInventoryRow {
  row: number;
  skuCode: string;
  stockQuantity: number;
}

export interface ParsedInventoryData {
  parsedRows: ParsedInventoryRow[];
  existingProducts: Array<{
    id: bigint;
    skuCode: string;
    currentInventory: number;
  }>;
  previewRows: InventoryPreviewRowDto[];
}
