export type ProductStatus = 'Active' | 'Inactive';

export interface ProductCategorySummary {
  id: string;
  categoryCode: string;
  categoryName: string;
}

export interface Category {
  id: string;
  categoryCode: string;
  categoryName: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  skuCode: string;
  productName: string;
  barcode: string | null;
  unit: string;
  status: ProductStatus | string;
  currentInventory: number;
  onOrderQuantity: number;
  categoryId: string;
  category: ProductCategorySummary;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  page: number;
  limit: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface ProductListResponse {
  items: Product[];
  pagination: PaginationMeta;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: 'Active' | 'Inactive' | 'All';
}

export interface CreateProductDto {
  skuCode: string;
  productName: string;
  categoryId: string | number;
  unit: string;
  barcode?: string | null;
}

export interface UpdateProductDto {
  productName?: string;
  categoryId?: string | number;
  unit?: string;
  barcode?: string | null;
}

export interface UpdateProductStatusDto {
  status: 'Active' | 'Inactive';
}

export interface DeleteProductResponse {
  message: string;
  deletedSkuCode: string;
}

export const COMMON_UNITS = [
  'Hộp',
  'Chai',
  'Lon',
  'Gói',
  'Kg',
  'Thùng',
  'Túi',
  'Cái',
  'Bịch',
] as const;
