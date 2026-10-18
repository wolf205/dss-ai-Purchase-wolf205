import React from 'react';
import { TrendingUp, Layers, CheckCircle2 } from 'lucide-react';

export const DssPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Core DSS Engine (UC-01)
            </div>
            <h3 className="text-lg font-bold text-slate-900">Bảng Đề Xuất DSS & Dự Báo Nhu Cầu</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Hệ thống tổng hợp dự báo nhu cầu bán hàng, tính toán lượng tồn an toàn (SS), điểm đặt hàng lại (ROP), 
              đề xuất số lượng đặt mua tối ưu (SOQ) và xếp hạng nhà cung cấp theo thuật toán WSM.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hạ tầng sẵn sàng cho 7B.2
          </span>
        </div>
      </div>

      {/* Feature Plan Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Phân Loại ABC-XYZ</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Phân hạng giá trị doanh thu tích lũy (A/B/C) và mức độ biến động nhu cầu (X/Y/Z).
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Biểu Đồ Dự Báo Recharts</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Dữ liệu bán thực tế quá khứ kết hợp 14 ngày dự báo tương lai kèm dải tin cậy CI 95%.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Giải Trình Quyết Định (LLM)</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Kích hoạt On-demand Gemini Flash giải thích lý do đề xuất mà không chặn luồng tính toán cốt lõi.
          </p>
        </div>
      </div>
    </div>
  );
};
