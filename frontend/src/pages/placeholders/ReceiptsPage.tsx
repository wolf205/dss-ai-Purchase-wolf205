import React from 'react';
import { PackageCheck, CheckCircle2, ShieldCheck, Award } from 'lucide-react';

export const ReceiptsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <PackageCheck className="w-3.5 h-3.5" />
              Goods Receipt & OTIF (UC-03)
            </div>
            <h3 className="text-lg font-bold text-slate-900">Nhập Kho & Đánh Giá Giao Hàng OTIF</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Quy trình ghi nhận nhận hàng thực tế từ nhà cung cấp, đóng đơn PO, tăng tồn kho khả dụng và tự động
              tính điểm OTIF (On-Time In-Full) vào cửa sổ 5 đơn gần nhất.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hạ tầng sẵn sàng cho 7B.4
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">ACID Transaction Nhập Kho</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Kiểm soát chặt chẽ số lượng nhận thực tế, cảnh báo mềm khi giao vượt và khóa đơn an toàn.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Vòng Lặp Phản Hồi OTIF (BR-13)</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Điểm giao hàng đúng hạn & đủ lượng lập tức phản ánh vào điểm tín nhiệm của thuật toán WSM phiên sau.
          </p>
        </div>
      </div>
    </div>
  );
};
