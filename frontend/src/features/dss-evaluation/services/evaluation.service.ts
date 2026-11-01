import { apiClient } from '../../../services/api/axios.client';
import type { ApiResponse } from '../../../types/auth';
import type {
  DssSessionEvaluationResponse,
  DssSessionSummaryItem,
} from '../types';

export const evaluationService = {
  /**
   * Lấy danh sách toàn bộ các phiên đề xuất DSS để lựa chọn trong dropdown
   * GET /api/v1/dss/sessions
   */
  async getAllSessions(): Promise<DssSessionSummaryItem[]> {
    const response = await apiClient.get<ApiResponse<DssSessionSummaryItem[]> | DssSessionSummaryItem[]>(
      '/dss/sessions'
    );
    const raw = response.data;
    if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray(raw.data)) {
      return raw.data;
    }
    return Array.isArray(raw) ? raw : [];
  },

  /**
   * Lấy chi tiết kết quả đối soát độ chính xác của phiên DSS
   * GET /api/v1/dss/sessions/:id/evaluation
   */
  async getSessionEvaluation(
    sessionId: number | string
  ): Promise<DssSessionEvaluationResponse> {
    const response = await apiClient.get<ApiResponse<DssSessionEvaluationResponse>>(
      `/dss/sessions/${sessionId}/evaluation`
    );
    return response.data?.data;
  },
};

