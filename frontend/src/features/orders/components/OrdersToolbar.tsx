import React from 'react';
import {
  Search,
  RotateCcw,
  Clock,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { PurchaseOrderFilters, SupplierOption } from '../types';

export interface OrdersToolbarProps {
  filters: PurchaseOrderFilters;
  onFilterChange: (newFilters: Partial<PurchaseOrderFilters>) => void;
  onResetFilters: () => void;
  supplierOptions: SupplierOption[];
  totalOrdersCount: number;
  approvedCount: number;
  overdueCount: number;
  isLoading?: boolean;
}

export const OrdersToolbar: React.FC<OrdersToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  supplierOptions,
  totalOrdersCount,
  approvedCount,
  overdueCount,
  isLoading = false,
}) => {
  const isFiltered =
    Boolean(filters.search?.trim()) ||
    (filters.status && filters.status !== 'all') ||
    (filters.supplierId && filters.supplierId !== 'all') ||
    (filters.isOverdue !== undefined && filters.isOverdue !== 'all');

  return (
    <div className="space-y-4">
      {/* Thống kê nhanh trạng thái đơn hàng */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng Đơn Mua Hàng</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {totalOrdersCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Đang Chờ Giao Hàng</p>
            <p className="text-2xl font-bold text-sky-600 mt-1">
              {approvedCount}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 border border-sky-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border shadow-2xs flex items-center justify-between transition-colors ${
            overdueCount > 0
              ? 'bg-rose-50/60 border-rose-200 text-rose-950'
              : 'bg-white border-slate-200/90'
          }`}
        >
          <div>
            <p className="text-xs font-medium text-slate-500">Đơn Quá Hạn Giao (BR-09)</p>
            <div className="flex items-center gap-2 mt-1">
              <p
                className={`text-2xl font-bold ${
                  overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {overdueCount}
              </p>
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                  Cần xử lý
                </span>
              )}
            </div>
          </div>
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              overdueCount > 0
                ? 'bg-rose-100 text-rose-600 border-rose-200'
                : 'bg-slate-100 text-slate-400 border-slate-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Thanh công cụ tìm kiếm và lọc */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) =>
                onFilterChange({ search: e.target.value, page: 1 })
              }
              placeholder="Tìm theo mã PO (vd: PO-2026...) hoặc tên Nhà cung cấp..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors"
            />
          </div>

          {/* Nhóm bộ lọc */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Lọc Trạng thái */}
            <div className="min-w-[150px]">
              <select
                value={filters.status || 'all'}
                onChange={(e) =>
                  onFilterChange({ status: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 font-medium cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="Approved">Chờ giao hàng (Approved)</option>
                <option value="Completed">Đã nhận hàng (Completed)</option>
                <option value="Cancelled">Đã hủy (Cancelled)</option>
              </select>
            </div>

            {/* Lọc Quá hạn giao (BR-09) */}
            <div className="min-w-[150px]">
              <select
                value={
                  filters.isOverdue === undefined || filters.isOverdue === 'all'
                    ? 'all'
                    : filters.isOverdue
                    ? 'true'
                    : 'false'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  onFilterChange({
                    isOverdue:
                      val === 'all' ? 'all' : val === 'true' ? true : false,
                    page: 1,
                  });
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 font-medium cursor-pointer ${
                  filters.isOverdue === true
                    ? 'border-rose-400 text-rose-700 bg-rose-50/40 font-semibold'
                    : 'border-slate-200 text-slate-700'
                }`}
              >
                <option value="all">Tất cả tiến độ</option>
                <option value="true">⚠️ Quá hạn giao (BR-09)</option>
                <option value="false">Trong hạn giao</option>
              </select>
            </div>

            {/* Lọc Nhà cung cấp */}
            <div className="min-w-[170px]">
              <select
                value={filters.supplierId || 'all'}
                onChange={(e) =>
                  onFilterChange({ supplierId: e.target.value, page: 1 })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 font-medium cursor-pointer truncate"
              >
                <option value="all">Tất cả nhà cung cấp</option>
                {supplierOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.supplierName} ({s.supplierCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Nút Reset Filters */}
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                disabled={isLoading}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
