import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import type { SupplyCondition } from '../types';

interface StopSupplyConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  condition: SupplyCondition | null;
  supplierName: string;
  onConfirm: (condition: SupplyCondition, newStatus: 'Active' | 'Inactive') => Promise<void>;
  isLoading: boolean;
}

export const StopSupplyConfirmModal: React.FC<StopSupplyConfirmModalProps> = ({
  isOpen,
  onClose,
  condition,
  supplierName,
  onConfirm,
  isLoading,
}) => {
  if (!condition) return null;

  const currentIsActive = condition.status === 'Active';
  const targetStatus = currentIsActive ? 'Inactive' : 'Active';

  const handleConfirm = async () => {
    try {
      await onConfirm(condition, targetStatus);
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
              ? 'Xác Nhận Ngừng Cung Ứng Mặt Hàng'
              : 'Xác Nhận Tái Kích Hoạt Cung Ứng'}
          </span>
        </div>
      }
      subtitle={
        <span className="font-mono text-slate-700">
          [{condition.product?.skuCode}] {condition.product?.productName} — NCC: {supplierName}
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
            ) : currentIsActive ? (
              <XCircle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>
              {currentIsActive ? 'Xác Nhận Ngừng Cung Ứng' : 'Kích Hoạt Cung Ứng Lại'}
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
                Cảnh báo ngừng cung ứng SKU (BR-23)
              </div>
              <p>
                Sau khi ngừng cung ứng, nhà cung cấp <strong>{supplierName}</strong> sẽ không còn được hệ thống DSS cân nhắc trong thuật toán xếp hạng NCC cho mặt hàng <strong>{condition.product?.productName}</strong>.
              </p>
              <p className="text-[11px] text-amber-800">
                Nếu đối tác này là nhà cung cấp duy nhất hiện tại của sản phẩm, DSS sẽ không thể đưa ra khuyến nghị mua hàng cho sản phẩm này cho đến khi bạn gán đối tác mới.
              </p>
            </div>

            <p className="text-slate-600">
              <strong>Điều kiện tiên quyết (EF-5):</strong> Sản phẩm không được đang nằm trong bất kỳ đơn mua hàng nào ở trạng thái <code>Approved</code> của chính nhà cung cấp này.
            </p>
          </>
        ) : (
          <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Tái kích hoạt cung ứng
            </div>
            <p>
              Mặt hàng <strong>[{condition.product?.skuCode}] {condition.product?.productName}</strong> sẽ được kích hoạt trở lại trong danh mục cung ứng của <strong>{supplierName}</strong> với đơn giá {condition.purchasePrice.toLocaleString()} đ và MOQ {condition.moq}.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
