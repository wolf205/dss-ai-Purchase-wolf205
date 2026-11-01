import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  Award,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { AbcXyzBadge } from './AbcXyzBadge';
import { StockRiskBadge } from './StockRiskBadge';
import type { RecommendationItem } from '../types';

export interface DssRecommendationTableProps {
  items: RecommendationItem[];
  isDraft: boolean;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onOpenExplain: (item: RecommendationItem) => void;
  onOpenChart: (item: RecommendationItem) => void;
  onOpenSupplierModal: (item: RecommendationItem) => void;
}

export const DssRecommendationTable: React.FC<DssRecommendationTableProps> = ({
  items,
  isDraft,
  onUpdateQuantity,
  onOpenExplain,
  onOpenChart,
  onOpenSupplierModal,
}) => {
  // Local state for inline edit inputs
  const [editingQuantities, setEditingQuantities] = useState<
    Record<number, string>
  >({});

  const handleQuantityChange = (itemId: number, value: string) => {
    setEditingQuantities((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleQuantityBlur = (item: RecommendationItem) => {
    const rawValue = editingQuantities[item.itemId];
    if (rawValue === undefined) return;

    const parsed = parseInt(rawValue, 10);
    const validQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;

    if (validQty !== item.approvedQuantity) {
      onUpdateQuantity(item.itemId, validQty);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Không tìm thấy mặt hàng nào phù hợp với bộ lọc hiện tại.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Vui lòng thử điều chỉnh lại từ khóa tìm kiếm hoặc bỏ chọn các điều kiện lọc.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 min-w-[220px]">Sản phẩm & Ngành hàng</th>
              <th className="py-3 px-3 min-w-[120px]">Ma trận & Rủi ro</th>
              <th className="py-3 px-3 min-w-[140px]">Tồn kho / Ngưỡng</th>
              <th className="py-3 px-3 min-w-[150px]">Đề xuất & Duyệt (SOQ)</th>
              <th className="py-3 px-4 min-w-[200px]">Nhà cung cấp tối ưu</th>
              <th className="py-3 px-3 text-right min-w-[110px]">Thành tiền</th>
              <th className="py-3 px-3 text-center min-w-[120px]">Căn cứ ra quyết định</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => {
              const currentQty =
                editingQuantities[item.itemId] !== undefined
                  ? editingQuantities[item.itemId]
                  : String(item.approvedQuantity);

              const parsedQty = parseInt(currentQty, 10) || 0;

              // Kiểm tra xem người dùng có chọn NCC khác với DSS gợi ý không
              const isSupplierOverridden =
                item.approvedSupplierId !== null &&
                item.suggestedSupplier !== null &&
                item.approvedSupplierId !== item.suggestedSupplier.id;

              // Giải quyết NCC hiệu lực (Effective Supplier)
              let effectiveSupplier = item.suggestedSupplier;
              if (isSupplierOverridden && Array.isArray(item.supplierRankings)) {
                const matched = item.supplierRankings.find(
                  (r) => r.supplierId === item.approvedSupplierId
                );
                if (matched) {
                  effectiveSupplier = {
                    id: matched.supplierId,
                    code: item.suggestedSupplier?.code || `SUP-${matched.supplierId}`,
                    name: matched.name,
                    leadTimeDays: matched.leadTime,
                    moq: matched.moq ?? 1,
                    unitPrice: matched.price,
                    wsmScore: matched.score,
                  };
                }
              }

              const supplier = effectiveSupplier;
              const moq = supplier?.moq || 1;
              const unitPrice = supplier?.unitPrice || 0;
              const totalAmount = parsedQty * unitPrice;
              const isBelowMoq = parsedQty > 0 && parsedQty < moq;

              return (
                <tr
                  key={item.itemId}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    parsedQty > 0 ? 'bg-white' : 'bg-slate-50/30 opacity-75'
                  }`}
                >
                  {/* Column 1: SKU & Name */}
                  <td className="py-3 px-4 align-top">
                    <div className="flex items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold font-mono text-slate-900">
                            {item.skuCode}
                          </span>
                          {item.isOverridden && (
                            <span
                              title="Số lượng hoặc NCC đã được người dùng can thiệp điều chỉnh"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                            >
                              <UserCheck className="w-3 h-3 text-amber-600" />
                              Đã chỉnh
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-slate-800 text-xs mt-0.5 line-clamp-1">
                          {item.skuName}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {item.categoryName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: ABC-XYZ & Stock Risk */}
                  <td className="py-3 px-3 align-top space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <AbcXyzBadge badge={item.abcXyzBadge} size="sm" />
                      <StockRiskBadge status={item.stockRiskStatus} size="sm" />
                    </div>
                  </td>

                  {/* Column 3: Inventory & Thresholds */}
                  <td className="py-3 px-3 align-top">
                    <div className="space-y-1 text-slate-600">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Tồn kho:</span>
                        <span className="font-semibold text-slate-800">
                          {item.currentInventory}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Đang về:</span>
                        <span className="font-mono text-blue-600 font-semibold">
                          +{item.onOrderQuantity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-400">ROP / SS:</span>
                        <span className="font-mono text-slate-700">
                          {item.reorderPoint} / {item.safetyStock}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Column 4: SOQ vs Approved Quantity */}
                  <td className="py-3 px-3 align-top">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>DSS gợi ý:</span>
                        <span className="font-bold text-blue-700 font-mono">
                          {item.suggestedQuantity} sp
                        </span>
                      </div>

                      {/* Editable Quantity Input */}
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          disabled={!isDraft || !supplier}
                          value={supplier ? currentQty : 0}
                          onChange={(e) =>
                            handleQuantityChange(item.itemId, e.target.value)
                          }
                          onBlur={() => handleQuantityBlur(item)}
                          onKeyDown={handleKeyDown}
                          title={
                            !supplier
                              ? 'Không thể đặt mua do chưa có Nhà cung cấp khả dụng (UC-01 EF-1)'
                              : undefined
                          }
                          className={`w-full px-2.5 py-1.5 text-xs font-bold font-mono rounded-lg border focus:outline-none transition-colors ${
                            !supplier
                              ? 'border-slate-200 text-slate-400 bg-slate-100 cursor-not-allowed'
                              : isBelowMoq
                              ? 'border-amber-400 bg-amber-50/50 text-amber-900 focus:ring-1 focus:ring-amber-500'
                              : parsedQty > 0
                              ? 'border-slate-300 text-slate-900 focus:border-slate-800 focus:ring-1 focus:ring-slate-800'
                              : 'border-slate-200 text-slate-400 bg-slate-50'
                          }`}
                        />
                      </div>

                      {/* Cảnh báo chưa có NCC (UC-01 EF-1) */}
                      {!supplier && (
                        <p className="text-[10px] text-amber-700 flex items-center gap-1 font-medium leading-tight">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          Khóa đặt: Chưa gán NCC
                        </p>
                      )}

                      {/* MOQ Soft Warning */}
                      {supplier && isBelowMoq && (
                        <p className="text-[10px] text-amber-700 flex items-center gap-1 font-medium leading-tight">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          Nhỏ hơn MOQ ({moq} sp)
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Column 5: Supplier */}
                  <td className="py-3 px-4 align-top">
                    {supplier ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-slate-900 leading-snug line-clamp-1">
                            {supplier.name}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {isSupplierOverridden && (
                              <span
                                title="Nhà cung cấp do người dùng chọn thay cho gợi ý tối ưu ban đầu của DSS"
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                Tự chọn NCC
                              </span>
                            )}
                            {supplier.wsmScore !== null && (
                              <span
                                title="Điểm số tối ưu WSM"
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-200"
                              >
                                {Number(supplier.wsmScore).toFixed(1)} đ
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-medium text-slate-700">
                            {Number(supplier.unitPrice).toLocaleString('vi-VN')} đ
                          </span>
                          <span>•</span>
                          <span>Giao: {supplier.leadTimeDays} ngày</span>
                          <span>•</span>
                          <span>MOQ: {supplier.moq}</span>
                        </div>

                        {/* Switch Supplier Action */}
                        {isDraft && item.supplierRankings?.length > 1 && (
                          <button
                            type="button"
                            onClick={() => onOpenSupplierModal(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline pt-0.5 cursor-pointer"
                          >
                            <Award className="w-3 h-3" />
                            Đổi NCC ({item.supplierRankings.length} lựa chọn)
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                          Chưa có NCC khả dụng
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Cần gán NCC tại UC-06 trước khi đặt hàng (EF-1).
                        </p>
                      </div>
                    )}
                  </td>

                  {/* Column 6: Line Total Amount */}
                  <td className="py-3 px-3 align-top text-right">
                    <p className="font-bold font-mono text-slate-900 text-xs">
                      {totalAmount.toLocaleString('vi-VN')} đ
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {parsedQty} × {unitPrice.toLocaleString('vi-VN')}
                    </span>
                  </td>

                  {/* Column 7: Actions */}
                  <td className="py-3 px-3 align-top">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* LLM Explain Button */}
                      <button
                        type="button"
                        onClick={() => onOpenExplain(item)}
                        title="Xem giải thích lý do mua hàng từ Google Gemini 1.5 Flash"
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          item.llmExplanation
                            ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50/50'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {/* Forecast Chart Button */}
                      <button
                        type="button"
                        onClick={() => onOpenChart(item)}
                        title="Xem biểu đồ dự báo nhu cầu 14 ngày kèm dải tin cậy CI 95%"
                        className="p-1.5 rounded-lg bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-colors cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
