import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { Product } from '../types';

interface ProductStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (id: string, newStatus: 'Active' | 'Inactive') => Promise<void>;
  isLoading: boolean;
}

export const ProductStatusConfirmModal: React.FC<ProductStatusConfirmModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirm,
  isLoading,
}) => {
  if (!product) return null;

  const isCurrentlyActive = product.status === 'Active';
  const targetStatus = isCurrentlyActive ? 'Inactive' : 'Active';

  const handleConfirm = async () => {
    await onConfirm(product.id, targetStatus);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isCurrentlyActive
          ? 'Xác Nhận Ngừng Kinh Doanh Sản Phẩm'
          : 'Xác Nhận Mở Lại Kinh Doanh Sản Phẩm'
      }
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
            variant={isCurrentlyActive ? 'danger' : 'success'}
            size="sm"
            isLoading={isLoading}
            onClick={handleConfirm}
          >
            {isCurrentlyActive ? 'Ngừng Kinh Doanh' : 'Kích Hoạt Lại'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Nội dung xác nhận */}
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isCurrentlyActive
                ? 'bg-rose-100 text-rose-600'
                : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {isCurrentlyActive ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">
              Bạn có chắc chắn muốn chuyển trạng thái kinh doanh của sản phẩm{' '}
              <strong className="text-slate-900 font-bold">{product.skuCode}</strong> (
              {product.productName}) sang{' '}
              <strong
                className={
                  isCurrentlyActive ? 'text-rose-600' : 'text-emerald-600'
                }
              >
                {isCurrentlyActive ? 'Ngừng kinh doanh (Inactive)' : 'Đang kinh doanh (Active)'}
              </strong>
              ?
            </p>
          </div>
        </div>

        {/* Hộp thông tin nghiệp vụ BR-18 */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Quy tắc vận hành (BR-18):</span>
          </div>

          {isCurrentlyActive ? (
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>
                Sản phẩm sẽ <strong>loại trừ 100%</strong> khỏi chu trình gợi ý mua hàng tự động của DSS (UC-01).
              </li>
              <li>
                Hệ thống <strong>vẫn tiếp nhận bình thường</strong> dữ liệu bán hàng và kiểm kê tại UC-04 để theo dõi bán nốt số tồn dư.
              </li>
              {product.onOrderQuantity > 0 && (
                <li className="text-amber-700 font-medium">
                  Sản phẩm đang có {product.onOrderQuantity} {product.unit} trên đường về từ các đơn PO.
                </li>
              )}
            </ul>
          ) : (
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>
                Sản phẩm sẽ <strong>được đưa trở lại</strong> phạm vi phân tích dự báo nhu cầu và tính toán ROP/SOQ của DSS (UC-01).
              </li>
              <li>
                Đảm bảo sản phẩm đã có ít nhất một Nhà cung cấp được cấu hình điều kiện cung ứng (UC-06).
              </li>
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};
