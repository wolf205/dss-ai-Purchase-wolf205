import React, { useState, useEffect } from 'react';
import { Search, Plus, RotateCcw, Building2, CheckCircle2, XCircle, Layers } from 'lucide-react';
import type { SupplierFilters } from '../types';

interface SupplierToolbarProps {
  filters: SupplierFilters;
  onFilterChange: (newFilters: Partial<SupplierFilters>) => void;
  onResetFilters: () => void;
  isManager: boolean;
  onOpenCreateModal: () => void;
  totalSuppliers: number;
}

export const SupplierToolbar: React.FC<SupplierToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  isManager,
  onOpenCreateModal,
  totalSuppliers,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== (filters.search || '')) {
        onFilterChange({ search: searchTerm, page: 1 });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, onFilterChange]);

  const handleStatusChange = (status: 'Active' | 'Inactive' | 'All') => {
    onFilterChange({ status, page: 1 });
  };

  const isFiltered = Boolean(
    (filters.search && filters.search.trim().length > 0) ||
      (filters.status && filters.status !== 'Active'),
  );

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Top row: Title summary + Add supplier button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Danh Sách Nhà Cung Cấp
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {totalSuppliers} đối tác
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Quản lý hồ sơ đối tác, điều kiện mua hàng (giá, MOQ) và chỉ số giao hàng OTIF
            </p>
          </div>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Nhà Cung Cấp</span>
          </button>
        )}
      </div>

      {/* Bottom row: Search input + Status Tabs + Reset button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã NCC, tên đối tác hoặc số điện thoại..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg focus:outline-hidden transition-all text-slate-900 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onFilterChange({ search: '', page: 1 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleStatusChange('Active')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${
                filters.status === 'Active' || !filters.status
                  ? 'bg-white text-emerald-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đang hợp tác</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('Inactive')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${
                filters.status === 'Inactive'
                  ? 'bg-white text-slate-800 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Ngừng hợp tác</span>
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('All')}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${
                filters.status === 'All'
                  ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tất cả</span>
            </button>
          </div>

          {/* Reset button */}
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                onResetFilters();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
