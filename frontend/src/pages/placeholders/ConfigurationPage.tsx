import React from 'react';
import { Sliders, CheckCircle2, Scale, RefreshCw } from 'lucide-react';

export const ConfigurationPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white border border-slate-900 mb-2">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              DSS Configuration (UC-07)
            </div>
            <h3 className="text-lg font-bold text-slate-900">Cấu Hình Tham Số DSS & Trọng Số WSM</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Chỉ Quản Lý Cửa Hàng có quyền điều chỉnh: 4 thanh trượt trọng số WSM (Giá, Lead Time, MOQ, Lịch sử OTIF) 
              với ràng buộc tổng chính xác bằng 100%, Service Level mục tiêu (90/95/98/99%) và Chu kỳ xem xét (1-30 ngày).
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hạ tầng sẵn sàng cho 7B.8
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Scale className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">4 Sliders Trọng Số WSM</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Live validation tổng 4 trọng số = 1.0 (±0.001) trước khi cho phép lưu cấu hình (BR-02).
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Sliders className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Target Service Level & Review Period</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Chọn hệ số an toàn Z và chu kỳ đặt hàng định kỳ R phục vụ công thức ROP & SOQ.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <RefreshCw className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Khôi Phục Mặc Định (Reset)</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Đặt lại bộ tham số chuẩn khuyến nghị của chuyên gia chỉ với một cú nhấp chuột.
          </p>
        </div>
      </div>
    </div>
  );
};
