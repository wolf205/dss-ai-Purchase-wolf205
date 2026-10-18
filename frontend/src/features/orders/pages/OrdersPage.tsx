import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ClipboardList, PlusCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { OrdersToolbar } from '../components/OrdersToolbar';
import { OrdersTable } from '../components/OrdersTable';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { CancelPoModal } from '../components/CancelPoModal';
import {
  usePurchaseOrders,
  useCancelPurchaseOrder,
  useExportPurchaseOrder,
  useSupplierOptions,
} from '../hooks/useOrders';
import type {
  PurchaseOrderFilters,
  PurchaseOrderSummary,
  PurchaseOrderDetail,
} from '../types';

export const OrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo bộ lọc từ search params nếu có
  const [filters, setFilters] = useState<PurchaseOrderFilters>(() => {
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 20;
    const status = searchParams.get('status') || 'all';
    const supplierId = searchParams.get('supplierId') || 'all';
    const isOverdueParam = searchParams.get('isOverdue');
    const isOverdue =
      isOverdueParam === 'true' ? true : isOverdueParam === 'false' ? false : 'all';
    const search = searchParams.get('search') || '';

    return {
      page,
      limit,
      status,
      supplierId,
      isOverdue,
      search,
    };
  });

  // Modal states
  const [detailPoId, setDetailPoId] = useState<string | null>(() => {
    return searchParams.get('orderId') || null;
  });
  const [cancelPoTarget, setCancelPoTarget] = useState<{
    id: string;
    poNumber: string;
    supplierName: string;
    totalAmount: number;
  } | null>(null);

  // Queries
  const { data: supplierOptions = [] } = useSupplierOptions();
  const {
    data: ordersData,
    isLoading,
    isFetching,
  } = usePurchaseOrders(filters);

  // Mutations
  const cancelMutation = useCancelPurchaseOrder();
  const exportMutation = useExportPurchaseOrder();

  const orders = useMemo(() => ordersData?.items || [], [ordersData?.items]);
  const pagination = useMemo(
    () =>
      ordersData?.pagination || {
        totalItems: 0,
        itemCount: 0,
        itemsPerPage: filters.limit || 20,
        totalPages: 1,
        currentPage: filters.page || 1,
      },
    [ordersData?.pagination, filters.limit, filters.page]
  );

  // Đồng bộ filter lên URL search parameters
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.page && filters.page > 1) params.page = String(filters.page);
    if (filters.limit && filters.limit !== 20) params.limit = String(filters.limit);
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.supplierId && filters.supplierId !== 'all') {
      params.supplierId = filters.supplierId;
    }
    if (filters.isOverdue !== undefined && filters.isOverdue !== 'all') {
      params.isOverdue = String(filters.isOverdue);
    }
    if (filters.search && filters.search.trim()) params.search = filters.search.trim();
    if (detailPoId) params.orderId = detailPoId;

    setSearchParams(params, { replace: true });
  }, [filters, detailPoId, setSearchParams]);

  // Thống kê nhanh
  const approvedCount = useMemo(() => {
    return orders.filter((o) => o.status === 'Approved').length;
  }, [orders]);

  const overdueCount = useMemo(() => {
    return orders.filter((o) => o.isOverdue).length;
  }, [orders]);

  // Filter handlers
  const handleFilterChange = (newFilters: Partial<PurchaseOrderFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: 'all',
      supplierId: 'all',
      isOverdue: 'all',
      search: '',
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setFilters((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  // Action handlers
  const handleViewDetail = (order: PurchaseOrderSummary) => {
    setDetailPoId(order.id);
  };

  const handleCloseDetailModal = () => {
    setDetailPoId(null);
  };

  const handleOpenCancelModal = (
    order: PurchaseOrderSummary | PurchaseOrderDetail
  ) => {
    setCancelPoTarget({
      id: order.id,
      poNumber: order.poNumber,
      supplierName: order.supplierName,
      totalAmount: order.totalAmount,
    });
  };

  const handleCloseCancelModal = () => {
    setCancelPoTarget(null);
  };

  const handleConfirmCancel = async (cancellationReason: string) => {
    if (!cancelPoTarget) return;

    await cancelMutation.mutateAsync({
      id: cancelPoTarget.id,
      cancellationReason,
    });

    handleCloseCancelModal();
  };

  const handleExportOrder = async (
    orderId: string,
    format: 'pdf' | 'excel'
  ) => {
    await exportMutation.mutateAsync({ id: orderId, format });
  };

  const isFiltered =
    Boolean(filters.search?.trim()) ||
    (filters.status && filters.status !== 'all') ||
    (filters.supplierId && filters.supplierId !== 'all') ||
    (filters.isOverdue !== undefined && filters.isOverdue !== 'all');

  return (
    <div className="space-y-6">
      {/* Header Giới Thiệu Chức Năng */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
              <span>Purchase Order Execution & Tracking (UC-02)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản Lý Đơn Mua Hàng
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Theo dõi toàn bộ đơn mua hàng sinh tự động từ phiên phê duyệt DSS, kiểm soát tiến độ giao hàng,
              cảnh báo đơn quá hạn (BR-09), xuất chứng từ gửi đối tác và hủy đơn hoàn trả tồn kho đang về (BR-07).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/dss">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<PlusCircle className="w-4 h-4 text-slate-600" />}
                rightIcon={<ArrowRight className="w-3.5 h-3.5 text-slate-400" />}
              >
                Tạo Đơn Từ DSS
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <OrdersToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        supplierOptions={supplierOptions}
        totalOrdersCount={pagination.totalItems}
        approvedCount={approvedCount}
        overdueCount={overdueCount}
        isLoading={isLoading || isFetching}
      />

      {/* Table & Pagination */}
      <OrdersTable
        orders={orders}
        pagination={pagination}
        isLoading={isLoading}
        isFiltered={isFiltered}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onResetFilters={handleResetFilters}
        onViewDetail={handleViewDetail}
        onCancelOrder={handleOpenCancelModal}
        onExportOrder={handleExportOrder}
        isExportingPoId={exportMutation.isPending ? exportMutation.variables?.id : null}
      />

      {/* Modal Chi Tiết Đơn Hàng (UC-02 Bước 5) */}
      <OrderDetailModal
        isOpen={Boolean(detailPoId)}
        onClose={handleCloseDetailModal}
        orderId={detailPoId}
        onCancelPo={handleOpenCancelModal}
        onExportPo={handleExportOrder}
        isExporting={exportMutation.isPending}
      />

      {/* Modal Hủy Đơn Hàng (UC-02 Luồng rẽ nhánh AF-1) */}
      <CancelPoModal
        key={cancelPoTarget?.id || 'none'}
        isOpen={Boolean(cancelPoTarget)}
        onClose={handleCloseCancelModal}
        order={cancelPoTarget}
        onConfirmCancel={handleConfirmCancel}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
};
