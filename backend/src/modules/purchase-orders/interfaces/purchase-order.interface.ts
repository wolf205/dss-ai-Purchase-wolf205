import { Prisma } from '@prisma/client';

export type PurchaseOrderWithRelations = Prisma.PurchaseOrderGetPayload<{
  include: {
    supplier: true;
    session: {
      select: {
        id: true;
        sessionCode: true;
      };
    };
    lineItems: {
      include: {
        product: {
          select: {
            id: true;
            skuCode: true;
            productName: true;
            barcode: true;
            unit: true;
          };
        };
      };
    };
  };
}>;

export interface PurchaseOrderItemSummary {
  id: string;
  poNumber: string;
  sessionId: string;
  sessionCode?: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  status: string;
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

export interface PoExportData {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}
