import React from 'react';
import { Award, Sparkles, TrendingUp } from 'lucide-react';

interface SupplierOtifBadgeProps {
  performanceScore: number;
  recent5OrderOnTimeRate: number | null;
  recent5OrderFulfillmentRate: number | null;
  performanceLabel: string;
  completedOrderCount: number;
  compact?: boolean;
}

export const SupplierOtifBadge: React.FC<SupplierOtifBadgeProps> = ({
  performanceScore,
  recent5OrderOnTimeRate,
  recent5OrderFulfillmentRate,
  performanceLabel,
  completedOrderCount,
  compact = false,
}) => {
  const isColdStart = completedOrderCount < 3;
  const scorePercent = Math.round(performanceScore * 100);

  // Color coding based on performance
  let colorStyles = {
    bg: 'bg-emerald-50/90',
    border: 'border-emerald-200/90',
    text: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-800',
    bar: 'bg-emerald-500',
  };

  if (isColdStart) {
    colorStyles = {
      bg: 'bg-amber-50/90',
      border: 'border-amber-200/90',
      text: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-900 border border-amber-200',
      bar: 'bg-amber-500',
    };
  } else if (scorePercent < 70) {
    colorStyles = {
      bg: 'bg-rose-50/90',
      border: 'border-rose-200/90',
      text: 'text-rose-800',
      badge: 'bg-rose-100 text-rose-800 border border-rose-200',
      bar: 'bg-rose-500',
    };
  } else if (scorePercent < 85) {
    colorStyles = {
      bg: 'bg-blue-50/90',
      border: 'border-blue-200/90',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-800 border border-blue-200',
      bar: 'bg-blue-500',
    };
  }

  const formatRate = (rate: number | null): string => {
    if (rate === null || rate === undefined) return '--';
    return `${Math.round(rate * 100)}%`;
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-medium shadow-2xs ${colorStyles.bg} ${colorStyles.border} ${colorStyles.text}`}
        title={`${performanceLabel} - Hoàn tất: ${completedOrderCount} đơn`}
      >
        {isColdStart ? (
          <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
        ) : (
          <Award className="w-3 h-3 text-emerald-600 shrink-0" />
        )}
        <span className="font-bold">{scorePercent}%</span>
        {isColdStart && (
          <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1 rounded">
            Cold Start
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-2 rounded-lg border shadow-2xs transition-all ${colorStyles.bg} ${colorStyles.border}`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5">
          {isColdStart ? (
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          ) : (
            <TrendingUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          )}
          <span className="text-xs font-bold text-slate-800">
            {isColdStart ? 'Khởi tạo NCC Mới' : 'OTIF 5 Đơn Gần Nhất'}
          </span>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${colorStyles.badge}`}
        >
          {scorePercent}%
        </span>
      </div>

      {isColdStart ? (
        <div className="text-[11px] text-amber-800/90 leading-tight">
          <p className="font-medium">
            Điểm khởi tạo chuẩn 80% (BR-24)
          </p>
          <p className="text-[10px] text-amber-700/80 mt-0.5">
            Đã hoàn tất {completedOrderCount}/3 đơn đầu tiên
          </p>
        </div>
      ) : (
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center justify-between text-slate-600">
            <span>Đúng hạn:</span>
            <span className="font-semibold text-slate-900 font-mono">
              {formatRate(recent5OrderOnTimeRate)}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Đủ hàng:</span>
            <span className="font-semibold text-slate-900 font-mono">
              {formatRate(recent5OrderFulfillmentRate)}
            </span>
          </div>
          <div className="w-full bg-slate-200/70 rounded-full h-1 mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${colorStyles.bar}`}
              style={{ width: `${Math.min(100, Math.max(0, scorePercent))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
