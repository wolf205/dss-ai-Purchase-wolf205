import React, { useState } from 'react';
import { AlertTriangle, Database, Check, ShieldAlert } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { ImportType } from '../types';

interface ImportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: ImportType;
  totalRows: number;
  duplicateDates: string[];
  isConfirming: boolean;
}

export const ImportConfirmModal: React.FC<ImportConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  totalRows,
  duplicateDates,
  isConfirming,
}) => {
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const isSales = type === 'sales';
  const hasDuplicates = duplicateDates.length > 0;

  const handleClose = () => {
    if (!isConfirming) {
      setHasAcknowledged(false);
      onClose();
    }
  };

  const handleProceed = () => {
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isSales && hasDuplicates
          ? 'Xác Nhận Ghi Đè Dữ Liệu Bán Hàng (BR-15)'
          : 'Xác Nhận Nạp Dữ Liệu Vận Hành'
      }
      size="md"
    >
      <div className="space-y-4">
        {isSales && hasDuplicates ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-xs text-amber-900">
                <p className="font-bold text-sm text-amber-950">
                  Cảnh báo ghi đè ngày trùng lặp!
                </p>
                <p className="leading-relaxed">
                  Tệp tải lên chứa <strong>{duplicateDates.length} ngày</strong>{' '}
                  đã có số liệu trong hệ thống:
                </p>
                <div className="flex flex-wrap gap-1 py-1">
                  {duplicateDates.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-950 border border-amber-300"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <p className="text-amber-800">
                  Toàn bộ dữ liệu cũ của các ngày này sẽ bị{' '}
                  <strong>xóa sạch và thay thế</strong> bằng {totalRows} bản ghi
                  mới trong transaction. Tuyệt đối không cộng dồn.
                </p>
              </div>
            </div>
          </div>
        ) : isSales ? (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-bold text-sm text-blue-950">
                  Xác nhận lưu {totalRows} bản ghi bán hàng
                </p>
                <p className="text-blue-800">
                  Dữ liệu bán hàng mới sẽ được ghi nhận vào lịch sử để làm giàu
                  chuỗi dữ liệu phục vụ các thuật toán AI dự báo nhu cầu.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-900 space-y-1">
                <p className="font-bold text-sm text-indigo-950">
                  Cập nhật tồn kho cho {totalRows} sản phẩm
                </p>
                <p className="text-indigo-800">
                  Hệ thống sẽ cập nhật tồn kho khả dụng mới nhất trên kệ. Toàn bộ
                  số lượng hàng đang về (`on_order_quantity`) và các SKU không có
                  trong file được bảo lưu nguyên vẹn (BR-16).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checkbox bắt buộc nếu có ngày trùng lặp */}
        {isSales && hasDuplicates && (
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span>
              Tôi hiểu và đồng ý xóa dữ liệu cũ để ghi đè số liệu mới của{' '}
              {duplicateDates.length} ngày đã nêu.
            </span>
          </label>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isConfirming}
          >
            Hủy Bỏ
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleProceed}
            disabled={isConfirming || (isSales && hasDuplicates && !hasAcknowledged)}
            className={`${
              isSales && hasDuplicates
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            } text-white font-semibold shadow-xs`}
          >
            {isConfirming ? (
              'Đang ghi vào CSDL...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Đồng Ý Nạp Dữ Liệu
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
