import React from 'react';
import {
  Eye,
  Edit2,
  Power,
  Building2,
  Phone,
  Clock,
  Package,
  MapPin,
  Mail,
} from 'lucide-react';
import { SupplierStatusBadge } from './SupplierStatusBadge';
import { SupplierOtifBadge } from './SupplierOtifBadge';
import { Pagination } from '../../../components/ui/Pagination';
import type { Supplier, PaginationMeta } from '../types';

interface SupplierTableProps {
  suppliers: Supplier[];
  pagination: PaginationMeta;
  isLoading: boolean;
  isFiltered: boolean;
  isManager: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onResetFilters: () => void;
  onViewDetail: (supplier: Supplier) => void;
  onEditSupplier: (supplier: Supplier) => void;
  onToggleStatus: (supplier: Supplier) => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  suppliers,
  pagination,
  isLoading,
  isFiltered,
  isManager,
  onPageChange,
  onLimitChange,
  onResetFilters,
  onViewDetail,
  onEditSupplier,
  onToggleStatus,
}) => {
  const totalItems = Number(pagination?.totalItems) || 0;
  const currentPage = Number(pagination?.currentPage ?? pagination?.page ?? 1) || 1;
  const itemsPerPage = Number(pagination?.itemsPerPage ?? pagination?.limit ?? 20) || 20;
  const totalPages = Number(pagination?.totalPages) || 1;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách nhà cung cấp...</p>
        </div>
      </div>
    );
  }

  if (suppliers.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">
          {isFiltered
            ? 'Không tìm thấy nhà cung cấp phù hợp'
            : 'Chưa có nhà cung cấp nào trong hệ thống'}
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          {isFiltered
            ? 'Không có đối tác nào khớp với tiêu chí tìm kiếm hoặc bộ lọc trạng thái hiện tại. Hãy thử thay đổi từ khóa.'
            : 'Hệ thống chưa có nhà cung cấp nào. Bấm "Thêm Nhà Cung Cấp" để bắt đầu thiết lập hồ sơ đối tác.'}
        </p>
        {isFiltered && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold tracking-wider uppercase text-[11px]">
              <th className="py-3 px-4 min-w-[120px]">Mã NCC</th>
              <th className="py-3 px-4 min-w-[220px]">Nhà Cung Cấp</th>
              <th className="py-3 px-4 min-w-[160px]">Người Liên Hệ</th>
              <th className="py-3 px-4 min-w-[110px] text-center">Lead Time</th>
              <th className="py-3 px-4 min-w-[100px] text-center">SKU Active</th>
              <th className="py-3 px-4 min-w-[200px]">Điểm OTIF 5 Đơn</th>
              <th className="py-3 px-4 min-w-[120px] text-center">Trạng Thái</th>
              <th className="py-3 px-4 min-w-[120px] text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suppliers.map((supplier) => {
              const isActive = supplier.status === 'Active';

              return (
                <tr
                  key={supplier.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    !isActive ? 'bg-slate-50/40 text-slate-500' : ''
                  }`}
                >
                  {/* Mã NCC */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    <button
                      type="button"
                      onClick={() => onViewDetail(supplier)}
                      className="hover:text-blue-600 hover:underline cursor-pointer text-left"
                      title="Bấm để xem chi tiết điều kiện cung ứng và lịch sử đơn hàng"
                    >
                      {supplier.supplierCode}
                    </button>
                  </td>

                  {/* Tên NCC & thông tin phụ */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">
                      {supplier.supplierName}
                    </div>
                    {supplier.email && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate max-w-[200px]">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate max-w-[200px]">{supplier.address}</span>
                      </div>
                    )}
                  </td>

                  {/* Người liên hệ & SĐT */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-800">
                      {supplier.contactPerson || '--'}
                    </div>
                    {supplier.phoneNumber && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                        <span>{supplier.phoneNumber}</span>
                      </div>
                    )}
                  </td>

                  {/* Lead Time cam kết */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-semibold text-xs border border-slate-200">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {supplier.committedLeadTimeDays} ngày
                    </span>
                  </td>

                  {/* Số SKU Active */}
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Package className="w-3 h-3" />
                      {supplier.activeSkuCount}
                    </span>
                  </td>

                  {/* Điểm OTIF 5 đơn gần nhất */}
                  <td className="py-3.5 px-4">
                    <SupplierOtifBadge
                      performanceScore={supplier.performanceScore}
                      recent5OrderOnTimeRate={supplier.recent5OrderOnTimeRate}
                      recent5OrderFulfillmentRate={supplier.recent5OrderFulfillmentRate}
                      performanceLabel={supplier.performanceLabel}
                      completedOrderCount={supplier.completedOrderCount}
                    />
                  </td>

                  {/* Trạng Thái */}
                  <td className="py-3.5 px-4 text-center">
                    <SupplierStatusBadge status={supplier.status} />
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(supplier)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết & Điều kiện cung ứng"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Sửa thông tin (Manager) */}
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => onEditSupplier(supplier)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa hồ sơ nhà cung cấp"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Chuyển trạng thái Active / Inactive (Manager) */}
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(supplier)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isActive
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={
                            isActive
                              ? 'Ngừng hợp tác với nhà cung cấp'
                              : 'Kích hoạt lại nhà cung cấp'
                          }
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </div>
  );
};
