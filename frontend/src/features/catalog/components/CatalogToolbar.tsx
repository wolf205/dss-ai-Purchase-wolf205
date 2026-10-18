import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Filter,
  Plus,
  RotateCcw,
  Boxes,
  CheckCircle2,
  Archive,
  Loader2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { Category, ProductFilters } from '../types';

interface CatalogToolbarProps {
  filters: ProductFilters;
  onFilterChange: (newFilters: Partial<ProductFilters>) => void;
  onResetFilters: () => void;
  categories: Category[];
  isManager: boolean;
  onOpenCreateModal: () => void;
  totalCount: number;
  activeCount?: number;
  inactiveCount?: number;
  isLoading?: boolean;
}

export const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
  isManager,
  onOpenCreateModal,
  totalCount,
  activeCount,
  inactiveCount,
  isLoading = false,
}) => {
  const [prevFilterSearch, setPrevFilterSearch] = useState(filters.search);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Đồng bộ searchInput khi filters.search thay đổi từ bên ngoài (e.g. Reset)
  if (filters.search !== prevFilterSearch) {
    setPrevFilterSearch(filters.search);
    setSearchInput(filters.search || '');
  }

  // Debounce search input 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== searchInput.trim()) {
        onFilterChange({ search: searchInput.trim(), page: 1 });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFilterChange]);

  const handleClearSearch = () => {
    setSearchInput('');
    onFilterChange({ search: '', page: 1 });
  };

  const isFiltered =
    Boolean(filters.search?.trim()) ||
    (filters.categoryId && filters.categoryId !== 'all') ||
    (filters.status && filters.status !== 'All');

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Thẻ Thống Kê Nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <div className="w-9 h-9 rounded-md bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <span>Tổng Mặt Hàng</span>
              {isLoading && <Loader2 className="w-3 h-3 animate-spin text-blue-600" />}
            </div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {totalCount}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <div className="w-9 h-9 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Đang Kinh Doanh
            </div>
            <div className="text-lg font-bold text-emerald-700 leading-tight">
              {activeCount ?? '—'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <div className="w-9 h-9 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Ngừng Kinh Doanh
            </div>
            <div className="text-lg font-bold text-slate-600 leading-tight">
              {inactiveCount ?? '—'}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70">
          <div className="w-9 h-9 rounded-md bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Số Ngành Hàng
            </div>
            <div className="text-lg font-bold text-amber-800 leading-tight">
              {categories.length}
            </div>
          </div>
        </div>
      </div>

      {/* Hàng Điều Khiển & Bộ Lọc */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
        {/* Nhóm Bộ Lọc */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Ô Tìm Kiếm */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm mã SKU hoặc tên sản phẩm..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors placeholder:text-slate-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc Ngành Hàng */}
          <div className="min-w-[160px]">
            <select
              value={filters.categoryId || 'all'}
              onChange={(e) =>
                onFilterChange({
                  categoryId: e.target.value,
                  page: 1,
                })
              }
              className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả ngành hàng</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoryName} ({cat.categoryCode})
                </option>
              ))}
            </select>
          </div>

          {/* Lọc Trạng Thái */}
          <div className="min-w-[150px]">
            <select
              value={filters.status || 'Active'}
              onChange={(e) =>
                onFilterChange({
                  status: e.target.value as 'Active' | 'Inactive' | 'All',
                  page: 1,
                })
              }
              className="w-full py-2 px-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors text-slate-700 cursor-pointer"
            >
              <option value="Active">Đang kinh doanh (Active)</option>
              <option value="Inactive">Ngừng kinh doanh (Inactive)</option>
              <option value="All">Tất cả trạng thái (All)</option>
            </select>
          </div>

          {/* Nút Đặt lại Bộ lọc */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>

        {/* Nút Thêm Sản Phẩm (STORE_MANAGER Only) */}
        {isManager && (
          <div className="flex items-center justify-end shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={onOpenCreateModal}
            >
              Thêm Sản Phẩm
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
