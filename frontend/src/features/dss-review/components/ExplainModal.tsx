import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Sparkles, Bot, AlertTriangle, RefreshCw } from 'lucide-react';
import { AbcXyzBadge } from './AbcXyzBadge';
import { StockRiskBadge } from './StockRiskBadge';
import type { RecommendationItem } from '../types';

export interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: RecommendationItem | null;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  item,
  isLoading,
  error,
  onRetry,
}) => {
  if (!item) return null;

  const explanation = item.llmExplanation;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Giải Trình Quyết Định Mua Hàng (AI Explainability)</span>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 mt-1">
          <span className="font-medium text-slate-700">{item.skuName}</span>
          <span className="text-slate-400 font-mono">({item.skuCode})</span>
          <AbcXyzBadge badge={item.abcXyzBadge} size="sm" />
          <StockRiskBadge status={item.stockRiskStatus} size="sm" />
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-purple-500" />
            Sinh bởi Google Gemini 1.5 Flash (On-demand)
          </span>
          <div className="flex items-center gap-2">
            {error && onRetry && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={onRetry}
                isLoading={isLoading}
              >
                Thử lại
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="w-10 h-10 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <Sparkles className="w-4 h-4 text-purple-600 absolute inset-0 m-auto" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              Đang phân tích bối cảnh và tổng hợp lý do đề xuất...
            </p>
            <p className="text-xs text-slate-400">
              Kết hợp mô hình tồn kho ROP/SS, xếp hạng WSM và phân loại ABC-XYZ
            </p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Không thể tạo giải thích tự nhiên lúc này
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Dịch vụ mô hình ngôn ngữ không phản hồi hoặc gặp sự cố kết nối. Quá trình ra quyết định và các chỉ số định lượng (ROP, SS, WSM) vẫn hoàn toàn chính xác và hoạt động bình thường.
            </p>
          </div>
        ) : explanation ? (
          <div className="space-y-4">
            {/* Context Metrics Summary */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                  Tồn khả dụng
                </span>
                <span className="font-bold text-slate-800">
                  {item.currentInventory + item.onOrderQuantity} sp
                </span>
                <span className="text-[10px] text-slate-400 block">
                  (Kho: {item.currentInventory} | Về: {item.onOrderQuantity})
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                  Ngưỡng ROP / SS
                </span>
                <span className="font-bold text-slate-800">
                  {item.reorderPoint} / {item.safetyStock} sp
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">
                  Đề xuất mua (SOQ)
                </span>
                <span className="font-bold text-blue-600">
                  {item.suggestedQuantity} sp
                </span>
              </div>
            </div>

            {/* AI Explanation Content Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/60 to-indigo-50/40 border border-purple-200/80 text-slate-800 text-sm leading-relaxed shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Lý giải từ hệ thống DSS
              </div>
              <p className="whitespace-pre-line text-slate-700 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Chưa có giải thích cho mặt hàng này.
          </div>
        )}
      </div>
    </Modal>
  );
};
