import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type {
  ImportType,
  SalesValidateResponse,
  InventoryValidateResponse,
} from '../types';

interface ImportPreviewTableProps {
  type: ImportType;
  salesData?: SalesValidateResponse | null;
  inventoryData?: InventoryValidateResponse | null;
  onConfirm: () => void;
  onReset: () => void;
  isConfirming: boolean;
}

export const ImportPreviewTable: React.FC<ImportPreviewTableProps> = ({
  type,
  salesData,
  inventoryData,
  onConfirm,
  onReset,
  isConfirming,
}) => {
  const isSales = type === 'sales';
  const totalRows = isSales ? salesData?.totalRows || 0 : inventoryData?.totalRows || 0;
  const duplicateDates = salesData?.duplicateDatesFound || [];
  const hasDuplicates = duplicateDates.length > 0;

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(val);
  };

  return (
    <div className="space-y-5 animate-toast-enter">
      {/* 1. Header Trạng thái Hợp lệ 100% */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-emerald-950">
                  Thẩm Định Đạt Tiêu Chuẩn 100% (All-or-Nothing)
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                  BR-14 PASSED
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Toàn bộ <strong>{totalRows} dòng</strong> trong tệp đều hợp lệ
                về cấu trúc, mã SKU, định dạng số học và thời gian.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 shadow-2xs">
              Tổng số dòng: {totalRows.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Cảnh báo ghi đè ngày trùng lặp (BR-15 Sales) */}
      {isSales && hasDuplicates && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <div>
                <h4 className="text-sm font-bold text-amber-950">
                  Cảnh Báo Trùng Lặp Ngày Bán Hàng — Cơ Chế Ghi Đè (BR-15)
                </h4>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  Hệ thống phát hiện{' '}
                  <strong>{duplicateDates.length} ngày</strong> trong tệp đã tồn
                  tại dữ liệu trong CSDL bán hàng. Khi bạn nhấn{' '}
                  <em>Xác nhận nạp</em>, hệ thống sẽ thực thi quy chế{' '}
                  <strong>xóa cũ ghi mới (Date Overwrite)</strong> trong một ACID
                  transaction duy nhất. Tuyệt đối không cộng dồn làm sai lệch mô
                  hình AI.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 mr-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Các ngày sẽ bị ghi đè:
                </span>
                {duplicateDates.map((dateStr) => (
                  <span
                    key={dateStr}
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs"
                  >
                    {dateStr}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Ghi chú bảo lưu On-Order Quantity (BR-16 Inventory) */}
      {!isSales && (
        <div className="bg-indigo-50/60 border border-indigo-200/90 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <p className="font-semibold">
                Quy tắc bảo lưu dữ liệu kiểm kê (BR-16):
              </p>
              <p className="text-indigo-800 leading-relaxed">
                • Cập nhật số lượng tồn kho trên kệ (`current_inventory`) cho{' '}
                <strong>{totalRows} SKU</strong> có mặt trong tệp.
                <br />
                • Bảo lưu nguyên vẹn 100% số lượng hàng đang về
                (`on_order_quantity`) từ các đơn PO Approved.
                <br />• Giữ nguyên mức tồn kho của các SKU vắng mặt (hỗ trợ kiểm
                kê luân phiên theo ngành hàng).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Bảng Xem Trước Dữ Liệu (Preview Table) */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bảng Xem Trước Dữ Liệu Thực Tế
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 italic">
            Hiển thị tối đa 10 dòng đầu tiên để đối soát trực quan
          </span>
        </div>

        <div className="overflow-x-auto">
          {isSales ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3">Ngày Giao Dịch</th>
                  <th className="px-4 py-3">Mã SKU</th>
                  <th className="px-4 py-3 text-right">Số Lượng Bán</th>
                  <th className="px-4 py-3 text-right">Doanh Thu Thuần</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesData?.previewRows.map((row, idx) => (
                  <tr key={`${row.date}-${row.skuCode}-${idx}`} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-700">
                      {row.date}
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-blue-700">
                      {row.skuCode}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-900">
                      {row.quantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3">Mã SKU</th>
                  <th className="px-4 py-3 text-right">Tồn Kho Đếm Kệ (Thực Tế)</th>
                  <th className="px-4 py-3 text-right">Tồn Hiện Hành (Hệ Thống)</th>
                  <th className="px-4 py-3 text-center">Độ Chênh Lệch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryData?.previewRows.map((row, idx) => {
                  const diff = row.difference ?? 0;
                  return (
                    <tr key={`${row.skuCode}-${idx}`} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">
                        {row.skuCode}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-slate-900">
                        {row.stockQuantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">
                        {row.currentInventory !== undefined
                          ? row.currentInventory.toLocaleString()
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {diff > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            +{diff.toLocaleString()} (Thừa)
                          </span>
                        ) : diff < 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {diff.toLocaleString()} (Thiếu)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            0 (Khớp)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. Khung Điều Khiển Phía Dưới */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          disabled={isConfirming}
          className="text-slate-600 hover:text-slate-900"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Hủy Bỏ / Chọn Tệp Khác (AF-2)
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={onConfirm}
          disabled={isConfirming}
          className={`${
            isSales && hasDuplicates
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          } text-white font-semibold shadow-xs`}
        >
          {isConfirming ? (
            'Đang thực thi ACID Transaction...'
          ) : (
            <>
              Xác Nhận Nạp Vào CSDL
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
