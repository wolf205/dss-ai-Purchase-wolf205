export interface PendingPoLineItem {
  id: string; // po_line_items.id
  productId: string;
  skuCode: string;
  productName: string;
  barcode?: string | null;
  unit: string;
  orderedQuantity: number;
  historicalUnitPrice: number;
  lineTotal: number;
}

export interface PendingPoSummary {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  approvalDate: string;
  expectedDeliveryDate: string;
  totalAmount: number;
  isOverdue: boolean;
  daysOverdue: number;
  totalLines: number;
  lineItems: PendingPoLineItem[];
}

export interface PendingPoQueryFilters {
  page?: number;
  limit?: number;
  supplierId?: string;
  search?: string;
}

export interface ReceiptLineItemInput {
  poLineItemId: number;
  skuId: number;
  receivedQuantity: number;
}

export interface CreateGoodsReceiptPayload {
  purchaseOrderId: number;
  receiptDate: string; // YYYY-MM-DD
  note?: string;
  lines: ReceiptLineItemInput[];
}

export interface ReceiptLineItemResponse {
  id: string;
  poLineItemId: string;
  productId: string;
  skuCode: string;
  productName: string;
  unit: string;
  orderedQuantity: number;
  receivedQuantity: number;
  historicalUnitPrice: number;
  lineReceivedTotal: number;
  itemFulfillmentRate: number;
  createdAt: string;
}

export interface SupplierPerformanceUpdate {
  supplierId: string;
  completedOrderCount: number;
  performanceScore: number;
  allTimePerformanceScore: number;
  performanceLabel: string;
}

export interface GoodsReceiptResponse {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  actualDeliveryDate: string;
  expectedDeliveryDate: string;
  daysLate: number;
  isOnTime: boolean;
  onTimeFactor: number;
  overallFulfillmentRate: number;
  orderPerformanceScore: number;
  notes?: string | null;
  receivedBy: string;
  createdAt: string;
  lines: ReceiptLineItemResponse[];
  supplierPerformance: SupplierPerformanceUpdate;
}

export interface LineReceiptState {
  poLineItemId: number;
  skuId: number;
  skuCode: string;
  productName: string;
  unit: string;
  barcode?: string | null;
  historicalUnitPrice: number;
  orderedQuantity: number;
  receivedQuantity: number;
  // Computed values
  lineReceivedTotal: number;
  fulfillmentRate: number;
  isOverDelivered: boolean;
  isUnderDelivered: boolean;
  isZero: boolean;
}

export const COMMON_RECEIPT_NOTES = [
  'Giao hàng đúng hẹn, bao bì nguyên vẹn',
  'NCC hết hàng cục bộ, giao thiếu theo thỏa thuận',
  'Hàng bị móp méo/hỏng khi bốc dỡ, đã từ chối nhận tại chỗ',
  'NCC tặng kèm hàng mẫu/khuyến mãi (giao vượt)',
  'Quy cách đóng thùng tròn lốc thừa so với PO ban đầu',
] as const;
