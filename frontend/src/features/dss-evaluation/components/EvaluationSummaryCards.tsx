import React from 'react';
import { Target, TrendingUp, BarChart2, PackageCheck } from 'lucide-react';
import type { OverallEvaluationSummary } from '../types';

interface EvaluationSummaryCardsProps {
  summary: OverallEvaluationSummary;
  weeklySummary?: OverallEvaluationSummary | null;
}

export const EvaluationSummaryCards: React.FC<EvaluationSummaryCardsProps> = ({
  summary,
  weeklySummary,
}) => {
  const getQualityBadge = (
    rating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING',
    compact = false,
  ) => {
    switch (rating) {
      case 'EXCELLENT':
        return (
          <span
            className={`inline-flex items-center rounded-full font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 ${
              compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
            }`}
          >
            {compact ? 'Xuất sắc (≤30%)' : 'Xuất Sắc (≤ 30%)'}
          </span>
        );
      case 'ACCEPTABLE':
        return (
          <span
            className={`inline-flex items-center rounded-full font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 ${
              compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
            }`}
          >
            {compact ? 'Khá (30-45%)' : 'Chấp Nhận Được (30-45%)'}
          </span>
        );
      case 'NEEDS_TUNING':
      default:
        return (
          <span
            className={`inline-flex items-center rounded-full font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 ${
              compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs'
            }`}
          >
            {compact ? 'Cần chỉnh (>45%)' : 'Cần Hiệu Chỉnh (> 45%)'}
          </span>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Thẻ 1: Sai số WAPE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Sai Số WAPE (Theo Ngày)
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
          <div className="mt-2.5">
            {getQualityBadge(summary.qualityRating)}
          </div>
        </div>

        {weeklySummary && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 block">
                Chu kỳ tuần (đặt hàng)
              </span>
              <span className="text-sm font-bold text-slate-800">
                {weeklySummary.overallWape.toFixed(1)}%
              </span>
            </div>
            <div>
              {getQualityBadge(weeklySummary.qualityRating, true)}
            </div>
          </div>
        )}
      </div>

      {/* Thẻ 2: Forecast Bias */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
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
              {summary.overallBias > 0
                ? `+${summary.overallBias.toFixed(1)}%`
                : `${summary.overallBias.toFixed(1)}%`}
            </span>
            <span className="text-xs text-slate-400">over/under</span>
          </div>
          <div className="mt-2.5">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                Math.abs(summary.overallBias) <= 5
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : summary.overallBias > 0
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
              }`}
            >
              {Math.abs(summary.overallBias) <= 5
                ? 'Cân bằng lý tưởng'
                : summary.overallBias > 0
                ? 'Dự báo dư thừa'
                : 'Dự báo thiếu hụt'}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {Math.abs(summary.overallBias) <= 3
              ? '✅ Không lệch hệ thống, bù trừ tốt'
              : summary.overallBias > 0
              ? '⚠️ Nguy cơ ứ đọng vốn lưu động'
              : '⚠️ Cần đệm Safety Stock tránh đứt hàng'}
          </p>
        </div>
      </div>

      {/* Thẻ 3: MAPE & MAE */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Sai Số Tuyệt Đối (MAE)
            </span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              &plusmn;{summary.overallMae.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">sp / ngày / SKU</span>
          </div>
          <div className="mt-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 border border-violet-500/20">
              Độ lệch số lượng vật lý
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">MAPE trung bình:</span>
          <span className="font-bold text-slate-800">
            {summary.overallMape.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Thẻ 4: Tổng Sản Lượng Đối Soát */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
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
          <div className="mt-2.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {summary.evaluatedDaysCount} ngày đối soát
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">AI dự báo tổng:</span>
          <span className="font-bold text-slate-800">
            {summary.totalPredicted.toLocaleString('vi-VN')} sp
          </span>
        </div>
      </div>
    </div>
  );
};
