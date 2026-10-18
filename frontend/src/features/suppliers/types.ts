export type SupplierStatus = 'Active' | 'Inactive';

export interface Supplier {
  id: string;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  committedLeadTimeDays: number;
  status: SupplierStatus | string;
  performanceScore: number;
  allTimePerformanceScore: number;
  completedOrderCount: number;
  activeSkuCount: number;
  recent5OrderOnTimeRate: number | null;
  recent5OrderFulfillmentRate: number | null;
  performanceLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplyConditionProductSummary {
  id: string;
  skuCode: string;
  productName: string;
  barcode: string | null;
  unit: string;
  status: string;
  categoryName: string;
}

export interface SupplyCondition {
  id: string;
  supplierId: string;
  productId: string;
  purchasePrice: number;
  moq: number;
  status: 'Active' | 'Inactive' | string;
  product: SupplyConditionProductSummary;
  createdAt: string;
  updatedAt: string;
  isSoleSupplier?: boolean;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount?: number;
  page: number;
  limit: number;
  totalPages: number;
  currentPage?: number;
  itemsPerPage?: number;
}

export interface SupplierListResponse {
  items: Supplier[];
  pagination: PaginationMeta;
}

export interface SupplierFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'Active' | 'Inactive' | 'All';
}

export interface CreateSupplierDto {
  supplierCode: string;
  supplierName: string;
  contactPerson: string;
  phoneNumber: string;
  committedLeadTimeDays: number;
  email?: string | null;
  address?: string | null;
}

export interface UpdateSupplierDto {
  supplierName?: string;
  contactPerson?: string;
  phoneNumber?: string;
  committedLeadTimeDays?: number;
  email?: string | null;
  address?: string | null;
}

export interface UpdateSupplierStatusDto {
  status: 'Active' | 'Inactive';
}

export interface CreateSupplyConditionDto {
  productId: string | number;
  purchasePrice: number;
  moq?: number;
}

export interface UpdateSupplyConditionDto {
  purchasePrice?: number;
  moq?: number;
  status?: 'Active' | 'Inactive';
}
