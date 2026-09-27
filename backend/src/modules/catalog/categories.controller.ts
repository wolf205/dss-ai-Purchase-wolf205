import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';

@ApiTags('Catalog')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh mục ngành hàng (Categories list)',
    description:
      'Trả về toàn bộ danh sách ngành hàng (public, không yêu cầu xác thực). Dùng cho bộ lọc danh mục và dropdown khai báo hàng hóa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách ngành hàng thành công',
    type: [CategoryResponseDto],
  })
  async findAll(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll();
  }
}
