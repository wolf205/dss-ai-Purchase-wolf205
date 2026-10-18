import React from 'react';
import { ClipboardList, CheckCircle2, FileText, Download } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              Purchase Orders (UC-02)
            </div>
            <h3 className="text-lg font-bold text-slate-900">Quản Lý Đơn Mua Hàng (PO)</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Theo dõi danh sách đơn mua được sinh từ phiên phê duyệt DSS, kiểm soát trạng thái giao hàng, 
              cảnh báo đơn quá hạn (isOverdue) và xuất hóa đơn PDF/Excel.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hạ tầng sẵn sàng cho 7B.3
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <FileText className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Chi Tiết Đơn Hàng & Snapshot Bất Biến</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Bảo toàn lịch sử đơn giá, MOQ và thời gian giao hàng (Lead Time) tại thời điểm duyệt.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Download className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Xuất File & Hủy Đơn An Toàn</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Hỗ trợ xuất PDF/Excel gửi NCC; hủy đơn kèm lý do và hoàn trả số lượng đang đặt (on_order).
          </p>
        </div>
      </div>
    </div>
  );
};
