import { apiClient } from '../../../services/api/axios.client';
import type { ApiResponse } from '../../../types/auth';
import type { PurchaseOrderSummary } from '../../orders/types';
import type { Product } from '../../catalog/types';
import type {
  Supplier,
  SupplyCondition,
  SupplierFilters,
  SupplierListResponse,
  PaginationMeta,
  CreateSupplierDto,
  UpdateSupplierDto,
  UpdateSupplierStatusDto,
  CreateSupplyConditionDto,
  UpdateSupplyConditionDto,
} from '../types';

export const supplierService = {
  /**
   * Tra cứu danh sách nhà cung cấp kèm phân trang, lọc trạng thái và tìm kiếm (UC-06)
   * GET /api/v1/suppliers
   */
  async getSuppliers(filters?: SupplierFilters): Promise<SupplierListResponse> {
    const params: Record<string, string | number> = {};

    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.status && filters.status !== 'All') {
      params.status = filters.status;
    }
    if (filters?.search && filters.search.trim().length > 0) {
      params.search = filters.search.trim();
    }

    const response = await apiClient.get<
      ApiResponse<Supplier[]> & { meta?: { pagination?: PaginationMeta } }
    >('/suppliers', { params });

    const rawData = response.data?.data;
    let items: Supplier[] = [];

    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (rawData && typeof rawData === 'object') {
      const anyData = rawData as Record<string, unknown>;
      if (Array.isArray(anyData.data)) {
        items = anyData.data as Supplier[];
      } else if (Array.isArray(anyData.items)) {
        items = anyData.items as Supplier[];
      }
    }

    const anyObj =
      rawData && typeof rawData === 'object' && !Array.isArray(rawData)
        ? (rawData as Record<string, unknown>)
        : null;

    const rawPagination = (
      (anyObj?.meta as Record<string, unknown> | undefined)?.pagination ||
      anyObj?.pagination ||
      response.data?.meta?.pagination ||
      {}
    ) as Record<string, unknown>;

    const page =
      Number(rawPagination.page ?? rawPagination.currentPage ?? filters?.page ?? 1) || 1;
    const limit =
      Number(rawPagination.limit ?? rawPagination.itemsPerPage ?? filters?.limit ?? 20) || 20;
    const totalItems =
      typeof rawPagination.totalItems === 'number'
        ? rawPagination.totalItems
        : typeof rawPagination.total === 'number'
          ? (rawPagination.total as number)
          : items.length;
    const totalPages =
      Number(rawPagination.totalPages ?? Math.ceil(totalItems / limit)) || 1;

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
   * Xem chi tiết một nhà cung cấp theo ID kèm điểm OTIF (UC-06)
   * GET /api/v1/suppliers/:id
   */
  async getSupplierById(id: string): Promise<Supplier> {
    const response = await apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`);
    return response.data?.data;
  },

  /**
   * Tạo mới nhà cung cấp tuân thủ BR-21 và BR-24 (STORE_MANAGER)
   * POST /api/v1/suppliers
   */
  async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    const payload = {
      supplierCode: dto.supplierCode.trim().toUpperCase(),
      supplierName: dto.supplierName.trim(),
      contactPerson: dto.contactPerson.trim(),
      phoneNumber: dto.phoneNumber.trim(),
      committedLeadTimeDays: Number(dto.committedLeadTimeDays),
      email: dto.email ? dto.email.trim() : null,
      address: dto.address ? dto.address.trim() : null,
    };
    const response = await apiClient.post<ApiResponse<Supplier>>('/suppliers', payload);
    return response.data?.data;
  },

  /**
   * Cập nhật hồ sơ nhà cung cấp (STORE_MANAGER)
   * Cấm sửa supplierCode theo BR-21
   * PATCH /api/v1/suppliers/:id
   */
  async updateSupplier(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    const payload: Record<string, unknown> = {};
    if (dto.supplierName !== undefined) payload.supplierName = dto.supplierName.trim();
    if (dto.contactPerson !== undefined) payload.contactPerson = dto.contactPerson.trim();
    if (dto.phoneNumber !== undefined) payload.phoneNumber = dto.phoneNumber.trim();
    if (dto.committedLeadTimeDays !== undefined) {
      payload.committedLeadTimeDays = Number(dto.committedLeadTimeDays);
    }
    if (dto.email !== undefined) payload.email = dto.email ? dto.email.trim() : null;
    if (dto.address !== undefined) payload.address = dto.address ? dto.address.trim() : null;

    const response = await apiClient.patch<ApiResponse<Supplier>>(
      `/suppliers/${id}`,
      payload,
    );
    return response.data?.data;
  },

  /**
   * Đổi trạng thái nhà cung cấp (Active <-> Inactive) (STORE_MANAGER)
   * PATCH /api/v1/suppliers/:id/status
   */
  async updateSupplierStatus(
    id: string,
    payload: UpdateSupplierStatusDto,
  ): Promise<Supplier> {
    const response = await apiClient.patch<ApiResponse<Supplier>>(
      `/suppliers/${id}/status`,
      payload,
    );
    return response.data?.data;
  },

  /**
   * Lấy danh sách điều kiện cung ứng (SKU, Giá nhập, MOQ) của một NCC
   * GET /api/v1/suppliers/:id/conditions
   */
  async getSupplyConditions(supplierId: string): Promise<SupplyCondition[]> {
    const response = await apiClient.get<ApiResponse<SupplyCondition[]>>(
      `/suppliers/${supplierId}/conditions`,
    );
    return response.data?.data || [];
  },

  /**
   * Gán SKU cho Nhà cung cấp với Đơn giá nhập và MOQ (STORE_MANAGER)
   * POST /api/v1/suppliers/:id/conditions
   */
  async createSupplyCondition(
    supplierId: string,
    dto: CreateSupplyConditionDto,
  ): Promise<SupplyCondition> {
    const payload = {
      productId: String(dto.productId),
      purchasePrice: Number(dto.purchasePrice),
      moq: dto.moq ? Number(dto.moq) : 1,
    };
    const response = await apiClient.post<ApiResponse<SupplyCondition>>(
      `/suppliers/${supplierId}/conditions`,
      payload,
    );
    return response.data?.data;
  },

  /**
   * Cập nhật điều kiện cung ứng (Đơn giá, MOQ, hoặc Trạng thái Active/Inactive) (STORE_MANAGER)
   * PATCH /api/v1/supply-conditions/:id
   */
  async updateSupplyCondition(
    conditionId: string,
    dto: UpdateSupplyConditionDto,
  ): Promise<SupplyCondition> {
    const payload: Record<string, unknown> = {};
    if (dto.purchasePrice !== undefined) payload.purchasePrice = Number(dto.purchasePrice);
    if (dto.moq !== undefined) payload.moq = Number(dto.moq);
    if (dto.status !== undefined) payload.status = dto.status;

    const response = await apiClient.patch<ApiResponse<SupplyCondition>>(
      `/supply-conditions/${conditionId}`,
      payload,
    );
    return response.data?.data;
  },

  /**
   * Tra cứu lịch sử đơn mua hàng của một NCC (phục vụ tab PO History)
   * GET /api/v1/purchase-orders?supplierId=:id
   */
  async getSupplierPurchaseOrders(
    supplierId: string,
    limit: number = 50,
  ): Promise<PurchaseOrderSummary[]> {
    const response = await apiClient.get<ApiResponse<PurchaseOrderSummary[]>>(
      '/purchase-orders',
      {
        params: {
          supplierId,
          limit,
        },
      },
    );
    return response.data?.data || [];
  },

  /**
   * Lấy danh sách sản phẩm Active trong danh mục để phục vụ gán SKU mới (UC-05)
   * GET /api/v1/products?status=Active&limit=100
   */
  async getActiveProducts(): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products', {
      params: {
        status: 'Active',
        limit: 100,
      },
    });
    const rawData = response.data?.data;
    if (Array.isArray(rawData)) return rawData;
    if (rawData && typeof rawData === 'object') {
      const anyData = rawData as Record<string, unknown>;
      if (Array.isArray(anyData.data)) return anyData.data as Product[];
      if (Array.isArray(anyData.items)) return anyData.items as Product[];
    }
    return [];
  },
};
