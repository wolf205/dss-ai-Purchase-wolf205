import { apiClient } from '../../../services/api/axios.client';
import type { ApiResponse } from '../../../types/auth';
import type {
  PendingPoSummary,
  PendingPoQueryFilters,
  CreateGoodsReceiptPayload,
  GoodsReceiptResponse,
} from '../types';

export interface PendingPoListResponse {
  items: PendingPoSummary[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export const receiptService = {
  /**
   * Lấy danh sách Đơn mua hàng Approved chưa nhận hàng (UC-03 Bước 1, 2)
   * GET /api/v1/goods-receipts/pending-pos
   */
  async getPendingPurchaseOrders(
    filters?: PendingPoQueryFilters
  ): Promise<PendingPoListResponse> {
    const params: Record<string, string | number> = {};

    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.supplierId && filters.supplierId !== 'all') {
      params.supplierId = filters.supplierId;
    }
    if (filters?.search && filters.search.trim().length > 0) {
      params.search = filters.search.trim();
    }

    const response = await apiClient.get<
      ApiResponse<PendingPoSummary[]> & {
        meta?: {
          pagination?: {
            page: number;
            limit: number;
            totalItems: number;
            totalPages: number;
          };
        };
      }
    >('/goods-receipts/pending-pos', { params });

    const items = response.data?.data || [];
    const pagination = response.data?.meta?.pagination || {
      page: filters?.page || 1,
      limit: filters?.limit || 20,
      totalItems: items.length,
      totalPages: 1,
    };

    return {
      items,
      pagination,
    };
  },

  /**
   * Xác nhận Phiếu nhận hàng kho trong ACID Transaction (UC-03 Bước 4, 5)
   * POST /api/v1/goods-receipts
   */
  async confirmGoodsReceipt(
    payload: CreateGoodsReceiptPayload
  ): Promise<GoodsReceiptResponse> {
    const response = await apiClient.post<ApiResponse<GoodsReceiptResponse>>(
      '/goods-receipts',
      payload
    );
    return response.data?.data;
  },

  /**
   * Xem chi tiết Phiếu nhận hàng kho đã lập
   * GET /api/v1/goods-receipts/:id
   */
  async getGoodsReceiptById(id: string): Promise<GoodsReceiptResponse> {
    const response = await apiClient.get<ApiResponse<GoodsReceiptResponse>>(
      `/goods-receipts/${id}`
    );
    return response.data?.data;
  },
};
