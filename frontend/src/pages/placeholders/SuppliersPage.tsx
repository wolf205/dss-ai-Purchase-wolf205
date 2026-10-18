import React from 'react';
import { Building2, CheckCircle2, Award, BadgePercent } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <Building2 className="w-3.5 h-3.5" />
              Supplier Management (UC-06)
            </div>
            <h3 className="text-lg font-bold text-slate-900">Quản Lý Nhà Cung Cấp & Điều Kiện Cung Ứng</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Hồ sơ đối tác cung ứng, liên kết SKU kèm đơn giá và số lượng đặt tối thiểu (MOQ), 
              hiển thị huy hiệu điểm tín nhiệm giao hàng (OTIF) từ lịch sử 5 đơn gần nhất.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hạ tầng sẵn sàng cho 7B.7
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <BadgePercent className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Điều Kiện Cung Ứng (Supply Conditions)</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Thiết lập đơn giá nhập, MOQ và cam kết thời gian giao hàng (Lead Time) cho từng SKU.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Award className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Huy Hiệu Điểm OTIF 5 Đơn Gần Nhất</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Theo dõi tỷ lệ hoàn thành đơn và độ trễ giao hàng thực tế của từng đối tác cung cấp.
          </p>
        </div>
      </div>
    </div>
  );
};
