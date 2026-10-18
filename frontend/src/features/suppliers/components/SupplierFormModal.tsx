import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Building2, AlertCircle, Clock, Phone, User, Mail, MapPin } from 'lucide-react';
import type { Supplier, CreateSupplierDto, UpdateSupplierDto } from '../types';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
  onSubmitCreate: (data: CreateSupplierDto) => Promise<unknown>;
  onSubmitUpdate: (id: string, data: UpdateSupplierDto) => Promise<unknown>;
  isLoading: boolean;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onSubmitCreate,
  onSubmitUpdate,
  isLoading,
}) => {
  const isEdit = Boolean(supplier);

  const [formData, setFormData] = useState(() => ({
    supplierCode: supplier?.supplierCode || '',
    supplierName: supplier?.supplierName || '',
    contactPerson: supplier?.contactPerson || '',
    phoneNumber: supplier?.phoneNumber || '',
    committedLeadTimeDays: supplier?.committedLeadTimeDays || 3,
    email: supplier?.email || '',
    address: supplier?.address || '',
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEdit) {
      const code = formData.supplierCode.trim();
      if (!code) {
        newErrors.supplierCode = 'Mã nhà cung cấp không được để trống (EF-7).';
      } else if (!/^[A-Za-z0-9_-]+$/.test(code)) {
        newErrors.supplierCode =
          'Mã chỉ chứa chữ cái, chữ số, gạch nối (-) hoặc gạch dưới (_), không chứa dấu cách (BR-21, EF-8).';
      }
    }

    if (!formData.supplierName.trim()) {
      newErrors.supplierName = 'Tên nhà cung cấp không được để trống (EF-7).';
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Họ tên người liên hệ không được để trống (EF-7).';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại không được để trống (EF-7).';
    }

    const leadTime = Number(formData.committedLeadTimeDays);
    if (isNaN(leadTime) || leadTime < 1 || !Number.isInteger(leadTime)) {
      newErrors.committedLeadTimeDays =
        'Thời gian giao cam kết phải là số nguyên dương từ 1 ngày trở lên (BR-22).';
    }

    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Địa chỉ email không đúng định dạng.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (isEdit && supplier) {
        await onSubmitUpdate(supplier.id, {
          supplierName: formData.supplierName.trim(),
          contactPerson: formData.contactPerson.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          committedLeadTimeDays: Number(formData.committedLeadTimeDays),
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
        });
      } else {
        await onSubmitCreate({
          supplierCode: formData.supplierCode.trim().toUpperCase(),
          supplierName: formData.supplierName.trim(),
          contactPerson: formData.contactPerson.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          committedLeadTimeDays: Number(formData.committedLeadTimeDays),
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
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
          <Building2 className="w-5 h-5 text-blue-600" />
          <span>
            {isEdit
              ? `Chỉnh Sửa Hồ Sơ NCC: ${supplier?.supplierCode}`
              : 'Thêm Mới Nhà Cung Cấp'}
          </span>
        </div>
      }
      subtitle={
        isEdit
          ? 'Cập nhật thông tin đối tác và thời gian giao cam kết tiêu chuẩn (Mã NCC bất biến).'
          : 'Hồ sơ nhà cung cấp mới sẽ được khởi tạo với trạng thái Active và điểm khởi tạo 80% (BR-24).'
      }
      size="lg"
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
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>{isEdit ? 'Lưu Thay Đổi' : 'Tạo Nhà Cung Cấp'}</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Banner lưu ý BR-21 */}
        {isEdit && (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý BR-21:</strong> Mã nhà cung cấp ({supplier?.supplierCode}) là định danh bất biến, không thể chỉnh sửa để bảo toàn lịch sử đơn hàng.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mã NCC */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã Nhà Cung Cấp <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.supplierCode}
              disabled={isEdit}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  supplierCode: e.target.value.toUpperCase(),
                }))
              }
              placeholder="VD: VINAMILK, TH-TRUE, MASAN"
              className={`w-full px-3 py-2 text-xs font-mono rounded-lg border transition-all ${
                isEdit
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  : 'bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden'
              } ${errors.supplierCode ? 'border-rose-500 bg-rose-50/30' : ''}`}
            />
            {errors.supplierCode && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.supplierCode}</p>
            )}
            {!isEdit && (
              <p className="text-[10px] text-slate-400 mt-1">
                Chỉ gồm chữ cái, chữ số, gạch ngang (-) hoặc gạch dưới (_).
              </p>
            )}
          </div>

          {/* Lead Time cam kết */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thời Gian Giao Cam Kết (Ngày) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                step="1"
                value={formData.committedLeadTimeDays}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    committedLeadTimeDays: parseInt(e.target.value, 10) || 1,
                  }))
                }
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden transition-all ${
                  errors.committedLeadTimeDays ? 'border-rose-500 bg-rose-50/30' : ''
                }`}
              />
            </div>
            {errors.committedLeadTimeDays && (
              <p className="text-[11px] text-rose-500 mt-1">
                {errors.committedLeadTimeDays}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              Lead Time tiêu chuẩn tính bằng ngày, số nguyên ≥ 1.
            </p>
          </div>
        </div>

        {/* Tên NCC */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tên Nhà Cung Cấp / Doanh Nghiệp <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.supplierName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, supplierName: e.target.value }))
            }
            placeholder="VD: Công ty Cổ phần Sữa Việt Nam (Vinamilk)"
            className={`w-full px-3 py-2 text-xs rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden transition-all ${
              errors.supplierName ? 'border-rose-500 bg-rose-50/30' : ''
            }`}
          />
          {errors.supplierName && (
            <p className="text-[11px] text-rose-500 mt-1">{errors.supplierName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Người liên hệ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Người Đại Diện Liên Hệ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, contactPerson: e.target.value }))
                }
                placeholder="VD: Nguyễn Văn A"
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden transition-all ${
                  errors.contactPerson ? 'border-rose-500 bg-rose-50/30' : ''
                }`}
              />
            </div>
            {errors.contactPerson && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.contactPerson}</p>
            )}
          </div>

          {/* SĐT */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Số Điện Thoại Liên Lạc <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                placeholder="VD: 0901234567"
                className={`w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden transition-all ${
                  errors.phoneNumber ? 'border-rose-500 bg-rose-50/30' : ''
                }`}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.phoneNumber}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Giao Dịch (Tùy chọn)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="VD: sales@vinamilk.com.vn"
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden transition-all ${
                  errors.email ? 'border-rose-500 bg-rose-50/30' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Địa chỉ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Địa Chỉ Kho / Văn Phòng (Tùy chọn)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="VD: Quận 7, TP. Hồ Chí Minh"
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-white border-slate-200 focus:border-blue-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
