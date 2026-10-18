export type PurchaseOrderStatus = 'Approved' | 'Completed' | 'Cancelled';

export interface PurchaseOrderSummary {
  id: string;
  poNumber: string;
  sessionId: string;
  sessionCode?: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  status: PurchaseOrderStatus | string;
  approvalDate: string;
  historicalLeadTimeDays: number;
  expectedDeliveryDate: string;
  totalAmount: number;
  totalLines: number;
  isOverdue: boolean;
  cancellationReason: string | null;
  cancelledAt: string | null;
  lastExportedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderLineItem {
  id: string;
  productId: string;
  skuCode: string;
  productName: string;
  barcode: string | null;
  unit: string;
  quantity: number;
  historicalUnitPrice: number;
  historicalMoq: number;
  lineTotal: number;
}

export interface PurchaseOrderSupplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
}

export interface PurchaseOrderDetail extends PurchaseOrderSummary {
  supplier: PurchaseOrderSupplier;
  lineItems: PurchaseOrderLineItem[];
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PurchaseOrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  supplierId?: string;
  isOverdue?: boolean | 'all';
  search?: string;
}

export interface CancelPurchaseOrderRequest {
  cancellationReason: string;
}

export interface SupplierOption {
  id: string;
  supplierCode: string;
  supplierName: string;
}

export const CANCELLATION_REASONS = [
  'NCC báo hết hàng',
  'NCC không liên lạc được',
  'Cửa hàng thay đổi kế hoạch',
  'Lỗi nhập sai số lượng',
  'Khác',
] as const;

export type StandardCancellationReason = (typeof CANCELLATION_REASONS)[number];
