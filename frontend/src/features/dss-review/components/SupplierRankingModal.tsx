import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Award, CheckCircle2, DollarSign, Clock, Package, AlertCircle } from 'lucide-react';
import type { RecommendationItem, SupplierRanking } from '../types';

export interface SupplierRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: RecommendationItem | null;
  onSelectSupplier: (supplierId: number) => void;
  isUpdating?: boolean;
}

export const SupplierRankingModal: React.FC<SupplierRankingModalProps> = ({
  isOpen,
  onClose,
  item,
  onSelectSupplier,
  isUpdating = false,
}) => {
  if (!item) return null;

  const rankings: SupplierRanking[] = item.supplierRankings || [];
  const currentSupplierId =
    item.approvedSupplierId || item.suggestedSupplier?.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <span>Bảng Điểm Xếp Hạng Nhà Cung Cấp (WSM Engine)</span>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 mt-1">
          <span className="font-medium text-slate-700">{item.skuName}</span>
          <span className="text-slate-400 font-mono">({item.skuCode})</span>
        </div>
      }
      footer={
        <Button variant="outline" size="sm" onClick={onClose}>
          Đóng
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Info Banner */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Điểm số WSM được chuẩn hóa min-max và tổng hợp từ 4 trọng số: <strong>Đơn giá</strong> (thấp hơn là tốt hơn), <strong>Lead Time</strong> (ngắn hơn là tốt hơn), <strong>MOQ</strong> (nhỏ hơn là linh hoạt hơn), và <strong>Lịch sử giao hàng OTIF 5 đơn gần nhất</strong>.
          </p>
        </div>

        {/* Suppliers List */}
        {rankings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Chưa có dữ liệu nhà cung cấp liên kết cho sản phẩm này.
          </div>
        ) : (
          <div className="space-y-2.5">
            {rankings.map((ranking, index) => {
              const isSelected = ranking.supplierId === currentSupplierId;
              const isRank1 = index === 0;

              return (
                <div
                  key={ranking.supplierId}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Left: Supplier info & Rank */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isRank1
                            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400/50'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900">
                            {ranking.name}
                          </h4>
                          {isRank1 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Gợi ý tối ưu (Rank 1)
                            </span>
                          )}
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              Đang chọn duyệt
                            </span>
                          )}
                        </div>

                        {/* Metric pills */}
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            {Number(ranking.price).toLocaleString('vi-VN')} đ
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Giao hàng: <strong>{ranking.leadTime} ngày</strong>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            MOQ: <strong>{ranking.moq ?? 1} sp</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: WSM Score & Action Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold text-slate-400">
                          Điểm WSM
                        </p>
                        <p
                          className={`text-lg font-bold font-mono ${
                            isRank1 ? 'text-amber-600' : 'text-slate-800'
                          }`}
                        >
                          {Number(ranking.score).toFixed(1)}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant={isSelected ? 'secondary' : 'outline'}
                        disabled={isSelected || isUpdating}
                        onClick={() => onSelectSupplier(ranking.supplierId)}
                      >
                        {isSelected ? 'Đang chọn' : 'Chọn NCC này'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};
