import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { dataImportService } from '../services/data-import.service';
import type {
  ImportType,
  SalesValidateResponse,
  SalesConfirmResponse,
  InventoryValidateResponse,
  InventoryConfirmResponse,
  ImportValidationErrorPayload,
} from '../types';

export function extractImportError(error: unknown): ImportValidationErrorPayload {
  const axiosErr = error as {
    response?: {
      data?: {
        error?: {
          code?: string;
          message?: string;
          details?: Array<{ row?: number; skuCode?: string; issue?: string }>;
        };
        message?: string;
      };
    };
  };

  const errorObj = axiosErr?.response?.data?.error;
  const code = errorObj?.code || 'VALIDATION_ERROR';
  const message =
    errorObj?.message ||
    axiosErr?.response?.data?.message ||
    'Tệp tải lên không hợp lệ hoặc không đúng cấu trúc định dạng.';

  const rawDetails = errorObj?.details || [];
  const details = rawDetails.map((item, index) => ({
    row: typeof item.row === 'number' ? item.row : index + 1,
    skuCode: item.skuCode,
    issue: item.issue || 'Dữ liệu không hợp lệ',
  }));

  return { code, message, details };
}

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: (type: ImportType) => dataImportService.downloadTemplate(type),
    onSuccess: (_, type) => {
      const name =
        type === 'sales' ? 'sales_template.csv' : 'inventory_template.csv';
      toast.success('Tải tệp mẫu thành công', {
        description: `Đã lưu tệp ${name} về thiết bị của bạn.`,
      });
    },
    onError: () => {
      toast.error('Lỗi khi tải tệp mẫu', {
        description: 'Không thể kết nối đến máy chủ để tải biểu mẫu chuẩn.',
      });
    },
  });
}

export function useValidateSales() {
  return useMutation<SalesValidateResponse, unknown, File>({
    mutationFn: (file: File) => dataImportService.validateSalesFile(file),
  });
}

export function useConfirmSales() {
  const queryClient = useQueryClient();

  return useMutation<SalesConfirmResponse, unknown, File>({
    mutationFn: (file: File) => dataImportService.confirmSales(file),
    onSuccess: (data) => {
      // Invalidate các query liên quan để đồng bộ dữ liệu dự báo & phiên DSS
      queryClient.invalidateQueries({ queryKey: ['dss-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast.success('Nạp dữ liệu bán hàng thành công!', {
        description: data.message,
      });
    },
  });
}

export function useValidateInventory() {
  return useMutation<InventoryValidateResponse, unknown, File>({
    mutationFn: (file: File) => dataImportService.validateInventoryFile(file),
  });
}

export function useConfirmInventory() {
  const queryClient = useQueryClient();

  return useMutation<InventoryConfirmResponse, unknown, File>({
    mutationFn: (file: File) => dataImportService.confirmInventory(file),
    onSuccess: (data) => {
      // Invalidate các query liên quan để đồng bộ tồn kho khả dụng
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dss-sessions'] });

      toast.success('Cập nhật tồn kho kiểm kê thành công!', {
        description: data.message,
      });
    },
  });
}
