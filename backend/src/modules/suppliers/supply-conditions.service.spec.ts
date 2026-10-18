import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { SupplyConditionsService } from './supply-conditions.service';
import { CreateSupplyConditionDto } from './dto/create-supply-condition.dto';
import { UpdateSupplyConditionDto } from './dto/update-supply-condition.dto';

describe('SupplyConditionsService', () => {
  let service: SupplyConditionsService;

  const mockDate = new Date('2026-09-15T08:00:00.000Z');

  const mockPrismaProduct = {
    id: BigInt(12),
    skuCode: 'MILK-TH-1L',
    productName: 'Sữa tươi tiệt trùng TH True Milk 1L',
    barcode: '8936036010011',
    unit: 'Hộp',
    status: 'Active',
    category: {
      id: BigInt(1),
      categoryName: 'Đồ Uống',
    },
  };

  const mockPrismaSupplyCondition = {
    id: BigInt(1),
    supplierId: BigInt(1),
    productId: BigInt(12),
    purchasePrice: new Decimal(32000),
    moq: 10,
    status: 'Active',
    createdAt: mockDate,
    updatedAt: mockDate,
    product: mockPrismaProduct,
  };

  const mockPrismaSupplier = {
    id: BigInt(1),
    supplierCode: 'VINAMILK',
    supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    status: 'Active',
  };

  const existingConditionWithRelations = {
    ...mockPrismaSupplyCondition,
    supplier: mockPrismaSupplier,
  };

  const mockPrisma = {
    supplier: {
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    supplyCondition: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    purchaseOrder: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplyConditionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SupplyConditionsService>(SupplyConditionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findConditionsBySupplierId', () => {
    it('should return list of conditions when supplier exists', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);
      mockPrisma.supplyCondition.findMany.mockResolvedValue([
        mockPrismaSupplyCondition,
      ]);

      const result = await service.findConditionsBySupplierId('1');

      expect(mockPrisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
      expect(mockPrisma.supplyCondition.findMany).toHaveBeenCalledWith({
        where: { supplierId: BigInt(1) },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].purchasePrice).toBe(32000);
      expect(result[0].moq).toBe(10);
      expect(result[0].product.skuCode).toBe('MILK-TH-1L');
    });

    it('should throw NotFoundException (RESOURCE_NOT_FOUND) when supplier does not exist', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(service.findConditionsBySupplierId('999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createCondition', () => {
    const createConditionDto: CreateSupplyConditionDto = {
      productId: '12',
      purchasePrice: 32000,
      moq: 10,
    };

    it('should successfully create condition when product is Active and not duplicate (EF-2)', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);
      mockPrisma.product.findUnique.mockResolvedValue(mockPrismaProduct);
      mockPrisma.supplyCondition.findUnique.mockResolvedValue(null);
      mockPrisma.supplyCondition.create.mockResolvedValue(
        mockPrismaSupplyCondition,
      );

      const result = await service.createCondition('1', createConditionDto);

      expect(mockPrisma.supplier.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(12) },
        include: { category: true },
      });
      expect(mockPrisma.supplyCondition.findUnique).toHaveBeenCalledWith({
        where: {
          productId_supplierId: {
            productId: BigInt(12),
            supplierId: BigInt(1),
          },
        },
      });
      expect(mockPrisma.supplyCondition.create).toHaveBeenCalledWith({
        data: {
          supplierId: BigInt(1),
          productId: BigInt(12),
          purchasePrice: 32000,
          moq: 10,
          status: 'Active',
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });
      expect(result.id).toBe('1');
      expect(result.product.skuCode).toBe('MILK-TH-1L');
      expect(result.purchasePrice).toBe(32000);
    });

    it('should throw NotFoundException (RESOURCE_NOT_FOUND) when supplier does not exist', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(null);

      await expect(
        service.createCondition('999', createConditionDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException (RESOURCE_NOT_FOUND) when product does not exist', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(
        service.createCondition('1', {
          ...createConditionDto,
          productId: '999',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException (VALIDATION_ERROR) when product is Inactive (Precondition UC-06 3.2)', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);
      mockPrisma.product.findUnique.mockResolvedValue({
        ...mockPrismaProduct,
        status: 'Inactive',
      });

      await expect(
        service.createCondition('1', createConditionDto),
      ).rejects.toThrow(BadRequestException);

      try {
        await service.createCondition('1', createConditionDto);
      } catch (err: unknown) {
        expect((err as BadRequestException).getResponse()).toEqual({
          code: 'VALIDATION_ERROR',
          message:
            "Mặt hàng 'MILK-TH-1L' đang ở trạng thái 'Inactive'. Chỉ cho phép gán các mặt hàng đang Active cho nhà cung cấp.",
        });
      }
    });

    it('should throw ConflictException (DUPLICATE_SKU_ASSIGNMENT) when condition already exists (EF-2)', async () => {
      mockPrisma.supplier.findUnique.mockResolvedValue(mockPrismaSupplier);
      mockPrisma.product.findUnique.mockResolvedValue(mockPrismaProduct);
      mockPrisma.supplyCondition.findUnique.mockResolvedValue(
        mockPrismaSupplyCondition,
      );

      await expect(
        service.createCondition('1', createConditionDto),
      ).rejects.toThrow(ConflictException);

      try {
        await service.createCondition('1', createConditionDto);
      } catch (err: unknown) {
        expect((err as ConflictException).getResponse()).toEqual({
          code: 'DUPLICATE_SKU_ASSIGNMENT',
          message:
            "Mặt hàng này đã có trong danh mục cung ứng của nhà cung cấp. Vui lòng sử dụng chức năng 'Sửa điều kiện' nếu muốn điều chỉnh đơn giá nhập hoặc MOQ.",
        });
      }
    });
  });

  describe('updateCondition', () => {
    it('should successfully update price and moq (AF-2, BR-22)', async () => {
      mockPrisma.supplyCondition.findUnique.mockResolvedValue(
        existingConditionWithRelations,
      );
      mockPrisma.supplyCondition.update.mockResolvedValue({
        ...mockPrismaSupplyCondition,
        purchasePrice: new Decimal(35000),
        moq: 15,
      });

      const dto: UpdateSupplyConditionDto = {
        purchasePrice: 35000,
        moq: 15,
      };

      const result = await service.updateCondition('1', dto);

      expect(mockPrisma.supplyCondition.findUnique).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        include: {
          product: { include: { category: true } },
          supplier: true,
        },
      });
      expect(mockPrisma.supplyCondition.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          purchasePrice: 35000,
          moq: 15,
        },
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      });
      expect(result.purchasePrice).toBe(35000);
      expect(result.moq).toBe(15);
    });

    it('should successfully update status to Inactive when no approved PO contains SKU (AF-3)', async () => {
      mockPrisma.supplyCondition.findUnique.mockResolvedValue(
        existingConditionWithRelations,
      );
      mockPrisma.purchaseOrder.findFirst.mockResolvedValue(null);
      mockPrisma.supplyCondition.count.mockResolvedValue(1);
      mockPrisma.supplyCondition.update.mockResolvedValue({
        ...mockPrismaSupplyCondition,
        status: 'Inactive',
      });

      const dto: UpdateSupplyConditionDto = {
        status: 'Inactive',
      };

      const result = await service.updateCondition('1', dto);

      expect(mockPrisma.purchaseOrder.findFirst).toHaveBeenCalledWith({
        where: {
          supplierId: BigInt(1),
          status: 'Approved',
          lineItems: {
            some: {
              productId: BigInt(12),
            },
          },
        },
        select: {
          poNumber: true,
        },
      });
      expect(result.status).toBe('Inactive');
      expect(result.isSoleSupplier).toBe(false);
    });

    it('should indicate isSoleSupplier = true when no other active supplier exists (BR-23)', async () => {
      mockPrisma.supplyCondition.findUnique.mockResolvedValue(
        existingConditionWithRelations,
      );
      mockPrisma.purchaseOrder.findFirst.mockResolvedValue(null);
      mockPrisma.supplyCondition.count.mockResolvedValue(0);
      mockPrisma.supplyCondition.update.mockResolvedValue({
        ...mockPrismaSupplyCondition,
        status: 'Inactive',
      });

      const dto: UpdateSupplyConditionDto = {
        status: 'Inactive',
      };

      const result = await service.updateCondition('1', dto);

      expect(result.isSoleSupplier).toBe(true);
    });

    it('should throw ConflictException (ON_ORDER_SKU_EXISTS) when updating status to Inactive and approved PO with SKU exists (EF-5, BR-23)', async () => {
      mockPrisma.supplyCondition.findUnique.mockResolvedValue(
        existingConditionWithRelations,
      );
      mockPrisma.purchaseOrder.findFirst.mockResolvedValue({
        poNumber: 'PO-2026-001',
      });

      const dto: UpdateSupplyConditionDto = {
        status: 'Inactive',
      };

      await expect(service.updateCondition('1', dto)).rejects.toThrow(
        ConflictException,
      );

      try {
        await service.updateCondition('1', dto);
      } catch (err: unknown) {
        const errorResp = (err as ConflictException).getResponse() as {
          code: string;
          message: string;
        };
        expect(errorResp.code).toBe('ON_ORDER_SKU_EXISTS');
        expect(errorResp.message).toContain(
          'Không thể ngừng cung ứng sản phẩm',
        );
        expect(errorResp.message).toContain('PO-2026-001');
      }

      expect(mockPrisma.supplyCondition.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException (RESOURCE_NOT_FOUND) when condition does not exist', async () => {
      mockPrisma.supplyCondition.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCondition('999', { purchasePrice: 35000 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException (VALIDATION_ERROR) when all dto fields are undefined', async () => {
      mockPrisma.supplyCondition.findUnique.mockResolvedValue(
        existingConditionWithRelations,
      );

      await expect(service.updateCondition('1', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
