import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { COMMON_UNITS } from '../types';
import type { Category, Product, CreateProductDto, UpdateProductDto } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialData?: Product | null;
  onSubmit: (payload: CreateProductDto | UpdateProductDto) => Promise<void>;
  isLoading: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  initialData,
  onSubmit,
  isLoading,
}) => {
  const isEdit = Boolean(initialData);

  const [skuCode, setSkuCode] = useState(initialData?.skuCode || '');
  const [productName, setProductName] = useState(initialData?.productName || '');
  const [categoryId, setCategoryId] = useState<string>(
    initialData
      ? String(initialData.categoryId || initialData.category?.id || '')
      : categories.length > 0
        ? String(categories[0].id)
        : ''
  );
  const [unit, setUnit] = useState(initialData?.unit || 'Hộp');
  const [barcode, setBarcode] = useState(initialData?.barcode || '');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEdit) {
      const trimmedSku = skuCode.trim();
      if (!trimmedSku) {
        newErrors.skuCode = 'Mã SKU không được để trống';
      } else if (trimmedSku.length > 50) {
        newErrors.skuCode = 'Mã SKU tối đa 50 ký tự';
      } else if (!/^[a-zA-Z0-9_-]+$/.test(trimmedSku)) {
        newErrors.skuCode =
          'Mã SKU chỉ được chứa chữ cái, chữ số, gạch ngang (-) hoặc gạch dưới (_)';
      }
    }

    const trimmedName = productName.trim();
    if (!trimmedName) {
      newErrors.productName = 'Tên sản phẩm không được để trống';
    } else if (trimmedName.length > 255) {
      newErrors.productName = 'Tên sản phẩm tối đa 255 ký tự';
    }

    if (!categoryId) {
      newErrors.categoryId = 'Vui lòng chọn ngành hàng';
    }

    const trimmedUnit = unit.trim();
    if (!trimmedUnit) {
      newErrors.unit = 'Đơn vị tính không được để trống';
    } else if (trimmedUnit.length > 30) {
      newErrors.unit = 'Đơn vị tính tối đa 30 ký tự';
    }

    if (barcode && barcode.trim().length > 50) {
      newErrors.barcode = 'Mã vạch tối đa 50 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit) {
      await onSubmit({
        productName: productName.trim(),
        categoryId,
        unit: unit.trim(),
        barcode: barcode.trim() || null,
      });
    } else {
      await onSubmit({
        skuCode: skuCode.trim().toUpperCase(),
        productName: productName.trim(),
        categoryId,
        unit: unit.trim(),
        barcode: barcode.trim() || null,
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Mới Sản Phẩm SKU'}
      subtitle={
        isEdit
          ? `Cập nhật thông tin cho sản phẩm ${initialData?.skuCode}`
          : 'Khai báo hồ sơ sản phẩm mới trong danh mục hàng hóa (UC-05)'
      }
      size="lg"
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
            variant="primary"
            size="sm"
            isLoading={isLoading}
            onClick={handleSubmit}
          >
            {isEdit ? 'Lưu Thay Đổi' : 'Thêm Sản Phẩm'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mã SKU */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="skuCode"
              className="block text-xs font-semibold text-slate-800"
            >
              Mã SKU <span className="text-rose-500">*</span>
            </label>
            {isEdit && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <Lock className="w-3 h-3 text-slate-400" />
                Khóa cố định (BR-17)
              </span>
            )}
          </div>

          <div className="mt-1 relative">
            <input
              id="skuCode"
              type="text"
              value={skuCode}
              onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
              disabled={isEdit || isLoading}
              placeholder="VD: MILK-TH-1L"
              className={`w-full font-mono uppercase px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                isEdit
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  : errors.skuCode
                    ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-white'
                    : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900 bg-white'
              } focus:outline-none focus:ring-2`}
            />
          </div>
          {errors.skuCode ? (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.skuCode}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">
              {isEdit
                ? 'Mã SKU là định danh logic bất biến toàn hệ thống, không được phép thay đổi.'
                : 'Chỉ chấp nhận chữ cái, chữ số, dấu gạch nối (-) hoặc gạch dưới (_).'}
            </p>
          )}
        </div>

        {/* Tên sản phẩm */}
        <div>
          <label
            htmlFor="productName"
            className="block text-xs font-semibold text-slate-800"
          >
            Tên Sản Phẩm <span className="text-rose-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="productName"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              disabled={isLoading}
              placeholder="VD: Sữa tươi tiệt trùng TH True Milk 1L"
              className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                errors.productName
                  ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900'
              } focus:outline-none focus:ring-2 bg-white`}
            />
          </div>
          {errors.productName && (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.productName}
            </p>
          )}
        </div>

        {/* Hàng: Ngành hàng & Đơn vị tính */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Ngành hàng */}
          <div>
            <label
              htmlFor="categoryId"
              className="block text-xs font-semibold text-slate-800"
            >
              Ngành Hàng <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1">
              <select
                id="categoryId"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={isLoading}
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors bg-white cursor-pointer ${
                  errors.categoryId
                    ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900'
                } focus:outline-none focus:ring-2`}
              >
                <option value="">-- Chọn ngành hàng --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName} ({cat.categoryCode})
                  </option>
                ))}
              </select>
            </div>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.categoryId}
              </p>
            )}
          </div>

          {/* Đơn vị tính */}
          <div>
            <label
              htmlFor="unit"
              className="block text-xs font-semibold text-slate-800"
            >
              Đơn Vị Tính <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1">
              <input
                id="unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={isLoading}
                placeholder="VD: Hộp, Chai, Thùng..."
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors bg-white ${
                  errors.unit
                    ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900'
                } focus:outline-none focus:ring-2`}
              />
            </div>
            {/* Quick chips gợi ý ĐVT */}
            <div className="mt-1.5 flex flex-wrap gap-1 items-center">
              <span className="text-[11px] text-slate-400 mr-1">Gợi ý:</span>
              {COMMON_UNITS.slice(0, 6).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setUnit(item)}
                  className={`px-1.5 py-0.5 text-[11px] rounded border transition-colors cursor-pointer ${
                    unit === item
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            {errors.unit && (
              <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.unit}
              </p>
            )}
          </div>
        </div>

        {/* Mã vạch */}
        <div>
          <label
            htmlFor="barcode"
            className="block text-xs font-semibold text-slate-800"
          >
            Mã Vạch Sản Phẩm (Barcode)
          </label>
          <div className="mt-1">
            <input
              id="barcode"
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              disabled={isLoading}
              placeholder="VD: 8936036010011 (tùy chọn)"
              className={`w-full font-mono px-3 py-2 text-xs sm:text-sm rounded-lg border transition-colors bg-white ${
                errors.barcode
                  ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-slate-900 focus:border-slate-900'
              } focus:outline-none focus:ring-2`}
            />
          </div>
          {errors.barcode ? (
            <p className="mt-1 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errors.barcode}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-slate-400">
              Nếu nhập, mã vạch phải là duy nhất. Có thể để trống nếu sản phẩm chưa có mã vạch.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
};
