import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';

export interface PoOverdueBadgeProps {
  isOverdue: boolean;
  showOnTime?: boolean;
  className?: string;
}

export const PoOverdueBadge: React.FC<PoOverdueBadgeProps> = ({
  isOverdue,
  showOnTime = false,
  className = '',
}) => {
  if (isOverdue) {
    return (
      <span
        title="Đơn hàng đã vượt quá ngày giao dự kiến nhưng chưa nhận hàng (BR-09)"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs animate-pulse ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>Quá hạn giao</span>
      </span>
    );
  }

  if (showOnTime) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}
      >
        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>Trong hạn</span>
      </span>
    );
  }

  return null;
};
