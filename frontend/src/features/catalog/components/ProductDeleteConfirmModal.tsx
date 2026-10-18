import React from 'react';
import { AlertOctagon, ShieldAlert } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { Product } from '../types';

interface ProductDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const ProductDeleteConfirmModal: React.FC<ProductDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
  isLoading,
}) => {
  if (!product) return null;

  const handleConfirm = async () => {
    await onConfirm(product.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác Nhận Xóa Vĩnh Viễn Sản Phẩm"
      size="md"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy Bỏ
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={isLoading}
            onClick={handleConfirm}
          >
            Xác Nhận Xóa Vĩnh Viễn
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              Bạn có chắc chắn muốn xóa hoàn toàn sản phẩm{' '}
              <strong className="text-slate-900 font-bold">{product.skuCode}</strong> (
              {product.productName}) khỏi hệ thống?
            </p>
            <p className="text-xs text-rose-600 mt-1 font-semibold">
              Hành động này không thể hoàn tác sau khi đã thực hiện!
            </p>
          </div>
        </div>

        {/* Cảnh báo ràng buộc Zero-Link (BR-18) */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 space-y-2 text-xs">
          <div className="font-semibold text-amber-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Ràng buộc Zero-Link (BR-18 & INV-PROD-04):</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Hệ thống <strong>chỉ cho phép xóa</strong> nếu sản phẩm vừa tạo mới do nhầm lẫn và{' '}
            <strong>chưa phát sinh bất kỳ dữ liệu liên kết nào</strong> (không có dữ liệu bán hàng, kiểm kê, đơn PO hoặc điều kiện cung ứng).
          </p>
          <p className="text-amber-800 leading-relaxed">
            Nếu sản phẩm đã phát sinh liên kết vận hành, hệ thống sẽ từ chối xóa để bảo toàn dữ liệu chuỗi thời gian. Trong trường hợp đó, vui lòng sử dụng chức năng{' '}
            <strong>Ngừng kinh doanh (Inactive)</strong>.
          </p>
        </div>
      </div>
    </Modal>
  );
};
