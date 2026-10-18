/**
 * Types & Interfaces cho DSS Configuration (UC-07)
 * Tuân thủ BR-25, BR-26, BR-27, BR-28
 */

export interface DssConfiguration {
  id: number;
  priceWeight: number;
  leadTimeWeight: number;
  moqWeight: number;
  historyWeight: number;
  weightPrice: number;
  weightLeadTime: number;
  weightMoq: number;
  weightHistory: number;
  targetServiceLevel: number;
  zFactor: number;
  reviewPeriodDays: number;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateDssConfigurationDto {
  weightPrice: number;
  weightLeadTime: number;
  weightMoq: number;
  weightHistory: number;
  targetServiceLevel: number;
  reviewPeriodDays: number;
}

export interface ConfigurationFormData {
  weightPrice: number; // 0 - 100 (%)
  weightLeadTime: number; // 0 - 100 (%)
  weightMoq: number; // 0 - 100 (%)
  weightHistory: number; // 0 - 100 (%)
  targetServiceLevel: number; // 0.90 | 0.95 | 0.98 | 0.99
  reviewPeriodDays: number; // 1 - 30
}

export interface ServiceLevelOption {
  value: number;
  label: string;
  zFactor: number;
  riskPercentage: string;
  recommendedTag?: string;
  description: string;
}

export const SERVICE_LEVEL_OPTIONS: ServiceLevelOption[] = [
  {
    value: 0.9,
    label: '90%',
    zFactor: 1.28,
    riskPercentage: '10%',
    description: 'Tồn kho an toàn tinh giản, chấp nhận rủi ro đứt hàng 10%.',
  },
  {
    value: 0.95,
    label: '95%',
    zFactor: 1.65,
    riskPercentage: '5%',
    recommendedTag: 'Khuyến nghị chuẩn',
    description: 'Cân bằng tối ưu giữa chi phí lưu kho và rủi ro đứt hàng 5%.',
  },
  {
    value: 0.98,
    label: '98%',
    zFactor: 2.05,
    riskPercentage: '2%',
    description: 'Ưu tiên sẵn sàng hàng hóa cao, rủi ro đứt hàng chỉ 2%.',
  },
  {
    value: 0.99,
    label: '99%',
    zFactor: 2.33,
    riskPercentage: '1%',
    description: 'Mức bảo vệ tối đa cho mặt hàng thiết yếu, rủi ro đứt hàng 1%.',
  },
];

export interface WeightPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  weights: {
    price: number;
    leadTime: number;
    moq: number;
    history: number;
  };
}

export const WEIGHT_PRESETS: WeightPreset[] = [
  {
    id: 'baseline',
    name: 'Mặc Định Hệ Thống',
    badge: 'Baseline (BR-28)',
    description: 'Cân bằng tổng hòa 4 tiêu chí theo chuẩn mực DSS khuyến nghị.',
    weights: { price: 40, leadTime: 20, moq: 15, history: 25 },
  },
  {
    id: 'cost_priority',
    name: 'Ưu Tiên Chi Phí',
    badge: 'Tiết Kiệm',
    description: 'Tập trung tối đa vào đơn giá nhập thấp nhất để tối ưu biên lợi nhuận.',
    weights: { price: 60, leadTime: 15, moq: 10, history: 15 },
  },
  {
    id: 'fast_delivery',
    name: 'Giao Hàng Nhanh',
    badge: 'Tốc Độ',
    description: 'Ưu tiên nhà cung cấp có Lead Time ngắn nhất nhằm bù đắp nhu cầu khẩn cấp.',
    weights: { price: 25, leadTime: 45, moq: 10, history: 20 },
  },
  {
    id: 'reputation_priority',
    name: 'Ưu Tiên Uy Tín',
    badge: 'Đối Tác Tin Cậy',
    description: 'Tập trung vào hiệu suất giao đúng hẹn và đủ số lượng trong quá khứ (OTIF).',
    weights: { price: 20, leadTime: 20, moq: 10, history: 50 },
  },
];

export const DEFAULT_BASELINE_CONFIG: ConfigurationFormData = {
  weightPrice: 40,
  weightLeadTime: 20,
  weightMoq: 15,
  weightHistory: 25,
  targetServiceLevel: 0.95,
  reviewPeriodDays: 7,
};
