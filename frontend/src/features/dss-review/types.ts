export type StockRiskStatus =
  | 'Critical'
  | 'Warning'
  | 'Safe'
  | 'Normal'
  | 'Overstock'
  | string;

export interface DailyForecast {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface SupplierRanking {
  supplierId: number;
  name: string;
  score: number;
  price: number;
  leadTime: number;
  moq?: number;
}

export interface SuggestedSupplier {
  id: number;
  code: string;
  name: string;
  leadTimeDays: number;
  moq: number;
  unitPrice: number;
  wsmScore: number | null;
}

export interface RecommendationItem {
  itemId: number;
  skuId: number;
  skuCode: string;
  skuName: string;
  categoryName: string;
  abcClassification: string;
  xyzClassification: string;
  abcXyzBadge: string;
  currentInventory: number;
  onOrderQuantity: number;
  reorderPoint: number;
  safetyStock: number;
  stockRiskStatus: StockRiskStatus;
  suggestedQuantity: number;
  approvedQuantity: number;
  suggestedSupplier: SuggestedSupplier | null;
  approvedSupplierId: number | null;
  dailyForecasts: DailyForecast[];
  supplierRankings: SupplierRanking[];
  isOverridden: boolean;
  llmExplanation: string | null;
}

export interface DssSession {
  sessionId: number;
  sessionCode: string;
  status: 'Draft' | 'Approved' | 'Discarded' | string;
  categoryId: number | null;
  scope: string;
  totalSuggestedAmount: number;
  totalApprovedAmount: number;
  createdAt: string;
  items: RecommendationItem[];
}

export interface Category {
  id: string;
  categoryCode: string;
  categoryName: string;
  description: string | null;
}

export interface AnalyzeSessionRequest {
  categoryId?: number | null;
}

export interface AnalyzeSessionResponse {
  sessionId: number;
  sessionCode: string;
  totalSkusAnalyzed: number;
  suggestedOrderCount: number;
  createdAt: string;
}

export interface GeneratedPurchaseOrder {
  poId: number;
  poNumber: string;
  supplierName: string;
  totalLines: number;
  totalAmount: number;
  expectedDeliveryDate: string;
}

export interface ApproveSessionResponse {
  sessionId: number;
  generatedPurchaseOrders: GeneratedPurchaseOrder[];
}

export interface UpdateRecommendationItemRequest {
  approvedQuantity?: number;
  approvedSupplierId?: number;
}

export interface ExplainRecommendationItemResponse {
  itemId: number;
  llmExplanation: string;
}

export interface DssFilterState {
  search: string;
  riskStatus: 'all' | 'Critical' | 'Warning' | 'Safe' | 'Normal' | 'Overstock';
  abcClass: 'all' | 'A' | 'B' | 'C';
  xyzClass: 'all' | 'X' | 'Y' | 'Z';
}
