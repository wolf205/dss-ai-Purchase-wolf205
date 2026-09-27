import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy toàn bộ danh sách ngành hàng trong hệ thống (sắp xếp theo ID tăng dần).
   * Phục vụ cho các bộ lọc danh mục và dropdown khai báo hàng hóa (UC-05, UC-01).
   */
  async findAll(): Promise<CategoryResponseDto[]> {
    this.logger.log('Lấy danh sách toàn bộ ngành hàng');

    const categories = await this.prisma.category.findMany({
      orderBy: { id: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id.toString(),
      categoryCode: cat.categoryCode,
      categoryName: cat.categoryName,
      description: cat.description,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }));
  }
}
