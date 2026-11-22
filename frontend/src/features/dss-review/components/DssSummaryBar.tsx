import React from 'react';
import { ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { DssSession } from '../types';

export interface DssSummaryBarProps {
  session: DssSession;
  onOpenApproveModal: () => void;
  isDraft: boolean;
}

export const DssSummaryBar: React.FC<DssSummaryBarProps> = ({
  session,
  onOpenApproveModal,
  isDraft,
}) => {
  const items = session.items || [];
  const orderedItems = items.filter((it) => it.approvedQuantity > 0);

  // Group unique suppliers
  const supplierIdSet = new Set(
    orderedItems.map((it) => it.approvedSupplierId || it.suggestedSupplier?.id)
  );
  const estimatedPoCount = supplierIdSet.size;

  const totalBudget = orderedItems.reduce((sum, it) => {
    let price = it.suggestedSupplier?.unitPrice || 0;
    if (it.approvedSupplierId && Array.isArray(it.supplierRankings)) {
      const matched = it.supplierRankings.find(
        (r) => r.supplierId === it.approvedSupplierId
      );
      if (matched) {
        price = matched.price;
      }
    }
    return sum + it.approvedQuantity * price;
  }, 0);

  return (
    <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
        {/* Total Analyzed */}
        <div className="border-r border-slate-800 pr-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Tổng SKU phân tích
          </p>
          <p className="text-xl font-bold text-white mt-1">
            {items.length}{' '}
            <span className="text-xs font-normal text-slate-400">mặt hàng</span>
          </p>
        </div>

        {/* Selected to Buy */}
        <div className="border-r border-slate-800 pr-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Mặt hàng chọn mua
          </p>
          <p className="text-xl font-bold text-blue-400 mt-1">
            {orderedItems.length}{' '}
            <span className="text-xs font-normal text-slate-400">SKU ({items.length > 0 ? Math.round((orderedItems.length / items.length) * 100) : 0}%)</span>
          </p>
        </div>

        {/* Estimated POs */}
        <div className="border-r border-slate-800 pr-3">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Đơn PO dự kiến sinh
          </p>
          <p className="text-xl font-bold text-amber-400 mt-1">
            {estimatedPoCount}{' '}
            <span className="text-xs font-normal text-slate-400">đơn (theo NCC)</span>
          </p>
        </div>

        {/* Total Budget */}
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Tổng ngân sách duyệt
          </p>
          <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">
            {totalBudget.toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-normal text-slate-400">đ</span>
          </p>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-3 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-slate-800 w-full md:w-auto justify-end">
        {!isDraft ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Phiên đã phê duyệt ({session.status})
          </div>
        ) : (
          <Button
            variant="success"
            size="lg"
            disabled={orderedItems.length === 0}
            leftIcon={<ShoppingCart className="w-4 h-4" />}
            onClick={onOpenApproveModal}
          >
            {orderedItems.length === 0 ? (
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-slate-300" />
                Chưa chọn số lượng
              </span>
            ) : (
              `Phê duyệt ${orderedItems.length} SKU (${totalBudget.toLocaleString('vi-VN')} đ)`
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
