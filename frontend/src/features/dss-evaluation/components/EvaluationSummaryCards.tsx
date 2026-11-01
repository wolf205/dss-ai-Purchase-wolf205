import React from 'react';
import { Target, TrendingUp, BarChart2, PackageCheck } from 'lucide-react';
import type { OverallEvaluationSummary } from '../types';

interface EvaluationSummaryCardsProps {
  summary: OverallEvaluationSummary;
}

export const EvaluationSummaryCards: React.FC<EvaluationSummaryCardsProps> = ({ summary }) => {
  const getQualityBadge = (rating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING') => {
    switch (rating) {
      case 'EXCELLENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Xuất Sắc (&le; 20%)
          </span>
        );
      case 'ACCEPTABLE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            Chấp Nhận Được (20-35%)
          </span>
        );
      case 'NEEDS_TUNING':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            Cần Hiệu Chỉnh (&gt; 35%)
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Thẻ 1: Sai số WAPE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Sai Số WAPE (Chuẩn Vàng)
          </span>
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Target className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            {summary.overallWape.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">weighted error</span>
        </div>
        <div className="mt-3">{getQualityBadge(summary.qualityRating)}</div>
      </div>

      {/* Thẻ 2: Forecast Bias */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Độ Lệch Thiên Vị (Bias)
          </span>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className={`text-3xl font-extrabold ${
              Math.abs(summary.overallBias) <= 5
                ? 'text-emerald-600'
                : summary.overallBias > 0
                ? 'text-amber-600'
                : 'text-rose-600'
            }`}
          >
            {summary.overallBias > 0 ? `+${summary.overallBias.toFixed(1)}%` : `${summary.overallBias.toFixed(1)}%`}
          </span>
          <span className="text-xs text-slate-400">over/under</span>
        </div>
        <p className="mt-3 text-xs text-slate-500 truncate">
          {Math.abs(summary.overallBias) <= 3
            ? '✅ Cân bằng lý tưởng, không lệch'
            : summary.overallBias > 0
            ? '⚠️ Dự báo hơi cao hơn thực tế'
            : '⚠️ Dự báo thấp hơn nhu cầu thực'}
        </p>
      </div>

      {/* Thẻ 3: MAPE & MAE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Sai Số Trung Bình (MAE)
          </span>
          <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            &plusmn;{summary.overallMae.toFixed(1)}
          </span>
          <span className="text-xs text-slate-400">sản phẩm / ngày</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          MAPE trung bình: <strong className="text-slate-700">{summary.overallMape.toFixed(1)}%</strong>
        </p>
      </div>

      {/* Thẻ 4: Tổng Sản Lượng Đối Soát */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Tổng Doanh Số Đối Soát
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            {summary.totalActual.toLocaleString('vi-VN')}
          </span>
          <span className="text-xs text-slate-400">sp thực tế</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          AI dự báo: <strong className="text-slate-700">{summary.totalPredicted.toLocaleString('vi-VN')} sp</strong> ({summary.evaluatedDaysCount}/{summary.totalDaysHorizon} ngày)
        </p>
      </div>
    </div>
  );
};

