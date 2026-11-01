import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  AlertCircle,
  FileUp,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useDssSessions, useDssSessionEvaluation } from '../hooks/useDssEvaluation';
import { EvaluationSummaryCards } from '../components/EvaluationSummaryCards';
import { ForecastVsActualChart } from '../components/ForecastVsActualChart';
import { SkuAccuracyTable } from '../components/SkuAccuracyTable';

export const DssEvaluationPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // 1. Tải danh sách các phiên DSS bằng TanStack Query
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    error: sessionsError,
  } = useDssSessions();

  // Tự động xác định phiên hiệu lực: ưu tiên phiên người dùng chọn, nếu chưa chọn thì lấy phiên Approved gần nhất
  const effectiveSessionId = useMemo(() => {
    if (selectedSessionId) return selectedSessionId;
    if (sessions.length === 0) return '';
    const approved = sessions.find((s) => s.status === 'Approved');
    return approved ? approved.id : sessions[0].id;
  }, [sessions, selectedSessionId]);

  // 2. Tải kết quả đánh giá đối soát cho phiên được chọn bằng TanStack Query
  const {
    data: evaluation = null,
    isLoading: isLoadingEval,
    isRefetching: isRefetchingEval,
    error: evalError,
    refetch: refetchEval,
  } = useDssSessionEvaluation(effectiveSessionId);

  const error = sessionsError
    ? 'Không thể tải danh sách phiên DSS'
    : evalError
    ? (evalError as any)?.response?.data?.message ||
      'Lỗi khi tải kết quả đối soát độ chính xác'
    : null;

  const handleRefresh = () => {
    if (effectiveSessionId) {
      refetchEval();
    }
  };

  const isRefreshing = isLoadingEval || isRefetchingEval;
  const selectedSessionInfo = sessions.find((s) => s.id === effectiveSessionId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Đối Soát & Đánh Giá Độ Chính Xác DSS
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kiểm định sai số dự báo (WAPE, MAPE, Bias) bằng cách so sánh số lượng AI khuyến nghị với doanh số bán thực tế
          </p>
        </div>

        {/* Session Selector & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {isLoadingSessions ? (
            <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-xl" />
          ) : sessions.length === 0 ? (
            <span className="text-xs text-slate-400">Chưa có phiên DSS nào</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Phiên DSS:</span>
              <select
                value={effectiveSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sessionCode} ({s.status}) - {new Date(s.createdAt).toLocaleDateString('vi-VN')}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || !effectiveSessionId}
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Làm mới dữ liệu đối soát"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selected Session Metadata Banner */}
      {selectedSessionInfo && (
        <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-blue-400 text-sm">{selectedSessionInfo.sessionCode}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-300">Phạm vi: {selectedSessionInfo.scope}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Tạo ngày:{' '}
              {new Date(selectedSessionInfo.createdAt).toLocaleString('vi-VN')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                selectedSessionInfo.status === 'Approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : selectedSessionInfo.status === 'Draft'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              Trạng thái: {selectedSessionInfo.status}
            </span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingEval && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Đang đối soát dữ liệu bán hàng thực tế...</p>
          <p className="text-xs text-slate-400">Hệ thống đang so khớp chuỗi thời gian ngày theo ngày cho 25 SKU</p>
        </div>
      )}

      {/* Error Banner */}
      {!isLoadingEval && error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Case 1: No Sessions exist at all */}
      {!isLoadingSessions && sessions.length === 0 && (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-blue-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Chưa có phiên phân tích đề xuất mua hàng nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Hãy kích hoạt phân tích DSS tại màn hình Bảng Đề Xuất DSS để tạo phiên mua hàng đầu tiên trước khi đối soát.
          </p>
          <button
            onClick={() => navigate('/dss')}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Đến Màn Hình Đề Xuất DSS
          </button>
        </div>
      )}

      {/* Case 2: Session exists but NO actual sales data imported yet for this window */}
      {!isLoadingEval && evaluation && !evaluation.hasActualData && (
        <div className="bg-amber-50/70 border border-amber-200/80 p-6 sm:p-8 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
            <FileUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Chưa Có Dữ Liệu Bán Hàng Thực Tế Trong Chu Kỳ Dự Báo
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 max-w-lg mx-auto">
              Phiên đề xuất này dự báo cho chuỗi ngày từ{' '}
              <strong className="text-slate-800">{evaluation.evaluationWindow.startDate}</strong> đến{' '}
              <strong className="text-slate-800">{evaluation.evaluationWindow.endDate}</strong> ({evaluation.evaluationWindow.totalDays} ngày). Hiện cơ sở dữ liệu chưa có doanh số bán hàng trong khoảng thời gian này.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 text-left text-xs max-w-md mx-auto space-y-2">
            <p className="font-semibold text-slate-800">📌 Hướng dẫn kiểm thử & đối soát:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Mở trang <strong>Nhập Dữ Liệu</strong></li>
              <li>Chọn loại <strong>Dữ liệu bán hàng (Sales History)</strong></li>
              <li>Tải lên tệp <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">data/demo_batches/week_1_sales.csv</code></li>
              <li>Quay lại màn hình này để xem kết quả đối soát tự động!</li>
            </ol>
          </div>

          <button
            onClick={() => navigate('/data-import')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow"
          >
            <FileUp className="w-4 h-4" /> Đến Trang Nhập Dữ Liệu Vận Hành
          </button>
        </div>
      )}

      {/* Case 3: Actual Sales Data IS available -> Show Full Evaluation Report */}
      {!isLoadingEval && evaluation && evaluation.hasActualData && evaluation.summary && (
        <div className="space-y-6">
          {/* Status Alert */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{evaluation.message}</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700">
              {evaluation.evaluationWindow.startDate} &rarr; {evaluation.evaluationWindow.endDate}
            </span>
          </div>

          {/* 1. Summary KPI Cards */}
          <EvaluationSummaryCards
            summary={evaluation.summary}
            weeklySummary={evaluation.weeklySummary}
          />

          {/* 2. Store-wide Aggregated Forecast vs Actual Chart */}
          <ForecastVsActualChart
            data={evaluation.summary.dailyAggregateTimeline}
            title="Biểu Đồ Đối Soát Doanh Số Toàn Cửa Hàng (Tổng Hợp 25 SKU)"
            subtitle={`So sánh tổng sản lượng bán ra thực tế với tổng nhu cầu dự báo qua ${evaluation.summary.evaluatedDaysCount} ngày vận hành`}
          />

          {/* 3. Detailed SKU Accuracy Table */}
          <SkuAccuracyTable skuEvaluations={evaluation.skuEvaluations} />
        </div>
      )}
    </div>
  );
};
