import { SupplierResponseDto } from '../dto/supplier-response.dto';
import { SupplyConditionResponseDto } from '../dto/supply-condition-response.dto';
import {
  SupplierWithRelations,
  SupplyConditionWithProduct,
} from '../interfaces/suppliers.interface';
import { calculateRecentOrderMetrics } from './supplier-scoring.helper';

/**
 * Chuyển đổi Prisma Supplier Entity sang SupplierResponseDto
 * và tính toán các chỉ số OTIF 5 đơn gần nhất + nhãn phong độ BR-24.
 */
export function mapToSupplierResponseDto(
  supplier: SupplierWithRelations,
): SupplierResponseDto {
  const activeSkuCount = supplier.supplyConditions
    ? supplier.supplyConditions.length
    : 0;

  const recentOrders = supplier.purchaseOrders || [];
  const {
    recent5OrderOnTimeRate,
    recent5OrderFulfillmentRate,
    performanceLabel,
  } = calculateRecentOrderMetrics(recentOrders, supplier.completedOrderCount);

  return {
    id: supplier.id.toString(),
    supplierCode: supplier.supplierCode,
    supplierName: supplier.supplierName,
    contactPerson: supplier.contactPerson,
    phoneNumber: supplier.phoneNumber,
    email: supplier.email,
    address: supplier.address,
    committedLeadTimeDays: supplier.committedLeadTimeDays,
    status: supplier.status,
    performanceScore: Number(supplier.performanceScore),
    allTimePerformanceScore: Number(supplier.allTimePerformanceScore),
    completedOrderCount: supplier.completedOrderCount,
    activeSkuCount,
    recent5OrderOnTimeRate,
    recent5OrderFulfillmentRate,
    performanceLabel,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}

/**
 * Chuyển đổi SupplyCondition entity sang SupplyConditionResponseDto.
 */
export function mapToSupplyConditionResponseDto(
  condition: SupplyConditionWithProduct,
): SupplyConditionResponseDto {
  return {
    id: condition.id.toString(),
    supplierId: condition.supplierId.toString(),
    productId: condition.productId.toString(),
    purchasePrice: Number(condition.purchasePrice),
    moq: condition.moq,
    status: condition.status,
    product: {
      id: condition.product.id.toString(),
      skuCode: condition.product.skuCode,
      productName: condition.product.productName,
      barcode: condition.product.barcode,
      unit: condition.product.unit,
      status: condition.product.status,
      categoryName:
        condition.product.category?.categoryName || 'Chưa phân loại',
    },
    createdAt: condition.createdAt.toISOString(),
    updatedAt: condition.updatedAt.toISOString(),
  };
}
