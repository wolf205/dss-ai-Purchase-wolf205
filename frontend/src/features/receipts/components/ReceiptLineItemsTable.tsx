import React from 'react';
import {
  AlertTriangle,
  Sparkles,
  RotateCcw,
  Minus,
  Plus,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { LineReceiptState } from '../types';

interface ReceiptLineItemsTableProps {
  lines: LineReceiptState[];
  onChangeQuantity: (poLineItemId: number, newQty: number) => void;
  onResetAllToOrdered: () => void;
  disabled?: boolean;
}

export const ReceiptLineItemsTable: React.FC<ReceiptLineItemsTableProps> = ({
  lines,
  onChangeQuantity,
  onResetAllToOrdered,
  disabled = false,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleInputChange = (poLineItemId: number, value: string) => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 0) {
      onChangeQuantity(poLineItemId, 0);
    } else {
      onChangeQuantity(poLineItemId, parsed);
    }
  };

  // Thống kê tổng
  const totalOrderedQty = lines.reduce((acc, l) => acc + l.orderedQuantity, 0);
  const totalReceivedQty = lines.reduce((acc, l) => acc + l.receivedQuantity, 0);
  const totalReceivedAmount = lines.reduce((acc, l) => acc + l.lineReceivedTotal, 0);

  const hasAnyOverDelivery = lines.some((l) => l.isOverDelivered);
  const hasAnyUnderDelivery = lines.some((l) => l.isUnderDelivered);
  const isAllZero = lines.length > 0 && lines.every((l) => l.receivedQuantity === 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
      {/* Table Header Bar */}
      <div className="bg-slate-50/90 px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            Danh Sách Mặt Hàng Tiếp Nhận Kho (BR-11)
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hệ thống đã tự động điền sẵn số lượng đặt ban đầu. Vui lòng kiểm đếm thực tế và điều chỉnh nếu có chênh lệch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={onResetAllToOrdered}
            disabled={disabled}
            leftIcon={<RotateCcw className="w-3 h-3 text-slate-500" />}
            title="Khôi phục lại số lượng thực nhận bằng đúng số lượng đặt hàng ban đầu"
          >
            Điền đủ tất cả ({totalOrderedQty})
          </Button>
        </div>
      </div>

      {/* Global Alerts if any special conditions */}
      {hasAnyOverDelivery && (
        <div className="px-5 py-2.5 bg-purple-50/70 border-b border-purple-200/80 text-xs text-purple-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Cảnh báo giao vượt (AF-2):</span> Đang có mặt hàng có số lượng thực nhận lớn hơn đơn đặt ban đầu.
            Toàn bộ số lượng thực tế sẽ được cộng vào tồn kho để phản ánh đúng thực tế kệ hàng, nhưng tỷ lệ hoàn thành (Fulfillment Rate) của đơn sẽ được khóa ở mức trần 100% theo BR-13.
            <span className="font-semibold text-purple-950"> Vui lòng nhập lý do giải trình vào phần ghi chú.</span>
          </div>
        </div>
      )}

      {hasAnyUnderDelivery && (
        <div className="px-5 py-2 bg-amber-50/70 border-b border-amber-200/80 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Lưu ý giao thiếu hàng (AF-1):</span> Đang có mặt hàng nhận ít hơn số lượng đặt.
            Khi chốt nhận hàng, đơn PO sẽ chuyển sang Completed và toàn bộ lượng chờ về (On-order) của đơn sẽ được tất toán để không bị treo số liệu (BR-12). Hệ thống DSS phiên sau sẽ tự tính đặt bù nếu cần.
          </div>
        </div>
      )}

      {isAllZero && (
        <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed font-medium">
            <span className="font-bold">Chặn xác nhận nhận hàng (EF-2):</span> Toàn bộ số lượng thực nhận của tất cả mặt hàng đang bằng 0.
            Nếu bạn từ chối nhận hàng do sai lỗi, vui lòng hủy thao tác và giữ đơn ở trạng thái Approved để NCC giao lại, hoặc sang phân hệ UC-02 để Hủy đơn.
          </div>
        </div>
      )}

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-12 text-center">STT</th>
              <th className="py-3 px-4">Mã SKU & Sản Phẩm</th>
              <th className="py-3 px-4 text-center">ĐVT</th>
              <th className="py-3 px-4 text-right">Đơn Giá Cam Kết</th>
              <th className="py-3 px-4 text-center">SL Đặt Mua</th>
              <th className="py-3 px-4 text-center w-52">SL Thực Nhận</th>
              <th className="py-3 px-4 text-right">Thành Tiền Nhận</th>
              <th className="py-3 px-4 text-center">Tỷ Lệ Đáp Ứng</th>
              <th className="py-3 px-4 text-center">Trạng Thái Dòng</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {lines.map((item, index) => {
              const diffQty = item.receivedQuantity - item.orderedQuantity;

              return (
                <tr
                  key={item.poLineItemId}
                  className={`transition-colors ${
                    item.isOverDelivered
                      ? 'bg-purple-50/20 hover:bg-purple-50/30'
                      : item.isUnderDelivered
                      ? 'bg-amber-50/15 hover:bg-amber-50/25'
                      : item.isZero
                      ? 'bg-rose-50/20 hover:bg-rose-50/30'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* STT */}
                  <td className="py-3 px-4 text-center text-slate-400 font-mono">
                    {index + 1}
                  </td>

                  {/* SKU & Tên sản phẩm */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {item.skuCode}
                      </span>
                      <span className="text-slate-800 line-clamp-1">
                        {item.productName}
                      </span>
                      {item.barcode && (
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Barcode: {item.barcode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* ĐVT */}
                  <td className="py-3 px-4 text-center text-slate-600">
                    {item.unit}
                  </td>

                  {/* Đơn giá cam kết snapshot */}
                  <td className="py-3 px-4 text-right font-mono text-slate-700">
                    {formatCurrency(item.historicalUnitPrice)}
                  </td>

                  {/* SL Đặt Mua */}
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 text-xs">
                    {item.orderedQuantity}
                  </td>

                  {/* SL Thực Nhận (Input & Quick Actions) */}
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Decrement */}
                      <button
                        type="button"
                        onClick={() =>
                          onChangeQuantity(
                            item.poLineItemId,
                            Math.max(0, item.receivedQuantity - 1)
                          )
                        }
                        disabled={disabled || item.receivedQuantity <= 0}
                        className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Giảm 1"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      {/* Input */}
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.receivedQuantity}
                        onChange={(e) =>
                          handleInputChange(item.poLineItemId, e.target.value)
                        }
                        disabled={disabled}
                        className={`w-20 px-2 py-1.5 text-center font-mono font-bold text-xs rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                          item.isOverDelivered
                            ? 'border-purple-400 bg-purple-50/50 text-purple-950 focus:ring-purple-400'
                            : item.isUnderDelivered
                            ? 'border-amber-400 bg-amber-50/50 text-amber-950 focus:ring-amber-400'
                            : item.isZero
                            ? 'border-rose-400 bg-rose-50/50 text-rose-950 focus:ring-rose-400'
                            : 'border-slate-300 bg-white text-slate-900 focus:ring-slate-900'
                        }`}
                      />

                      {/* Increment */}
                      <button
                        type="button"
                        onClick={() =>
                          onChangeQuantity(
                            item.poLineItemId,
                            item.receivedQuantity + 1
                          )
                        }
                        disabled={disabled}
                        className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Tăng 1"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Quick reset to ordered */}
                      <button
                        type="button"
                        onClick={() =>
                          onChangeQuantity(
                            item.poLineItemId,
                            item.orderedQuantity
                          )
                        }
                        disabled={disabled || item.receivedQuantity === item.orderedQuantity}
                        className="px-1.5 py-1 text-[10px] font-semibold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Khôi phục lại bằng số lượng đặt"
                      >
                        Đủ
                      </button>

                      {/* Quick set to 0 */}
                      <button
                        type="button"
                        onClick={() =>
                          onChangeQuantity(item.poLineItemId, 0)
                        }
                        disabled={disabled || item.receivedQuantity === 0}
                        className="px-1.5 py-1 text-[10px] font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Không nhận mặt hàng này (0)"
                      >
                        0
                      </button>
                    </div>
                  </td>

                  {/* Thành Tiền Nhận */}
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.lineReceivedTotal)}
                  </td>

                  {/* Tỷ Lệ Đáp Ứng */}
                  <td className="py-3 px-4 text-center font-mono">
                    <span
                      className={`font-semibold ${
                        item.fulfillmentRate >= 1.0
                          ? 'text-emerald-700'
                          : item.fulfillmentRate > 0
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {Math.round(item.fulfillmentRate * 100)}%
                    </span>
                  </td>

                  {/* Trạng Thái Dòng */}
                  <td className="py-3 px-4 text-center">
                    {item.isOverDelivered ? (
                      <Badge variant="purple" size="sm" dot>
                        Giao vượt (+{diffQty})
                      </Badge>
                    ) : item.isUnderDelivered ? (
                      <Badge variant="warning" size="sm" dot>
                        Thiếu ({diffQty})
                      </Badge>
                    ) : item.isZero ? (
                      <Badge variant="danger" size="sm" dot>
                        Không giao (0)
                      </Badge>
                    ) : (
                      <Badge variant="success" size="sm" dot>
                        Đủ 100%
                      </Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Footer Tổng Cộng */}
          <tfoot className="bg-slate-50/90 border-t-2 border-slate-200 font-bold text-slate-900">
            <tr>
              <td colSpan={4} className="py-3 px-4 text-right text-xs">
                Tổng Cộng Tiếp Nhận ({lines.length} SKU):
              </td>
              <td className="py-3 px-4 text-center font-mono text-slate-700">
                {totalOrderedQty}
              </td>
              <td className="py-3 px-4 text-center font-mono text-slate-900">
                <span
                  className={
                    totalReceivedQty > totalOrderedQty
                      ? 'text-purple-700'
                      : totalReceivedQty < totalOrderedQty
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }
                >
                  {totalReceivedQty}
                </span>
                {totalReceivedQty !== totalOrderedQty && (
                  <span className="text-[10px] text-slate-400 block font-normal">
                    (chênh {totalReceivedQty - totalOrderedQty > 0 ? '+' : ''}
                    {totalReceivedQty - totalOrderedQty})
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-right font-mono text-sm text-slate-900">
                {formatCurrency(totalReceivedAmount)}
              </td>
              <td colSpan={2} className="py-3 px-4 text-center text-xs text-slate-500 font-normal">
                {totalOrderedQty > 0 && (
                  <span>
                    Fulfillment Rate đơn:{' '}
                    <strong className="font-mono text-slate-900">
                      {Math.min(
                        100,
                        Math.round((totalReceivedQty / totalOrderedQty) * 100)
                      )}
                      %
                    </strong>
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
