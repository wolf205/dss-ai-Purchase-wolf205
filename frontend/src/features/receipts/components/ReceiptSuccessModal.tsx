import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Award,
  ArrowRight,
  RotateCcw,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import type { GoodsReceiptResponse } from '../types';

interface ReceiptSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: GoodsReceiptResponse | null;
  onReceiveAnother: () => void;
}

export const ReceiptSuccessModal: React.FC<ReceiptSuccessModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  onReceiveAnother,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !receiptData) return null;

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const orderScore100 = Math.round(receiptData.orderPerformanceScore * 100);
  const supplierRollingScore100 = Math.round(
    receiptData.supplierPerformance.performanceScore * 100
  );
  const supplierAllTimeScore100 = Math.round(
    receiptData.supplierPerformance.allTimePerformanceScore * 100
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-base">
              Tiếp Nhận Kho Thành Công
            </span>
            <span className="font-mono text-xs text-emerald-700 font-semibold block">
              Mã Phiếu: {receiptData.receiptNumber}
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={onReceiveAnother}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Tiếp tục nhận đơn khác
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                navigate('/orders');
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Xem Danh Sách Đơn PO
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Banner tóm tắt giao dịch */}
        <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-xl p-4 text-xs text-emerald-950 space-y-1">
          <p className="font-semibold text-emerald-900 text-sm">
            Đơn mua hàng {receiptData.poNumber} đã được đóng (Completed)!
          </p>
          <p className="text-emerald-800 leading-relaxed">
            Số lượng tồn kho thực tế (<code className="font-semibold">current_inventory</code>) của {receiptData.lines.length} SKU đã được cập nhật tăng ngay lập tức.
            Lượng hàng đang chờ về (<code className="font-semibold">on_order_quantity</code>) đã được tất toán để tránh treo số liệu.
          </p>
        </div>

        {/* Khối Điểm OTIF & Đóng Kín Vòng Lặp Phản Hồi (Closed-Loop Feedback) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Điểm Đơn Hàng Vừa Nhận */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Hiệu Suất Đơn Này
              </span>
              <Badge variant={orderScore100 >= 80 ? 'success' : 'warning'} size="sm">
                {orderScore100 >= 80 ? 'Đạt Chuẩn' : 'Cảnh Báo'}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {orderScore100}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ 100 điểm OTIF</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex justify-between">
                <span>Trạng thái giao hàng:</span>
                <span className={receiptData.isOnTime ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                  {receiptData.isOnTime ? 'Đúng hạn' : `Trễ ${receiptData.daysLate} ngày`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tỷ lệ giao đủ (In-Full):</span>
                <span className="font-mono font-bold text-slate-900">
                  {Math.round(receiptData.overallFulfillmentRate * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hệ số thời gian:</span>
                <span className="font-mono text-slate-700">
                  {receiptData.onTimeFactor.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Phong Độ Cập Nhật Của Nhà Cung Cấp */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-purple-600" />
                Phong Độ Nhà Cung Cấp (BR-24)
              </span>
              <Badge variant="purple" size="sm">
                {receiptData.supplierPerformance.performanceLabel}
              </Badge>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-purple-900">
                {supplierRollingScore100}
              </span>
              <span className="text-xs text-slate-500 font-medium">/ 100 điểm (5 đơn)</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2">
              <div className="flex justify-between">
                <span>Tổng đơn đã hoàn tất:</span>
                <span className="font-mono font-bold text-slate-900">
                  {receiptData.supplierPerformance.completedOrderCount} đơn
                </span>
              </div>
              <div className="flex justify-between">
                <span>Điểm toàn thời gian:</span>
                <span className="font-mono text-slate-700">
                  {supplierAllTimeScore100} / 100
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tác động WSM:</span>
                <span className="text-purple-700 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Cập nhật S_History phiên sau
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin nhà cung cấp & Ghi chú */}
        <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-900">{receiptData.supplierName}</span>
            <span className="text-slate-400 font-mono">({receiptData.supplierCode})</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <span>Ngày nhận thực tế: {formatDate(receiptData.actualDeliveryDate)}</span>
            <span>•</span>
            <span>Người tiếp nhận: {receiptData.receivedBy}</span>
          </div>
          {receiptData.notes && (
            <div className="pt-1.5 border-t border-slate-200/60 text-slate-700">
              <span className="font-semibold text-slate-800">Ghi chú:</span> {receiptData.notes}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
