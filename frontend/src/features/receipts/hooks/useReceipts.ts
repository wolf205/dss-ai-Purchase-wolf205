import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { receiptService } from '../services/receipt.service';
import type {
  PendingPoQueryFilters,
  CreateGoodsReceiptPayload,
  GoodsReceiptResponse,
} from '../types';

export function usePendingPurchaseOrders(filters?: PendingPoQueryFilters) {
  return useQuery({
    queryKey: ['goods-receipts', 'pending-pos', filters],
    queryFn: () => receiptService.getPendingPurchaseOrders(filters),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
}

export function useGoodsReceiptDetail(id: string | null) {
  return useQuery({
    queryKey: ['goods-receipts', 'detail', id],
    queryFn: () => receiptService.getGoodsReceiptById(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useConfirmGoodsReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateGoodsReceiptPayload) =>
      receiptService.confirmGoodsReceipt(payload),
    onSuccess: (data: GoodsReceiptResponse) => {
      // Invalidate các query liên quan để đồng bộ tồn kho, trạng thái đơn PO và phong độ NCC
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });

      toast.success('Ghi nhận nhận hàng thành công', {
        description: `Phiếu nhập ${data.receiptNumber} đã được lập. Đơn hàng ${data.poNumber} đã hoàn tất và điểm OTIF đã được cập nhật.`,
      });
    },
    onError: (error: any) => {
      const code = error?.response?.data?.error?.code;
      const message =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Không thể xác nhận phiếu nhận hàng. Vui lòng kiểm tra lại.';

      if (code === 'ZERO_FULFILLMENT_RECEIPT') {
        toast.error('Chặn tiếp nhận đơn hàng (EF-2)', {
          description:
            'Tất cả mặt hàng đều có số lượng bằng 0. Nếu từ chối nhận hàng do lỗi/sai hàng, vui lòng giữ đơn ở trạng thái Chờ giao hoặc Hủy đơn tại UC-02.',
        });
      } else if (code === 'INVALID_FUTURE_DATE') {
        toast.error('Ngày nhận hàng không hợp lệ (EF-3)', {
          description:
            'Ngày nhận hàng thực tế không được lớn hơn ngày hiện tại hoặc trước ngày duyệt đơn.',
        });
      } else if (code === 'PO_ALREADY_CLOSED') {
        toast.error('Đơn mua hàng không hợp lệ (EF-5)', {
          description:
            'Đơn mua hàng này đã được nhận trước đó hoặc đã bị hủy. Hệ thống sẽ tự làm mới danh sách.',
        });
        queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
        queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      } else {
        toast.error('Lỗi khi ghi nhận nhận hàng', {
          description: message,
        });
      }
    },
  });
}
