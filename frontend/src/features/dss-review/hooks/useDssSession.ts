import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dssService } from '../services/dss.service';
import type {
  DssSession,
  AnalyzeSessionRequest,
  UpdateRecommendationItemRequest,
} from '../types';

export const DSS_KEYS = {
  all: ['dss'] as const,
  categories: ['categories'] as const,
  activeDraft: ['dss', 'active-draft'] as const,
  session: (id: number | null) => ['dss', 'session', id] as const,
};

/**
 * Hook tải danh mục ngành hàng cho bộ lọc
 */
export function useCategories() {
  return useQuery({
    queryKey: DSS_KEYS.categories,
    queryFn: () => dssService.getCategories(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook tải phiên Draft đang dở dang (nếu có)
 */
export function useActiveDraftSession(enabled: boolean = true) {
  return useQuery({
    queryKey: DSS_KEYS.activeDraft,
    queryFn: () => dssService.getActiveDraftSession(),
    enabled,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook tải chi tiết một phiên đề xuất DSS
 */
export function useDssSession(sessionId: number | null) {
  return useQuery({
    queryKey: DSS_KEYS.session(sessionId),
    queryFn: () => dssService.getSessionById(sessionId!),
    enabled: !!sessionId && sessionId > 0,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Mutation kích hoạt phân tích DSS mới
 */
export function useAnalyzeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: AnalyzeSessionRequest) =>
      dssService.analyzeSession(payload),
    onSuccess: (data) => {
      // Làm mới phiên active draft
      queryClient.invalidateQueries({ queryKey: DSS_KEYS.activeDraft });
      if (data?.sessionId) {
        queryClient.invalidateQueries({
          queryKey: DSS_KEYS.session(data.sessionId),
        });
      }
    },
  });
}

/**
 * Mutation can thiệp người dùng (Human Adjustment: số lượng hoặc NCC)
 */
export function useUpdateRecommendationItem(sessionId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: number;
      payload: UpdateRecommendationItemRequest;
    }) => dssService.updateItem(itemId, payload),
    onSuccess: (updatedItem) => {
      if (!sessionId) return;
      // Cập nhật optimistic/trực tiếp vào cache phiên hiện tại
      queryClient.setQueryData<DssSession>(
        DSS_KEYS.session(sessionId),
        (old) => {
          if (!old) return old;
          const updatedItems = old.items.map((it) =>
            it.itemId === updatedItem.itemId ? { ...it, ...updatedItem } : it
          );
          // Tính lại totalApprovedAmount theo NCC thực tế được chọn (approvedSupplierId)
          const newTotalApproved = updatedItems.reduce((sum, it) => {
            let unitPrice = it.suggestedSupplier?.unitPrice ?? 0;
            if (it.approvedSupplierId && Array.isArray(it.supplierRankings)) {
              const matched = it.supplierRankings.find(
                (r) => r.supplierId === it.approvedSupplierId
              );
              if (matched && matched.price !== undefined) {
                unitPrice = matched.price;
              }
            }
            return sum + it.approvedQuantity * unitPrice;
          }, 0);

          return {
            ...old,
            items: updatedItems,
            totalApprovedAmount: newTotalApproved,
          };
        }
      );
    },
  });
}

/**
 * Mutation yêu cầu AI Gemini Flash giải thích lý do mua hàng On-demand
 */
export function useExplainRecommendationItem(sessionId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => dssService.explainItem(itemId),
    onSuccess: (data) => {
      if (!sessionId) return;
      queryClient.setQueryData<DssSession>(
        DSS_KEYS.session(sessionId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((it) =>
              it.itemId === data.itemId
                ? { ...it, llmExplanation: data.llmExplanation }
                : it
            ),
          };
        }
      );
    },
  });
}

/**
 * Mutation phê duyệt phiên DSS và sinh PO
 */
export function useApproveDssSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: number) => dssService.approveSession(sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: DSS_KEYS.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: DSS_KEYS.activeDraft });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}
