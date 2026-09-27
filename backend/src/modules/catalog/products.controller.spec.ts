import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProduct: ProductResponseDto = {
    id: '101',
    skuCode: 'MILK-TH-1L',
    productName: 'Sữa tươi tiệt trùng TH True Milk 1L',
    barcode: '8936036010011',
    unit: 'Hộp',
    status: 'Active',
    currentInventory: 0,
    onOrderQuantity: 0,
    categoryId: '1',
    category: {
      id: '1',
      categoryCode: 'BEV',
      categoryName: 'Đồ Uống',
    },
    createdAt: '2026-09-15T08:00:00.000Z',
    updatedAt: '2026-09-15T08:00:00.000Z',
  };

  const mockQueryResult = {
    items: [mockProduct],
    pagination: {
      page: 1,
      limit: 20,
      totalItems: 1,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockQueryResult),
            findById: jest.fn().mockResolvedValue(mockProduct),
            create: jest.fn().mockResolvedValue(mockProduct),
            update: jest.fn().mockResolvedValue(mockProduct),
            updateStatus: jest
              .fn()
              .mockResolvedValue({ ...mockProduct, status: 'Inactive' }),
            remove: jest.fn().mockResolvedValue({
              message:
                'Đã xóa vĩnh viễn sản phẩm MILK-TH-1L khỏi danh mục hệ thống.',
              deletedSkuCode: 'MILK-TH-1L',
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return products and pagination meta', async () => {
      const query: QueryProductDto = { page: 1, limit: 20 };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        data: [mockProduct],
        meta: {
          pagination: mockQueryResult.pagination,
        },
      });
    });
  });

  describe('create', () => {
    it('should create product and return created product DTO', async () => {
      const createDto: CreateProductDto = {
        skuCode: 'MILK-TH-1L',
        productName: 'Sữa tươi tiệt trùng TH True Milk 1L',
        categoryId: '1',
        unit: 'Hộp',
        barcode: '8936036010011',
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findById', () => {
    it('should return product details', async () => {
      const result = await controller.findById('101');

      expect(service.findById).toHaveBeenCalledWith('101');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update product and return updated product DTO', async () => {
      const updateDto = {
        productName: 'Tên mới',
        unit: 'Thùng',
      };

      const result = await controller.update('101', updateDto);

      expect(service.update).toHaveBeenCalledWith('101', updateDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('updateStatus', () => {
    it('should update product status and return product DTO', async () => {
      const result = await controller.updateStatus('101', {
        status: 'Inactive',
      });

      expect(service.updateStatus).toHaveBeenCalledWith('101', {
        status: 'Inactive',
      });
      expect(result.status).toBe('Inactive');
    });
  });

  describe('remove', () => {
    it('should delete product and return confirmation', async () => {
      const result = await controller.remove('101');

      expect(service.remove).toHaveBeenCalledWith('101');
      expect(result).toEqual({
        message: 'Đã xóa vĩnh viễn sản phẩm MILK-TH-1L khỏi danh mục hệ thống.',
        deletedSkuCode: 'MILK-TH-1L',
      });
    });
  });
});
