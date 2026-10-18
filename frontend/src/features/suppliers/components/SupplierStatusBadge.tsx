import React from 'react';
import type { SupplierStatus } from '../types';

interface SupplierStatusBadgeProps {
  status: SupplierStatus | string;
  size?: 'sm' | 'md';
}

export const SupplierStatusBadge: React.FC<SupplierStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const isActive = status === 'Active';

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] gap-1'
      : 'px-2.5 py-1 text-xs gap-1.5';

  if (isActive) {
    return (
      <span
        className={`inline-flex items-center font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs ${sizeClasses}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Đang hợp tác
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Ngừng hợp tác
    </span>
  );
};
