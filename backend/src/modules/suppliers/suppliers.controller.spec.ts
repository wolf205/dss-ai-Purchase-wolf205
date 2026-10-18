import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UpdateSupplierStatusDto } from './dto/update-supplier-status.dto';
import { CreateSupplyConditionDto } from './dto/create-supply-condition.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { SupplierResponseDto } from './dto/supplier-response.dto';
import { SupplyConditionResponseDto } from './dto/supply-condition-response.dto';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;

  const mockSupplier: SupplierResponseDto = {
    id: '1',
    supplierCode: 'VINAMILK',
    supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    contactPerson: 'Nguyễn Văn A',
    phoneNumber: '0901234567',
    email: 'sales@vinamilk.com.vn',
    address: '10 Tân Trào, Q7, TP.HCM',
    committedLeadTimeDays: 3,
    status: 'Active',
    performanceScore: 0.8,
    allTimePerformanceScore: 0.8,
    completedOrderCount: 0,
    activeSkuCount: 5,
    recent5OrderOnTimeRate: null,
    recent5OrderFulfillmentRate: null,
    performanceLabel: '[NCC Mới - Điểm khởi tạo: 80%]',
    createdAt: '2026-09-15T08:00:00.000Z',
    updatedAt: '2026-09-15T08:00:00.000Z',
  };

  const mockCondition: SupplyConditionResponseDto = {
    id: '1',
    supplierId: '1',
    productId: '12',
    purchasePrice: 32000,
    moq: 10,
    status: 'Active',
    product: {
      id: '12',
      skuCode: 'MILK-TH-1L',
      productName: 'Sữa tươi tiệt trùng TH True Milk 1L',
      barcode: '8936036010011',
      unit: 'Hộp',
      status: 'Active',
      categoryName: 'Đồ Uống',
    },
    createdAt: '2026-09-15T08:00:00.000Z',
    updatedAt: '2026-09-15T08:00:00.000Z',
  };

  const mockQueryResult = {
    items: [mockSupplier],
    pagination: {
      page: 1,
      limit: 20,
      totalItems: 1,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockQueryResult),
            findById: jest.fn().mockResolvedValue(mockSupplier),
            create: jest.fn().mockResolvedValue(mockSupplier),
            update: jest.fn().mockResolvedValue(mockSupplier),
            updateStatus: jest.fn().mockResolvedValue({
              ...mockSupplier,
              status: 'Inactive',
            }),
            findConditionsBySupplierId: jest
              .fn()
              .mockResolvedValue([mockCondition]),
            createCondition: jest.fn().mockResolvedValue(mockCondition),
          },
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return suppliers and pagination meta', async () => {
      const query: QuerySupplierDto = { page: 1, limit: 20, status: 'Active' };
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual({
        data: [mockSupplier],
        meta: {
          pagination: mockQueryResult.pagination,
        },
      });
    });
  });

  describe('create', () => {
    it('should create supplier and return created supplier DTO', async () => {
      const createDto: CreateSupplierDto = {
        supplierCode: 'VINAMILK',
        supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
        contactPerson: 'Nguyễn Văn A',
        phoneNumber: '0901234567',
        committedLeadTimeDays: 3,
        email: 'sales@vinamilk.com.vn',
        address: '10 Tân Trào, Q7, TP.HCM',
      };

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('findById', () => {
    it('should return supplier details by id', async () => {
      const result = await controller.findById('1');

      expect(service.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('update', () => {
    it('should update supplier and return updated supplier DTO', async () => {
      const updateDto: UpdateSupplierDto = {
        supplierName: 'Vinamilk Mới',
        contactPerson: 'Trần Văn B',
        phoneNumber: '0987654321',
        committedLeadTimeDays: 4,
        email: 'new-sales@vinamilk.com.vn',
        address: 'Quận 1, TP.HCM',
      };

      const result = await controller.update('1', updateDto);

      expect(service.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('updateStatus', () => {
    it('should update supplier status and return updated supplier DTO', async () => {
      const statusDto: UpdateSupplierStatusDto = {
        status: 'Inactive',
      };

      const result = await controller.updateStatus('1', statusDto);

      expect(service.updateStatus).toHaveBeenCalledWith('1', statusDto);
      expect(result).toEqual({
        ...mockSupplier,
        status: 'Inactive',
      });
    });
  });

  describe('findConditions', () => {
    it('should return list of supply conditions for a supplier', async () => {
      const result = await controller.findConditions('1');

      expect(service.findConditionsBySupplierId).toHaveBeenCalledWith('1');
      expect(result).toEqual([mockCondition]);
    });
  });

  describe('createCondition', () => {
    it('should assign SKU to supplier and return created condition', async () => {
      const dto: CreateSupplyConditionDto = {
        productId: '12',
        purchasePrice: 32000,
        moq: 10,
      };

      const result = await controller.createCondition('1', dto);

      expect(service.createCondition).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockCondition);
    });
  });
});
