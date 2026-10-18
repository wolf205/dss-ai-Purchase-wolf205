import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  PackageCheck,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { PoSelector } from '../components/PoSelector';
import { ReceiptLineItemsTable } from '../components/ReceiptLineItemsTable';
import { ReceiptSummaryCard } from '../components/ReceiptSummaryCard';
import { ReceiptSuccessModal } from '../components/ReceiptSuccessModal';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  usePendingPurchaseOrders,
  useConfirmGoodsReceipt,
} from '../hooks/useReceipts';
import type {
  PendingPoSummary,
  LineReceiptState,
  GoodsReceiptResponse,
} from '../types';

interface ReceiptEditorProps {
  selectedPo: PendingPoSummary;
  onSuccess: (result: GoodsReceiptResponse) => void;
}

const ReceiptEditor: React.FC<ReceiptEditorProps> = ({
  selectedPo,
  onSuccess,
}) => {
  const confirmMutation = useConfirmGoodsReceipt();

  // Khởi tạo lines một lần khi component mount theo key={selectedPo.id}
  const [lines, setLines] = useState<LineReceiptState[]>(() => {
    return selectedPo.lineItems.map((item) => {
      const ordered = item.orderedQuantity;
      const received = item.orderedQuantity; // BR-11 Pre-fill: received = ordered
      const unitPrice = item.historicalUnitPrice;
      return {
        poLineItemId: Number(item.id),
        skuId: Number(item.productId),
        skuCode: item.skuCode,
        productName: item.productName,
        unit: item.unit,
        barcode: item.barcode,
        historicalUnitPrice: unitPrice,
        orderedQuantity: ordered,
        receivedQuantity: received,
        lineReceivedTotal: received * unitPrice,
        fulfillmentRate: 1.0,
        isOverDelivered: false,
        isUnderDelivered: false,
        isZero: false,
      };
    });
  });

  const [receiptDate, setReceiptDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [note, setNote] = useState<string>('');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Điều chỉnh số lượng thực nhận từng dòng
  const handleChangeQuantity = (poLineItemId: number, newQty: number) => {
    setLines((prevLines) =>
      prevLines.map((line) => {
        if (line.poLineItemId !== poLineItemId) return line;

        const ordered = line.orderedQuantity;
        const received = Math.max(0, newQty);
        const lineReceivedTotal = received * line.historicalUnitPrice;
        const fulfillmentRate =
          ordered > 0 ? Math.min(1.0, received / ordered) : 1.0;

        return {
          ...line,
          receivedQuantity: received,
          lineReceivedTotal,
          fulfillmentRate,
          isOverDelivered: received > ordered,
          isUnderDelivered: received < ordered && received > 0,
          isZero: received === 0,
        };
      })
    );
  };

  // Khôi phục tất cả về số lượng đặt ban đầu
  const handleResetAllToOrdered = () => {
    setLines((prevLines) =>
      prevLines.map((line) => ({
        ...line,
        receivedQuantity: line.orderedQuantity,
        lineReceivedTotal: line.orderedQuantity * line.historicalUnitPrice,
        fulfillmentRate: 1.0,
        isOverDelivered: false,
        isUnderDelivered: false,
        isZero: false,
      }))
    );
  };

  // Mở modal xác nhận trước khi gọi transaction
  const handleOpenConfirmPreview = () => {
    setIsPreviewModalOpen(true);
  };

  // Xác nhận nhập kho chính thức
  const handleExecuteReceipt = async () => {
    try {
      const payload = {
        purchaseOrderId: Number(selectedPo.id),
        receiptDate,
        note: note.trim() || undefined,
        lines: lines.map((l) => ({
          poLineItemId: l.poLineItemId,
          skuId: l.skuId,
          receivedQuantity: l.receivedQuantity,
        })),
      };

      const result = await confirmMutation.mutateAsync(payload);
      setIsPreviewModalOpen(false);
      onSuccess(result);
    } catch {
      setIsPreviewModalOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Bảng nhập số lượng từng dòng */}
      <ReceiptLineItemsTable
        lines={lines}
        onChangeQuantity={handleChangeQuantity}
        onResetAllToOrdered={handleResetAllToOrdered}
        disabled={confirmMutation.isPending}
      />

      {/* Card Tóm Tắt & Tham Số Nhập Kho */}
      <ReceiptSummaryCard
        selectedPo={selectedPo}
        receiptDate={receiptDate}
        onReceiptDateChange={setReceiptDate}
        note={note}
        onNoteChange={setNote}
        lines={lines}
        onConfirmReceipt={handleOpenConfirmPreview}
        isSubmitting={confirmMutation.isPending}
      />

      {/* Modal Xem Trước / Xác Nhận Trước Khi Commit ACID */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        size="md"
        title="Xác Nhận Nhập Kho Hàng Hóa"
        subtitle={`Đơn mua hàng: ${selectedPo.poNumber} — Nhà cung cấp: ${selectedPo.supplierName}`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewModalOpen(false)}
              disabled={confirmMutation.isPending}
            >
              Quay lại kiểm tra
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleExecuteReceipt}
              isLoading={confirmMutation.isPending}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Đồng Ý Nhập Kho & Đóng Đơn PO
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs text-slate-700">
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Ngày nhận thực tế:</span>
              <span className="font-mono font-bold text-slate-900">{receiptDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tổng số mặt hàng (SKU):</span>
              <span className="font-bold text-slate-900">{lines.length} mặt hàng</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tổng số lượng thực nhận:</span>
              <span className="font-mono font-bold text-slate-900">
                {lines.reduce((a, b) => a + b.receivedQuantity, 0)} sản phẩm
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200/60 pt-2">
              <span className="text-slate-500 font-semibold">Tổng giá trị thực nhận:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatCurrency(
                  lines.reduce((a, b) => a + b.lineReceivedTotal, 0)
                )}
              </span>
            </div>
          </div>

          {note ? (
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 text-amber-950">
              <span className="font-bold block mb-0.5">Ghi chú kèm theo:</span>
              <p className="italic">{note}</p>
            </div>
          ) : null}

          <div className="text-[11px] text-slate-500 leading-relaxed bg-blue-50/50 p-2.5 rounded-lg border border-blue-200/60 flex items-start gap-1.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Thao tác này sẽ thực thi trong một <strong>ACID Transaction</strong>: Cập nhật tăng tồn kho khả dụng,
              giải phóng lượng hàng chờ về, đóng đơn PO thành <strong className="text-slate-900">Completed</strong> và cập nhật điểm phong độ NCC. Hành động này không thể hoàn tác.
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export const ReceiptsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPoId = searchParams.get('poId');

  // Queries
  const {
    data: pendingPosData,
    isLoading: isPendingLoading,
    refetch: refetchPendingPos,
  } = usePendingPurchaseOrders();

  const pendingPos = useMemo(
    () => pendingPosData?.items || [],
    [pendingPosData?.items]
  );

  // Quản lý PO được chọn: ưu tiên người dùng bấm chọn -> query param -> PO đầu tiên
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);

  const activePoId = selectedPoId ?? urlPoId ?? (pendingPos[0]?.id ?? null);
  const selectedPo = useMemo(
    () => pendingPos.find((po) => po.id === activePoId) || pendingPos[0] || null,
    [pendingPos, activePoId]
  );

  // Success modal state
  const [lastConfirmedReceipt, setLastConfirmedReceipt] =
    useState<GoodsReceiptResponse | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Cập nhật khi chọn PO từ selector
  const handleSelectPo = (po: PendingPoSummary) => {
    setSelectedPoId(po.id);
    setSearchParams({ poId: po.id }, { replace: true });
  };

  // Xử lý khi xác nhận nhập kho thành công
  const handleReceiptSuccess = (result: GoodsReceiptResponse) => {
    setLastConfirmedReceipt(result);
    setIsSuccessModalOpen(true);
  };

  // Nhận đơn tiếp theo
  const handleReceiveAnother = () => {
    setIsSuccessModalOpen(false);
    setLastConfirmedReceipt(null);
    setSelectedPoId(null);
    setSearchParams({}, { replace: true });
    refetchPendingPos();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
            Goods Receipt & OTIF Closed-Loop (UC-03)
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Ghi Nhận Nhập Kho & Đánh Giá Giao Hàng
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Tiếp nhận hàng hóa thực tế từ Đơn mua hàng Approved. Hệ thống tự động tăng tồn kho khả dụng,
            tất toán lượng hàng chờ về (on-order) và cập nhật điểm phong độ OTIF của Nhà cung cấp (BR-11, BR-12, BR-13, BR-24).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/orders">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4 text-slate-500" />}
            >
              Xem Danh Sách PO
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetchPendingPos()}
            leftIcon={<RotateCcw className="w-4 h-4 text-slate-500" />}
            title="Làm mới danh sách PO chờ tiếp nhận"
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* 1. Selector chọn Đơn Mua Hàng Approved */}
      <PoSelector
        pendingPos={pendingPos}
        selectedPo={selectedPo}
        onSelectPo={handleSelectPo}
        isLoading={isPendingLoading}
      />

      {/* 2. Chi tiết Tiếp Nhận Khi Có PO Được Chọn (Keyed by selectedPo.id) */}
      {selectedPo && (
        <ReceiptEditor
          key={selectedPo.id}
          selectedPo={selectedPo}
          onSuccess={handleReceiptSuccess}
        />
      )}

      {/* Modal Hiển Thị Kết Quả Tiếp Nhận Kho Thành Công */}
      <ReceiptSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        receiptData={lastConfirmedReceipt}
        onReceiveAnother={handleReceiveAnother}
      />
    </div>
  );
};
