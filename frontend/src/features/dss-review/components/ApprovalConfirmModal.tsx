import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { CheckCircle2, ShoppingBag, ArrowRight, FileText, Calendar } from 'lucide-react';
import type { DssSession, GeneratedPurchaseOrder } from '../types';

export interface ApprovalConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: DssSession | null;
  onConfirmApprove: () => Promise<void>;
  isApproving: boolean;
  generatedOrders: GeneratedPurchaseOrder[] | null;
}

export const ApprovalConfirmModal: React.FC<ApprovalConfirmModalProps> = ({
  isOpen,
  onClose,
  session,
  onConfirmApprove,
  isApproving,
  generatedOrders,
}) => {
  const navigate = useNavigate();

  if (!session) return null;

  // Gom các mặt hàng có approvedQuantity > 0 theo Nhà cung cấp
  const activeItems = (session.items || []).filter(
    (it) => it.approvedQuantity > 0
  );

  const supplierGroups = activeItems.reduce<
    Record<
      number,
      {
        supplierId: number;
        supplierName: string;
        itemCount: number;
        totalAmount: number;
      }
    >
  >((acc, it) => {
    const sId = it.approvedSupplierId || it.suggestedSupplier?.id || 0;
    const sName =
      it.suggestedSupplier?.name ||
      it.supplierRankings?.find((r) => r.supplierId === sId)?.name ||
      `Nhà cung cấp #${sId}`;
    const price = it.suggestedSupplier?.unitPrice || 0;
    const lineAmount = it.approvedQuantity * price;

    if (!acc[sId]) {
      acc[sId] = {
        supplierId: sId,
        supplierName: sName,
        itemCount: 0,
        totalAmount: 0,
      };
    }
    acc[sId].itemCount += 1;
    acc[sId].totalAmount += lineAmount;
    return acc;
  }, {});

  const groupList = Object.values(supplierGroups);
  const totalApprovedCost = groupList.reduce(
    (sum, g) => sum + g.totalAmount,
    0
  );

  const isSuccess = !!generatedOrders && generatedOrders.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        isSuccess ? (
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Phê Duyệt Thành Công! Đã Sinh Đơn PO</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span>Xác Nhận Phê Duyệt Phương Án Mua Hàng</span>
          </div>
        )
      }
      subtitle={
        isSuccess
          ? `Hệ thống đã tự động gom nhóm và khởi tạo ${generatedOrders.length} Đơn mua hàng (Purchase Orders) ở trạng thái Approved.`
          : `Phiên đề xuất ${session.sessionCode} — Vui lòng kiểm tra lại phương án trước khi chốt đơn.`
      }
      footer={
        isSuccess ? (
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4 text-blue-400" />}
              onClick={() => {
                onClose();
                navigate('/orders');
              }}
            >
              Chuyển đến Danh sách Đơn PO
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2.5">
            <Button
              variant="outline"
              size="sm"
              disabled={isApproving}
              onClick={onClose}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="success"
              size="sm"
              isLoading={isApproving}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
              onClick={onConfirmApprove}
            >
              {isApproving ? 'Đang tạo đơn...' : 'Xác nhận Duyệt & Tạo Đơn'}
            </Button>
          </div>
        )
      }
    >
      {isSuccess ? (
        /* Success View: List of Generated POs */
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Danh sách đơn mua hàng mới phát sinh:
          </p>
          <div className="space-y-2">
            {generatedOrders.map((po) => (
              <div
                key={po.poId}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-emerald-950">
                        {po.poNumber}
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        — {po.supplierName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{po.totalLines} dòng hàng</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Giao dự kiến:{' '}
                        {po.expectedDeliveryDate
                          ? new Date(po.expectedDeliveryDate).toLocaleDateString(
                              'vi-VN'
                            )
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Tổng tiền</span>
                  <span className="font-bold text-sm text-emerald-700">
                    {Number(po.totalAmount).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Confirmation View */
        <div className="space-y-4">
          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">
                Số mặt hàng duyệt mua
              </p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {activeItems.length}{' '}
                <span className="text-xs font-normal text-slate-500">
                  / {session.items.length} SKU
                </span>
              </p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">
                Số đơn PO dự kiến
              </p>
              <p className="text-base font-bold text-blue-600 mt-0.5">
                {groupList.length} đơn
              </p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold text-[10px]">
                Tổng ngân sách duyệt
              </p>
              <p className="text-base font-bold text-emerald-700 mt-0.5">
                {totalApprovedCost.toLocaleString('vi-VN')} đ
              </p>
            </div>
          </div>

          {/* Breakdown by Supplier */}
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Phân bổ đơn theo Nhà cung cấp:
            </p>
            {groupList.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Toàn bộ mặt hàng đang có số lượng mua = 0. Vui lòng tăng số lượng ít nhất một SKU trước khi duyệt.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {groupList.map((g) => (
                  <div
                    key={g.supplierId}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {g.supplierName}
                      </p>
                      <p className="text-slate-400 text-[11px] mt-0.5">
                        {g.itemCount} sản phẩm
                      </p>
                    </div>
                    <div className="font-bold text-slate-900 font-mono">
                      {g.totalAmount.toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Sau khi duyệt, hệ thống sẽ tự động cập nhật hàng đang về (On-order quantity) cho các SKU tương ứng để loại trừ tính trùng lặp ở đợt phân tích tiếp theo.
          </p>
        </div>
      )}
    </Modal>
  );
};
