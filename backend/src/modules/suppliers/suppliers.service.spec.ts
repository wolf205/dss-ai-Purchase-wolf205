import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';

describe('SuppliersService', () => {
  let service: SuppliersService;

  const mockDate = new Date('2026-09-15T08:00:00.000Z');

  const mockPrismaSupplier = {
    id: BigInt(1),
    supplierCode: 'VINAMILK',
    supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    contactPerson: 'Nguyễn Văn A',
    phoneNumber: '0901234567',
    email: 'sales@vinamilk.com.vn',
    address: '10 Tân Trào, Q7, TP.HCM',
    committedLeadTimeDays: 3,
    status: 'Active',
    performanceScore: new Decimal(0.8),
    allTimePerformanceScore: new Decimal(0.8),
    completedOrderCount: 0,
    createdAt: mockDate,
    updatedAt: mockDate,
    supplyConditions: [{ id: BigInt(10) }, { id: BigInt(11) }],
    purchaseOrders: [],
  };

  const mockPrisma = {
    supplier: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return suppliers with pagination and cold-start OTIF metrics (0 completed orders)', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([mockPrismaSupplier]);
      mockPrisma.supplier.count.mockResolvedValue(1);

      const query: QuerySupplierDto = { page: 1, limit: 20, status: 'Active' };
      const result = await service.findAll(query);

      expect(mockPrisma.supplier.findMany).toHaveBeenCalled();
      expect(mockPrisma.supplier.count).toHaveBeenCalled();
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
      });
      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.id).toBe('1');
      expect(item.supplierCode).toBe('VINAMILK');
      expect(item.activeSkuCount).toBe(2);
      expect(item.recent5OrderOnTimeRate).toBeNull();
      expect(item.recent5OrderFulfillmentRate).toBeNull();
      expect(item.performanceLabel).toBe('[NCC Mới - Điểm khởi tạo: 80%]');
      expect(item.performanceScore).toBe(0.8);
    });

    it('should compute OTIF metrics correctly for supplier with recent completed orders', async () => {
      const supplierWithOrders = {
        ...mockPrismaSupplier,
        id: BigInt(2),
        supplierCode: 'TH_TRUE_MILK',
        completedOrderCount: 4,
        purchaseOrders: [
          {
            id: BigInt(201),
            goodsReceipt: {
              daysLate: 0,
              overallFulfillmentRate: new Decimal(1.0),
            },
          },
          {
            id: BigInt(202),
            goodsReceipt: {
              daysLate: 1,
              overallFulfillmentRate: new Decimal(0.9),
            },
          },
        ],
      };

      mockPrisma.supplier.findMany.mockResolvedValue([supplierWithOrders]);
      mockPrisma.supplier.count.mockResolvedValue(1);

      const result = await service.findAll({ status: 'All' });
      expect(result.items).toHaveLength(1);
      const item = result.items[0];
      expect(item.recent5OrderOnTimeRate).toBe(0.5); // 1 on-time out of 2 orders
      expect(item.recent5OrderFulfillmentRate).toBe(0.95); // (1.0 + 0.9) / 2
      expect(item.performanceLabel).toBe('[Lịch sử: 4 đơn]');
    });

    it('should label as [Phong độ 5 đơn gần nhất] when completedOrderCount >= 5', async () => {
      const supplierMature = {
        ...mockPrismaSupplier,
        id: BigInt(3),
        supplierCode: 'NESTLE',
        completedOrderCount: 6,
        purchaseOrders: [
          {
            id: BigInt(301),
            goodsReceipt: {
              daysLate: 0,
              overallFulfillmentRate: new Decimal(1.0),
            },
          },
          {
            id: BigInt(302),
            goodsReceipt: {
              daysLate: 0,
              overallFulfillmentRate: new Decimal(1.0),
            },
          },
          {
            id: BigInt(303),
            goodsReceipt: {
              daysLate: 0,
              overallFulfillmentRate: new Decimal(1.0),
            },
          },
          {
            id: BigInt(304),
            goodsReceipt: {
              daysLate: 0,
              overallFulfillmentRate: new Decimal(1.0),
            },
          },
          {
            id: BigInt(305),
            goodsReceipt: {
              daysLate: 0,
              overallFulfillmentRate: new Decimal(1.0),
            },
          },
        ],
      };

      mockPrisma.supplier.findMany.mockResolvedValue([supplierMature]);
      mockPrisma.supplier.count.mockResolvedValue(1);

      const result = await service.findAll({});
      expect(result.items[0].performanceLabel).toBe(
        '[Phong độ 5 đơn gần nhất]',
      );
      expect(result.items[0].recent5OrderOnTimeRate).toBe(1.0);
      expect(result.items[0].recent5OrderFulfillmentRate).toBe(1.0);
    });

    it('should search across supplierCode, supplierName, and phoneNumber', async () => {
      mockPrisma.supplier.findMany.mockResolvedValue([]);
      mockPrisma.supplier.count.mockResolvedValue(0);

      await service.findAll({ search: '0901' });

      expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { supplierCode: { contains: '0901', mode: 'insensitive' } },
              { supplierName: { contains: '0901', mode: 'insensitive' } },
              { phoneNumber: { contains: '0901', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });
  });

  describe('create', () => {
    const createDto: CreateSupplierDto = {
      supplierCode: 'VINAMILK',
      supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      contactPerson: 'Nguyễn Văn A',
      phoneNumber: '0901234567',
      committedLeadTimeDays: 3,
      email: 'sales@vinamilk.com.vn',
      address: '10 Tân Trào, Q7, TP.HCM',
    };

    it('should create a new supplier with cold start performance score 0.8000', async () => {
      mockPrisma.supplier.findFirst.mockResolvedValue(null);
      mockPrisma.supplier.create.mockResolvedValue(mockPrismaSupplier);

      const result = await service.create(createDto);

      expect(mockPrisma.supplier.findFirst).toHaveBeenCalledWith({
        where: {
          supplierCode: {
            equals: 'VINAMILK',
            mode: 'insensitive',
          },
        },
      });

      expect(mockPrisma.supplier.create).toHaveBeenCalledWith({
        data: {
          supplierCode: 'VINAMILK',
          supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
          contactPerson: 'Nguyễn Văn A',
          phoneNumber: '0901234567',
          committedLeadTimeDays: 3,
          email: 'sales@vinamilk.com.vn',
          address: '10 Tân Trào, Q7, TP.HCM',
          status: 'Active',
          performanceScore: 0.8,
          allTimePerformanceScore: 0.8,
          completedOrderCount: 0,
        },
        include: {
          supplyConditions: {
            where: { status: 'Active' },
            select: { id: true },
          },
          purchaseOrders: {
            where: { status: 'Completed' },
            include: { goodsReceipt: true },
            orderBy: { id: 'desc' },
            take: 5,
          },
        },
      });

      expect(result.id).toBe('1');
      expect(result.performanceScore).toBe(0.8);
      expect(result.status).toBe('Active');
      expect(result.performanceLabel).toBe('[NCC Mới - Điểm khởi tạo: 80%]');
    });

    it('should throw ConflictException (DUPLICATE_CODE) when supplierCode already exists', async () => {
      mockPrisma.supplier.findFirst.mockResolvedValue(mockPrismaSupplier);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );

      try {
        await service.create(createDto);
      } catch (err: unknown) {
        expect((err as ConflictException).getResponse()).toEqual({
          code: 'DUPLICATE_CODE',
          message: `Mã nhà cung cấp 'VINAMILK' đã tồn tại trong hệ thống.`,
        });
      }
    });
  });

  describe('findById', () => {
    it('should return supplier response DTO when supplier exists', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);

      const result = await service.findById(1);

      expect(mockPrisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: expect.any(Object),
      });
      expect(result.id).toBe('1');
      expect(result.supplierCode).toBe('VINAMILK');
    });

    it('should throw NotFoundException (RESOURCE_NOT_FOUND) when supplier does not exist', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateSupplierDto = {
      supplierName: 'Vinamilk Mới',
      contactPerson: 'Trần Văn B',
      phoneNumber: '0987654321',
      committedLeadTimeDays: 4,
      email: 'new-sales@vinamilk.com.vn',
      address: 'Quận 1, TP.HCM',
    };

    it('should update supplier profile successfully', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);
      const updatedSupplier = {
        ...mockPrismaSupplier,
        supplierName: 'Vinamilk Mới',
        contactPerson: 'Trần Văn B',
        phoneNumber: '0987654321',
        committedLeadTimeDays: 4,
        email: 'new-sales@vinamilk.com.vn',
        address: 'Quận 1, TP.HCM',
      };
      mockPrisma.supplier.update.mockResolvedValue(updatedSupplier);

      const result = await service.update(1, updateDto);

      expect(mockPrisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
      expect(mockPrisma.supplier.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          supplierName: 'Vinamilk Mới',
          contactPerson: 'Trần Văn B',
          phoneNumber: '0987654321',
          committedLeadTimeDays: 4,
          email: 'new-sales@vinamilk.com.vn',
          address: 'Quận 1, TP.HCM',
        },
        include: expect.any(Object),
      });
      expect(result.supplierName).toBe('Vinamilk Mới');
      expect(result.contactPerson).toBe('Trần Văn B');
      expect(result.phoneNumber).toBe('0987654321');
      expect(result.committedLeadTimeDays).toBe(4);
      expect(result.email).toBe('new-sales@vinamilk.com.vn');
      expect(result.address).toBe('Quận 1, TP.HCM');
    });

    it('should allow clearing optional fields (email and address to null)', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);
      const clearedSupplier = {
        ...mockPrismaSupplier,
        email: null,
        address: null,
      };
      mockPrisma.supplier.update.mockResolvedValue(clearedSupplier);

      const clearDto: UpdateSupplierDto = {
        email: null,
        address: null,
      };

      const result = await service.update(1, clearDto);

      expect(mockPrisma.supplier.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          email: null,
          address: null,
        },
        include: expect.any(Object),
      });
      expect(result.email).toBeNull();
      expect(result.address).toBeNull();
    });

    it('should throw NotFoundException (RESOURCE_NOT_FOUND) when updating non-existent supplier', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException (VALIDATION_ERROR) if supplierCode is attempted to be modified', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);

      const invalidDto = {
        ...updateDto,
        supplierCode: 'NEW_CODE',
      } as unknown as UpdateSupplierDto;

      await expect(service.update(1, invalidDto)).rejects.toThrow(
        BadRequestException,
      );

      try {
        await service.update(1, invalidDto);
      } catch (err: unknown) {
        expect((err as BadRequestException).getResponse()).toEqual({
          code: 'VALIDATION_ERROR',
          message:
            'Mã nhà cung cấp (supplierCode) là định danh bất biến, tuyệt đối không được phép chỉnh sửa.',
        });
      }
    });
  });
});
