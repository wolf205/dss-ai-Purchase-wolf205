import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];
  unitName?: string;
  isLoading?: boolean;
  className?: string;
  showPageSizeSelector?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage: rawCurrentPage,
  totalPages: rawTotalPages,
  totalItems: rawTotalItems,
  itemsPerPage: rawItemsPerPage,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50],
  unitName = 'mặt hàng',
  isLoading = false,
  className = '',
  showPageSizeSelector = true,
}) => {
  const totalItems = Math.max(0, Number(rawTotalItems) || 0);
  const itemsPerPage = Math.max(1, Number(rawItemsPerPage) || 20);
  const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const totalPages = Math.max(1, Number(rawTotalPages) || calculatedTotalPages);
  const currentPage = Math.min(Math.max(1, Number(rawCurrentPage) || 1), totalPages);

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      className={`px-4 py-3 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}
    >
      {/* Thông tin số lượng bản ghi & chọn số dòng/trang */}
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Hiển thị <strong className="font-bold text-slate-900">{startRecord}</strong> -{' '}
          <strong className="font-bold text-slate-900">{endRecord}</strong> trên tổng số{' '}
          <strong className="font-bold text-slate-900">{totalItems}</strong> {unitName}
        </span>

        {showPageSizeSelector && onLimitChange && (
          <div className="flex items-center gap-1.5 pl-2.5 border-l border-slate-200">
            <span className="text-slate-500">Mỗi trang:</span>
            <select
              value={itemsPerPage}
              disabled={isLoading}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="py-1 px-2 bg-white border border-slate-200 rounded text-xs text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Chọn số lượng hiển thị mỗi trang"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Điều khiển chuyển trang */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage <= 1 || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          aria-label="Trang trước"
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-2.5 py-1 font-semibold text-slate-800">
          Trang {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          aria-label="Trang tiếp theo"
          title="Trang tiếp theo"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
