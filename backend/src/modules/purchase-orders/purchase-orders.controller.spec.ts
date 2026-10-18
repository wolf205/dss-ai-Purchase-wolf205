import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersController', () => {
  let controller: PurchaseOrdersController;
  let service: jest.Mocked<PurchaseOrdersService>;

  const mockDetailResponse = {
    id: '201',
    poNumber: 'PO-20261018-001',
    sessionId: '105',
    sessionCode: 'REC-20261018-001',
    supplierId: '3',
    supplierCode: 'NCC-THM',
    supplierName: 'Công ty Cổ phần Sữa TH',
    status: 'Approved',
    approvalDate: '2026-10-18',
    historicalLeadTimeDays: 2,
    expectedDeliveryDate: '2026-10-20',
    totalAmount: 1550000,
    totalLines: 1,
    isOverdue: false,
    cancellationReason: null,
    cancelledAt: null,
    lastExportedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    supplier: {
      id: '3',
      supplierCode: 'NCC-THM',
      supplierName: 'Công ty Cổ phần Sữa TH',
      contactPerson: 'Nguyễn Văn A',
      phoneNumber: '0901234567',
      email: 'th@milk.vn',
      address: 'Hà Nội',
    },
    lineItems: [
      {
        id: '1',
        productId: '12',
        skuCode: 'MILK-TH-1L',
        productName: 'Sữa tươi TH True Milk 1L',
        barcode: '8934673200025',
        unit: 'Hộp',
        quantity: 50,
        historicalUnitPrice: 31000,
        historicalMoq: 20,
        lineTotal: 1550000,
      },
    ],
  };

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      cancel: jest.fn(),
      export: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseOrdersController],
      providers: [
        {
          provide: PurchaseOrdersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<PurchaseOrdersController>(PurchaseOrdersController);
    service = module.get(PurchaseOrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return enveloped list of purchase orders', async () => {
      service.findAll.mockResolvedValue({
        items: [mockDetailResponse],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
      });

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.meta.pagination).toEqual({
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
      });
    });
  });

  describe('findOne', () => {
    it('should return enveloped detail of purchase order', async () => {
      service.findOne.mockResolvedValue(mockDetailResponse);

      const result = await controller.findOne('201');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('201');
      expect(result.data.poNumber).toBe('PO-20261018-001');
    });
  });

  describe('cancel', () => {
    it('should cancel purchase order and return enveloped result', async () => {
      service.cancel.mockResolvedValue({
        ...mockDetailResponse,
        status: 'Cancelled',
        cancellationReason: 'NCC báo hết hàng',
      });

      const result = await controller.cancel('201', {
        cancellationReason: 'NCC báo hết hàng',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('Cancelled');
      expect(result.data.cancellationReason).toBe('NCC báo hết hàng');
    });
  });

  describe('export', () => {
    it('should stream export file buffer with correct headers', async () => {
      const mockBuffer = Buffer.from('test,csv\r\n', 'utf-8');
      service.export.mockResolvedValue({
        buffer: mockBuffer,
        mimeType: 'text/csv; charset=utf-8',
        fileName: 'PO-20261018-001.csv',
      });

      const mockRes = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as unknown as Response;

      await controller.export('201', { format: 'excel' }, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv; charset=utf-8',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="PO-20261018-001.csv"',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        mockBuffer.length,
      );
      expect(mockRes.end).toHaveBeenCalledWith(mockBuffer);
    });
  });
});
