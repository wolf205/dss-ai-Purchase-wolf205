import { apiClient } from '../../../services/api/axios.client';
import type { ApiResponse } from '../../../types/auth';
import type { DssConfiguration, UpdateDssConfigurationDto } from '../types';

export const configurationService = {
  /**
   * Lấy cấu hình Singleton DSS hiện hành (UC-07)
   * GET /api/v1/dss-configurations
   */
  async getConfiguration(): Promise<DssConfiguration> {
    const response = await apiClient.get<ApiResponse<DssConfiguration>>(
      '/dss-configurations',
    );
    return response.data?.data;
  },

  /**
   * Cập nhật tham số cấu hình DSS Singleton (STORE_MANAGER)
   * PUT /api/v1/dss-configurations
   */
  async updateConfiguration(
    dto: UpdateDssConfigurationDto,
  ): Promise<DssConfiguration> {
    const payload = {
      weightPrice: Number(dto.weightPrice),
      weightLeadTime: Number(dto.weightLeadTime),
      weightMoq: Number(dto.weightMoq),
      weightHistory: Number(dto.weightHistory),
      targetServiceLevel: Number(dto.targetServiceLevel),
      reviewPeriodDays: Math.round(Number(dto.reviewPeriodDays)),
    };

    const response = await apiClient.put<ApiResponse<DssConfiguration>>(
      '/dss-configurations',
      payload,
    );
    return response.data?.data;
  },

  /**
   * Khôi phục tham số cấu hình DSS về mặc định chuẩn mực hệ thống (STORE_MANAGER)
   * POST /api/v1/dss-configurations/reset
   */
  async resetToDefaults(): Promise<DssConfiguration> {
    const response = await apiClient.post<ApiResponse<DssConfiguration>>(
      '/dss-configurations/reset',
    );
    return response.data?.data;
  },
};
