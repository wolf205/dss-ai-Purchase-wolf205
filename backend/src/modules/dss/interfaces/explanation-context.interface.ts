export interface RecommendationExplanationContext {
  skuCode: string;
  productName: string;
  categoryName: string;
  unit: string;
  abcXyzBadge: string;
  currentInventory: number;
  onOrderQuantity: number;
  reorderPoint: number;
  safetyStock: number;
  stockRiskStatus: string;
  suggestedQuantity: number;
  supplierName: string;
  purchasePrice: number;
  leadTimeDays: number;
  moq: number;
  wsmScore: number | null;
}
