import React from 'react';
import {
  Calendar,
  FileText,
  AlertTriangle,
  Award,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { COMMON_RECEIPT_NOTES } from '../types';
import type { PendingPoSummary, LineReceiptState } from '../types';

interface ReceiptSummaryCardProps {
  selectedPo: PendingPoSummary;
  receiptDate: string;
  onReceiptDateChange: (date: string) => void;
  note: string;
  onNoteChange: (note: string) => void;
  lines: LineReceiptState[];
  onConfirmReceipt: () => void;
  isSubmitting?: boolean;
}

export const ReceiptSummaryCard: React.FC<ReceiptSummaryCardProps> = ({
  selectedPo,
  receiptDate,
  onReceiptDateChange,
  note,
  onNoteChange,
  lines,
  onConfirmReceipt,
  isSubmitting = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Tính toán thời gian & OTIF theo BR-13
  const todayStr = new Date().toISOString().split('T')[0];
  const isFutureDate = receiptDate > todayStr;
  const isBeforeApproval = receiptDate < selectedPo.approvalDate;
  const isDateInvalid = isFutureDate || isBeforeApproval;

  // Tính số ngày trễ
  const calcDaysLate = () => {
    try {
      const actual = new Date(receiptDate);
      const expected = new Date(selectedPo.expectedDeliveryDate);
      actual.setHours(0, 0, 0, 0);
      expected.setHours(0, 0, 0, 0);
      const diffMs = actual.getTime() - expected.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch {
      return 0;
    }
  };

  const daysLate = calcDaysLate();
  const isOnTime = daysLate === 0;

  // On-time factor (BR-13)
  const onTimeFactor = isOnTime
    ? 1.0
    : Math.max(0, parseFloat((1 - daysLate / 3).toFixed(4)));

  const onTimeScore50 = Math.round(onTimeFactor * 50);

  // Fulfillment rate (BR-13: cap 100%)
  const totalOrderedQty = lines.reduce((acc, l) => acc + l.orderedQuantity, 0);
  const totalReceivedQty = lines.reduce((acc, l) => acc + l.receivedQuantity, 0);
  const totalReceivedAmount = lines.reduce((acc, l) => acc + l.lineReceivedTotal, 0);

  const rawFulfillmentRate =
    totalOrderedQty > 0 ? (totalReceivedQty / totalOrderedQty) * 100 : 0;
  const cappedFulfillmentRate = Math.min(100, Math.round(rawFulfillmentRate));
  const fulfillmentScore50 = Math.round((cappedFulfillmentRate / 100) * 50);

  // Dự tính điểm Order Score (0 - 100)
  const estimatedOrderScore = onTimeScore50 + fulfillmentScore50;

  // Kiểm tra sai lệch số lượng -> bắt buộc có ghi chú
  const hasDiscrepancy = lines.some(
    (l) => l.receivedQuantity !== l.orderedQuantity
  );
  const isNoteMissing = hasDiscrepancy && (!note || note.trim().length === 0);

  // EF-2: Chặn khi 100% bằng 0
  const isAllZero = lines.length > 0 && lines.every((l) => l.receivedQuantity === 0);

  const canSubmit = !isSubmitting && !isDateInvalid && !isAllZero && !isNoteMissing;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cột 1 & 2: Ngày nhận hàng & Ghi chú tiếp nhận */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Thông Tin Tiếp Nhận Thực Tế
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Input Ngày nhận hàng thực tế */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ngày nhận hàng thực tế <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={receiptDate}
                  max={todayStr}
                  min={selectedPo.approvalDate}
                  onChange={(e) => onReceiptDateChange(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 font-mono ${
                    isDateInvalid
                      ? 'border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-rose-400'
                      : 'border-slate-300 bg-white text-slate-900 focus:ring-slate-900'
                  }`}
                />
              </div>

              {/* Thông báo hợp lệ / cảnh báo ngày */}
              {isFutureDate && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Ngày nhận không được vượt quá ngày hiện tại (EF-3).
                </p>
              )}
              {isBeforeApproval && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Ngày nhận không được trước ngày duyệt đơn ({formatDate(selectedPo.approvalDate)}).
                </p>
              )}
              {!isDateInvalid && (
                <p className="text-[10px] text-slate-400 mt-1">
                  Mặc định ngày hiện tại. Được phép chọn từ ngày duyệt đến hôm nay.
                </p>
              )}
            </div>

            {/* Thông tin đối chiếu tiến độ giao hàng */}
            <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Hạn giao cam kết:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatDate(selectedPo.expectedDeliveryDate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tiến độ giao hàng:</span>
                {isOnTime ? (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đúng hạn (50/50 điểm)
                  </Badge>
                ) : (
                  <Badge variant="danger" size="sm">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    Trễ {daysLate} ngày ({onTimeScore50}/50 điểm)
                  </Badge>
                )}
              </div>
              <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-200/60 leading-relaxed">
                Hệ số On-Time Factor: <strong className="text-slate-800 font-mono">{onTimeFactor.toFixed(2)}</strong>
                {daysLate > 0 && daysLate < 3 && ' (suy giảm theo BR-13)'}
                {daysLate >= 3 && ' (mất toàn bộ 50 điểm thời gian)'}
              </div>
            </div>
          </div>

          {/* Textarea Ghi chú tiếp nhận */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Ghi chú tiếp nhận kho
                {hasDiscrepancy && (
                  <span className="text-rose-500 text-xs font-bold" title="Bắt buộc nhập khi có chênh lệch số lượng">*</span>
                )}
              </label>
              {hasDiscrepancy && (
                <span className="text-[10px] font-semibold text-rose-600">
                  Bắt buộc nhập do có chênh lệch số lượng (AF-1 / AF-2)
                </span>
              )}
            </div>

            <textarea
              rows={3}
              maxLength={1000}
              placeholder={
                hasDiscrepancy
                  ? 'Vui lòng giải trình nguyên nhân chênh lệch số lượng (giao thừa, giao thiếu, hàng hỏng tại chỗ)...'
                  : 'Ghi chú kiểm đếm hàng hóa, tình trạng bao bì, xe giao hàng (không bắt buộc)...'
              }
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                isNoteMissing
                  ? 'border-rose-400 bg-rose-50/30 text-slate-900 focus:ring-rose-400 placeholder:text-rose-400'
                  : 'border-slate-300 bg-white text-slate-900 focus:ring-slate-900'
              }`}
            />

            {/* Quick Pick Gợi Ý Ghi Chú */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400">Gợi ý nhanh:</span>
              {COMMON_RECEIPT_NOTES.map((quickNote, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onNoteChange(quickNote)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {quickNote}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cột 3: Tóm Tắt Đánh Giá OTIF & Nút Xác Nhận Nhập Kho */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-600" />
            Đánh Giá Hiệu Suất Đơn Hàng (OTIF)
          </h4>

          {/* Điểm OTIF Dự Tính */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">
                Điểm Đơn Hàng Dự Tính (BR-24)
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {estimatedOrderScore}
                </span>
                <span className="text-xs text-slate-400">/ 100 điểm</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 text-[10px] block">Xếp loại</span>
              <span className="font-semibold text-emerald-300">
                {estimatedOrderScore >= 90
                  ? 'Xuất Sắc'
                  : estimatedOrderScore >= 75
                  ? 'Đạt Yêu Cầu'
                  : 'Cần Cải Thiện'}
              </span>
            </div>
          </div>

          {/* Thành phần tính điểm */}
          <div className="space-y-2 text-xs divide-y divide-slate-100">
            <div className="flex justify-between items-center pt-1.5">
              <span className="text-slate-500">1. Điểm đúng hạn (On-Time):</span>
              <span className="font-mono font-bold text-slate-900">
                {onTimeScore50} / 50 đ
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5">
              <span className="text-slate-500">2. Điểm đủ lượng (In-Full):</span>
              <span className="font-mono font-bold text-slate-900">
                {fulfillmentScore50} / 50 đ
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5">
              <span className="text-slate-500">Tỷ lệ giao đủ (Cap 100%):</span>
              <span className="font-mono font-bold text-emerald-700">
                {cappedFulfillmentRate}%
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5">
              <span className="text-slate-500">Tổng tiền thực nhận:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(totalReceivedAmount)}
              </span>
            </div>
          </div>

          {/* Nút Xác Nhận Nhận Hàng */}
          <div className="pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="success"
              size="lg"
              className="w-full justify-center"
              onClick={onConfirmReceipt}
              disabled={!canSubmit}
              isLoading={isSubmitting}
              leftIcon={<ShieldCheck className="w-5 h-5" />}
            >
              Xác Nhận Nhận Hàng (UC-03)
            </Button>

            {/* Validation helper messages */}
            {isAllZero && (
              <p className="text-[11px] text-rose-600 font-medium text-center mt-2">
                Không thể xác nhận khi số lượng thực nhận bằng 0 (EF-2).
              </p>
            )}
            {isNoteMissing && !isAllZero && (
              <p className="text-[11px] text-rose-600 font-medium text-center mt-2">
                Vui lòng nhập ghi chú lý do chênh lệch số lượng.
              </p>
            )}
            {isDateInvalid && (
              <p className="text-[11px] text-rose-600 font-medium text-center mt-2">
                Vui lòng chọn ngày nhận hàng hợp lệ.
              </p>
            )}
            {canSubmit && (
              <p className="text-[10px] text-slate-400 text-center mt-2">
                ACID Transaction: Tăng tồn kho, tất toán đơn PO và cập nhật phong độ NCC.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
