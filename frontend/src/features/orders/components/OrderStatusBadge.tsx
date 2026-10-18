import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { PurchaseOrderStatus } from '../types';

export interface OrderStatusBadgeProps {
  status: PurchaseOrderStatus | string;
  className?: string;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  switch (status) {
    case 'Approved':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs ${className}`}
        >
          <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          Chờ giao hàng
        </span>
      );

    case 'Completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Đã nhận hàng
        </span>
      );

    case 'Cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs ${className}`}
        >
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          Đã hủy
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {status}
        </span>
      );
  }
};
