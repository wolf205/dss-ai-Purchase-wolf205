import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Package, Layers, AlertCircle } from 'lucide-react';
import type { SupplyCondition, CreateSupplyConditionDto, UpdateSupplyConditionDto } from '../types';
import type { Product } from '../../catalog/types';

interface SupplyConditionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierId?: string;
  condition?: SupplyCondition | null;
  assignedProductIds: string[];
  activeProducts: Product[];
  onSubmitCreate: (payload: CreateSupplyConditionDto) => Promise<unknown>;
  onSubmitUpdate: (conditionId: string, payload: UpdateSupplyConditionDto) => Promise<unknown>;
  isLoading: boolean;
}

export const SupplyConditionFormModal: React.FC<SupplyConditionFormModalProps> = ({
  isOpen,
  onClose,
  condition,
  assignedProductIds,
  activeProducts,
  onSubmitCreate,
  onSubmitUpdate,
  isLoading,
}) => {
  const isEdit = Boolean(condition);

  // Filter products: Only active products not already assigned to this supplier
  const availableProducts = activeProducts.filter(
    (p) => !assignedProductIds.includes(p.id) || (isEdit && p.id === condition?.productId),
  );

  const [productId, setProductId] = useState(
    () => condition?.productId || availableProducts[0]?.id || '',
  );
  const [purchasePrice, setPurchasePrice] = useState<number | string>(
    () => condition?.purchasePrice ?? '',
  );
  const [moq, setMoq] = useState<number | string>(
    () => condition?.moq ?? 1,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEdit && !productId) {
      newErrors.productId = 'Vui lòng chọn mặt hàng (SKU) cần gán (EF-6).';
    }

    const price = Number(purchasePrice);
    if (!purchasePrice || isNaN(price) || price <= 0) {
      newErrors.purchasePrice = 'Đơn giá nhập phải là số dương lớn hơn 0 (EF-6).';
    }

    const moqVal = Number(moq);
    if (!moq || isNaN(moqVal) || moqVal < 1 || !Number.isInteger(moqVal)) {
      newErrors.moq = 'Số lượng đặt tối thiểu (MOQ) phải là số nguyên ≥ 1 (EF-6).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit && condition) {
        await onSubmitUpdate(condition.id, {
          purchasePrice: Number(purchasePrice),
          moq: Number(moq),
        });
      } else {
        await onSubmitCreate({
          productId,
          purchasePrice: Number(purchasePrice),
          moq: Number(moq),
        });
      }
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
          <Package className="w-5 h-5 text-blue-600" />
          <span>
            {isEdit
              ? `Sửa Điều Kiện Cung Ứng: ${condition?.product?.skuCode}`
              : 'Gán Mặt Hàng (SKU) Cho Nhà Cung Cấp'}
          </span>
        </div>
      }
      subtitle={
        isEdit
          ? 'Cập nhật đơn giá nhập và số lượng đặt tối thiểu (MOQ) cho mặt hàng này.'
          : 'Thiết lập bảng giá nhập và điều kiện giao hàng cho SKU mới.'
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
            onClick={handleSubmit}
            disabled={isLoading || (!isEdit && availableProducts.length === 0)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isEdit ? 'Lưu Điều Kiện' : 'Thêm Vào Danh Mục'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner BR-22 */}
        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Quy tắc BR-22:</strong> Mức giá nhập và MOQ mới chỉ áp dụng cho các phiên tính toán DSS tương lai. Đơn PO đã sinh trong quá khứ được bảo lưu vĩnh viễn mức snapshot giá cũ.
          </div>
        </div>

        {/* Chọn SKU */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Mặt Hàng (SKU) <span className="text-rose-500">*</span>
          </label>
          {isEdit ? (
            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
              <span className="font-mono font-bold text-slate-900">
                {condition?.product?.skuCode}
              </span>{' '}
              — {condition?.product?.productName} ({condition?.product?.unit})
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Tất cả các sản phẩm Active trong hệ thống đã được gán cho NCC này, hoặc chưa có sản phẩm nào ở trạng thái Active.
            </div>
          ) : (
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden transition-all ${
                errors.productId ? 'border-rose-500 bg-rose-50/30' : ''
              }`}
            >
              <option value="" disabled>
                -- Chọn sản phẩm cần gán --
              </option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.skuCode}] {p.productName} ({p.unit}) - {p.category?.categoryName || 'Chung'}
                </option>
              ))}
            </select>
          )}
          {errors.productId && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.productId}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Đơn giá nhập */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Đơn Giá Nhập (VNĐ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₫
              </span>
              <input
                type="number"
                min="1"
                step="100"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="VD: 32000"
                className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden font-mono transition-all ${
                  errors.purchasePrice ? 'border-rose-500 bg-rose-50/30' : ''
                }`}
              />
            </div>
            {errors.purchasePrice && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.purchasePrice}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Đơn giá mua tính theo VNĐ ({'>'} 0)</p>
          </div>

          {/* MOQ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số Lượng Đặt Tối Thiểu (MOQ) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Layers className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                step="1"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                placeholder="VD: 10"
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden font-mono transition-all ${
                  errors.moq ? 'border-rose-500 bg-rose-50/30' : ''
                }`}
              />
            </div>
            {errors.moq && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.moq}</p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">Số lượng tối thiểu/đơn (≥ 1)</p>
          </div>
        </div>
      </form>
    </Modal>
  );
};
