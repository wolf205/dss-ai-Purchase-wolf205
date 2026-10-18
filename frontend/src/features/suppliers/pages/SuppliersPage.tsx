import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  useSuppliers,
  useActiveProducts,
  useCreateSupplier,
  useUpdateSupplier,
  useUpdateSupplierStatus,
  useCreateSupplyCondition,
  useUpdateSupplyCondition,
} from '../hooks/useSuppliers';
import { SupplierToolbar } from '../components/SupplierToolbar';
import { SupplierTable } from '../components/SupplierTable';
import { SupplierFormModal } from '../components/SupplierFormModal';
import { SupplierStatusConfirmModal } from '../components/SupplierStatusConfirmModal';
import { SupplierDetailModal } from '../components/SupplierDetailModal';
import { SupplyConditionFormModal } from '../components/SupplyConditionFormModal';
import { StopSupplyConfirmModal } from '../components/StopSupplyConfirmModal';
import type {
  Supplier,
  SupplierFilters,
  PaginationMeta,
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplyCondition,
  CreateSupplyConditionDto,
  UpdateSupplyConditionDto,
} from '../types';

export const SuppliersPage: React.FC = () => {
  const { user } = useAuth();
  const isManager = Boolean(user?.role === 'STORE_MANAGER');

  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo bộ lọc từ search params nếu có
  const [filters, setFilters] = useState<SupplierFilters>(() => {
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
    const search = searchParams.get('search') || '';
    const statusParam = searchParams.get('status');
    const status =
      statusParam === 'Inactive' || statusParam === 'All'
        ? (statusParam as 'Inactive' | 'All')
        : 'Active';

    return {
      page,
      limit,
      search,
      status,
    };
  });

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [detailSupplierId, setDetailSupplierId] = useState<string | null>(null);
  const [statusTargetSupplier, setStatusTargetSupplier] = useState<Supplier | null>(null);

  // Condition modal states
  const [isAssignSkuOpen, setIsAssignSkuOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<SupplyCondition | null>(null);
  const [toggleTargetCondition, setToggleTargetCondition] = useState<SupplyCondition | null>(null);

  // Queries
  const { data: suppliersData, isLoading } = useSuppliers(filters);
  const { data: activeProducts = [] } = useActiveProducts();

  // Mutations
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const updateStatusMutation = useUpdateSupplierStatus();
  const createConditionMutation = useCreateSupplyCondition();
  const updateConditionMutation = useUpdateSupplyCondition();

  const suppliers = useMemo(() => suppliersData?.items || [], [suppliersData?.items]);
  const detailSupplier = useMemo(
    () => suppliers.find((s) => s.id === detailSupplierId) || null,
    [suppliers, detailSupplierId],
  );
  const pagination: PaginationMeta = useMemo(() => {
    const raw = suppliersData?.pagination;
    const page = Number(raw?.page ?? raw?.currentPage ?? filters.page ?? 1) || 1;
    const limit = Number(raw?.limit ?? raw?.itemsPerPage ?? filters.limit ?? 20) || 20;
    const totalItems = Number(raw?.totalItems ?? suppliers.length) || 0;
    const totalPages = Number(raw?.totalPages ?? Math.ceil(totalItems / limit)) || 1;

    return {
      totalItems,
      itemCount: raw?.itemCount ?? suppliers.length,
      page,
      limit,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    };
  }, [suppliersData?.pagination, filters.limit, filters.page, suppliers.length]);

  // Đồng bộ filter lên URL search parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.page && filters.page > 1) params.page = String(filters.page);
    if (filters.limit && filters.limit !== 20) params.limit = String(filters.limit);
    if (filters.status && filters.status !== 'Active') params.status = filters.status;
    if (filters.search && filters.search.trim().length > 0) params.search = filters.search.trim();

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleFilterChange = (newFilters: Partial<SupplierFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      search: '',
      status: 'Active',
    });
  };

  const isFiltered = Boolean(
    (filters.search && filters.search.trim().length > 0) ||
      (filters.status && filters.status !== 'Active'),
  );

  return (
    <div className="space-y-5 animate-toast-enter pb-12">
      {/* Toolbar lọc và hành động */}
      <SupplierToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        isManager={isManager}
        onOpenCreateModal={() => setIsCreateOpen(true)}
        totalSuppliers={pagination.totalItems}
      />

      {/* Bảng danh sách nhà cung cấp */}
      <SupplierTable
        suppliers={suppliers}
        pagination={pagination}
        isLoading={isLoading}
        isFiltered={isFiltered}
        isManager={isManager}
        onPageChange={(page) => handleFilterChange({ page })}
        onLimitChange={(limit) => handleFilterChange({ limit, page: 1 })}
        onResetFilters={handleResetFilters}
        onViewDetail={(supplier) => setDetailSupplierId(supplier.id)}
        onEditSupplier={(supplier) => setEditingSupplier(supplier)}
        onToggleStatus={(supplier) => setStatusTargetSupplier(supplier)}
      />

      {/* Modal Thêm Mới Nhà Cung Cấp */}
      {isCreateOpen && (
        <SupplierFormModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          supplier={null}
          onSubmitCreate={(dto: CreateSupplierDto) =>
            createMutation.mutateAsync(dto)
          }
          onSubmitUpdate={() => Promise.resolve()}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Modal Sửa Hồ Sơ Nhà Cung Cấp */}
      {editingSupplier && (
        <SupplierFormModal
          isOpen={Boolean(editingSupplier)}
          onClose={() => setEditingSupplier(null)}
          supplier={editingSupplier}
          onSubmitCreate={() => Promise.resolve()}
          onSubmitUpdate={(id: string, dto: UpdateSupplierDto) =>
            updateMutation.mutateAsync({ id, payload: dto })
          }
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Modal Xác Nhận Chuyển Trạng Thái (Active / Inactive) */}
      {statusTargetSupplier && (
        <SupplierStatusConfirmModal
          isOpen={Boolean(statusTargetSupplier)}
          onClose={() => setStatusTargetSupplier(null)}
          supplier={statusTargetSupplier}
          onConfirm={async (supplier, newStatus) => {
            await updateStatusMutation.mutateAsync({
              id: supplier.id,
              status: newStatus,
            });
          }}
          isLoading={updateStatusMutation.isPending}
        />
      )}

      {/* Modal Chi Tiết Toàn Diện NCC (Hồ Sơ, Supply Conditions, PO History) */}
      {detailSupplier && (
        <SupplierDetailModal
          isOpen={Boolean(detailSupplier)}
          onClose={() => setDetailSupplierId(null)}
          supplier={detailSupplier}
          isManager={isManager}
          onOpenAssignSku={() => setIsAssignSkuOpen(true)}
          onOpenEditCondition={(c) => setEditingCondition(c)}
          onOpenToggleCondition={(c) => setToggleTargetCondition(c)}
          onOpenEditSupplier={() => {
            setEditingSupplier(detailSupplier);
            setDetailSupplierId(null);
          }}
        />
      )}

      {/* Modal Gán SKU Mới Vào NCC */}
      {isAssignSkuOpen && detailSupplier && (
        <SupplyConditionFormModal
          isOpen={isAssignSkuOpen}
          onClose={() => setIsAssignSkuOpen(false)}
          supplierId={detailSupplier.id}
          condition={null}
          assignedProductIds={[]}
          activeProducts={activeProducts}
          onSubmitCreate={async (dto: CreateSupplyConditionDto) => {
            await createConditionMutation.mutateAsync({
              supplierId: detailSupplier.id,
              payload: dto,
            });
          }}
          onSubmitUpdate={() => Promise.resolve()}
          isLoading={createConditionMutation.isPending}
        />
      )}

      {/* Modal Sửa Điều Kiện Cung Ứng (Giá Nhập & MOQ) */}
      {editingCondition && detailSupplier && (
        <SupplyConditionFormModal
          isOpen={Boolean(editingCondition)}
          onClose={() => setEditingCondition(null)}
          supplierId={detailSupplier.id}
          condition={editingCondition}
          assignedProductIds={[]}
          activeProducts={activeProducts}
          onSubmitCreate={() => Promise.resolve()}
          onSubmitUpdate={async (conditionId: string, dto: UpdateSupplyConditionDto) => {
            await updateConditionMutation.mutateAsync({
              conditionId,
              supplierId: detailSupplier.id,
              payload: dto,
            });
          }}
          isLoading={updateConditionMutation.isPending}
        />
      )}

      {/* Modal Xác Nhận Ngừng / Kích Hoạt Lại Cung Ứng SKU */}
      {toggleTargetCondition && detailSupplier && (
        <StopSupplyConfirmModal
          isOpen={Boolean(toggleTargetCondition)}
          onClose={() => setToggleTargetCondition(null)}
          condition={toggleTargetCondition}
          supplierName={detailSupplier.supplierName}
          onConfirm={async (condition, newStatus) => {
            await updateConditionMutation.mutateAsync({
              conditionId: condition.id,
              supplierId: detailSupplier.id,
              payload: { status: newStatus },
            });
          }}
          isLoading={updateConditionMutation.isPending}
        />
      )}
    </div>
  );
};
