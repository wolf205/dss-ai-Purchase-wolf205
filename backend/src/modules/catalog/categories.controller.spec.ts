import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  const mockCategories: CategoryResponseDto[] = [
    {
      id: '1',
      categoryCode: 'BEV',
      categoryName: 'Đồ Uống',
      description: 'Nước giải khát, nước ngọt, bia',
      createdAt: '2026-09-15T08:00:00.000Z',
      updatedAt: '2026-09-15T08:00:00.000Z',
    },
    {
      id: '2',
      categoryCode: 'SNK',
      categoryName: 'Đồ Ăn Vặt',
      description: 'Bánh kẹo, bim bim, hạt',
      createdAt: '2026-09-15T08:05:00.000Z',
      updatedAt: '2026-09-15T08:05:00.000Z',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockCategories),
          },
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCategories);
    });
  });
});
