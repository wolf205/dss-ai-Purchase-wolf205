import { apiClient } from '../../../services/api/axios.client';
import type { ApiResponse } from '../../../types/auth';
import type {
  Product,
  Category,
  ProductFilters,
  ProductListResponse,
  PaginationMeta,
  CreateProductDto,
  UpdateProductDto,
  UpdateProductStatusDto,
  DeleteProductResponse,
} from '../types';

export const catalogService = {
  /**
   * Tra cứu danh sách sản phẩm (SKU list) kèm lọc theo ngành hàng, trạng thái, tìm kiếm và phân trang (UC-05)
   * GET /api/v1/products
   */
  async getProducts(filters?: ProductFilters): Promise<ProductListResponse> {
    const params: Record<string, string | number> = {};

    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.search && filters.search.trim().length > 0) {
      params.search = filters.search.trim();
    }
    if (filters?.categoryId && filters.categoryId !== 'all') {
      params.categoryId = filters.categoryId;
    }
    if (filters?.status && filters.status !== 'All') {
      params.status = filters.status;
    }

    const response = await apiClient.get<
      ApiResponse<any> & { meta?: { pagination?: PaginationMeta } }
    >('/products', { params });

    const rawData = response.data?.data;
    let items: Product[] = [];

    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (rawData && typeof rawData === 'object') {
      if (Array.isArray(rawData.data)) {
        items = rawData.data;
      } else if (Array.isArray(rawData.items)) {
        items = rawData.items;
      }
    }

    const rawPagination = (
      (typeof rawData === 'object' && rawData !== null && ('meta' in rawData ? (rawData as any).meta?.pagination : (rawData as any).pagination)) ||
      response.data?.meta?.pagination ||
      {}
    ) as Record<string, unknown>;

    const page = Number(rawPagination.page ?? rawPagination.currentPage ?? filters?.page ?? 1) || 1;
    const limit = Number(rawPagination.limit ?? rawPagination.itemsPerPage ?? filters?.limit ?? 20) || 20;
    const totalItems = typeof rawPagination.totalItems === 'number'
      ? rawPagination.totalItems
      : typeof rawPagination.total === 'number'
        ? rawPagination.total
        : items.length;
    const totalPages = Number(rawPagination.totalPages ?? Math.ceil(totalItems / limit)) || 1;

    const pagination: PaginationMeta = {
      totalItems,
      itemCount: items.length,
      page,
      limit,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };

    return {
      items,
      pagination,
    };
  },

  /**
   * Xem thông tin chi tiết một SKU (UC-05 Bước 2, AF-1)
   * GET /api/v1/products/:id
   */
  async getProductById(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data?.data;
  },

  /**
   * Lấy danh sách ngành hàng trong hệ thống (UC-05, BR-20)
   * GET /api/v1/categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return response.data?.data || [];
  },

  /**
   * Tạo mới sản phẩm SKU trong danh mục (STORE_MANAGER) (UC-05 Bước 3..7)
   * POST /api/v1/products
   */
  async createProduct(payload: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>('/products', {
      skuCode: payload.skuCode.trim().toUpperCase(),
      productName: payload.productName.trim(),
      categoryId: payload.categoryId,
      unit: payload.unit.trim(),
      barcode: payload.barcode && payload.barcode.trim() ? payload.barcode.trim() : null,
    });
    return response.data?.data;
  },

  /**
   * Cập nhật thông tin sản phẩm (STORE_MANAGER) (cấm sửa skuCode) (UC-05 AF-1)
   * PATCH /api/v1/products/:id
   */
  async updateProduct(id: string, payload: UpdateProductDto): Promise<Product> {
    const body: Record<string, any> = {};
    if (payload.productName !== undefined) body.productName = payload.productName.trim();
    if (payload.categoryId !== undefined) body.categoryId = payload.categoryId;
    if (payload.unit !== undefined) body.unit = payload.unit.trim();
    if (payload.barcode !== undefined) {
      body.barcode = payload.barcode && payload.barcode.trim() ? payload.barcode.trim() : null;
    }

    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, body);
    return response.data?.data;
  },

  /**
   * Chuyển đổi trạng thái kinh doanh Active <-> Inactive (STORE_MANAGER) (UC-05 AF-2, BR-18)
   * PATCH /api/v1/products/:id/status
   */
  async updateProductStatus(
    id: string,
    payload: UpdateProductStatusDto
  ): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(
      `/products/${id}/status`,
      payload
    );
    return response.data?.data;
  },

  /**
   * Xóa vĩnh viễn sản phẩm SKU (Zero-link delete) (STORE_MANAGER) (UC-05 AF-3)
   * DELETE /api/v1/products/:id
   */
  async deleteProduct(id: string): Promise<DeleteProductResponse> {
    const response = await apiClient.delete<ApiResponse<DeleteProductResponse>>(
      `/products/${id}`
    );
    return response.data?.data;
  },
};
