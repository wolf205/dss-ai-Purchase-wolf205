import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { orderService } from '../services/order.service';
import type { PurchaseOrderFilters } from '../types';

export function usePurchaseOrders(filters: PurchaseOrderFilters) {
  return useQuery({
    queryKey: ['purchase-orders', filters],
    queryFn: () => orderService.getPurchaseOrders(filters),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000, // 1 phút
  });
}

export function usePurchaseOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ['purchase-orders', 'detail', id],
    queryFn: () => orderService.getPurchaseOrderById(id!),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      cancellationReason,
    }: {
      id: string;
      cancellationReason: string;
    }) => orderService.cancelPurchaseOrder(id, { cancellationReason }),
    onSuccess: (data, variables) => {
      // Invalidate toàn bộ query liên quan đến PO để cập nhật status và on_order
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.setQueryData(
        ['purchase-orders', 'detail', variables.id],
        data
      );
      toast.success('Hủy đơn mua hàng thành công', {
        description: `Đơn hàng ${data.poNumber} đã được hủy. Đã hoàn trả số lượng đang đặt (on_order_quantity) cho các SKU trong đơn.`,
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Không thể hủy đơn mua hàng. Vui lòng kiểm tra lại.';
      toast.error('Lỗi khi hủy đơn hàng', { description: message });
    },
  });
}

export function useExportPurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      format,
    }: {
      id: string;
      format: 'pdf' | 'excel';
    }) => orderService.exportPurchaseOrder(id, format),
    onSuccess: (_, variables) => {
      // Invalidate để cập nhật lastExportedAt
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Xuất chứng từ thành công', {
        description: `Đã tải về chứng từ đơn hàng theo định dạng ${variables.format.toUpperCase()}.`,
      });
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Lỗi khi xuất chứng từ đơn mua hàng.';
      toast.error('Xuất chứng từ thất bại', { description: message });
    },
  });
}

export function useSupplierOptions() {
  return useQuery({
    queryKey: ['suppliers', 'options'],
    queryFn: () => orderService.getSupplierOptions(),
    staleTime: 10 * 60 * 1000, // 10 phút
  });
}
