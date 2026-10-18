export interface ForecastDailyItem {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface SkuSalesHistoryItem {
  date: string;
  quantity: number;
}

export interface SkuForecastInput {
  productId: bigint | number;
  history: SkuSalesHistoryItem[];
}

export interface SkuForecastResult {
  dailyAverage: number;
  dailyDemandStd: number;
  modelUsed: string;
  dailyForecasts: ForecastDailyItem[];
}

export interface AiServiceForecastResponse {
  results: {
    skuId: number;
    dailyAverage: number;
    dailyDemandStd: number;
    modelUsed: string;
    dailyForecasts: ForecastDailyItem[];
  }[];
}
