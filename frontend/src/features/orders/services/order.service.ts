import { apiClient } from '../../../services/api/axios.client';
import type { ApiResponse } from '../../../types/auth';
import type {
  PurchaseOrderSummary,
  PurchaseOrderDetail,
  PurchaseOrderFilters,
  PaginationMeta,
  CancelPurchaseOrderRequest,
  SupplierOption,
} from '../types';

export interface PurchaseOrderListResponse {
  items: PurchaseOrderSummary[];
  pagination: PaginationMeta;
}

export const orderService = {
  /**
   * Tra cứu danh sách Đơn mua hàng (UC-02)
   * GET /api/v1/purchase-orders
   */
  async getPurchaseOrders(
    filters?: PurchaseOrderFilters
  ): Promise<PurchaseOrderListResponse> {
    const params: Record<string, string | number | boolean> = {};

    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.status && filters.status !== 'all') params.status = filters.status;
    if (filters?.supplierId && filters.supplierId !== 'all') {
      params.supplierId = filters.supplierId;
    }
    if (filters?.isOverdue !== undefined && filters.isOverdue !== 'all') {
      params.isOverdue = filters.isOverdue;
    }
    if (filters?.search && filters.search.trim().length > 0) {
      params.search = filters.search.trim();
    }

    const response = await apiClient.get<
      ApiResponse<PurchaseOrderSummary[]> & {
        meta?: { pagination?: PaginationMeta };
      }
    >('/purchase-orders', { params });

    const items = response.data?.data || [];
    const pagination: PaginationMeta = response.data?.meta?.pagination || {
      totalItems: items.length,
      itemCount: items.length,
      itemsPerPage: filters?.limit || 20,
      totalPages: 1,
      currentPage: filters?.page || 1,
    };

    return {
      items,
      pagination,
    };
  },

  /**
   * Xem chi tiết Đơn mua hàng (UC-02 Bước 4, 5)
   * GET /api/v1/purchase-orders/:id
   */
  async getPurchaseOrderById(id: string): Promise<PurchaseOrderDetail> {
    const response = await apiClient.get<ApiResponse<PurchaseOrderDetail>>(
      `/purchase-orders/${id}`
    );
    return response.data?.data;
  },

  /**
   * Hủy Đơn mua hàng & Hoàn trả on_order_quantity (UC-02 Luồng rẽ nhánh AF-1)
   * POST /api/v1/purchase-orders/:id/cancel
   */
  async cancelPurchaseOrder(
    id: string,
    payload: CancelPurchaseOrderRequest
  ): Promise<PurchaseOrderDetail> {
    const response = await apiClient.post<ApiResponse<PurchaseOrderDetail>>(
      `/purchase-orders/${id}/cancel`,
      payload
    );
    return response.data?.data;
  },

  /**
   * Phát hành / Xuất chứng từ Đơn mua hàng ra file PDF hoặc Excel (UC-02 Bước 6, 7)
   * POST /api/v1/purchase-orders/:id/export?format=pdf|excel
   */
  async exportPurchaseOrder(
    id: string,
    format: 'pdf' | 'excel' = 'pdf'
  ): Promise<void> {
    const response = await apiClient.post(
      `/purchase-orders/${id}/export`,
      {},
      {
        params: { format },
        responseType: 'blob',
      }
    );

    // Xác định tên file tải về từ header Content-Disposition nếu có
    let filename = `Don_mua_hang_PO-${id}.${format === 'excel' ? 'csv' : 'html'}`;
    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const blobType =
      format === 'excel'
        ? 'text/csv;charset=utf-8;'
        : 'text/html;charset=utf-8;';

    const blob = new Blob([response.data], { type: blobType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  /**
   * Lấy danh sách nhà cung cấp để hiển thị dropdown lọc
   * GET /api/v1/suppliers
   */
  async getSupplierOptions(): Promise<SupplierOption[]> {
    try {
      const response = await apiClient.get<{
        data: Array<{ id: string | number; supplierCode: string; supplierName: string }>;
      }>('/suppliers', {
        params: { limit: 100 },
      });
      const suppliers = response.data?.data || [];
      return suppliers.map((s) => ({
        id: String(s.id),
        supplierCode: s.supplierCode,
        supplierName: s.supplierName,
      }));
    } catch {
      return [];
    }
  },
};
