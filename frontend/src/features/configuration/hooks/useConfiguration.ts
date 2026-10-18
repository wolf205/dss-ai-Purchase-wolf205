import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { configurationService } from '../services/configuration.service';
import type { DssConfiguration, UpdateDssConfigurationDto } from '../types';

export const CONFIGURATION_QUERY_KEY = ['dss-configuration'] as const;

/**
 * Trích xuất thông báo lỗi chuẩn từ backend AllExceptionsFilter cho UC-07
 */
export function extractConfigurationErrorMessage(error: unknown): string {
  const axiosErr = error as {
    response?: {
      data?: {
        error?: {
          code?: string;
          message?: string;
          details?: Array<{ field?: string; issue?: string; message?: string }>;
        };
        message?: string;
      };
    };
  };

  const errorObj = axiosErr?.response?.data?.error;
  const code = errorObj?.code;

  if (code === 'SUM_WEIGHT_NOT_100') {
    return (
      errorObj?.message ||
      'Tổng 4 trọng số đánh giá Nhà cung cấp phải bằng chính xác 100% (BR-25).'
    );
  }

  if (code === 'FORBIDDEN_ROLE') {
    return (
      errorObj?.message ||
      'Chỉ Quản Lý Cửa Hàng (STORE_MANAGER) mới có quyền chỉnh sửa cấu hình DSS.'
    );
  }

  if (code === 'VALIDATION_ERROR') {
    if (errorObj?.details && errorObj.details.length > 0) {
      const firstDetail = errorObj.details[0];
      return (
        firstDetail.issue ||
        firstDetail.message ||
        'Dữ liệu cấu hình không hợp lệ. Vui lòng kiểm tra lại.'
      );
    }
    return errorObj?.message || 'Dữ liệu cấu hình không hợp lệ.';
  }

  return (
    errorObj?.message ||
    axiosErr?.response?.data?.message ||
    'Đã xảy ra lỗi khi thực hiện thao tác trên cấu hình DSS.'
  );
}

/**
 * Hook truy vấn cấu hình Singleton DSS hiện hành (UC-07)
 */
export function useConfiguration() {
  return useQuery<DssConfiguration, Error>({
    queryKey: CONFIGURATION_QUERY_KEY,
    queryFn: () => configurationService.getConfiguration(),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

/**
 * Hook cập nhật tham số cấu hình DSS (STORE_MANAGER)
 */
export function useUpdateConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateDssConfigurationDto) =>
      configurationService.updateConfiguration(dto),
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(CONFIGURATION_QUERY_KEY, updatedConfig);
      void queryClient.invalidateQueries({ queryKey: CONFIGURATION_QUERY_KEY });
      toast.success(
        'Cấu hình tham số DSS đã được cập nhật thành công và có hiệu lực cho các đợt phân tích tiếp theo.',
      );
    },
    onError: (error) => {
      const msg = extractConfigurationErrorMessage(error);
      toast.error(msg);
    },
  });
}

/**
 * Hook khôi phục cấu hình DSS về mặc định chuẩn mực hệ thống (STORE_MANAGER)
 */
export function useResetConfiguration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => configurationService.resetToDefaults(),
    onSuccess: (resetConfig) => {
      queryClient.setQueryData(CONFIGURATION_QUERY_KEY, resetConfig);
      void queryClient.invalidateQueries({ queryKey: CONFIGURATION_QUERY_KEY });
      toast.success(
        'Đã khôi phục toàn bộ tham số về cấu hình Baseline chuẩn mực của hệ thống (BR-28).',
      );
    },
    onError: (error) => {
      const msg = extractConfigurationErrorMessage(error);
      toast.error(msg);
    },
  });
}
