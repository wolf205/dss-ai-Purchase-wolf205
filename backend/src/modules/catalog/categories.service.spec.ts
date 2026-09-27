import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: PrismaService;

  const mockCategories = [
    {
      id: 1n,
      categoryCode: 'BEV',
      categoryName: 'Đồ Uống',
      description: 'Nước giải khát, nước ngọt, bia',
      createdAt: new Date('2026-09-15T08:00:00.000Z'),
      updatedAt: new Date('2026-09-15T08:00:00.000Z'),
    },
    {
      id: 2n,
      categoryCode: 'SNK',
      categoryName: 'Đồ Ăn Vặt',
      description: 'Bánh kẹo, bim bim, hạt',
      createdAt: new Date('2026-09-15T08:05:00.000Z'),
      updatedAt: new Date('2026-09-15T08:05:00.000Z'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories with BigInt id converted to string', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        categoryCode: 'BEV',
        categoryName: 'Đồ Uống',
        description: 'Nước giải khát, nước ngọt, bia',
        createdAt: '2026-09-15T08:00:00.000Z',
        updatedAt: '2026-09-15T08:00:00.000Z',
      });
      expect(result[1]).toEqual({
        id: '2',
        categoryCode: 'SNK',
        categoryName: 'Đồ Ăn Vặt',
        description: 'Bánh kẹo, bim bim, hạt',
        createdAt: '2026-09-15T08:05:00.000Z',
        updatedAt: '2026-09-15T08:05:00.000Z',
      });
    });

    it('should return an empty array if no categories exist', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
