import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import {
  Building2,
  Award,
  Layers,
  History,
  Clock,
  Phone,
  Mail,
  MapPin,
  User,
  Plus,
  Edit2,
  Power,
  Package,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import type { Supplier, SupplyCondition } from '../types';
import {
  useSupplyConditions,
  useSupplierPurchaseOrders,
} from '../hooks/useSuppliers';

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  isManager: boolean;
  onOpenAssignSku: () => void;
  onOpenEditCondition: (condition: SupplyCondition) => void;
  onOpenToggleCondition: (condition: SupplyCondition) => void;
  onOpenEditSupplier: () => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplier,
  isManager,
  onOpenAssignSku,
  onOpenEditCondition,
  onOpenToggleCondition,
  onOpenEditSupplier,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'conditions' | 'history'>('profile');

  // Queries
  const {
    data: conditions = [],
    isLoading: isLoadingConditions,
  } = useSupplyConditions(supplier?.id);

  const {
    data: orders = [],
    isLoading: isLoadingOrders,
  } = useSupplierPurchaseOrders(supplier?.id);

  if (!supplier) return null;

  const isColdStart = supplier.completedOrderCount < 3;
  const recent5Score = Math.round(supplier.performanceScore * 100);
  const allTimeScore = Math.round(supplier.allTimePerformanceScore * 100);

  const approvedOrdersCount = orders.filter((o) => o.status === 'Approved').length;
  const completedOrdersCount = orders.filter((o) => o.status === 'Completed').length;
  const overdueOrdersCount = orders.filter((o) => o.isOverdue).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <div className="flex items-center gap-2">
            <span>{supplier.supplierName}</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {supplier.supplierCode}
            </span>
            <SupplierStatusBadge status={supplier.status} size="sm" />
          </div>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Lead Time: <strong>{supplier.committedLeadTimeDays} ngày</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-slate-400" />
            SKU cung ứng: <strong>{conditions.length} mặt hàng</strong>
          </span>
        </div>
      }
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {isManager && (
              <button
                type="button"
                onClick={onOpenEditSupplier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Hồ Sơ & Hiệu Suất</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('conditions')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'conditions'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Điều Kiện Cung Ứng ({conditions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Lịch Sử Đơn Hàng ({orders.length})</span>
          </button>
        </div>

        {/* TAB 1: Hồ Sơ & Hiệu Suất */}
        {activeTab === 'profile' && (
          <div className="space-y-4 animate-toast-enter">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Điểm 5 Đơn Gần Nhất
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold text-slate-900">
                    {recent5Score}%
                  </span>
                  {isColdStart && (
                    <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1 rounded">
                      Cold Start
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dùng trong DSS BR-02
                </span>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Điểm Tích Lũy Toàn Bộ
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {allTimeScore}%
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Theo dõi quản trị
                </span>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Đơn Hàng Hoàn Tất
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {supplier.completedOrderCount}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Đã nhận hàng (UC-03)
                </span>
              </div>

              <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Lead Time Cam Kết
                </span>
                <div className="text-xl font-bold text-slate-900 mt-1">
                  {supplier.committedLeadTimeDays} <span className="text-xs font-normal">ngày</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Thời gian giao tiêu chuẩn
                </span>
              </div>
            </div>

            {/* Performance Details Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    Chi Tiết Hiệu Suất Giao Hàng (OTIF Engine)
                  </h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {supplier.performanceLabel}
                </span>
              </div>

              {isColdStart ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Cơ chế Đối tác mới ("Cold Start Supplier" - BR-24)
                  </div>
                  <p className="leading-relaxed">
                    Đối tác mới chưa hoàn tất đủ 3 đơn mua hàng ({supplier.completedOrderCount}/3 đơn).
                    Hệ thống gán mức điểm tín nhiệm ban đầu chuẩn là <strong>80% (mức Khá)</strong> cho tiêu chí Lịch sử giao hàng để có cơ hội cạnh tranh công bằng về Giá, Lead Time và MOQ.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Tỷ lệ giao đúng hạn 5 đơn:</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {supplier.recent5OrderOnTimeRate !== null
                          ? `${Math.round(supplier.recent5OrderOnTimeRate * 100)}%`
                          : '--'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${(supplier.recent5OrderOnTimeRate || 0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Tỷ lệ giao đủ hàng 5 đơn:</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {supplier.recent5OrderFulfillmentRate !== null
                          ? `${Math.round(supplier.recent5OrderFulfillmentRate * 100)}%`
                          : '--'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{
                          width: `${(supplier.recent5OrderFulfillmentRate || 0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">
                Thông Tin Liên Hệ & Định Danh
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Người đại diện:</span>
                    <span className="font-semibold text-slate-800">
                      {supplier.contactPerson || '--'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Số điện thoại:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {supplier.phoneNumber || '--'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Email giao dịch:</span>
                    <span className="font-semibold text-slate-800">
                      {supplier.email || '--'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 block text-[11px]">Địa chỉ kho/VP:</span>
                    <span className="font-semibold text-slate-800">
                      {supplier.address || '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Điều Kiện Cung Ứng */}
        {activeTab === 'conditions' && (
          <div className="space-y-3 animate-toast-enter">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Bảng Điều Kiện Mua Hàng Theo Từng SKU
                </h4>
                <p className="text-[11px] text-slate-500">
                  Đơn giá nhập và MOQ làm đầu vào cho thuật toán gợi ý mua hàng DSS (BR-22)
                </p>
              </div>

              {isManager && (
                <button
                  type="button"
                  onClick={onOpenAssignSku}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Gán SKU Mới</span>
                </button>
              )}
            </div>

            {isLoadingConditions ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải danh mục điều kiện cung ứng...
              </div>
            ) : conditions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Chưa có mặt hàng nào được gán cho nhà cung cấp này
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Bấm "Gán SKU Mới" để thiết lập đơn giá nhập và số lượng đặt tối thiểu.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Mã SKU</th>
                      <th className="py-2.5 px-3">Tên Sản Phẩm</th>
                      <th className="py-2.5 px-3">Ngành Hàng</th>
                      <th className="py-2.5 px-3 text-right">Đơn Giá Nhập</th>
                      <th className="py-2.5 px-3 text-center">MOQ</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                      {isManager && <th className="py-2.5 px-3 text-right">Thao Tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {conditions.map((c) => {
                      const isActive = c.status === 'Active';
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-slate-50/70 ${
                            !isActive ? 'bg-slate-50/50 text-slate-400' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {c.product?.skuCode}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-slate-800">
                              {c.product?.productName}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5">
                              ({c.product?.unit})
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {c.product?.categoryName}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            {c.purchasePrice.toLocaleString()} ₫
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {c.moq} {c.product?.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isActive ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Đang cung ứng
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Ngừng cung ứng
                              </span>
                            )}
                          </td>
                          {isManager && (
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onOpenEditCondition(c)}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  title="Sửa Đơn Giá & MOQ"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenToggleCondition(c)}
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    isActive
                                      ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                                      : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                                  }`}
                                  title={
                                    isActive
                                      ? 'Ngừng cung ứng SKU này'
                                      : 'Kích hoạt lại cung ứng SKU này'
                                  }
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Lịch Sử Đơn Hàng */}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-toast-enter">
            {/* Summary statistics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block">Đơn Đã Nhận</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {completedOrdersCount}
                </span>
              </div>
              <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-200 text-center">
                <span className="text-[10px] text-blue-700 block">Đơn Đang Chờ Giao</span>
                <span className="text-base font-bold text-blue-900 font-mono">
                  {approvedOrdersCount}
                </span>
              </div>
              <div className="bg-rose-50/50 p-2.5 rounded-lg border border-rose-200 text-center">
                <span className="text-[10px] text-rose-700 block">Đơn Quá Hạn</span>
                <span className="text-base font-bold text-rose-900 font-mono">
                  {overdueOrdersCount}
                </span>
              </div>
            </div>

            {isLoadingOrders ? (
              <div className="p-8 text-center text-xs text-slate-500">
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Đang tải lịch sử đơn mua hàng...
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Nhà cung cấp chưa phát sinh đơn mua hàng nào
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Các đơn PO duyệt từ DSS sẽ hiển thị và cập nhật OTIF tại đây.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Mã PO</th>
                      <th className="py-2.5 px-3">Ngày Đặt</th>
                      <th className="py-2.5 px-3">Hạn Giao Hàng</th>
                      <th className="py-2.5 px-3 text-center">Số Dòng</th>
                      <th className="py-2.5 px-3 text-right">Tổng Tiền</th>
                      <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((po) => {
                      const isCompleted = po.status === 'Completed';
                      const isCancelled = po.status === 'Cancelled';
                      const isApproved = po.status === 'Approved';

                      return (
                        <tr key={po.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {po.poNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {new Date(po.approvalDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <span className="font-mono">
                              {new Date(po.expectedDeliveryDate).toLocaleDateString('vi-VN')}
                            </span>
                            {po.isOverdue && (
                              <span className="ml-1.5 px-1 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                Quá hạn
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {po.totalLines}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            {po.totalAmount.toLocaleString()} ₫
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isCompleted && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Đã nhận hàng
                              </span>
                            )}
                            {isApproved && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                Chờ nhận hàng
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Đã hủy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
