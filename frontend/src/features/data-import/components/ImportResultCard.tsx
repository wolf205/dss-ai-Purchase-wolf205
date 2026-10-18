import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Database,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type {
  ImportType,
  SalesConfirmResponse,
  InventoryConfirmResponse,
} from '../types';

interface ImportResultCardProps {
  type: ImportType;
  salesResult?: SalesConfirmResponse | null;
  inventoryResult?: InventoryConfirmResponse | null;
  onReset: () => void;
}

export const ImportResultCard: React.FC<ImportResultCardProps> = ({
  type,
  salesResult,
  inventoryResult,
  onReset,
}) => {
  const isSales = type === 'sales';

  return (
    <div className="bg-white border border-emerald-200/90 rounded-2xl p-6 sm:p-8 shadow-xs text-center max-w-2xl mx-auto space-y-6 animate-toast-enter">
      {/* Icon Thành Công */}
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          {isSales ? 'Sales Ingestion Completed' : 'Inventory Snapshot Synchronized'}
        </div>
        <h3 className="text-xl font-bold text-slate-900">
          Nạp Dữ Liệu Vận Hành Thành Công!
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isSales
            ? salesResult?.message ||
              'Dữ liệu bán hàng đã được cập nhật thành công vào hệ thống trong ACID transaction.'
            : inventoryResult?.message ||
              'Số liệu kiểm kê tồn kho trên kệ đã được đồng bộ chính xác.'}
        </p>
      </div>

      {/* Thống kê chi tiết */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
        {isSales ? (
          <>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                Bản ghi mới nạp:
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {salesResult?.importedCount.toLocaleString()} dòng
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Bản ghi cũ đã ghi đè:
              </span>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {salesResult?.deletedCount || 0} dòng
              </p>
            </div>
          </>
        ) : (
          <div className="col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Tổng số SKU đã cập nhật tồn kho:
            </span>
            <p className="text-lg font-bold text-slate-900 mt-1">
              {inventoryResult?.updatedCount.toLocaleString()} mặt hàng
            </p>
          </div>
        )}
      </div>

      {/* Điều hướng tiếp theo */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 border-t border-slate-100">
        <Button
          variant="outline"
          size="md"
          onClick={onReset}
          className="w-full sm:w-auto text-slate-700"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Tiếp Tục Nhập Tệp Khác
        </Button>

        <Link to="/dss" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            Chạy Phân Tích Mua Hàng DSS (UC-01)
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
