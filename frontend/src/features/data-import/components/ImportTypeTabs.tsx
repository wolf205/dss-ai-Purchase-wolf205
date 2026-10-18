import React from 'react';
import { TrendingUp, Boxes, ShieldAlert, Sparkles } from 'lucide-react';
import type { ImportType } from '../types';

interface ImportTypeTabsProps {
  activeType: ImportType;
  onChangeType: (type: ImportType) => void;
  disabled?: boolean;
}

export const ImportTypeTabs: React.FC<ImportTypeTabsProps> = ({
  activeType,
  onChangeType,
  disabled = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tab Bán Hàng */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChangeType('sales')}
        className={`relative text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
          activeType === 'sales'
            ? 'bg-blue-50/50 border-blue-500/80 ring-2 ring-blue-500/20 shadow-xs'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activeType === 'sales'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Dữ Liệu Doanh Số Bán Hàng
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-800">
                  Sales History
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Lịch sử bán hàng phục vụ dự báo AI chuỗi thời gian & phân hạng
                ABC-XYZ.
              </p>
            </div>
          </div>
          {activeType === 'sales' && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
          )}
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>
            Quy tắc: <strong>BR-15</strong> Ghi đè ngày trùng lặp (không cộng
            dồn) · <strong>BR-14</strong> All-or-Nothing
          </span>
        </div>
      </button>

      {/* Tab Kiểm Kê Tồn Kho */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChangeType('inventory')}
        className={`relative text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer ${
          activeType === 'inventory'
            ? 'bg-indigo-50/50 border-indigo-500/80 ring-2 ring-indigo-500/20 shadow-xs'
            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                activeType === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Kiểm Kê Tồn Kho Thực Tế
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100/80 text-indigo-800">
                  Inventory Snapshot
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Làm mới số lượng hàng đếm được trên kệ trước khi phân tích đề
                xuất mua hàng.
              </p>
            </div>
          </div>
          {activeType === 'inventory' && (
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
            </span>
          )}
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            Quy tắc: <strong>BR-16</strong> Bảo lưu on-order quantity & SKU vắng
            mặt · <strong>BR-14</strong> All-or-Nothing
          </span>
        </div>
      </button>
    </div>
  );
};
