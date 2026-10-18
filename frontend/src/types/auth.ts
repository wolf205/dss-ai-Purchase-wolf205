export type UserRole = 'STORE_MANAGER' | 'PURCHASING_STAFF';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequestDto {
  username: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  user: User;
}

export interface RefreshResponseData {
  accessToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  constraint?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    timestamp: string;
    path: string;
  };
}
