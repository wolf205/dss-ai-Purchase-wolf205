export type ImportType = 'sales' | 'inventory';

export type WorkflowStep = 'upload' | 'preview' | 'error' | 'success';

export interface SalesPreviewRow {
  date: string;
  skuCode: string;
  quantity: number;
  revenue: number;
}

export interface SalesValidateResponse {
  isValid: boolean;
  totalRows: number;
  duplicateDatesFound: string[];
  previewRows: SalesPreviewRow[];
}

export interface SalesConfirmResponse {
  importedCount: number;
  deletedCount: number;
  overwrittenDates: string[];
  message: string;
}

export interface InventoryPreviewRow {
  skuCode: string;
  stockQuantity: number;
  currentInventory?: number;
  difference?: number;
}

export interface InventoryValidateResponse {
  isValid: boolean;
  totalRows: number;
  previewRows: InventoryPreviewRow[];
}

export interface InventoryConfirmResponse {
  updatedCount: number;
  message: string;
}

export interface ImportErrorDetail {
  row: number;
  skuCode?: string;
  issue: string;
}

export interface ImportValidationErrorPayload {
  code: string;
  message: string;
  details: ImportErrorDetail[];
}

export interface TemplateInfo {
  type: ImportType;
  title: string;
  filename: string;
  description: string;
  requiredColumns: string[];
  exampleRow: string;
}
