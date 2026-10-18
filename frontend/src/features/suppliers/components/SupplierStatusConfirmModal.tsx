import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { AlertTriangle, CheckCircle2, Power } from 'lucide-react';
import type { Supplier } from '../types';

interface SupplierStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onConfirm: (supplier: Supplier, newStatus: 'Active' | 'Inactive') => Promise<void>;
  isLoading: boolean;
}

export const SupplierStatusConfirmModal: React.FC<SupplierStatusConfirmModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onConfirm,
  isLoading,
}) => {
  if (!supplier) return null;

  const currentIsActive = supplier.status === 'Active';
  const targetStatus = currentIsActive ? 'Inactive' : 'Active';

  const handleConfirm = async () => {
    try {
      await onConfirm(supplier, targetStatus);
      onClose();
    } catch {
      // Handled in mutation onError
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {currentIsActive ? (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
          <span>
            {currentIsActive
              ? 'Xác Nhận Ngừng Hợp Tác Đối Tác'
              : 'Xác Nhận Tái Kích Hoạt Đối Tác'}
          </span>
        </div>
      }
      subtitle={
        <span className="font-mono text-slate-700">
          {supplier.supplierCode} — {supplier.supplierName}
        </span>
      }
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
              currentIsActive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            <span>
              {currentIsActive ? 'Xác Nhận Ngừng Hợp Tác' : 'Kích Hoạt Lại Đối Tác'}
            </span>
          </button>
        </div>
      }
    >
      <div className="space-y-3 text-xs leading-relaxed">
        {currentIsActive ? (
          <>
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Cảnh báo tác động nghiệp vụ (BR-24)
              </div>
              <p>
                Khi chuyển sang trạng thái <strong>Ngừng hợp tác (Inactive)</strong>:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] text-amber-800">
                <li>
                  Toàn bộ <strong>{supplier.activeSkuCount} mặt hàng</strong> do đối tác này cung cấp sẽ tự động bị loại trừ khỏi thuật toán chấm điểm và gợi ý mua hàng tại DSS (UC-01).
                </li>
                <li>
                  Lịch sử các đơn mua hàng cũ vẫn được bảo lưu nguyên vẹn để phục vụ đối soát.
                </li>
              </ul>
            </div>

            <p className="text-slate-600">
              <strong>Điều kiện tiên quyết (EF-4):</strong> Nhà cung cấp không được có bất kỳ đơn mua hàng nào ở trạng thái <code>Approved</code> đang chờ giao. Nếu có, hệ thống sẽ từ chối thao tác.
            </p>
          </>
        ) : (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Tái kích hoạt đối tác
            </div>
            <p>
              Nhà cung cấp <strong>{supplier.supplierName}</strong> sẽ được chuyển lại sang trạng thái <strong>Đang hợp tác (Active)</strong>.
            </p>
            <p className="text-[11px] text-emerald-800">
              Các mặt hàng thuộc danh mục cung ứng của đối tác sẽ lập tức được đưa trở lại thuật toán xếp hạng WSM tại DSS (UC-01).
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
