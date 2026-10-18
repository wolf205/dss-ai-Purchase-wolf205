import { Test, TestingModule } from '@nestjs/testing';
import { SupplyConditionsController } from './supply-conditions.controller';
import { SupplyConditionsService } from './supply-conditions.service';
import { UpdateSupplyConditionDto } from './dto/update-supply-condition.dto';
import { SupplyConditionResponseDto } from './dto/supply-condition-response.dto';

describe('SupplyConditionsController', () => {
  let controller: SupplyConditionsController;
  let service: SupplyConditionsService;

  const mockCondition: SupplyConditionResponseDto = {
    id: '1',
    supplierId: '1',
    productId: '12',
    purchasePrice: 35000,
    moq: 15,
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplyConditionsController],
      providers: [
        {
          provide: SupplyConditionsService,
          useValue: {
            updateCondition: jest.fn().mockResolvedValue(mockCondition),
          },
        },
      ],
    }).compile();

    controller = module.get<SupplyConditionsController>(
      SupplyConditionsController,
    );
    service = module.get<SupplyConditionsService>(SupplyConditionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('update', () => {
    it('should update supply condition and return updated DTO', async () => {
      const dto: UpdateSupplyConditionDto = {
        purchasePrice: 35000,
        moq: 15,
        status: 'Active',
      };

      const result = await controller.update('1', dto);

      expect(service.updateCondition).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockCondition);
    });
  });
});
