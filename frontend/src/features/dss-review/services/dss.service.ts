import { apiClient } from '../../../services/api/axios.client';
import type { ApiResponse } from '../../../types/auth';
import type {
  DssSession,
  Category,
  AnalyzeSessionRequest,
  AnalyzeSessionResponse,
  ApproveSessionResponse,
  UpdateRecommendationItemRequest,
  RecommendationItem,
  ExplainRecommendationItemResponse,
} from '../types';

export const dssService = {
  /**
   * Lấy danh mục ngành hàng cho bộ lọc phạm vi
   * GET /api/v1/categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/categories');
    // Note: CategoriesController returns CategoryResponseDto[] directly or wrapped
    const raw = response.data as unknown as ApiResponse<Category[]> | Category[];
    if ('data' in raw && Array.isArray(raw.data)) {
      return raw.data;
    }
    return Array.isArray(raw) ? raw : [];
  },

  /**
   * Kích hoạt chuỗi phân tích DSS mới
   * POST /api/v1/dss/sessions/analyze
   */
  async analyzeSession(
    payload?: AnalyzeSessionRequest
  ): Promise<AnalyzeSessionResponse> {
    const response = await apiClient.post<ApiResponse<AnalyzeSessionResponse>>(
      '/dss/sessions/analyze',
      payload?.categoryId ? { categoryId: Number(payload.categoryId) } : {}
    );
    return response.data?.data;
  },

  /**
   * Lấy phiên đề xuất DSS trạng thái Draft gần nhất (nếu có)
   * GET /api/v1/dss/sessions/active/draft
   */
  async getActiveDraftSession(): Promise<DssSession | null> {
    try {
      const response = await apiClient.get<ApiResponse<DssSession | null>>(
        '/dss/sessions/active/draft'
      );
      return response.data?.data ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Lấy chi tiết phiên phân tích và danh sách mặt hàng đề xuất
   * GET /api/v1/dss/sessions/:id
   */
  async getSessionById(sessionId: number): Promise<DssSession> {
    const response = await apiClient.get<ApiResponse<DssSession>>(
      `/dss/sessions/${sessionId}`
    );
    return response.data?.data;
  },

  /**
   * Điều chỉnh số lượng hoặc nhà cung cấp duyệt mua (Human Adjustment)
   * PATCH /api/v1/dss/items/:itemId
   */
  async updateItem(
    itemId: number,
    payload: UpdateRecommendationItemRequest
  ): Promise<RecommendationItem> {
    const response = await apiClient.patch<ApiResponse<RecommendationItem>>(
      `/dss/items/${itemId}`,
      payload
    );
    return response.data?.data;
  },

  /**
   * Yêu cầu AI Gemini Flash giải thích lý do mua hàng (On-demand)
   * POST /api/v1/dss/items/:itemId/explain
   */
  async explainItem(itemId: number): Promise<ExplainRecommendationItemResponse> {
    const response = await apiClient.post<
      ApiResponse<ExplainRecommendationItemResponse>
    >(`/dss/items/${itemId}/explain`);
    return response.data?.data;
  },

  /**
   * Phê duyệt phương án mua hàng & tự động sinh PO
   * POST /api/v1/dss/sessions/:id/approve
   */
  async approveSession(sessionId: number): Promise<ApproveSessionResponse> {
    const response = await apiClient.post<ApiResponse<ApproveSessionResponse>>(
      `/dss/sessions/${sessionId}/approve`
    );
    return response.data?.data;
  },
};
