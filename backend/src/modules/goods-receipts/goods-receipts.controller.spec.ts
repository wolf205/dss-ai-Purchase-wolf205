import { Test, TestingModule } from '@nestjs/testing';
import { GoodsReceiptsController } from './goods-receipts.controller';
import { GoodsReceiptsService } from './goods-receipts.service';
import { AuthenticatedUser } from '../auth/interfaces/auth-payload.interface';
import { Role } from '../../common/enums/role.enum';
import { CreateGoodsReceiptDto } from './dto/create-goods-receipt.dto';

describe('GoodsReceiptsController', () => {
  let controller: GoodsReceiptsController;
  let service: jest.Mocked<GoodsReceiptsService>;

  const mockUser: AuthenticatedUser = {
    id: '1',
    username: 'staff01',
    role: Role.PURCHASING_STAFF,
  };

  const mockGoodsReceiptResponse = {
    id: '301',
    receiptNumber: 'GR-20261017-001',
    purchaseOrderId: '201',
    poNumber: 'PO-20261015-001',
    supplierId: '3',
    supplierName: 'Công ty Cổ phần Sữa TH',
    supplierCode: 'SUP-TH',
    actualDeliveryDate: '2026-10-17',
    expectedDeliveryDate: '2026-10-17',
    daysLate: 0,
    isOnTime: true,
    onTimeFactor: 1.0,
    overallFulfillmentRate: 1.0,
    orderPerformanceScore: 1.0,
    notes: 'Đúng hạn',
    receivedBy: 'staff01',
    createdAt: new Date().toISOString(),
    lines: [
      {
        id: '801',
        poLineItemId: '501',
        productId: '12',
        skuCode: 'MILK-TH-1L',
        productName: 'Sữa tươi TH True Milk 1L',
        unit: 'Hộp',
        orderedQuantity: 50,
        receivedQuantity: 50,
        historicalUnitPrice: 32000,
        lineReceivedTotal: 1600000,
        itemFulfillmentRate: 1.0,
        createdAt: new Date().toISOString(),
      },
    ],
    supplierPerformance: {
      supplierId: '3',
      completedOrderCount: 1,
      performanceScore: 0.8,
      allTimePerformanceScore: 1.0,
      performanceLabel: '[NCC Mới - Điểm khởi tạo: 80%]',
    },
  };

  beforeEach(async () => {
    const mockService = {
      getPendingPurchaseOrders: jest.fn(),
      confirmGoodsReceipt: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoodsReceiptsController],
      providers: [{ provide: GoodsReceiptsService, useValue: mockService }],
    }).compile();

    controller = module.get<GoodsReceiptsController>(GoodsReceiptsController);
    service = module.get(GoodsReceiptsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPendingPurchaseOrders', () => {
    it('nên trả về danh sách PO pending với envelope chuẩn', async () => {
      service.getPendingPurchaseOrders.mockResolvedValue({
        items: [],
        totalItems: 0,
        totalPages: 1,
      });

      const result = await controller.getPendingPurchaseOrders({
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.meta.pagination?.totalItems).toBe(0);
    });
  });

  describe('confirmGoodsReceipt', () => {
    it('nên gọi service.confirmGoodsReceipt và trả về kết quả trong envelope chuẩn', async () => {
      service.confirmGoodsReceipt.mockResolvedValue(mockGoodsReceiptResponse);

      const dto: CreateGoodsReceiptDto = {
        purchaseOrderId: 201,
        receiptDate: '2026-10-17',
        lines: [{ poLineItemId: 501, skuId: 12, receivedQuantity: 50 }],
      };

      const result = await controller.confirmGoodsReceipt(dto, mockUser);

      expect(result.success).toBe(true);
      expect(result.data.receiptNumber).toBe('GR-20261017-001');
      expect(service.confirmGoodsReceipt).toHaveBeenCalledWith(dto, 'staff01');
    });
  });

  describe('findOne', () => {
    it('nên trả về chi tiết phiếu nhận hàng theo id', async () => {
      service.findOne.mockResolvedValue(mockGoodsReceiptResponse);

      const result = await controller.findOne('301');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('301');
      expect(service.findOne).toHaveBeenCalledWith('301');
    });
  });
});
