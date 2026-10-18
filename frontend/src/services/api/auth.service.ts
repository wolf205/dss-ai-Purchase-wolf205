import { apiClient } from './axios.client';
import type {
  ApiResponse,
  LoginRequestDto,
  LoginResponseData,
  RefreshResponseData,
  User,
} from '../../types/auth';

export const authService = {
  /**
   * Đăng nhập hệ thống (POST /api/v1/auth/login)
   */
  async login(credentials: LoginRequestDto): Promise<LoginResponseData> {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      credentials
    );
    return response.data.data;
  },

  /**
   * Cấp mới Access Token (POST /api/v1/auth/refresh)
   */
  async refresh(): Promise<RefreshResponseData> {
    const response = await apiClient.post<ApiResponse<RefreshResponseData>>(
      '/auth/refresh',
      {}
    );
    return response.data.data;
  },

  /**
   * Lấy thông tin người dùng hiện tại (GET /api/v1/auth/me)
   */
  async getMe(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  /**
   * Đăng xuất hệ thống (POST /api/v1/auth/logout)
   */
  async logout(): Promise<void> {
    await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout', {});
  },
};
