import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { DssToolbar } from '../components/DssToolbar';
import { DssSummaryBar } from '../components/DssSummaryBar';
import { DssRecommendationTable } from '../components/DssRecommendationTable';
import { ForecastChartModal } from '../components/ForecastChartModal';
import { SupplierRankingModal } from '../components/SupplierRankingModal';
import { ExplainModal } from '../components/ExplainModal';
import { ApprovalConfirmModal } from '../components/ApprovalConfirmModal';
import {
  useCategories,
  useActiveDraftSession,
  useDssSession,
  useAnalyzeSession,
  useUpdateRecommendationItem,
  useExplainRecommendationItem,
  useApproveDssSession,
} from '../hooks/useDssSession';
import type {
  RecommendationItem,
  DssFilterState,
  GeneratedPurchaseOrder,
} from '../types';

export const DssReviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramSessionId = searchParams.get('sessionId')
    ? Number(searchParams.get('sessionId'))
    : null;

  // Selected Category Scope for Trigger Analyze
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>(
    'all'
  );

  // Table Filters
  const [filters, setFilters] = useState<DssFilterState>({
    search: '',
    riskStatus: 'all',
    abcClass: 'all',
    xyzClass: 'all',
  });

  // Modal states
  const [chartItem, setChartItem] = useState<RecommendationItem | null>(null);
  const [rankingItem, setRankingItem] = useState<RecommendationItem | null>(
    null
  );
  const [explainingItem, setExplainingItem] =
    useState<RecommendationItem | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [generatedOrders, setGeneratedOrders] = useState<
    GeneratedPurchaseOrder[] | null
  >(null);

  // Queries
  const { data: categories = [] } = useCategories();
  const {
    data: activeDraftSession,
    isLoading: isLoadingActiveDraft,
  } = useActiveDraftSession(!paramSessionId);

  // Active Session Resolution
  const currentSessionId =
    paramSessionId || (activeDraftSession ? activeDraftSession.sessionId : null);

  const {
    data: sessionDetail,
    isLoading: isLoadingSession,
  } = useDssSession(currentSessionId);

  // Use sessionDetail if available, else activeDraftSession
  const session = sessionDetail || activeDraftSession;

  // Sync session id into URL search param if we found an active draft and no param existed
  useEffect(() => {
    if (!paramSessionId && activeDraftSession?.sessionId) {
      setSearchParams({ sessionId: String(activeDraftSession.sessionId) }, { replace: true });
    }
  }, [paramSessionId, activeDraftSession, setSearchParams]);

  // Mutations
  const analyzeMutation = useAnalyzeSession();
  const updateItemMutation = useUpdateRecommendationItem(currentSessionId);
  const explainItemMutation = useExplainRecommendationItem(currentSessionId);
  const approveMutation = useApproveDssSession();

  // Trigger Analyze handler
  const handleTriggerAnalyze = async () => {
    try {
      const res = await analyzeMutation.mutateAsync({
        categoryId: selectedCategoryId === 'all' ? null : selectedCategoryId,
      });
      toast.success('Khởi tạo phiên phân tích DSS thành công!', {
        description: `Đã phân tích ${res.totalSkusAnalyzed} mặt hàng, gợi ý ${res.suggestedOrderCount} mặt hàng cần đặt.`,
      });
      // Switch URL to the newly created session
      setSearchParams({ sessionId: String(res.sessionId) });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ||
        'Không thể chạy phân tích DSS. Vui lòng kiểm tra lại dịch vụ AI.';
      toast.error('Lỗi phân tích DSS', { description: msg });
    }
  };

  // Human Adjustment: Quantity Update
  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    try {
      await updateItemMutation.mutateAsync({
        itemId,
        payload: { approvedQuantity: quantity },
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Không thể cập nhật số lượng';
      toast.error('Lỗi cập nhật', { description: msg });
    }
  };

  // Human Adjustment: Supplier Selection from Modal
  const handleSelectSupplier = async (supplierId: number) => {
    if (!rankingItem) return;
    try {
      await updateItemMutation.mutateAsync({
        itemId: rankingItem.itemId,
        payload: { approvedSupplierId: supplierId },
      });
      toast.success('Đã cập nhật nhà cung cấp được duyệt');
      setRankingItem(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || 'Không thể đổi nhà cung cấp';
      toast.error('Lỗi cập nhật NCC', { description: msg });
    }
  };

  // On-demand Explain trigger
  const handleOpenExplain = (item: RecommendationItem) => {
    setExplainingItem(item);
    if (!item.llmExplanation) {
      explainItemMutation.mutate(item.itemId, {
        onError: () => {
          toast.warning('Không thể tạo giải thích tự nhiên lúc này');
        },
      });
    }
  };

  // Approve Session handler
  const handleConfirmApprove = async () => {
    if (!currentSessionId) return;
    try {
      const res = await approveMutation.mutateAsync(currentSessionId);
      setGeneratedOrders(res.generatedPurchaseOrders);
      toast.success('Phê duyệt thành công!', {
        description: `Đã khởi tạo ${res.generatedPurchaseOrders.length} đơn mua hàng (PO).`,
      });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ||
        'Không thể phê duyệt phiên phân tích.';
      toast.error('Lỗi phê duyệt', { description: msg });
    }
  };

  // Client-side Filtering of Items
  const sessionItems = session?.items;
  const filteredItems = useMemo(() => {
    if (!sessionItems) return [];

    return sessionItems.filter((item) => {
      // Search filter
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const matchSku = item.skuCode.toLowerCase().includes(q);
        const matchName = item.skuName.toLowerCase().includes(q);
        if (!matchSku && !matchName) return false;
      }

      // Stock risk filter
      if (filters.riskStatus !== 'all') {
        if (item.stockRiskStatus !== filters.riskStatus) return false;
      }

      // ABC classification filter
      if (filters.abcClass !== 'all') {
        if (item.abcClassification !== filters.abcClass) return false;
      }

      return true;
    });
  }, [sessionItems, filters]);

  const isLoading =
    (!session && (isLoadingActiveDraft || isLoadingSession)) ||
    analyzeMutation.isPending;

  const isDraft = session?.status === 'Draft';

  return (
    <div className="space-y-6">
      {/* Session Overview Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Core DSS Engine (UC-01)
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Bảng Đề Xuất DSS & Dự Báo Nhu Cầu Mua Hàng
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Tổng hợp dự báo tiêu thụ 14 ngày, phân loại ma trận ABC-XYZ, ngưỡng an toàn SS/ROP, 
              đề xuất số lượng đặt mua tối ưu (SOQ) và xếp hạng nhà cung cấp WSM.
            </p>
          </div>

          {session && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Mã phiên phân tích
                </span>
                <span className="font-mono font-bold text-xs text-slate-800">
                  {session.sessionCode}
                </span>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  isDraft
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {session.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content / Empty State */}
      {!session && !isLoading ? (
        /* Empty State: No Session */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">
              Chưa có phiên đề xuất mua hàng nào đang mở
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Chọn phạm vi ngành hàng hoặc toàn bộ cửa hàng bên dưới và bấm nút 
              <strong> "Chạy phân tích DSS"</strong> để hệ thống thực thi dự báo và sinh đề xuất mua hàng tối ưu.
            </p>
          </div>

          <div className="inline-flex flex-col sm:flex-row items-center gap-3 pt-2">
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedCategoryId(val === 'all' ? 'all' : Number(val));
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer min-w-[220px]"
            >
              <option value="all">🏢 Toàn bộ cửa hàng (All Categories)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  📦 {c.categoryName} ({c.categoryCode})
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="md"
              onClick={handleTriggerAnalyze}
              isLoading={analyzeMutation.isPending}
              leftIcon={<Sparkles className="w-4 h-4 text-blue-400" />}
            >
              {analyzeMutation.isPending
                ? 'Đang phân tích AI...'
                : 'Kích hoạt phân tích DSS ngay'}
            </Button>
          </div>
        </div>
      ) : (
        /* Active Session View */
        <div className="space-y-4">
          {/* Toolbar */}
          <DssToolbar
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
            onTriggerAnalyze={handleTriggerAnalyze}
            isAnalyzing={analyzeMutation.isPending}
            filters={filters}
            onFilterChange={(newFilters) =>
              setFilters((prev) => ({ ...prev, ...newFilters }))
            }
            totalItemsCount={session?.items?.length || 0}
            filteredItemsCount={filteredItems.length}
          />

          {/* Real-time Summary & Approval Bar */}
          {session && (
            <DssSummaryBar
              session={session}
              isDraft={isDraft}
              onOpenApproveModal={() => {
                setGeneratedOrders(null);
                setIsApproveModalOpen(true);
              }}
            />
          )}

          {/* Recommendation Table */}
          <DssRecommendationTable
            items={filteredItems}
            isDraft={isDraft}
            onUpdateQuantity={handleUpdateQuantity}
            onOpenExplain={handleOpenExplain}
            onOpenChart={(item) => setChartItem(item)}
            onOpenSupplierModal={(item) => setRankingItem(item)}
          />
        </div>
      )}

      {/* Modals */}
      {/* 1. Forecast Chart Modal (Recharts CI 95%) */}
      <ForecastChartModal
        isOpen={!!chartItem}
        onClose={() => setChartItem(null)}
        item={chartItem}
      />

      {/* 2. Supplier Ranking Modal (WSM Engine) */}
      <SupplierRankingModal
        isOpen={!!rankingItem}
        onClose={() => setRankingItem(null)}
        item={rankingItem}
        onSelectSupplier={handleSelectSupplier}
        isUpdating={updateItemMutation.isPending}
      />

      {/* 3. On-demand Explain Modal (Gemini 1.5 Flash) */}
      <ExplainModal
        isOpen={!!explainingItem}
        onClose={() => setExplainingItem(null)}
        item={
          explainingItem
            ? session?.items?.find((i) => i.itemId === explainingItem.itemId) ||
              explainingItem
            : null
        }
        isLoading={explainItemMutation.isPending}
        error={explainItemMutation.isError ? 'Lỗi kết nối LLM' : null}
        onRetry={() => {
          if (explainingItem) {
            explainItemMutation.mutate(explainingItem.itemId);
          }
        }}
      />

      {/* 4. Approval Confirmation & Success Modal */}
      <ApprovalConfirmModal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false);
          setGeneratedOrders(null);
        }}
        session={session || null}
        onConfirmApprove={handleConfirmApprove}
        isApproving={approveMutation.isPending}
        generatedOrders={generatedOrders}
      />
    </div>
  );
};
