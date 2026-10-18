import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { catalogService } from '../services/catalog.service';
import type {
  ProductFilters,
  CreateProductDto,
  UpdateProductDto,
} from '../types';

/**
 * Trích xuất thông báo lỗi chuẩn từ phản hồi của backend (AllExceptionsFilter)
 */
export function extractCatalogErrorMessage(error: unknown): string {
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

  if (code === 'DUPLICATE_CODE') {
    return (
      errorObj?.message ||
      'Mã SKU hoặc Mã vạch đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.'
    );
  }

  if (code === 'HARD_DELETE_PROHIBITED') {
    return (
      errorObj?.message ||
      'Không thể xóa sản phẩm này do đã phát sinh dữ liệu liên kết lịch sử. Vui lòng sử dụng chức năng Ngừng kinh doanh (Inactive).'
    );
  }

  if (code === 'RESOURCE_NOT_FOUND') {
    return errorObj?.message || 'Không tìm thấy sản phẩm hoặc ngành hàng tương ứng.';
  }

  if (code === 'FORBIDDEN_ROLE') {
    return 'Bạn không có quyền thực hiện thao tác này. Yêu cầu vai trò Store Manager.';
  }

  if (code === 'VALIDATION_ERROR' && errorObj?.details && errorObj.details.length > 0) {
    const issues = errorObj.details
      .map((d) => d.issue || d.message)
      .filter(Boolean)
      .join(', ');
    if (issues) return `${errorObj.message}: ${issues}`;
  }

  return (
    errorObj?.message ||
    axiosErr?.response?.data?.message ||
    'Đã xảy ra lỗi trong quá trình xử lý yêu cầu. Vui lòng thử lại.'
  );
}

/**
 * Hook tra cứu danh sách sản phẩm SKU kèm bộ lọc và phân trang (UC-05)
 */
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => catalogService.getProducts(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook lấy toàn bộ danh mục ngành hàng (Categories list)
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook xem chi tiết một SKU
 */
export function useProduct(id?: string | null) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => catalogService.getProductById(id!),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook tạo mới sản phẩm SKU (STORE_MANAGER)
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProductDto) => catalogService.createProduct(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Thêm sản phẩm thành công', {
        description: `Mã SKU ${data.skuCode} đã được thêm vào danh mục với trạng thái Active.`,
      });
    },
    onError: (error) => {
      toast.error('Không thể tạo sản phẩm', {
        description: extractCatalogErrorMessage(error),
      });
    },
  });
}

/**
 * Hook cập nhật thông tin sản phẩm SKU (STORE_MANAGER)
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductDto }) =>
      catalogService.updateProduct(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
      toast.success('Cập nhật thành công', {
        description: `Thông tin SKU ${data.skuCode} đã được cập nhật thành công.`,
      });
    },
    onError: (error) => {
      toast.error('Cập nhật thất bại', {
        description: extractCatalogErrorMessage(error),
      });
    },
  });
}

/**
 * Hook đổi trạng thái kinh doanh Active <-> Inactive (STORE_MANAGER)
 */
export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) =>
      catalogService.updateProductStatus(id, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', data.id] });
      const statusLabel =
        data.status === 'Active' ? 'Đang kinh doanh (Active)' : 'Ngừng kinh doanh (Inactive)';
      toast.success('Đổi trạng thái thành công', {
        description: `SKU ${data.skuCode} đã chuyển sang trạng thái ${statusLabel}.`,
      });
    },
    onError: (error) => {
      toast.error('Không thể đổi trạng thái', {
        description: extractCatalogErrorMessage(error),
      });
    },
  });
}

/**
 * Hook xóa vĩnh viễn Zero-Link SKU (STORE_MANAGER)
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => catalogService.deleteProduct(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Xóa sản phẩm thành công', {
        description: data?.message || `Đã xóa vĩnh viễn SKU ${data?.deletedSkuCode} khỏi hệ thống.`,
      });
    },
    onError: (error) => {
      toast.error('Không thể xóa sản phẩm', {
        description: extractCatalogErrorMessage(error),
      });
    },
  });
}
