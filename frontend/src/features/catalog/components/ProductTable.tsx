import React from 'react';
import {
  Eye,
  Edit2,
  Trash2,
  Power,
  AlertTriangle,
  PackageX,
  Truck,
} from 'lucide-react';
import { ProductStatusBadge } from './ProductStatusBadge';
import { Pagination } from '../../../components/ui/Pagination';
import type { Product, PaginationMeta } from '../types';

interface ProductTableProps {
  products: Product[];
  pagination: PaginationMeta;
  isLoading: boolean;
  isFiltered: boolean;
  isManager: boolean;
  onPageChange: (newPage: number) => void;
  onLimitChange: (newLimit: number) => void;
  onResetFilters: () => void;
  onViewDetail: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onToggleStatus: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  pagination,
  isLoading,
  isFiltered,
  isManager,
  onPageChange,
  onLimitChange,
  onResetFilters,
  onViewDetail,
  onEditProduct,
  onToggleStatus,
  onDeleteProduct,
}) => {
  const totalItems = Number(pagination?.totalItems) || 0;
  const currentPage = Number(pagination?.currentPage ?? pagination?.page ?? 1) || 1;
  const itemsPerPage = Number(pagination?.itemsPerPage ?? pagination?.limit ?? 20) || 20;
  const totalPages = Number(pagination?.totalPages) || 1;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden">
        <div className="p-8 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh mục sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <PackageX className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">
          {isFiltered
            ? 'Không tìm thấy sản phẩm phù hợp'
            : 'Chưa có sản phẩm nào trong danh mục'}
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          {isFiltered
            ? 'Không có sản phẩm nào khớp với tiêu chí tìm kiếm hoặc bộ lọc ngành hàng hiện tại. Hãy thử thay đổi từ khóa hoặc đặt lại bộ lọc.'
            : 'Hệ thống chưa có sản phẩm nào. Hãy bấm "Thêm Sản Phẩm" để bắt đầu thiết lập danh mục hàng hóa.'}
        </p>
        {isFiltered && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onResetFilters}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden flex flex-col">
      {/* Container cuộn ngang bảng */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold tracking-wider uppercase text-[11px]">
              <th className="py-3 px-4 min-w-[130px]">Mã SKU</th>
              <th className="py-3 px-4 min-w-[220px]">Tên Sản Phẩm</th>
              <th className="py-3 px-4 min-w-[130px]">Ngành Hàng</th>
              <th className="py-3 px-4 min-w-[80px]">ĐVT</th>
              <th className="py-3 px-4 min-w-[120px] text-right">Tồn Trên Kệ</th>
              <th className="py-3 px-4 min-w-[120px] text-right">Hàng Đang Về</th>
              <th className="py-3 px-4 min-w-[130px] text-center">Trạng Thái</th>
              <th className="py-3 px-4 min-w-[130px] text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => {
              const isOutOfStock = product.currentInventory <= 0;
              const hasOnOrder = product.onOrderQuantity > 0;
              const isActive = product.status === 'Active';

              return (
                <tr
                  key={product.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Mã SKU */}
                  <td className="py-3 px-4 align-middle">
                    <button
                      type="button"
                      onClick={() => onViewDetail(product)}
                      className="font-mono font-bold text-slate-900 hover:text-blue-600 hover:underline transition-colors text-left cursor-pointer"
                      title="Xem chi tiết SKU"
                    >
                      {product.skuCode}
                    </button>
                  </td>

                  {/* Tên sản phẩm & Barcode */}
                  <td className="py-3 px-4 align-middle">
                    <div className="font-medium text-slate-900 line-clamp-1">
                      {product.productName}
                    </div>
                    {product.barcode ? (
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        Mã vạch: {product.barcode}
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400/80 mt-0.5 italic">
                        Không có mã vạch
                      </div>
                    )}
                  </td>

                  {/* Ngành hàng */}
                  <td className="py-3 px-4 align-middle">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {product.category?.categoryName || 'Chưa phân loại'}
                    </span>
                  </td>

                  {/* Đơn vị tính */}
                  <td className="py-3 px-4 align-middle text-slate-600 font-medium">
                    {product.unit}
                  </td>

                  {/* Tồn kho trên kệ (currentInventory) */}
                  <td className="py-3 px-4 align-middle text-right">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        0
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-900 text-sm">
                        {product.currentInventory.toLocaleString('vi-VN')}
                      </span>
                    )}
                  </td>

                  {/* Lượng hàng đang về (onOrderQuantity) */}
                  <td className="py-3 px-4 align-middle text-right">
                    {hasOnOrder ? (
                      <span className="inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        <Truck className="w-3 h-3" />
                        +{product.onOrderQuantity.toLocaleString('vi-VN')}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>

                  {/* Trạng thái kinh doanh */}
                  <td className="py-3 px-4 align-middle text-center">
                    <ProductStatusBadge status={product.status} size="sm" />
                  </td>

                  {/* Cột Thao tác */}
                  <td className="py-3 px-4 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => onViewDetail(product)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Xem chi tiết"
                        aria-label="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Các thao tác dành riêng cho Quản lý */}
                      {isManager && (
                        <>
                          {/* Chỉnh sửa */}
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Chỉnh sửa thông tin"
                            aria-label="Chỉnh sửa sản phẩm"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Đổi trạng thái Active <-> Inactive */}
                          <button
                            type="button"
                            onClick={() => onToggleStatus(product)}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              isActive
                                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={
                              isActive
                                ? 'Chuyển sang Ngừng kinh doanh (Inactive)'
                                : 'Kích hoạt lại kinh doanh (Active)'
                            }
                            aria-label="Đổi trạng thái"
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Xóa vĩnh viễn (Zero-Link) */}
                          <button
                            type="button"
                            onClick={() => onDeleteProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Xóa sản phẩm (chỉ khi chưa có liên kết lịch sử)"
                            aria-label="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Thanh Phân Trang Tái Sử Dụng */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
        unitName="mặt hàng"
        isLoading={isLoading}
      />
    </div>
  );
};
