import React from 'react';
import {
  DollarSign,
  Clock,
  Package,
  Award,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { WEIGHT_PRESETS } from '../types';
import type { WeightPreset } from '../types';

export interface WeightSlidersCardProps {
  weightPrice: number;
  weightLeadTime: number;
  weightMoq: number;
  weightHistory: number;
  onChange: (weights: {
    weightPrice: number;
    weightLeadTime: number;
    weightMoq: number;
    weightHistory: number;
  }) => void;
  isReadOnly?: boolean;
}

export const WeightSlidersCard: React.FC<WeightSlidersCardProps> = ({
  weightPrice,
  weightLeadTime,
  weightMoq,
  weightHistory,
  onChange,
  isReadOnly = false,
}) => {
  const totalWeight = weightPrice + weightLeadTime + weightMoq + weightHistory;
  const isValid = totalWeight === 100;
  const isUnder = totalWeight < 100;
  const isOver = totalWeight > 100;

  const handleSliderChange = (
    field: 'weightPrice' | 'weightLeadTime' | 'weightMoq' | 'weightHistory',
    rawValue: number,
  ) => {
    if (isReadOnly) return;
    const value = Math.max(0, Math.min(100, Math.round(rawValue)));
    onChange({
      weightPrice: field === 'weightPrice' ? value : weightPrice,
      weightLeadTime: field === 'weightLeadTime' ? value : weightLeadTime,
      weightMoq: field === 'weightMoq' ? value : weightMoq,
      weightHistory: field === 'weightHistory' ? value : weightHistory,
    });
  };

  const applyPreset = (preset: WeightPreset) => {
    if (isReadOnly) return;
    onChange({
      weightPrice: preset.weights.price,
      weightLeadTime: preset.weights.leadTime,
      weightMoq: preset.weights.moq,
      weightHistory: preset.weights.history,
    });
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                1. Trọng Số Đánh Giá Nhà Cung Cấp (WSM Engine)
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                BR-02 & BR-25
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Phân bổ tỷ trọng giữa 4 tiêu chí cốt lõi. Tổng 4 trọng số bắt buộc phải bằng chính xác 100%.
            </p>
          </div>
        </div>

        {/* Live Validation Badge */}
        <div className="shrink-0 flex items-center gap-2">
          {isValid && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Tổng: 100% (Chuẩn hóa hợp lệ)</span>
            </div>
          )}
          {isUnder && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>
                Tổng: {totalWeight}% (Còn thiếu {100 - totalWeight}%)
              </span>
            </div>
          )}
          {isOver && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold shadow-2xs">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>
                Tổng: {totalWeight}% (Vượt quá {totalWeight - 100}%)
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Visual Stacked Distribution Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Trực quan hóa phân bổ tỷ trọng</span>
            <span className="font-mono">{totalWeight} / 100%</span>
          </div>

          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/80">
            {weightPrice > 0 && (
              <div
                style={{ width: `${weightPrice}%` }}
                className="bg-blue-500 transition-all duration-200"
                title={`Đơn giá: ${weightPrice}%`}
              />
            )}
            {weightLeadTime > 0 && (
              <div
                style={{ width: `${weightLeadTime}%` }}
                className="bg-purple-500 transition-all duration-200"
                title={`Lead Time: ${weightLeadTime}%`}
              />
            )}
            {weightMoq > 0 && (
              <div
                style={{ width: `${weightMoq}%` }}
                className="bg-amber-500 transition-all duration-200"
                title={`MOQ: ${weightMoq}%`}
              />
            )}
            {weightHistory > 0 && (
              <div
                style={{ width: `${weightHistory}%` }}
                className="bg-emerald-500 transition-all duration-200"
                title={`Lịch sử OTIF: ${weightHistory}%`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>Đơn giá ({weightPrice}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span>Lead Time ({weightLeadTime}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>MOQ ({weightMoq}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Lịch sử OTIF ({weightHistory}%)</span>
            </div>
          </div>
        </div>

        {/* 4 Sliders Grid */}
        <div className="space-y-5 pt-2">
          {/* 1. Price Weight */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/70 transition-colors">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="slider-price"
                    className="text-xs font-bold text-slate-900 block"
                  >
                    Tỷ Trọng Đơn Giá Nhập (Price Weight)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Min-Max chuẩn hóa nghịch đảo (giá thấp hơn đạt điểm cao hơn).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  disabled={isReadOnly}
                  value={weightPrice}
                  onChange={(e) =>
                    handleSliderChange('weightPrice', Number(e.target.value))
                  }
                  className="w-16 px-2 py-1 text-right text-xs font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            <input
              id="slider-price"
              type="range"
              min="0"
              max="100"
              step="1"
              disabled={isReadOnly}
              value={weightPrice}
              onChange={(e) =>
                handleSliderChange('weightPrice', Number(e.target.value))
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
            />
          </div>

          {/* 2. Lead Time Weight */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/70 transition-colors">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="slider-lead-time"
                    className="text-xs font-bold text-slate-900 block"
                  >
                    Tỷ Trọng Thời Gian Giao Hàng (Lead Time Weight)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Min-Max chuẩn hóa nghịch đảo (thời gian cam kết ngắn hơn đạt điểm cao hơn).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  disabled={isReadOnly}
                  value={weightLeadTime}
                  onChange={(e) =>
                    handleSliderChange('weightLeadTime', Number(e.target.value))
                  }
                  className="w-16 px-2 py-1 text-right text-xs font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            <input
              id="slider-lead-time"
              type="range"
              min="0"
              max="100"
              step="1"
              disabled={isReadOnly}
              value={weightLeadTime}
              onChange={(e) =>
                handleSliderChange('weightLeadTime', Number(e.target.value))
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:cursor-not-allowed"
            />
          </div>

          {/* 3. MOQ Weight */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/70 transition-colors">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="slider-moq"
                    className="text-xs font-bold text-slate-900 block"
                  >
                    Tỷ Trọng Số Lượng Đặt Tối Thiểu (MOQ Weight)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Min-Max chuẩn hóa nghịch đảo (MOQ nhỏ hơn linh hoạt vốn lưu động hơn).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  disabled={isReadOnly}
                  value={weightMoq}
                  onChange={(e) =>
                    handleSliderChange('weightMoq', Number(e.target.value))
                  }
                  className="w-16 px-2 py-1 text-right text-xs font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            <input
              id="slider-moq"
              type="range"
              min="0"
              max="100"
              step="1"
              disabled={isReadOnly}
              value={weightMoq}
              onChange={(e) =>
                handleSliderChange('weightMoq', Number(e.target.value))
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600 disabled:cursor-not-allowed"
            />
          </div>

          {/* 4. History Weight */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/70 transition-colors">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <label
                    htmlFor="slider-history"
                    className="text-xs font-bold text-slate-900 block"
                  >
                    Tỷ Trọng Lịch Sử Giao Hàng (Historical Performance Weight)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Điểm số OTIF rolling 5 đơn gần nhất (đối tác uy tín, giao đủ và đúng hẹn).
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  disabled={isReadOnly}
                  value={weightHistory}
                  onChange={(e) =>
                    handleSliderChange('weightHistory', Number(e.target.value))
                  }
                  className="w-16 px-2 py-1 text-right text-xs font-bold font-mono text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
                <span className="text-xs font-semibold text-slate-500">%</span>
              </div>
            </div>

            <input
              id="slider-history"
              type="range"
              min="0"
              max="100"
              step="1"
              disabled={isReadOnly}
              value={weightHistory}
              onChange={(e) =>
                handleSliderChange('weightHistory', Number(e.target.value))
              }
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Quick Strategy Presets */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Chiến Lược Mua Hàng Nhanh (Quick Presets)
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {WEIGHT_PRESETS.map((preset) => {
              const isActive =
                weightPrice === preset.weights.price &&
                weightLeadTime === preset.weights.leadTime &&
                weightMoq === preset.weights.moq &&
                weightHistory === preset.weights.history;

              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-xl text-left border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                    isActive
                      ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      {preset.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                  <div className="mt-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                    <span>{preset.weights.price}P / {preset.weights.leadTime}L / {preset.weights.moq}M / {preset.weights.history}H</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
