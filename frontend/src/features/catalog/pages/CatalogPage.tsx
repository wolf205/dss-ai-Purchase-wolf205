import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, PackageCheck } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import {
  useProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useUpdateProductStatus,
  useDeleteProduct,
} from '../hooks/useCatalog';
import { CatalogToolbar } from '../components/CatalogToolbar';
import { ProductTable } from '../components/ProductTable';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { ProductStatusConfirmModal } from '../components/ProductStatusConfirmModal';
import { ProductDeleteConfirmModal } from '../components/ProductDeleteConfirmModal';
import type {
  Product,
  ProductFilters,
  PaginationMeta,
  CreateProductDto,
  UpdateProductDto,
} from '../types';

export const CatalogPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = Boolean(user?.role === 'STORE_MANAGER');

  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo bộ lọc từ search params nếu có
  const [filters, setFilters] = useState<ProductFilters>(() => {
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || 'all';
    const statusParam = searchParams.get('status');
    const status =
      statusParam === 'Inactive' || statusParam === 'All'
        ? (statusParam as 'Inactive' | 'All')
        : 'Active';

    return {
      page,
      limit,
      search,
      categoryId,
      status,
    };
  });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [statusTargetProduct, setStatusTargetProduct] = useState<Product | null>(null);
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<Product | null>(null);

  // Queries
  const { data: categories = [] } = useCategories();
  const {
    data: productsData,
    isLoading,
    isFetching,
  } = useProducts(filters);

  // Mutations
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const updateStatusMutation = useUpdateProductStatus();
  const deleteMutation = useDeleteProduct();

  const products = useMemo(() => productsData?.items || [], [productsData?.items]);
  const pagination: PaginationMeta = useMemo(() => {
    const raw = productsData?.pagination;
    const page = Number(raw?.page ?? raw?.currentPage ?? filters.page ?? 1) || 1;
    const limit = Number(raw?.limit ?? raw?.itemsPerPage ?? filters.limit ?? 20) || 20;
    const totalItems = Number(raw?.totalItems ?? products.length) || 0;
    const totalPages = Number(raw?.totalPages ?? Math.ceil(totalItems / limit)) || 1;

    return {
      totalItems,
      itemCount: raw?.itemCount ?? products.length,
      page,
      limit,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
  }, [productsData?.pagination, filters.limit, filters.page, products.length]);

  // Đồng bộ filter lên URL search parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.page && filters.page > 1) params.page = String(filters.page);
    if (filters.limit && filters.limit !== 20) params.limit = String(filters.limit);
    if (filters.categoryId && filters.categoryId !== 'all') {
      params.categoryId = filters.categoryId;
    }
    if (filters.status && filters.status !== 'Active') {
      params.status = filters.status;
    }
    if (filters.search && filters.search.trim()) {
      params.search = filters.search.trim();
    }

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Thống kê nhanh trong trang hiện hành
  const activeCount = useMemo(() => {
    return products.filter((p) => p.status === 'Active').length;
  }, [products]);

  const inactiveCount = useMemo(() => {
    return products.filter((p) => p.status === 'Inactive').length;
  }, [products]);

  // Filter handlers
  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      categoryId: 'all',
      status: 'Active',
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Action handlers
  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  const handleCreateSubmit = async (payload: CreateProductDto | UpdateProductDto) => {
    await createMutation.mutateAsync(payload as CreateProductDto);
    setIsCreateOpen(false);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleCloseEdit = () => {
    setEditingProduct(null);
  };

  const handleEditSubmit = async (payload: CreateProductDto | UpdateProductDto) => {
    if (!editingProduct) return;
    await updateMutation.mutateAsync({
      id: editingProduct.id,
      payload: payload as UpdateProductDto,
    });
    setEditingProduct(null);
  };

  const handleOpenDetail = (product: Product) => {
    setDetailProduct(product);
  };

  const handleCloseDetail = () => {
    setDetailProduct(null);
  };

  const handleOpenToggleStatus = (product: Product) => {
    setStatusTargetProduct(product);
  };

  const handleCloseToggleStatus = () => {
    setStatusTargetProduct(null);
  };

  const handleConfirmToggleStatus = async (
    id: string,
    newStatus: 'Active' | 'Inactive'
  ) => {
    await updateStatusMutation.mutateAsync({ id, status: newStatus });
  };

  const handleOpenDelete = (product: Product) => {
    setDeleteTargetProduct(product);
  };

  const handleCloseDelete = () => {
    setDeleteTargetProduct(null);
  };

  const handleConfirmDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const isFiltered =
    Boolean(filters.search?.trim()) ||
    Boolean(filters.categoryId && filters.categoryId !== 'all') ||
    Boolean(filters.status && filters.status !== 'All');

  return (
    <div className="space-y-6">
      {/* Header Giới Thiệu Chức Năng (UC-05) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <Boxes className="w-3.5 h-3.5 text-slate-600" />
              <span>Catalog Management (UC-05)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản Lý Danh Mục Hàng Hóa & Tồn Kho
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Nguồn dữ liệu danh mục chuẩn duy nhất (Master Data) cho toàn bộ hệ thống DSS:
              theo dõi mã SKU bất biến (BR-17), kiểm soát số lượng tồn kệ và hàng đang về, quản lý ngành hàng và bảo vệ dữ liệu lịch sử với chính sách ngừng kinh doanh an toàn (BR-18).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                isManager
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              {isManager
                ? 'Vai trò: Store Manager (Toàn quyền CRUD)'
                : 'Vai trò: Purchasing Staff (Chỉ tra cứu Read-only)'}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <CatalogToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        categories={categories}
        isManager={isManager}
        onOpenCreateModal={handleOpenCreate}
        totalCount={pagination.totalItems}
        activeCount={activeCount}
        inactiveCount={inactiveCount}
        isLoading={isLoading || isFetching}
      />

      {/* Table & Pagination */}
      <ProductTable
        products={products}
        pagination={pagination}
        isLoading={isLoading}
        isFiltered={isFiltered}
        isManager={isManager}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onResetFilters={handleResetFilters}
        onViewDetail={handleOpenDetail}
        onEditProduct={handleOpenEdit}
        onToggleStatus={handleOpenToggleStatus}
        onDeleteProduct={handleOpenDelete}
      />

      {/* Modal Thêm Mới Sản Phẩm */}
      {isCreateOpen && (
        <ProductFormModal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          categories={categories}
          onSubmit={handleCreateSubmit}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Modal Chỉnh Sửa Sản Phẩm */}
      {editingProduct && (
        <ProductFormModal
          key={editingProduct.id}
          isOpen={Boolean(editingProduct)}
          onClose={handleCloseEdit}
          categories={categories}
          initialData={editingProduct}
          onSubmit={handleEditSubmit}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Modal Chi Tiết Sản Phẩm & Tồn Kho */}
      <ProductDetailModal
        isOpen={Boolean(detailProduct)}
        onClose={handleCloseDetail}
        product={detailProduct}
        isManager={isManager}
        onOpenEdit={handleOpenEdit}
      />

      {/* Modal Xác Nhận Đổi Trạng Thái Active <-> Inactive */}
      <ProductStatusConfirmModal
        key={statusTargetProduct?.id || 'none'}
        isOpen={Boolean(statusTargetProduct)}
        onClose={handleCloseToggleStatus}
        product={statusTargetProduct}
        onConfirm={handleConfirmToggleStatus}
        isLoading={updateStatusMutation.isPending}
      />

      {/* Modal Xác Nhận Xóa Vĩnh Viễn Zero-Link */}
      <ProductDeleteConfirmModal
        key={deleteTargetProduct?.id || 'none'}
        isOpen={Boolean(deleteTargetProduct)}
        onClose={handleCloseDelete}
        product={deleteTargetProduct}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
