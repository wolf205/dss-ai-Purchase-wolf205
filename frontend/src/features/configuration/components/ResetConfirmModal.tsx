import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Khôi Phục Cấu Hình Mặc Định Chuẩn Mực</span>
        </div>
      }
      subtitle="Thao tác này sẽ đặt lại toàn bộ tham số DSS về giá trị Baseline của hệ thống theo BR-28."
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy Bỏ
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => void onConfirm()}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Xác Nhận Khôi Phục
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
          <p className="font-semibold text-rose-950 mb-1">
            Lưu ý quan trọng (AF-1 / BR-28):
          </p>
          Toàn bộ tùy chỉnh hiện tại của cửa hàng về trọng số đánh giá NCC, mức
          độ phục vụ mục tiêu và chu kỳ rà soát sẽ bị thay thế bằng bộ tham số
          khuyến nghị ban đầu. Quyết định này sẽ áp dụng ngay cho các đợt phân
          tích DSS tiếp theo.
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
          <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Bộ Tham Số Mặc Định (System Baseline)
          </div>
          <div className="p-4 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-600">Trọng số Đơn giá (Price Weight):</span>
              <span className="font-semibold text-slate-900 font-mono">40%</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-600">Trọng số Thời gian giao hàng (Lead Time):</span>
              <span className="font-semibold text-slate-900 font-mono">20%</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-600">Trọng số Số lượng đặt tối thiểu (MOQ):</span>
              <span className="font-semibold text-slate-900 font-mono">15%</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-600">Trọng số Lịch sử giao hàng (OTIF):</span>
              <span className="font-semibold text-slate-900 font-mono">25%</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
              <span className="text-slate-600">Target Service Level:</span>
              <span className="font-semibold text-slate-900 font-mono">95% (Z = 1.65)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Chu kỳ rà soát mua hàng (Review Period):</span>
              <span className="font-semibold text-slate-900 font-mono">7 ngày</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
