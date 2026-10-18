import { apiClient } from '../../../services/api/axios.client';
import type { ApiResponse } from '../../../types/auth';
import type {
  ImportType,
  SalesValidateResponse,
  SalesConfirmResponse,
  InventoryValidateResponse,
  InventoryConfirmResponse,
} from '../types';

export const dataImportService = {
  /**
   * Tải tệp biểu mẫu CSV chuẩn (sales hoặc inventory) (UC-04 Luồng rẽ nhánh AF-1)
   * GET /api/v1/data-imports/templates/:type
   */
  async downloadTemplate(type: ImportType): Promise<void> {
    const response = await apiClient.get(`/data-imports/templates/${type}`, {
      responseType: 'blob',
    });

    let filename =
      type === 'sales' ? 'sales_template.csv' : 'inventory_template.csv';

    const disposition = response.headers['content-disposition'];
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match?.[1]) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const blob = new Blob([response.data], {
      type: 'text/csv;charset=utf-8;',
    });
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
   * Thẩm định tệp CSV bán hàng theo nguyên tắc All-or-Nothing (UC-04 Bước 3, BR-14, BR-15)
   * POST /api/v1/data-imports/sales/validate
   */
  async validateSalesFile(file: File): Promise<SalesValidateResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<SalesValidateResponse>>(
      '/data-imports/sales/validate',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data?.data;
  },

  /**
   * Xác nhận ghi đè và nạp dữ liệu bán hàng trong ACID transaction (UC-04 Bước 6, BR-14, BR-15)
   * POST /api/v1/data-imports/sales/confirm
   */
  async confirmSales(file: File): Promise<SalesConfirmResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<SalesConfirmResponse>>(
      '/data-imports/sales/confirm',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data?.data;
  },

  /**
   * Thẩm định tệp CSV kiểm kê kệ theo nguyên tắc All-or-Nothing (UC-04 Bước 3, BR-14, BR-16)
   * POST /api/v1/data-imports/inventory/validate
   */
  async validateInventoryFile(file: File): Promise<InventoryValidateResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<
      ApiResponse<InventoryValidateResponse>
    >('/data-imports/inventory/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data?.data;
  },

  /**
   * Xác nhận cập nhật tồn kho kệ trong ACID transaction (UC-04 Bước 6, BR-14, BR-16)
   * POST /api/v1/data-imports/inventory/confirm
   */
  async confirmInventory(file: File): Promise<InventoryConfirmResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<
      ApiResponse<InventoryConfirmResponse>
    >('/data-imports/inventory/confirm', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data?.data;
  },
};
