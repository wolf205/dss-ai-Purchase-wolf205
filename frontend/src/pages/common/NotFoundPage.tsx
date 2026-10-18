import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center mb-4">
        <FileQuestion className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">404 — Không Tìm Thấy Trang</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển trong hệ thống DSS.
      </p>
      <div className="mt-6">
        <button
          onClick={() => navigate('/dss')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Bảng Đề Xuất DSS</span>
        </button>
      </div>
    </div>
  );
};
