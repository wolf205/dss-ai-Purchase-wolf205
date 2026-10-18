import {
  exportPoToCsv,
  exportPoToHtmlPrint,
  exportPurchaseOrder,
  formatCurrencyVND,
  formatDateVN,
} from './po-exporter.helper';
import { PurchaseOrderWithRelations } from '../interfaces/purchase-order.interface';
import { Prisma } from '@prisma/client';

describe('po-exporter.helper', () => {
  const mockPo: PurchaseOrderWithRelations = {
    id: BigInt(201),
    poNumber: 'PO-20261018-001',
    sessionId: BigInt(105),
    supplierId: BigInt(3),
    status: 'Approved',
    approvalDate: new Date('2026-10-18'),
    historicalLeadTimeDays: 2,
    expectedDeliveryDate: new Date('2026-10-20'),
    totalAmount: new Prisma.Decimal('1550000.00'),
    cancellationReason: null,
    cancelledAt: null,
    lastExportedAt: null,
    createdAt: new Date('2026-10-18T08:00:00.000Z'),
    updatedAt: new Date('2026-10-18T08:00:00.000Z'),
    supplier: {
      id: BigInt(3),
      supplierCode: 'NCC-THM',
      supplierName: 'Công ty Cổ phần Sữa TH',
      contactPerson: 'Nguyễn Văn A',
      phoneNumber: '0901234567',
      email: 'th@milk.vn',
      address: 'Hà Nội',
      committedLeadTimeDays: 2,
      status: 'Active',
      performanceScore: new Prisma.Decimal('0.9000'),
      allTimePerformanceScore: new Prisma.Decimal('0.9000'),
      completedOrderCount: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: BigInt(105),
      sessionCode: 'REC-20261018-001',
    },
    lineItems: [
      {
        id: BigInt(1),
        poId: BigInt(201),
        productId: BigInt(12),
        quantity: 50,
        historicalUnitPrice: new Prisma.Decimal('31000.00'),
        historicalMoq: 20,
        lineTotal: new Prisma.Decimal('1550000.00'),
        createdAt: new Date(),
        product: {
          id: BigInt(12),
          skuCode: 'MILK-TH-1L',
          productName: 'Sữa tươi TH True Milk 1L',
          barcode: '8934673200025',
          unit: 'Hộp',
        },
      },
    ],
  };

  describe('format helpers', () => {
    it('formatCurrencyVND formats correctly', () => {
      const res = formatCurrencyVND(1550000);
      expect(res).toContain('1.550.000');
      expect(res).toContain('đ');
    });

    it('formatDateVN formats correctly', () => {
      const res = formatDateVN(new Date('2026-10-18'));
      expect(res).toContain('2026');
    });
  });

  describe('exportPoToCsv', () => {
    it('should generate valid UTF-8 BOM CSV data', () => {
      const res = exportPoToCsv(mockPo);
      expect(res.mimeType).toBe('text/csv; charset=utf-8');
      expect(res.fileName).toBe('PO-20261018-001.csv');

      const content = res.buffer.toString('utf-8');
      expect(content.charCodeAt(0)).toBe(0xfeff); // BOM
      expect(content).toContain('PO-20261018-001');
      expect(content).toContain('MILK-TH-1L');
      expect(content).toContain('1550000');
    });
  });

  describe('exportPoToHtmlPrint', () => {
    it('should generate valid HTML voucher data', () => {
      const res = exportPoToHtmlPrint(mockPo);
      expect(res.mimeType).toBe('text/html; charset=utf-8');
      expect(res.fileName).toBe('PO-20261018-001.html');

      const content = res.buffer.toString('utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('PO-20261018-001');
      expect(content).toContain('Sữa tươi TH True Milk 1L');
      expect(content).toContain('Hộp');
    });
  });

  describe('exportPurchaseOrder selector', () => {
    it('should delegate to CSV when format is excel', () => {
      const res = exportPurchaseOrder(mockPo, 'excel');
      expect(res.fileName.endsWith('.csv')).toBe(true);
    });

    it('should delegate to HTML print when format is pdf', () => {
      const res = exportPurchaseOrder(mockPo, 'pdf');
      expect(res.fileName.endsWith('.html')).toBe(true);
    });
  });
});
