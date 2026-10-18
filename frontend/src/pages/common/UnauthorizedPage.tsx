import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 tracking-tight">403 — Không Đủ Quyền Hạn</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">
        Chức năng này được bảo vệ nghiêm ngặt và chỉ khả dụng đối với tài khoản vai trò{' '}
        <span className="font-semibold text-slate-700">Quản Lý Cửa Hàng (STORE_MANAGER)</span>.
      </p>
      <div className="mt-6 flex gap-3">
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
