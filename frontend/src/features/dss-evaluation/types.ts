export interface DailyEvaluationItem {
  date: string;
  predicted: number;
  actual: number;
}

export interface SkuEvaluation {
  productId: string;
  skuCode: string;
  productName: string;
  categoryName: string;
  abcXyzGroup: string;
  wape: number;
  mape: number;
  mae: number;
  bias: number;
  totalPredicted: number;
  totalActual: number;
  qualityRating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING';
  dailyTimeline: DailyEvaluationItem[];
}

export interface OverallEvaluationSummary {
  overallWape: number;
  overallMape: number;
  overallMae: number;
  overallBias: number;
  totalPredicted: number;
  totalActual: number;
  qualityRating: 'EXCELLENT' | 'ACCEPTABLE' | 'NEEDS_TUNING';
  evaluatedDaysCount: number;
  totalDaysHorizon: number;
  dailyAggregateTimeline: DailyEvaluationItem[];
}

export interface EvaluationWindow {
  startDate: string;
  endDate: string;
  totalDays: number;
}

export interface DssSessionEvaluationResponse {
  sessionId: string;
  sessionCode: string;
  sessionStatus: string;
  approvedAt: string | null;
  hasActualData: boolean;
  message?: string;
  evaluationWindow: EvaluationWindow;
  summary: OverallEvaluationSummary | null;
  skuEvaluations: SkuEvaluation[];
}

export interface DssSessionSummaryItem {
  id: string;
  sessionCode: string;
  scope: string;
  status: string;
  totalSuggestedAmount: number;
  totalApprovedAmount: number;
  createdBy: string;
  approvedAt: string | null;
  createdAt: string;
}

