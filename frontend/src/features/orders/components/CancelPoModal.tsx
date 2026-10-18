import React, { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  CANCELLATION_REASONS,
  type StandardCancellationReason,
} from '../types';

export interface CancelPoModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    poNumber: string;
    supplierName: string;
    totalAmount: number;
  } | null;
  onConfirmCancel: (cancellationReason: string) => Promise<void> | void;
  isLoading?: boolean;
}

export const CancelPoModal: React.FC<CancelPoModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmCancel,
  isLoading = false,
}) => {
  const [selectedReason, setSelectedReason] =
    useState<StandardCancellationReason>('NCC báo hết hàng');
  const [customReasonText, setCustomReasonText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalReason = selectedReason as string;

    if (selectedReason === 'Khác') {
      if (!customReasonText.trim()) {
        setErrorMessage('Vui lòng nhập lý do cụ thể khi chọn "Khác".');
        return;
      }
      finalReason = customReasonText.trim();
    } else if (customReasonText.trim()) {
      // Bổ sung ghi chú nếu người dùng nhập thêm
      finalReason = `${selectedReason} - ${customReasonText.trim()}`;
    }

    if (finalReason.length > 255) {
      setErrorMessage('Lý do hủy đơn không được vượt quá 255 ký tự.');
      return;
    }

    setErrorMessage(null);
    onConfirmCancel(finalReason);
  };

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2 text-rose-600 font-bold">
          <XCircle className="w-5 h-5" />
          <span>Xác Nhận Hủy Đơn Mua Hàng</span>
        </div>
      }
      subtitle={`Đơn hàng: ${order.poNumber} — ${order.supplierName}`}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Đóng
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={isLoading}
            onClick={handleSubmit}
            leftIcon={<XCircle className="w-4 h-4" />}
          >
            Xác Nhận Hủy Đơn
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
        {/* Banner cảnh báo nghiệp vụ BR-07 & BR-06 */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-amber-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            Lưu ý nghiệp vụ quan trọng (BR-07, BR-06)
          </div>
          <p className="text-[11px] leading-relaxed">
            Khi hủy đơn hàng này, hệ thống sẽ thực hiện giao dịch ACID lập tức:
          </p>
          <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-800 font-medium">
            <li>
              <strong>Hoàn trả số lượng đang về (`on_order_quantity`)</strong> cho toàn bộ các SKU trong đơn (BR-07).
            </li>
            <li>
              DSS sẽ tự động nhận diện lại nhu cầu thiếu hụt trong đợt phân tích tiếp theo tại UC-01.
            </li>
            <li>
              Đơn hàng chuyển sang <strong>Cancelled</strong> và <strong>không thể khôi phục hay chỉnh sửa</strong> (BR-06).
            </li>
          </ul>
        </div>

        {/* Thông tin đơn hàng tóm tắt */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs font-medium">
          <div>
            <span className="text-slate-400">Đơn hàng:</span>{' '}
            <strong className="text-slate-900 font-mono">{order.poNumber}</strong>
          </div>
          <div>
            <span className="text-slate-400">Tổng tiền:</span>{' '}
            <strong className="text-slate-900 font-mono">
              {formatCurrency(order.totalAmount)}
            </strong>
          </div>
        </div>

        {/* Danh mục Lý do hủy đơn chuẩn hóa (BR-10) */}
        <div className="space-y-2">
          <label className="block font-bold text-slate-900 text-xs">
            Lý do hủy đơn bắt buộc (BR-10): <span className="text-rose-500">*</span>
          </label>

          <div className="space-y-1.5">
            {CANCELLATION_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  selectedReason === reason
                    ? 'border-rose-400 bg-rose-50/50 text-rose-950 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="cancellationReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => {
                    setSelectedReason(reason);
                    setErrorMessage(null);
                  }}
                  className="w-3.5 h-3.5 text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ô nhập giải thích bổ sung / Văn bản khi chọn 'Khác' */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-slate-800 text-xs">
            {selectedReason === 'Khác' ? (
              <span>
                Chi tiết lý do khác: <span className="text-rose-500">*</span>
              </span>
            ) : (
              <span>Ghi chú thêm (tùy chọn):</span>
            )}
          </label>
          <textarea
            rows={3}
            value={customReasonText}
            onChange={(e) => {
              setCustomReasonText(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            placeholder={
              selectedReason === 'Khác'
                ? 'Nhập lý do hủy chi tiết (tối đa 255 ký tự)...'
                : 'Nhập ghi chú thêm nếu cần...'
            }
            maxLength={255}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 text-slate-800"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-400">
            <span>Tối đa 255 ký tự</span>
            <span>{customReasonText.length}/255</span>
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {errorMessage}
          </p>
        )}
      </form>
    </Modal>
  );
};
