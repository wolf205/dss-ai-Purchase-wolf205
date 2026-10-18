import { Test, TestingModule } from '@nestjs/testing';
import { DataImportController } from './data-import.controller';
import { DataImportService } from './data-import.service';
import { Response } from 'express';
import { UploadedFile } from './interfaces/uploaded-file.interface';
import { SalesValidateResponseDto } from './dto/sales-validate-response.dto';
import { SalesConfirmResponseDto } from './dto/sales-confirm-response.dto';
import { ConfirmSalesDto } from './dto/confirm-sales.dto';
import { InventoryValidateResponseDto } from './dto/inventory-validate-response.dto';
import { InventoryConfirmResponseDto } from './dto/inventory-confirm-response.dto';
import { ConfirmInventoryDto } from './dto/confirm-inventory.dto';
import { AuthenticatedUser } from '../auth/interfaces/auth-payload.interface';
import { Role } from '../../common/enums/role.enum';

describe('DataImportController', () => {
  let controller: DataImportController;
  let service: DataImportService;

  const mockValidateResponse: SalesValidateResponseDto = {
    isValid: true,
    totalRows: 2,
    duplicateDatesFound: ['2026-09-14'],
    previewRows: [
      {
        date: '2026-09-14',
        skuCode: 'MILK-TH-1L',
        quantity: 18,
        revenue: 576000,
      },
      {
        date: '2026-09-14',
        skuCode: 'SNK-LAY-50G',
        quantity: 25,
        revenue: 375000,
      },
    ],
  };

  const mockConfirmResponse: SalesConfirmResponseDto = {
    importedCount: 2,
    deletedCount: 1,
    overwrittenDates: ['2026-09-14'],
    message:
      'Nạp dữ liệu bán hàng thành công. Đã ghi đè 1 ngày trùng lặp và lưu mới 2 bản ghi.',
  };

  const mockInventoryValidateResponse: InventoryValidateResponseDto = {
    isValid: true,
    totalRows: 2,
    previewRows: [
      {
        skuCode: 'BEV-COCA-330',
        stockQuantity: 120,
        currentInventory: 100,
        difference: 20,
      },
      {
        skuCode: 'SNK-LAY-50G',
        stockQuantity: 80,
        currentInventory: 80,
        difference: 0,
      },
    ],
  };

  const mockInventoryConfirmResponse: InventoryConfirmResponseDto = {
    updatedCount: 2,
    message: 'Cập nhật số liệu kiểm kê thành công cho 2 sản phẩm.',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataImportController],
      providers: [
        {
          provide: DataImportService,
          useValue: {
            getTemplate: jest.fn().mockReturnValue({
              filename: 'sales_template.csv',
              content: 'Date,SKU,Quantity,Revenue\n',
            }),
            validateSalesFile: jest
              .fn()
              .mockResolvedValue(mockValidateResponse),
            confirmSales: jest.fn().mockResolvedValue(mockConfirmResponse),
            validateInventoryFile: jest
              .fn()
              .mockResolvedValue(mockInventoryValidateResponse),
            confirmInventory: jest
              .fn()
              .mockResolvedValue(mockInventoryConfirmResponse),
          },
        },
      ],
    }).compile();

    controller = module.get<DataImportController>(DataImportController);
    service = module.get<DataImportService>(DataImportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('downloadTemplate', () => {
    it('should set headers and stream CSV content to response', () => {
      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn().mockImplementation((val) => val),
      } as unknown as Response;

      controller.downloadTemplate('sales', mockRes);

      expect(service.getTemplate).toHaveBeenCalledWith('sales');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv; charset=utf-8',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="sales_template.csv"',
      );
      expect(mockRes.send).toHaveBeenCalledWith('Date,SKU,Quantity,Revenue\n');
    });
  });

  describe('validateSales', () => {
    it('should call service.validateSalesFile with uploaded file and return validation result', async () => {
      const mockFile: UploadedFile = {
        fieldname: 'file',
        originalname: 'sales.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from('Date,SKU,Quantity,Revenue\n'),
        size: 26,
      };

      const result = await controller.validateSales(mockFile);

      expect(service.validateSalesFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockValidateResponse);
      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.duplicateDatesFound).toEqual(['2026-09-14']);
    });
  });

  describe('confirmSales', () => {
    it('should call service.confirmSales with uploaded file and return confirm result', async () => {
      const mockFile: UploadedFile = {
        fieldname: 'file',
        originalname: 'sales.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from('Date,SKU,Quantity,Revenue\n'),
        size: 26,
      };

      const result = await controller.confirmSales(mockFile, undefined);

      expect(service.confirmSales).toHaveBeenCalledWith(mockFile, undefined);
      expect(result).toEqual(mockConfirmResponse);
      expect(result.importedCount).toBe(2);
      expect(result.deletedCount).toBe(1);
      expect(result.overwrittenDates).toEqual(['2026-09-14']);
    });

    it('should call service.confirmSales with JSON body items and return confirm result', async () => {
      const body: ConfirmSalesDto = {
        items: [
          {
            date: '2026-09-14',
            skuCode: 'BEV-COCA-330',
            quantity: 50,
            revenue: 500000,
          },
        ],
      };

      const result = await controller.confirmSales(undefined, body);

      expect(service.confirmSales).toHaveBeenCalledWith(undefined, body);
      expect(result).toEqual(mockConfirmResponse);
    });
  });

  describe('validateInventory', () => {
    it('should call service.validateInventoryFile with uploaded file and return validation result', async () => {
      const mockFile: UploadedFile = {
        fieldname: 'file',
        originalname: 'inventory.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from('SKU,StockQuantity\nBEV-COCA-330,120\n'),
        size: 35,
      };

      const result = await controller.validateInventory(mockFile);

      expect(service.validateInventoryFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockInventoryValidateResponse);
      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.previewRows[0].difference).toBe(20);
    });
  });

  describe('confirmInventory', () => {
    it('should call service.confirmInventory with uploaded file, user and return confirm result', async () => {
      const mockFile: UploadedFile = {
        fieldname: 'file',
        originalname: 'inventory.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from('SKU,StockQuantity\nBEV-COCA-330,120\n'),
        size: 35,
      };
      const mockUser: AuthenticatedUser = {
        id: '1',
        username: 'manager_wolf',
        role: Role.STORE_MANAGER,
      };

      const result = await controller.confirmInventory(
        mockFile,
        undefined,
        mockUser,
      );

      expect(service.confirmInventory).toHaveBeenCalledWith(
        mockFile,
        undefined,
        'manager_wolf',
      );
      expect(result).toEqual(mockInventoryConfirmResponse);
      expect(result.updatedCount).toBe(2);
    });

    it('should call service.confirmInventory with JSON body items and return confirm result', async () => {
      const body: ConfirmInventoryDto = {
        items: [
          {
            skuCode: 'BEV-COCA-330',
            stockQuantity: 120,
          },
        ],
      };

      const result = await controller.confirmInventory(
        undefined,
        body,
        undefined,
      );

      expect(service.confirmInventory).toHaveBeenCalledWith(
        undefined,
        body,
        undefined,
      );
      expect(result).toEqual(mockInventoryConfirmResponse);
    });
  });
});
