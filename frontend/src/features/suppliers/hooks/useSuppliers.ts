import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supplierService } from '../services/supplier.service';
import type {
  SupplierFilters,
  CreateSupplierDto,
  UpdateSupplierDto,
  CreateSupplyConditionDto,
  UpdateSupplyConditionDto,
} from '../types';

/**
 * Trích xuất thông báo lỗi chuẩn từ backend AllExceptionsFilter
 */
export function extractSupplierErrorMessage(error: unknown): string {
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
      'Mã nhà cung cấp đã tồn tại trong hệ thống. Vui lòng kiểm tra lại hoặc sử dụng mã khác (EF-1, BR-21).'
    );
  }

  if (code === 'ACTIVE_PO_EXISTS') {
    return (
      errorObj?.message ||
      'Không thể ngừng hợp tác với nhà cung cấp này do đang có Đơn mua hàng (PO) ở trạng thái Approved đang chờ giao hàng (EF-4, BR-24).'
    );
  }

  if (code === 'ON_ORDER_SKU_EXISTS') {
    return (
      errorObj?.message ||
      'Không thể ngừng cung ứng sản phẩm này do đang có hàng chờ giao trong Đơn mua hàng Approved (EF-5, BR-23).'
    );
  }

  if (code === 'DUPLICATE_SKU_ASSIGNMENT') {
    return (
      errorObj?.message ||
      'Mặt hàng này đã có trong danh mục cung ứng của nhà cung cấp. Vui lòng sử dụng chức năng Sửa điều kiện (EF-2).'
    );
  }

  if (code === 'RESOURCE_NOT_FOUND') {
    return errorObj?.message || 'Không tìm thấy nhà cung cấp hoặc sản phẩm tương ứng.';
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
    'Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.'
  );
}

/**
 * Hook tra cứu danh sách nhà cung cấp (UC-06)
 */
export function useSuppliers(filters?: SupplierFilters) {
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => supplierService.getSuppliers(filters),
    placeholderData: (previousData) => previousData,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook xem chi tiết hồ sơ một NCC
 */
export function useSupplier(id?: string | null) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.getSupplierById(id!),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook tra cứu danh sách điều kiện cung ứng của một NCC
 */
export function useSupplyConditions(supplierId?: string | null) {
  return useQuery({
    queryKey: ['supplyConditions', supplierId],
    queryFn: () => supplierService.getSupplyConditions(supplierId!),
    enabled: Boolean(supplierId),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook tra cứu lịch sử PO của một NCC
 */
export function useSupplierPurchaseOrders(supplierId?: string | null) {
  return useQuery({
    queryKey: ['supplierPurchaseOrders', supplierId],
    queryFn: () => supplierService.getSupplierPurchaseOrders(supplierId!),
    enabled: Boolean(supplierId),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook lấy danh sách SKU Active để gán vào NCC
 */
export function useActiveProducts() {
  return useQuery({
    queryKey: ['activeProducts'],
    queryFn: () => supplierService.getActiveProducts(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook tạo mới nhà cung cấp (STORE_MANAGER)
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSupplierDto) => supplierService.createSupplier(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Tạo nhà cung cấp thành công', {
        description: `NCC ${data.supplierCode} - ${data.supplierName} đã được thêm vào hệ thống với điểm khởi tạo 80%.`,
      });
    },
    onError: (error) => {
      toast.error('Không thể tạo nhà cung cấp', {
        description: extractSupplierErrorMessage(error),
      });
    },
  });
}

/**
 * Hook cập nhật hồ sơ nhà cung cấp (STORE_MANAGER)
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupplierDto }) =>
      supplierService.updateSupplier(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', data.id] });
      toast.success('Cập nhật thành công', {
        description: `Thông tin nhà cung cấp ${data.supplierCode} đã được lưu thành công.`,
      });
    },
    onError: (error) => {
      toast.error('Cập nhật hồ sơ thất bại', {
        description: extractSupplierErrorMessage(error),
      });
    },
  });
}

/**
 * Hook đổi trạng thái hợp tác NCC (Active <-> Inactive) (STORE_MANAGER)
 */
export function useUpdateSupplierStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Active' | 'Inactive' }) =>
      supplierService.updateSupplierStatus(id, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['supplier', data.id] });
      const statusLabel =
        data.status === 'Active' ? 'Đang hợp tác (Active)' : 'Ngừng hợp tác (Inactive)';
      toast.success('Đổi trạng thái thành công', {
        description: `Nhà cung cấp ${data.supplierCode} đã chuyển sang trạng thái ${statusLabel}.`,
      });
    },
    onError: (error) => {
      toast.error('Không thể đổi trạng thái', {
        description: extractSupplierErrorMessage(error),
      });
    },
  });
}

/**
 * Hook gán SKU cho nhà cung cấp (STORE_MANAGER)
 */
export function useCreateSupplyCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supplierId,
      payload,
    }: {
      supplierId: string;
      payload: CreateSupplyConditionDto;
    }) => supplierService.createSupplyCondition(supplierId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplyConditions', data.supplierId] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Gán mặt hàng thành công', {
        description: `SKU ${data.product?.skuCode} đã được gán cho NCC với giá ${data.purchasePrice.toLocaleString()} đ, MOQ: ${data.moq}.`,
      });
    },
    onError: (error) => {
      toast.error('Không thể gán SKU', {
        description: extractSupplierErrorMessage(error),
      });
    },
  });
}

/**
 * Hook cập nhật điều kiện cung ứng (STORE_MANAGER)
 */
export function useUpdateSupplyCondition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conditionId,
      supplierId: _supplierId,
      payload,
    }: {
      conditionId: string;
      supplierId: string;
      payload: UpdateSupplyConditionDto;
    }) => supplierService.updateSupplyCondition(conditionId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['supplyConditions', data.supplierId] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      if (data.status === 'Inactive') {
        toast.info('Đã ngừng cung ứng SKU', {
          description: data.isSoleSupplier
            ? `Cảnh báo: Đây là NCC duy nhất cho SKU ${data.product?.skuCode}. DSS sẽ không thể gợi ý mua hàng cho đến khi có NCC mới.`
            : `Mặt hàng ${data.product?.skuCode} đã được chuyển sang trạng thái Ngừng cung ứng.`,
        });
      } else {
        toast.success('Cập nhật điều kiện thành công', {
          description: `Điều kiện cung ứng cho SKU ${data.product?.skuCode} đã được lưu.`,
        });
      }
    },
    onError: (error) => {
      toast.error('Thao tác thất bại', {
        description: extractSupplierErrorMessage(error),
      });
    },
  });
}
