import React from 'react';
import {
  ShieldCheck,
  Calendar,
  Layers,
  Info,
  Minus,
  Plus,
} from 'lucide-react';
import { SERVICE_LEVEL_OPTIONS } from '../types';

export interface InventoryPolicyCardProps {
  targetServiceLevel: number;
  reviewPeriodDays: number;
  onServiceLevelChange: (level: number) => void;
  onReviewPeriodChange: (days: number) => void;
  isReadOnly?: boolean;
}

export const InventoryPolicyCard: React.FC<InventoryPolicyCardProps> = ({
  targetServiceLevel,
  reviewPeriodDays,
  onServiceLevelChange,
  onReviewPeriodChange,
  isReadOnly = false,
}) => {
  const currentOption =
    SERVICE_LEVEL_OPTIONS.find((opt) => opt.value === targetServiceLevel) ||
    SERVICE_LEVEL_OPTIONS[1];

  const handleReviewPeriodAdjust = (delta: number) => {
    if (isReadOnly) return;
    const nextVal = Math.max(1, Math.min(30, reviewPeriodDays + delta));
    onReviewPeriodChange(nextVal);
  };

  const handleReviewPeriodInput = (raw: string) => {
    if (isReadOnly) return;
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      onReviewPeriodChange(Math.max(1, Math.min(30, num)));
    }
  };

  const isReviewPeriodValid =
    Number.isInteger(reviewPeriodDays) &&
    reviewPeriodDays >= 1 &&
    reviewPeriodDays <= 30;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                2. Chính Sách Tồn Kho & Chu Kỳ Đặt Hàng
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                BR-01, BR-26, BR-27
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Thiết lập Mức độ phục vụ mục tiêu (Target Service Level) và Chu kỳ rà soát mua hàng (Review Period).
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Section 1: Target Service Level */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Mức Độ Phục Vụ Mục Tiêu (Target Service Level)
              </label>
            </div>
            <span className="text-xs text-slate-500">
              Hệ số an toàn hiện tại: <strong className="font-mono text-indigo-700">Z = {currentOption.zFactor}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SERVICE_LEVEL_OPTIONS.map((option) => {
              const isSelected = targetServiceLevel === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => onServiceLevelChange(option.value)}
                  className={`p-4 rounded-xl text-left border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 relative ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
                  }`}
                >
                  {option.recommendedTag && (
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
                      {option.recommendedTag}
                    </span>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {option.label}
                    </span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Hệ số Z:</span>
                      <span className="font-mono font-bold text-slate-800">
                        Z = {option.zFactor}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Rủi ro đứt hàng:</span>
                      <span className="font-mono text-rose-600 font-semibold">
                        {option.riskPercentage}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Formula Callout */}
          <div className="mt-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Công thức Safety Stock (BR-01):</strong>{' '}
              <code className="px-1.5 py-0.5 rounded bg-white font-mono text-indigo-700 border border-indigo-200">
                Safety Stock = Z × σd × √LeadTime
              </code>
              . Hệ số Z càng cao thì mức tồn kho dự phòng an toàn càng lớn để đảm bảo tỷ lệ phục vụ khách hàng.
            </div>
          </div>
        </div>

        {/* Section 2: Review Period */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <label
                htmlFor="input-review-period"
                className="text-xs font-bold text-slate-900 uppercase tracking-wider"
              >
                Chu Kỳ Rà Soát Mua Hàng Định Kỳ (Review Period - R)
              </label>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Khoảng cho phép: 1 – 30 ngày (BR-27)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/40">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                Số ngày giữa hai kỳ rà soát mua hàng
              </span>
              <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                Chu kỳ rà soát quy định khoảng thời gian bảo vệ nhu cầu chu kỳ đặt hàng (
                <code className="text-slate-700 font-mono">LeadTime + R</code>) trong công thức tính toán ROP và Base SOQ tại UC-01.
              </p>
            </div>

            {/* Stepper Input */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isReadOnly || reviewPeriodDays <= 1}
                onClick={() => handleReviewPeriodAdjust(-1)}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Giảm 1 ngày"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="relative">
                <input
                  id="input-review-period"
                  type="number"
                  min="1"
                  max="30"
                  step="1"
                  disabled={isReadOnly}
                  value={reviewPeriodDays}
                  onChange={(e) => handleReviewPeriodInput(e.target.value)}
                  className={`w-20 px-3 py-2 text-center text-sm font-bold font-mono text-slate-900 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 ${
                    isReviewPeriodValid
                      ? 'border-slate-300'
                      : 'border-rose-500 text-rose-600 ring-1 ring-rose-500'
                  }`}
                />
              </div>

              <span className="text-xs font-bold text-slate-600">ngày</span>

              <button
                type="button"
                disabled={isReadOnly || reviewPeriodDays >= 30}
                onClick={() => handleReviewPeriodAdjust(1)}
                className="w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Tăng 1 ngày"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isReviewPeriodValid && (
            <p className="text-xs text-rose-600 mt-2 font-medium">
              Chu kỳ rà soát mua hàng bắt buộc là số nguyên từ 1 đến 30 ngày (BR-27, EF-2).
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
