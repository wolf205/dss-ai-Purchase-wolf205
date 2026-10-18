import React from 'react';
import type { StockRiskStatus } from '../types';

export interface StockRiskBadgeProps {
  status: StockRiskStatus;
  size?: 'sm' | 'md';
}

interface RiskConfig {
  label: string;
  dotColor: string;
  badgeClass: string;
  description: string;
}

const riskMap: Record<string, RiskConfig> = {
  Critical: {
    label: 'Cần mua gấp',
    dotColor: 'bg-rose-500 animate-pulse',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Tồn kho cạn kiệt hoặc dưới mức tồn an toàn SS',
  },
  Warning: {
    label: 'Sắp hết ROP',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Tồn khả dụng đã chạm hoặc dưới điểm đặt hàng lại ROP',
  },
  Normal: {
    label: 'An toàn',
    dotColor: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Mức tồn kho an toàn, chưa cần bổ sung',
  },
  Overstock: {
    label: 'Dư thừa',
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Tồn kho vượt xa nhu cầu dự báo chu kỳ',
  },
};

export const StockRiskBadge: React.FC<StockRiskBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const normalized = status ? String(status) : 'Normal';
  const config =
    riskMap[normalized] || {
      label: normalized,
      dotColor: 'bg-slate-400',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      description: '',
    };

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1.5'
      : 'px-2.5 py-1 text-xs gap-2';

  return (
    <span
      title={config.description}
      className={`inline-flex items-center font-medium rounded-md border ${config.badgeClass} ${sizeClass}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotColor}`} />
      <span>{config.label}</span>
    </span>
  );
};
