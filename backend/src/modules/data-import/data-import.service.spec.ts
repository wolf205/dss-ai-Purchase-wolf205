import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  DataImportService,
  INVENTORY_TEMPLATE_CSV,
  SALES_TEMPLATE_CSV,
} from './data-import.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadedFile } from './interfaces/uploaded-file.interface';

describe('DataImportService', () => {
  let service: DataImportService;
  let prisma: PrismaService;

  const mockTx = {
    salesRecord: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    product: {
      update: jest.fn(),
    },
    inventorySnapshot: {
      upsert: jest.fn(),
    },
  };

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
    },
    salesRecord: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(
      async (cb: (tx: typeof mockTx) => Promise<unknown>) => {
        if (typeof cb === 'function') {
          return await cb(mockTx);
        }
        return cb;
      },
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataImportService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DataImportService>(DataImportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('getTemplate', () => {
    it('should return sales CSV template with BR-14 columns (Date,SKU,Quantity,Revenue)', () => {
      const result = service.getTemplate('sales');

      expect(result.filename).toBe('sales_template.csv');
      expect(result.content).toBe(SALES_TEMPLATE_CSV);
      expect(result.content).toContain('Date,SKU,Quantity,Revenue');
      expect(result.content).toContain('BEV-COCA-330');
    });

    it('should return inventory CSV template with BR-14 columns (SKU,StockQuantity)', () => {
      const result = service.getTemplate('inventory');

      expect(result.filename).toBe('inventory_template.csv');
      expect(result.content).toBe(INVENTORY_TEMPLATE_CSV);
      expect(result.content).toContain('SKU,StockQuantity');
      expect(result.content).toContain('BEV-COCA-330');
    });

    it('should handle case insensitivity and whitespace', () => {
      const result = service.getTemplate('  SALES  ');

      expect(result.filename).toBe('sales_template.csv');
      expect(result.content).toBe(SALES_TEMPLATE_CSV);
    });

    it('should throw BadRequestException (VALIDATION_ERROR) for invalid template type', () => {
      expect(() => service.getTemplate('customers')).toThrow(
        BadRequestException,
      );

      try {
        service.getTemplate('invalid');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const response = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(response.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  const createMockFile = (
    content: string,
    filename = 'sales.csv',
  ): UploadedFile => ({
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype: 'text/csv',
    buffer: Buffer.from(content, 'utf-8'),
    size: Buffer.byteLength(content),
  });

  describe('validateSalesFile', () => {
    it('should successfully validate 100% valid sales CSV and return preview and duplicateDatesFound (BR-14, BR-15)', async () => {
      const csv = `Date,SKU,Quantity,Revenue
2026-09-14,MILK-TH-1L,18,576000
2026-09-14,SNK-LAY-50G,25,375000
`;
      const file = createMockFile(csv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { skuCode: 'MILK-TH-1L', status: 'Active' },
        { skuCode: 'SNK-LAY-50G', status: 'Active' },
      ]);

      mockPrismaService.salesRecord.findMany.mockResolvedValue([
        { saleDate: new Date('2026-09-14T00:00:00.000Z') },
      ]);

      const result = await service.validateSalesFile(file);

      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.duplicateDatesFound).toEqual(['2026-09-14']);
      expect(result.previewRows).toEqual([
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
      ]);
    });

    it('should accept Inactive SKU per BR-18 (operational data continuity)', async () => {
      const csv = `Date,SKU,Quantity,Revenue
2026-09-14,OLD-DISCONTINUED-SKU,5,100000
`;
      const file = createMockFile(csv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { skuCode: 'OLD-DISCONTINUED-SKU', status: 'Inactive' },
      ]);
      mockPrismaService.salesRecord.findMany.mockResolvedValue([]);

      const result = await service.validateSalesFile(file);

      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(1);
    });

    it('should throw BadRequestException (VALIDATION_ERROR) when file is empty or missing buffer', async () => {
      const emptyFile: UploadedFile = {
        fieldname: 'file',
        originalname: 'sales.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        buffer: Buffer.from(''),
        size: 0,
      };

      try {
        await service.validateSalesFile(emptyFile);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should throw BadRequestException (VALIDATION_ERROR) when file extension is not .csv', async () => {
      const file = createMockFile('Date,SKU,Quantity,Revenue\n', 'sales.pdf');

      try {
        await service.validateSalesFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should throw BadRequestException (VALIDATION_ERROR) when header is missing required columns', async () => {
      const csv = `Date,SKU,Quantity
2026-09-14,MILK-TH-1L,18
`;
      const file = createMockFile(csv);

      try {
        await service.validateSalesFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('VALIDATION_ERROR');
        expect(res.message).toContain('Cấu trúc tệp không hợp lệ');
      }
    });

    it('should throw BadRequestException (ALL_OR_NOTHING_IMPORT_FAILED) when SKU does not exist in DB', async () => {
      const csv = `Date,SKU,Quantity,Revenue
2026-09-14,NON_EXISTENT_SKU,10,200000
`;
      const file = createMockFile(csv);

      mockPrismaService.product.findMany.mockResolvedValue([]);

      try {
        await service.validateSalesFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{
          row: number;
          skuCode: string;
          issue: string;
        }>;
        expect(details.length).toBe(1);
        expect(details[0].row).toBe(2);
        expect(details[0].skuCode).toBe('NON_EXISTENT_SKU');
        expect(details[0].issue).toContain(
          'Mã SKU không tồn tại trong hệ thống',
        );
      }
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED when date is in the future (> Today)', async () => {
      const prevAllowFuture = process.env.ALLOW_FUTURE_SALES_IN_DEV;
      delete process.env.ALLOW_FUTURE_SALES_IN_DEV;

      const futureDate = '2099-12-31';
      const csv = `Date,SKU,Quantity,Revenue
${futureDate},MILK-TH-1L,10,200000
`;
      const file = createMockFile(csv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { skuCode: 'MILK-TH-1L', status: 'Active' },
      ]);

      try {
        await service.validateSalesFile(file);
        throw new Error('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{ row: number; issue: string }>;
        expect(details[0].issue).toContain('tương lai');
      } finally {
        if (prevAllowFuture !== undefined) {
          process.env.ALLOW_FUTURE_SALES_IN_DEV = prevAllowFuture;
        }
      }
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED when quantity is negative or zero or not an integer', async () => {
      const csv = `Date,SKU,Quantity,Revenue
2026-09-14,MILK-TH-1L,-5,200000
2026-09-14,MILK-TH-2L,0,200000
2026-09-14,MILK-TH-3L,1.5,200000
`;
      const file = createMockFile(csv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { skuCode: 'MILK-TH-1L', status: 'Active' },
        { skuCode: 'MILK-TH-2L', status: 'Active' },
        { skuCode: 'MILK-TH-3L', status: 'Active' },
      ]);

      try {
        await service.validateSalesFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{ row: number; issue: string }>;
        expect(details.length).toBe(3);
        expect(details[0].issue).toContain('số nguyên dương lớn hơn 0');
      }
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED when revenue is negative', async () => {
      const csv = `Date,SKU,Quantity,Revenue
2026-09-14,MILK-TH-1L,10,-50000
`;
      const file = createMockFile(csv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { skuCode: 'MILK-TH-1L', status: 'Active' },
      ]);

      try {
        await service.validateSalesFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{ row: number; issue: string }>;
        expect(details[0].issue).toContain('Doanh thu không được là số âm');
      }
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED when internal file contains duplicate (Date, SKU) pair', async () => {
      const csv = `Date,SKU,Quantity,Revenue
2026-09-14,MILK-TH-1L,10,200000
2026-09-14,MILK-TH-1L,5,100000
`;
      const file = createMockFile(csv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { skuCode: 'MILK-TH-1L', status: 'Active' },
      ]);

      try {
        await service.validateSalesFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{ row: number; issue: string }>;
        expect(details[0].issue).toContain('Trùng lặp dữ liệu nội bộ tệp');
      }
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED when a required cell is blank', async () => {
      const csv = `Date,SKU,Quantity,Revenue
2026-09-14,,10,200000
`;
      const file = createMockFile(csv);

      try {
        await service.validateSalesFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{ row: number; issue: string }>;
        expect(details[0].issue).toContain('Khuyết thiếu dữ liệu');
      }
    });
  });

  describe('confirmSales', () => {
    const validCsv = `Date,SKU,Quantity,Revenue
2026-09-14,BEV-COCA-330,50,500000
2026-09-14,SNK-LAY-50G,25,375000
2026-09-15,BEV-COCA-330,45,450000
`;

    it('should confirm sales file, delete duplicate dates and createMany records in ACID transaction', async () => {
      const file = createMockFile(validCsv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(10), skuCode: 'BEV-COCA-330' },
        { id: BigInt(20), skuCode: 'SNK-LAY-50G' },
      ]);

      mockPrismaService.salesRecord.findMany.mockResolvedValue([
        { saleDate: new Date('2026-09-14T00:00:00.000Z') },
      ]);

      mockTx.salesRecord.deleteMany.mockResolvedValue({ count: 2 });
      mockTx.salesRecord.createMany.mockResolvedValue({ count: 3 });

      const result = await service.confirmSales(file);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTx.salesRecord.deleteMany).toHaveBeenCalledWith({
        where: {
          saleDate: { in: [new Date('2026-09-14T00:00:00.000Z')] },
        },
      });
      expect(mockTx.salesRecord.createMany).toHaveBeenCalledWith({
        data: [
          {
            productId: BigInt(10),
            saleDate: new Date('2026-09-14T00:00:00.000Z'),
            quantitySold: 50,
            revenue: expect.anything(),
          },
          {
            productId: BigInt(20),
            saleDate: new Date('2026-09-14T00:00:00.000Z'),
            quantitySold: 25,
            revenue: expect.anything(),
          },
          {
            productId: BigInt(10),
            saleDate: new Date('2026-09-15T00:00:00.000Z'),
            quantitySold: 45,
            revenue: expect.anything(),
          },
        ],
      });

      expect(result.importedCount).toBe(3);
      expect(result.deletedCount).toBe(2);
      expect(result.overwrittenDates).toEqual(['2026-09-14']);
      expect(result.message).toContain('Đã ghi đè 1 ngày trùng lặp');
    });

    it('should confirm sales file when no duplicate dates exist (insert only without delete)', async () => {
      const file = createMockFile(validCsv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(10), skuCode: 'BEV-COCA-330' },
        { id: BigInt(20), skuCode: 'SNK-LAY-50G' },
      ]);

      mockPrismaService.salesRecord.findMany.mockResolvedValue([]);
      mockTx.salesRecord.createMany.mockResolvedValue({ count: 3 });

      const result = await service.confirmSales(file);

      expect(mockTx.salesRecord.deleteMany).not.toHaveBeenCalled();
      expect(mockTx.salesRecord.createMany).toHaveBeenCalled();
      expect(result.importedCount).toBe(3);
      expect(result.deletedCount).toBe(0);
      expect(result.overwrittenDates).toEqual([]);
      expect(result.message).toContain('Đã lưu mới 3 bản ghi');
    });

    it('should confirm sales when JSON body items provided', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(10), skuCode: 'BEV-COCA-330' },
      ]);
      mockPrismaService.salesRecord.findMany.mockResolvedValue([]);
      mockTx.salesRecord.createMany.mockResolvedValue({ count: 1 });

      const result = await service.confirmSales(undefined, {
        items: [
          {
            date: '2026-09-15',
            skuCode: 'BEV-COCA-330',
            quantity: 45,
            revenue: 450000,
          },
        ],
      });

      expect(result.importedCount).toBe(1);
      expect(result.deletedCount).toBe(0);
    });

    it('should throw VALIDATION_ERROR when neither file nor items are provided', async () => {
      await expect(service.confirmSales(undefined, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED and not start transaction if validation fails', async () => {
      const invalidCsv = `Date,SKU,Quantity,Revenue
2026-09-14,UNKNOWN-SKU,10,200000
`;
      const file = createMockFile(invalidCsv);

      mockPrismaService.product.findMany.mockResolvedValue([]);

      await expect(service.confirmSales(file)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should propagate error and rollback if createMany fails in transaction', async () => {
      const file = createMockFile(validCsv);

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(10), skuCode: 'BEV-COCA-330' },
        { id: BigInt(20), skuCode: 'SNK-LAY-50G' },
      ]);
      mockPrismaService.salesRecord.findMany.mockResolvedValue([]);
      mockTx.salesRecord.createMany.mockRejectedValue(
        new Error('Database write error'),
      );

      await expect(service.confirmSales(file)).rejects.toThrow(
        'Database write error',
      );
    });
  });

  describe('validateInventoryFile', () => {
    const validInventoryCsv = `SKU,StockQuantity
BEV-COCA-330,120
SNK-LAY-50G,80
`;

    it('should successfully validate 100% valid inventory CSV and return preview with difference', async () => {
      const file = createMockFile(validInventoryCsv, 'inventory.csv');

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(1), skuCode: 'BEV-COCA-330', currentInventory: 100 },
        { id: BigInt(2), skuCode: 'SNK-LAY-50G', currentInventory: 80 },
      ]);

      const result = await service.validateInventoryFile(file);

      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.previewRows).toHaveLength(2);
      expect(result.previewRows[0]).toEqual({
        skuCode: 'BEV-COCA-330',
        stockQuantity: 120,
        currentInventory: 100,
        difference: 20,
      });
      expect(result.previewRows[1]).toEqual({
        skuCode: 'SNK-LAY-50G',
        stockQuantity: 80,
        currentInventory: 80,
        difference: 0,
      });
    });

    it('should throw VALIDATION_ERROR when inventory header is invalid', async () => {
      const badHeaderCsv = `SKU_CODE,QTY
BEV-COCA-330,120
`;
      const file = createMockFile(badHeaderCsv, 'inventory.csv');

      await expect(service.validateInventoryFile(file)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED when negative stock quantity is found', async () => {
      const negativeCsv = `SKU,StockQuantity
BEV-COCA-330,-5
`;
      const file = createMockFile(negativeCsv, 'inventory.csv');

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(1), skuCode: 'BEV-COCA-330', currentInventory: 100 },
      ]);

      try {
        await service.validateInventoryFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{ issue: string }>;
        expect(details[0].issue).toContain(
          'Số lượng tồn kho phải là số nguyên không âm',
        );
      }
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED when duplicate SKU inside file is found', async () => {
      const dupCsv = `SKU,StockQuantity
BEV-COCA-330,120
BEV-COCA-330,150
`;
      const file = createMockFile(dupCsv, 'inventory.csv');

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(1), skuCode: 'BEV-COCA-330', currentInventory: 100 },
      ]);

      try {
        await service.validateInventoryFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{ issue: string }>;
        expect(details[0].issue).toContain('Trùng lặp mã SKU nội bộ tệp');
      }
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED when SKU does not exist in DB', async () => {
      const unknownCsv = `SKU,StockQuantity
UNKNOWN-SKU,120
`;
      const file = createMockFile(unknownCsv, 'inventory.csv');

      mockPrismaService.product.findMany.mockResolvedValue([]);

      try {
        await service.validateInventoryFile(file);
        fail('Should have thrown BadRequestException');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        const res = (err as BadRequestException).getResponse() as Record<
          string,
          unknown
        >;
        expect(res.code).toBe('ALL_OR_NOTHING_IMPORT_FAILED');
        const details = res.details as Array<{ issue: string }>;
        expect(details[0].issue).toContain(
          'Mã SKU không tồn tại trong hệ thống',
        );
      }
    });
  });

  describe('confirmInventory', () => {
    const validInventoryCsv = `SKU,StockQuantity
BEV-COCA-330,120
SNK-LAY-50G,80
`;

    it('should confirm inventory file, update product currentInventory and upsert snapshot in transaction', async () => {
      const file = createMockFile(validInventoryCsv, 'inventory.csv');

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(1), skuCode: 'BEV-COCA-330', currentInventory: 100 },
        { id: BigInt(2), skuCode: 'SNK-LAY-50G', currentInventory: 60 },
      ]);

      mockTx.product.update.mockResolvedValue({});
      mockTx.inventorySnapshot.upsert.mockResolvedValue({});

      const result = await service.confirmInventory(
        file,
        undefined,
        'wolf_admin',
      );

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockTx.product.update).toHaveBeenCalledTimes(2);
      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { currentInventory: 120 },
      });
      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: BigInt(2) },
        data: { currentInventory: 80 },
      });

      expect(mockTx.inventorySnapshot.upsert).toHaveBeenCalledTimes(2);
      expect(mockTx.inventorySnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            countedQuantity: 120,
            countedBy: 'wolf_admin',
          }),
        }),
      );

      expect(result.updatedCount).toBe(2);
      expect(result.message).toContain(
        'Cập nhật số liệu kiểm kê thành công cho 2 sản phẩm',
      );
    });

    it('should confirm inventory from JSON items', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(1), skuCode: 'BEV-COCA-330', currentInventory: 100 },
      ]);
      mockTx.product.update.mockResolvedValue({});
      mockTx.inventorySnapshot.upsert.mockResolvedValue({});

      const result = await service.confirmInventory(undefined, {
        items: [
          {
            skuCode: 'BEV-COCA-330',
            stockQuantity: 150,
          },
        ],
      });

      expect(result.updatedCount).toBe(1);
      expect(mockTx.product.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { currentInventory: 150 },
      });
    });

    it('should throw VALIDATION_ERROR when neither file nor items are provided for inventory confirm', async () => {
      await expect(
        service.confirmInventory(undefined, undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ALL_OR_NOTHING_IMPORT_FAILED and not start transaction when inventory file is invalid', async () => {
      const invalidCsv = `SKU,StockQuantity
UNKNOWN,50
`;
      const file = createMockFile(invalidCsv, 'inventory.csv');
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await expect(service.confirmInventory(file)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should propagate error and rollback if product update fails in transaction', async () => {
      const file = createMockFile(validInventoryCsv, 'inventory.csv');

      mockPrismaService.product.findMany.mockResolvedValue([
        { id: BigInt(1), skuCode: 'BEV-COCA-330', currentInventory: 100 },
        { id: BigInt(2), skuCode: 'SNK-LAY-50G', currentInventory: 60 },
      ]);
      mockTx.product.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.confirmInventory(file)).rejects.toThrow(
        'Update failed',
      );
    });
  });
});
