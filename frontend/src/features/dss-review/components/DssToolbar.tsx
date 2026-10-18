import React from 'react';
import { Search, Sparkles, Filter, Layers } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { Category, DssFilterState } from '../types';

export interface DssToolbarProps {
  categories: Category[];
  selectedCategoryId: number | 'all';
  onCategoryChange: (catId: number | 'all') => void;
  onTriggerAnalyze: () => void;
  isAnalyzing: boolean;
  filters: DssFilterState;
  onFilterChange: (newFilters: Partial<DssFilterState>) => void;
  totalItemsCount: number;
  filteredItemsCount: number;
}

export const DssToolbar: React.FC<DssToolbarProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
  onTriggerAnalyze,
  isAnalyzing,
  filters,
  onFilterChange,
  totalItemsCount,
  filteredItemsCount,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5">
      {/* Top Row: Category Scope + Trigger Analyze Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <label htmlFor="category-select" className="sr-only">
              Chọn phạm vi ngành hàng
            </label>
            <select
              id="category-select"
              value={selectedCategoryId}
              onChange={(e) => {
                const val = e.target.value;
                onCategoryChange(val === 'all' ? 'all' : Number(val));
              }}
              disabled={isAnalyzing}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-colors cursor-pointer"
            >
              <option value="all">🏢 Toàn bộ cửa hàng (Tất cả ngành hàng)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  📦 {c.categoryName} ({c.categoryCode})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onTriggerAnalyze}
            isLoading={isAnalyzing}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-400" />}
          >
            {isAnalyzing ? 'Đang phân tích AI...' : 'Chạy phân tích DSS'}
          </Button>
        </div>

        {/* Counter indicator */}
        <div className="text-xs text-slate-500 flex items-center gap-1.5 self-end sm:self-center">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Hiển thị <strong>{filteredItemsCount}</strong> / {totalItemsCount} mặt hàng
          </span>
        </div>
      </div>

      {/* Bottom Row: Search & Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="Tìm theo mã SKU hoặc tên sản phẩm..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stock Risk Status Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => onFilterChange({ riskStatus: 'all' })}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filters.riskStatus === 'all'
                  ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ riskStatus: 'Critical' })}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filters.riskStatus === 'Critical'
                  ? 'bg-rose-500 font-semibold text-white shadow-2xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Cần mua gấp
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ riskStatus: 'Warning' })}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filters.riskStatus === 'Warning'
                  ? 'bg-amber-500 font-semibold text-white shadow-2xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Sắp hết ROP
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ riskStatus: 'Normal' })}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filters.riskStatus === 'Normal'
                  ? 'bg-emerald-600 font-semibold text-white shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              An toàn
            </button>
          </div>

          {/* ABC Class Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 font-semibold text-[11px] uppercase ml-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              ABC:
            </span>
            {(['all', 'A', 'B', 'C'] as const).map((abc) => (
              <button
                key={abc}
                type="button"
                onClick={() => onFilterChange({ abcClass: abc })}
                className={`px-2 py-1 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                  filters.abcClass === abc
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {abc === 'all' ? 'Tất cả' : abc}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
