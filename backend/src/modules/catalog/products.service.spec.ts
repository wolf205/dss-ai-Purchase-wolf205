import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockCategory = {
    id: 1n,
    categoryCode: 'BEV',
    categoryName: 'Đồ Uống',
    description: 'Nước giải khát',
    createdAt: new Date('2026-09-15T08:00:00.000Z'),
    updatedAt: new Date('2026-09-15T08:00:00.000Z'),
  };

  const mockProduct = {
    id: 101n,
    skuCode: 'MILK-TH-1L',
    productName: 'Sữa tươi tiệt trùng TH True Milk 1L',
    barcode: '8936036010011',
    unit: 'Hộp',
    status: 'Active',
    currentInventory: 0,
    onOrderQuantity: 0,
    categoryId: 1n,
    category: mockCategory,
    createdAt: new Date('2026-09-15T08:00:00.000Z'),
    updatedAt: new Date('2026-09-15T08:00:00.000Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findUnique: jest.fn(),
            },
            product: {
              findMany: jest.fn(),
              count: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products with category relation mapped', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        include: { category: true },
        orderBy: { id: 'asc' },
        skip: 0,
        take: 20,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('101');
      expect(result.items[0].skuCode).toBe('MILK-TH-1L');
      expect(result.items[0].category).toEqual({
        id: '1',
        categoryCode: 'BEV',
        categoryName: 'Đồ Uống',
      });
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
      });
    });

    it('should apply search, categoryId, and status filters properly', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({
        page: 2,
        limit: 10,
        search: 'milk',
        categoryId: '1',
        status: 'Active',
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {
          categoryId: 1n,
          status: 'Active',
          OR: [
            { skuCode: { contains: 'milk', mode: 'insensitive' } },
            { productName: { contains: 'milk', mode: 'insensitive' } },
          ],
        },
        include: { category: true },
        orderBy: { id: 'asc' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('create', () => {
    const createDto = {
      skuCode: 'MILK-TH-1L',
      productName: 'Sữa tươi tiệt trùng TH True Milk 1L',
      categoryId: '1',
      unit: 'Hộp',
      barcode: '8936036010011',
    };

    it('should create product successfully with default values (INV-PROD-04, BR-19)', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1n },
      });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          skuCode: 'MILK-TH-1L',
          productName: 'Sữa tươi tiệt trùng TH True Milk 1L',
          categoryId: 1n,
          unit: 'Hộp',
          barcode: '8936036010011',
          status: 'Active',
          currentInventory: 0,
          onOrderQuantity: 0,
        },
        include: { category: true },
      });
      expect(result.id).toBe('101');
      expect(result.status).toBe('Active');
      expect(result.currentInventory).toBe(0);
      expect(result.onOrderQuantity).toBe(0);
    });

    it('should throw NotFoundException if category does not exist', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if skuCode already exists (case-insensitive BR-17)', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(mockProduct);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if barcode already exists for another product', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);
      // First findFirst checks skuCode -> returns null
      // Second findFirst checks barcode -> returns existing product
      (prisma.product.findFirst as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockProduct);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return product details with category if found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await service.findById('101');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 101n },
        include: { category: true },
      });
      expect(result.id).toBe('101');
      expect(result.skuCode).toBe('MILK-TH-1L');
    });

    it('should throw NotFoundException if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      productName: 'Tên mới',
      unit: 'Thùng',
      categoryId: '2',
      barcode: '8936036010028',
    };

    it('should update product fields successfully', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({
        id: 2n,
        categoryCode: 'SNK',
        categoryName: 'Đồ Ăn Vặt',
      });
      (prisma.product.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        productName: 'Tên mới',
        unit: 'Thùng',
        categoryId: 2n,
        category: { id: 2n, categoryCode: 'SNK', categoryName: 'Đồ Ăn Vặt' },
      });

      const result = await service.update('101', updateDto);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 101n },
        data: {
          productName: 'Tên mới',
          unit: 'Thùng',
          category: { connect: { id: 2n } },
          barcode: '8936036010028',
        },
        include: { category: true },
      });
      expect(result.productName).toBe('Tên mới');
      expect(result.unit).toBe('Thùng');
    });

    it('should allow clearing barcode to null', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        barcode: null,
      });

      const result = await service.update('101', { barcode: null });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 101n },
        data: { barcode: null },
        include: { category: true },
      });
      expect(result.barcode).toBeNull();
    });

    it('should throw NotFoundException if product to update not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if new category not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('101', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if new barcode duplicates another product', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.category.findUnique as jest.Mock).mockResolvedValue({ id: 2n });
      (prisma.product.findFirst as jest.Mock).mockResolvedValue({
        id: 999n,
        skuCode: 'OTHER-SKU',
        productName: 'Sản phẩm khác',
      });

      await expect(service.update('101', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should deactivate product successfully when onOrderQuantity = 0', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...mockProduct,
        status: 'Inactive',
      });

      const result = await service.updateStatus('101', { status: 'Inactive' });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 101n },
        data: { status: 'Inactive' },
        include: { category: true },
      });
      expect(result.status).toBe('Inactive');
    });

    it('should deactivate product successfully when onOrderQuantity > 0 (INV-PROD-03)', async () => {
      const productWithOnOrder = {
        ...mockProduct,
        onOrderQuantity: 50,
      };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(
        productWithOnOrder,
      );
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...productWithOnOrder,
        status: 'Inactive',
      });

      const result = await service.updateStatus('101', { status: 'Inactive' });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 101n },
        data: { status: 'Inactive' },
        include: { category: true },
      });
      expect(result.status).toBe('Inactive');
      expect(result.onOrderQuantity).toBe(50);
    });

    it('should reactivate product to Active successfully', async () => {
      const inactiveProduct = {
        ...mockProduct,
        status: 'Inactive',
      };
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(
        inactiveProduct,
      );
      (prisma.product.update as jest.Mock).mockResolvedValue({
        ...inactiveProduct,
        status: 'Active',
      });

      const result = await service.updateStatus('101', { status: 'Active' });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 101n },
        data: { status: 'Active' },
        include: { category: true },
      });
      expect(result.status).toBe('Active');
    });

    it('should throw NotFoundException if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateStatus('999', { status: 'Inactive' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const zeroLinkProduct = {
      ...mockProduct,
      _count: {
        supplyConditions: 0,
        salesRecords: 0,
        inventorySnapshots: 0,
        recommendationItems: 0,
        poLineItems: 0,
        receiptLineItems: 0,
      },
    };

    it('should delete product successfully when Zero-Link (INV-PROD-02, BR-18)', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(
        zeroLinkProduct,
      );
      (prisma.product.delete as jest.Mock).mockResolvedValue(zeroLinkProduct);

      const result = await service.remove('101');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 101n },
        include: {
          _count: {
            select: {
              supplyConditions: true,
              salesRecords: true,
              inventorySnapshots: true,
              recommendationItems: true,
              poLineItems: true,
              receiptLineItems: true,
            },
          },
        },
      });
      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 101n },
      });
      expect(result.deletedSkuCode).toBe('MILK-TH-1L');
    });

    it('should throw ConflictException (HARD_DELETE_PROHIBITED) if product has salesRecords', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...zeroLinkProduct,
        _count: {
          ...zeroLinkProduct._count,
          salesRecords: 5,
        },
      });

      await expect(service.remove('101')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException (HARD_DELETE_PROHIBITED) if product has supplyConditions', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...zeroLinkProduct,
        _count: {
          ...zeroLinkProduct._count,
          supplyConditions: 1,
        },
      });

      await expect(service.remove('101')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException (HARD_DELETE_PROHIBITED) if product has currentInventory > 0', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...zeroLinkProduct,
        currentInventory: 10,
      });

      await expect(service.remove('101')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException (HARD_DELETE_PROHIBITED) if product has onOrderQuantity > 0', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({
        ...zeroLinkProduct,
        onOrderQuantity: 20,
      });

      await expect(service.remove('101')).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });
});
