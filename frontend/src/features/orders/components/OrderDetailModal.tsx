import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  XCircle,
  Truck,
  Building2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { OrderStatusBadge } from './OrderStatusBadge';
import { PoOverdueBadge } from './PoOverdueBadge';
import { usePurchaseOrderDetail } from '../hooks/useOrders';
import type { PurchaseOrderDetail } from '../types';

export interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onCancelPo: (order: PurchaseOrderDetail) => void;
  onExportPo: (orderId: string, format: 'pdf' | 'excel') => void;
  isExporting?: boolean;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onCancelPo,
  onExportPo,
  isExporting = false,
}) => {
  const navigate = useNavigate();
  const { data: order, isLoading } = usePurchaseOrderDetail(orderId);

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

  if (!isOpen) return null;

  const isApproved = order?.status === 'Approved';
  const isCancelled = order?.status === 'Cancelled';
  const isCompleted = order?.status === 'Completed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono font-bold text-slate-900 text-base">
            {order?.poNumber || 'Chi tiết đơn mua hàng'}
          </span>
          {order && <OrderStatusBadge status={order.status} />}
          {order && <PoOverdueBadge isOverdue={order.isOverdue} />}
        </div>
      }
      subtitle={
        order?.sessionCode ? (
          <span>Bắt nguồn từ phiên phân tích DSS: <strong className="font-mono text-slate-800">{order.sessionCode}</strong></span>
        ) : undefined
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            {isApproved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/receipts?poId=${order.id}`);
                }}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                leftIcon={<Truck className="w-4 h-4 text-emerald-600" />}
              >
                Nhận hàng (UC-03)
              </Button>
            )}

            {isApproved && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (order) onCancelPo(order);
                }}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Hủy đơn hàng (AF-1)
              </Button>
            )}

            {(isCompleted || isCancelled) && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-md">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Đơn hàng đã đóng ({order?.status}) — Chỉ tra cứu và xuất chứng từ (BR-06)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {order && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={() => onExportPo(order.id, 'excel')}
                  leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
                >
                  Xuất Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isExporting}
                  onClick={() => onExportPo(order.id, 'pdf')}
                  leftIcon={<FileText className="w-4 h-4 text-rose-500" />}
                >
                  Xuất PDF
                </Button>
              </>
            )}
            <Button variant="secondary" size="sm" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      }
    >
      {isLoading || !order ? (
        <div className="p-8 text-center animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto"></div>
          <div className="h-32 bg-slate-100 rounded"></div>
          <div className="h-48 bg-slate-100 rounded"></div>
        </div>
      ) : (
        <div className="space-y-5 text-xs text-slate-600">
          {/* Cảnh báo đơn bị hủy nếu status = Cancelled */}
          {isCancelled && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Đơn Mua Hàng Đã Bị Hủy Bỏ (Cancelled)
              </div>
              <p className="text-xs">
                <strong>Lý do hủy đơn (BR-10):</strong>{' '}
                <span className="font-semibold">{order.cancellationReason || 'Không ghi nhận lý do'}</span>
              </p>
              {order.cancelledAt && (
                <p className="text-[11px] text-rose-700">
                  Thời điểm hủy: {formatDateTime(order.cancelledAt)}
                </p>
              )}
              <p className="text-[11px] text-rose-600 italic">
                * Toàn bộ số lượng đang đặt (on_order_quantity) đã được hoàn trả về tồn kho khả dụng theo BR-07.
              </p>
            </div>
          )}

          {/* Grid thông tin chung: Đối tác NCC & Tiến độ đơn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Nhà cung cấp */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-200">
                <Building2 className="w-4 h-4 text-blue-600" />
                Thông Tin Đối Tác Cung Ứng
              </div>
              <div className="space-y-1.5">
                <div>
                  <span className="text-slate-400 text-[11px]">Tên nhà cung cấp:</span>
                  <p className="font-bold text-slate-900 text-sm">{order.supplier.supplierName}</p>
                  <p className="font-mono text-[11px] text-slate-500">Mã NCC: {order.supplier.supplierCode}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" /> Người liên hệ
                    </span>
                    <p className="font-medium text-slate-800">
                      {order.supplier.contactPerson || 'Chưa cập nhật'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> Điện thoại
                    </span>
                    <p className="font-medium text-slate-800">
                      {order.supplier.phoneNumber || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" /> Email
                  </span>
                  <p className="font-medium text-slate-800">
                    {order.supplier.email || 'Chưa cập nhật'}
                  </p>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> Địa chỉ giao nhận
                  </span>
                  <p className="font-medium text-slate-800">
                    {order.supplier.address || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>
            </div>

            {/* Card Tiến độ & Thời gian */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs pb-1 border-b border-slate-200">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Tiến Độ & Kế Hoạch Giao Hàng
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Ngày phê duyệt đơn:</span>
                  <span className="font-semibold text-slate-900">{formatDate(order.approvalDate)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Lead time cam kết snapshot:</span>
                  <span className="font-semibold text-slate-900">{order.historicalLeadTimeDays} ngày</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Ngày giao hàng dự kiến (BR-08):</span>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        order.isOverdue ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {formatDate(order.expectedDeliveryDate)}
                    </span>
                    {order.isOverdue && (
                      <p className="text-[10px] text-rose-600 font-semibold flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3 h-3" /> Đã quá hạn giao (BR-09)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Xuất chứng từ gần nhất:</span>
                  <div className="flex items-center gap-1 font-medium text-slate-800">
                    {order.lastExportedAt ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{formatDateTime(order.lastExportedAt)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400 italic">Chưa xuất chứng từ</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Tổng giá trị đơn hàng:</span>
                  <span className="font-bold text-slate-900 text-sm font-mono">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng Mặt Hàng Đặt Mua (Snapshot BR-22) */}
          <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">
                Danh Sách Mặt Hàng Đặt Mua (Snapshot Giá & MOQ — BR-22)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {order.lineItems.length} mặt hàng SKU
              </span>
            </div>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 text-center">STT</th>
                    <th className="py-2.5 px-3">Mã SKU</th>
                    <th className="py-2.5 px-3">Tên Sản Phẩm</th>
                    <th className="py-2.5 px-3 text-center">ĐVT</th>
                    <th className="py-2.5 px-3 text-center">Số Lượng Đặt</th>
                    <th className="py-2.5 px-3 text-right">Đơn Giá Snapshot (VNĐ)</th>
                    <th className="py-2.5 px-3 text-center">MOQ Snapshot</th>
                    <th className="py-2.5 px-3 text-right">Thành Tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {order.lineItems.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {item.skuCode}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 line-clamp-1">
                            {item.productName}
                          </span>
                          {item.barcode && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              Barcode: {item.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {formatCurrency(item.historicalUnitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 font-mono">
                        {item.historicalMoq}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-bold text-slate-900">
                  <tr>
                    <td colSpan={4} className="py-2.5 px-3 text-right text-xs">
                      Tổng Cộng:
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      {order.lineItems.reduce((acc, item) => acc + item.quantity, 0)}
                    </td>
                    <td colSpan={2}></td>
                    <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
