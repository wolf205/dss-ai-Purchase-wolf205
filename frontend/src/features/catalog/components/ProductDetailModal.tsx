import React from 'react';
import {
  Boxes,
  Barcode,
  FolderTree,
  Scale,
  Calendar,
  Layers,
  Truck,
  PackageCheck,
  Edit2,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ProductStatusBadge } from './ProductStatusBadge';
import type { Product } from '../types';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  isManager: boolean;
  onOpenEdit: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  isManager,
  onOpenEdit,
}) => {
  if (!product) return null;

  const totalAvailable = product.currentInventory + product.onOrderQuantity;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>{product.skuCode}</span>
          <ProductStatusBadge status={product.status} size="sm" />
        </div>
      }
      subtitle={product.productName}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
          {isManager && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose();
                onOpenEdit(product);
              }}
            >
              Chỉnh Sửa Sản Phẩm
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        {/* Thẻ Chỉ Số Tồn Kho & Hàng Đang Về */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Tình Trạng Tồn Kho Thực Tế
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Tồn thực tế trên kệ */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Tồn Trên Kệ</span>
                <PackageCheck className="w-4 h-4 text-slate-400" />
              </div>
              <div
                className={`text-xl font-bold ${
                  product.currentInventory <= 0
                    ? 'text-rose-600'
                    : 'text-slate-900'
                }`}
              >
                {product.currentInventory.toLocaleString('vi-VN')}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {product.unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Số lượng kiểm kê thực tế sẵn sàng bán
              </p>
            </div>

            {/* Hàng đang về */}
            <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/50">
              <div className="flex items-center justify-between text-blue-700 text-xs mb-1">
                <span>Hàng Đang Về</span>
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-blue-900">
                +{product.onOrderQuantity.toLocaleString('vi-VN')}{' '}
                <span className="text-xs font-normal text-blue-700">
                  {product.unit}
                </span>
              </div>
              <p className="text-[11px] text-blue-600/80 mt-1">
                Từ các đơn PO đã phê duyệt đang chờ giao
              </p>
            </div>

            {/* Tổng tồn khả dụng */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Tổng Tồn Khả Dụng</span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-xl font-bold text-slate-900">
                {totalAvailable.toLocaleString('vi-VN')}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {product.unit}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Inventory Position (IP = Tồn kệ + Đang về)
              </p>
            </div>
          </div>
        </div>

        {/* Thông Tin Hồ Sơ Sản Phẩm */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Thông Tin Định Danh & Phân Loại
          </h4>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 divide-y divide-slate-200/60 text-xs">
            <div className="py-2.5 first:pt-0 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-slate-400" />
                Mã SKU
              </span>
              <span className="font-mono font-bold text-slate-900">
                {product.skuCode}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <FolderTree className="w-3.5 h-3.5 text-slate-400" />
                Ngành hàng
              </span>
              <span className="font-semibold text-slate-900">
                {product.category?.categoryName || 'Chưa phân loại'}{' '}
                <span className="text-slate-400 font-normal">
                  ({product.category?.categoryCode || 'N/A'})
                </span>
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-slate-400" />
                Đơn vị tính
              </span>
              <span className="font-semibold text-slate-900">
                {product.unit}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Barcode className="w-3.5 h-3.5 text-slate-400" />
                Mã vạch (Barcode)
              </span>
              <span className="font-mono font-medium text-slate-700">
                {product.barcode || '— (Chưa gán)'}
              </span>
            </div>

            <div className="py-2.5 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Thời điểm tạo
              </span>
              <span className="text-slate-600">
                {formatDate(product.createdAt)}
              </span>
            </div>

            <div className="py-2.5 last:pb-0 flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Cập nhật lần cuối
              </span>
              <span className="text-slate-600">
                {formatDate(product.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
