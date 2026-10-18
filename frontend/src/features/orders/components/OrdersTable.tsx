import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  Download,
  XCircle,
  Truck,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { PoOverdueBadge } from './PoOverdueBadge';
import type { PurchaseOrderSummary, PaginationMeta } from '../types';

export interface OrdersTableProps {
  orders: PurchaseOrderSummary[];
  pagination: PaginationMeta;
  isLoading: boolean;
  isFiltered: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onResetFilters: () => void;
  onViewDetail: (order: PurchaseOrderSummary) => void;
  onCancelOrder: (order: PurchaseOrderSummary) => void;
  onExportOrder: (orderId: string, format: 'pdf' | 'excel') => void;
  isExportingPoId?: string | null;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  pagination,
  isLoading,
  isFiltered,
  onPageChange,
  onLimitChange,
  onResetFilters,
  onViewDetail,
  onCancelOrder,
  onExportOrder,
  isExportingPoId,
}) => {
  const navigate = useNavigate();
  const [activeExportDropdownId, setActiveExportDropdownId] = useState<
    string | null
  >(null);

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('vi-VN') + ' đ';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa xuất';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Trạng thái rỗng
  if (!isLoading && orders.length === 0) {
    if (isFiltered) {
      return (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-900">
            Không tìm thấy đơn hàng nào phù hợp
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Không có đơn mua hàng nào khớp với điều kiện tìm kiếm và bộ lọc hiện tại (EF-1).
          </p>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900">
          Chưa có đơn mua hàng nào trong hệ thống
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto leading-relaxed">
          Đơn mua hàng được tạo tự động khi bạn phê duyệt phương án mua hàng tại phân hệ DSS (UC-01). 
          Hãy tiến hành phân tích và phê duyệt đề xuất để phát sinh các đơn hàng đầu tiên.
        </p>
        <div className="mt-5">
          <Link to="/dss">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Chuyển đến Phê Duyệt Đề Xuất (DSS)
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Mã Đơn PO</th>
              <th className="py-3 px-4">Nhà Cung Cấp</th>
              <th className="py-3 px-4">Ngày Duyệt</th>
              <th className="py-3 px-4">Ngày Giao Dự Kiến</th>
              <th className="py-3 px-4 text-center">Số SKU</th>
              <th className="py-3 px-4 text-right">Tổng Tiền (VNĐ)</th>
              <th className="py-3 px-4 text-center">Trạng Thái & Cảnh Báo</th>
              <th className="py-3 px-4">Xuất Bản Gần Nhất</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-16"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-32 mb-1"></div>
                    <div className="h-3 bg-slate-100 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-4 bg-slate-200 rounded w-24 ml-auto"></div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-5 bg-slate-200 rounded-full w-24 mx-auto"></div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="h-8 bg-slate-200 rounded w-20 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : (
              orders.map((po) => {
                const isApproved = po.status === 'Approved';

                return (
                  <tr
                    key={po.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      po.isOverdue ? 'bg-rose-50/25' : ''
                    }`}
                  >
                    {/* Cột 1: Mã PO */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => onViewDetail(po)}
                          className="text-left font-bold text-slate-900 hover:text-blue-600 hover:underline transition-colors font-mono cursor-pointer"
                        >
                          {po.poNumber}
                        </button>
                        {po.sessionCode && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Từ DSS: {po.sessionCode}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Cột 2: Nhà Cung Cấp */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col max-w-[200px]">
                        <span className="font-semibold text-slate-900 truncate" title={po.supplierName}>
                          {po.supplierName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {po.supplierCode}
                        </span>
                      </div>
                    </td>

                    {/* Cột 3: Ngày Duyệt */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDate(po.approvalDate)}
                    </td>

                    {/* Cột 4: Ngày Giao Dự Kiến (BR-08) */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold ${
                            po.isOverdue ? 'text-rose-700 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {formatDate(po.expectedDeliveryDate)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Lead time: {po.historicalLeadTimeDays} ngày
                        </span>
                      </div>
                    </td>

                    {/* Cột 5: Số SKU */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                        {po.totalLines}
                      </span>
                    </td>

                    {/* Cột 6: Tổng Tiền */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(po.totalAmount)}
                    </td>

                    {/* Cột 7: Trạng Thái & Cảnh Báo Overdue */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <OrderStatusBadge status={po.status} />
                        <PoOverdueBadge isOverdue={po.isOverdue} />
                      </div>
                    </td>

                    {/* Cột 8: Xuất Bản Gần Nhất */}
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {po.lastExportedAt ? (
                        <div className="flex items-center gap-1 text-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{formatDateTime(po.lastExportedAt)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Chưa xuất</span>
                      )}
                    </td>

                    {/* Cột 9: Thao Tác */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 relative">
                        {/* Xem chi tiết */}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => onViewDetail(po)}
                          title="Xem chi tiết đơn mua hàng"
                          className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        {/* Nút Xuất File */}
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              setActiveExportDropdownId(
                                activeExportDropdownId === po.id ? null : po.id
                              )
                            }
                            disabled={isExportingPoId === po.id}
                            title="Xuất chứng từ PO"
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>

                          {/* Export Dropdown Menu */}
                          {activeExportDropdownId === po.id && (
                            <>
                              <div
                                className="fixed inset-0 z-20"
                                onClick={() => setActiveExportDropdownId(null)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-left">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveExportDropdownId(null);
                                    onExportOrder(po.id, 'pdf');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Bản in / PDF</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveExportDropdownId(null);
                                    onExportOrder(po.id, 'excel');
                                  }}
                                  className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Excel (CSV)</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Nhận hàng nhanh (AF-2 Shortcut) - Chỉ cho đơn Approved */}
                        {isApproved && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate(`/receipts?poId=${po.id}`)}
                            title="Chuyển nhanh sang Nhận hàng (UC-03 AF-2)"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* Hủy Đơn Hàng - Chỉ cho đơn Approved (BR-06) */}
                        {isApproved && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onCancelOrder(po)}
                            title="Hủy đơn mua hàng (AF-1)"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh Phân Trang */}
      <div className="py-3 px-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Hiển thị</span>
          <select
            value={pagination.itemsPerPage}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-slate-800 cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>
            đơn mỗi trang • Tổng cộng{' '}
            <strong className="text-slate-900 font-semibold">
              {pagination.totalItems}
            </strong>{' '}
            đơn
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-600">
            Trang <strong>{pagination.currentPage}</strong> /{' '}
            <strong>{pagination.totalPages || 1}</strong>
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              disabled={pagination.currentPage <= 1 || isLoading}
              onClick={() => onPageChange(pagination.currentPage - 1)}
              leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={
                pagination.currentPage >= pagination.totalPages || isLoading
              }
              onClick={() => onPageChange(pagination.currentPage + 1)}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
