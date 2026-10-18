import React from 'react';
import { Boxes, CheckCircle2, Package, Search } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <Boxes className="w-3.5 h-3.5" />
              Catalog Management (UC-05)
            </div>
            <h3 className="text-lg font-bold text-slate-900">Danh Mục Hàng Hóa & Tồn Kho Hiện Tại</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Quản lý danh sách sản phẩm SKU, ngành hàng, đơn vị tính, trạng thái Active/Inactive 
              và xem nhanh số lượng tồn kho thực tế cùng số lượng đang đặt mua.
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Hạ tầng sẵn sàng cho 7B.6
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Search className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Tìm Kiếm & Bộ Lọc Nâng Cao</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Lọc theo ngành hàng, tìm kiếm theo tên hoặc mã SKU cùng phân trang tiêu chuẩn.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
            <Package className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-semibold text-slate-900">Phân Quyền CRUD (Manager) & Read-only (Staff)</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Chỉ Quản lý được phép thêm mới/cập nhật thông tin; cấm Hard-delete bảo toàn tính toàn vẹn dữ liệu.
          </p>
        </div>
      </div>
    </div>
  );
};
