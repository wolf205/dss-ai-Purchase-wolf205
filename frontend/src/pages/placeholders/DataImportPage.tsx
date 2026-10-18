import React from 'react';
import { Database, CheckCircle2, UploadCloud, AlertCircle } from 'lucide-react';

export const DataImportPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <Database className="w-3.5 h-3.5" />
              Data Import (UC-04)
            </div>
            <h3 className="text-lg font-bold text-slate-900">Nhập Dữ Liệu Bán Hàng & Tồn Kho</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Tải file mẫu, kéo thả tải lên dữ liệu doanh số và kiểm kê tồn kho theo cơ chế All-or-Nothing 
              đảm bảo tính toàn vẹn 100% trước khi lưu trữ vào cơ sở dữ liệu.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hạ tầng sẵn sàng cho 7B.5
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <UploadCloud className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Drag-and-Drop & Data Preview</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Hỗ trợ kéo thả CSV, xem trước dữ liệu và cảnh báo ngày trùng lặp (duplicateDates) trước khi ghi đè.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Chi Tiết Lỗi Từng Dòng (Row-level Errors)</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Chỉ rõ từng số dòng, mã SKU vi phạm ràng buộc giúp người dùng xử lý dữ liệu nhanh chóng.
          </p>
        </div>
      </div>
    </div>
  );
};
