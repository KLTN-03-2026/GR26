import { axiosInstance as api, publicAxiosInstance as publicApi } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  BackendAuthResponse,
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
  VerifyOtpResponse,
} from '../types/auth.types';

/**
 * Auth service chỉ làm đúng một việc:
 * gọi API và trả về `response.data`.
 */
export const authService = {
  /**
   * Đăng nhập bằng email và mật khẩu
   * POST /api/v1/auth/login
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<BackendAuthResponse>> => {
    const response = await publicApi.post<ApiResponse<BackendAuthResponse>>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Làm mới access token
   * POST /api/v1/auth/refresh
   */
  refreshToken: async (refreshToken?: string): Promise<ApiResponse<BackendAuthResponse>> => {
    const payload = refreshToken ? { refreshToken } : {};
    const response = await publicApi.post<ApiResponse<BackendAuthResponse>>(
      '/auth/refresh',
      payload,
      {
        withCredentials: !refreshToken,
      }
    );
    return response.data;
  },

  /**
   * Đăng ký tenant mới
   * POST /api/v1/auth/register
   */
  register: async (payload: RegisterPayload): Promise<ApiResponse<BackendAuthResponse>> => {
    const response = await publicApi.post<ApiResponse<BackendAuthResponse>>('/auth/register', payload);
    return response.data;
  },

  /**
   * Gửi OTP quên mật khẩu
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<ApiResponse<void>> => {
    const response = await publicApi.post<ApiResponse<void>>('/auth/forgot-password', payload);
    return response.data;
  },

  /**
   * Xác thực OTP
   * POST /api/v1/auth/verify-otp
   */
  verifyOtp: async (payload: VerifyOtpPayload): Promise<ApiResponse<VerifyOtpResponse>> => {
    const response = await publicApi.post<ApiResponse<VerifyOtpResponse>>('/auth/verify-otp', payload);
    return response.data;
  },

  /**
   * Đặt lại mật khẩu mới
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (payload: ResetPasswordPayload): Promise<ApiResponse<void>> => {
    const response = await publicApi.post<ApiResponse<void>>('/auth/reset-password', payload);
    return response.data;
  },

  /**
   * Chọn chi nhánh làm việc
   * POST /api/v1/auth/select-branch
   */
  selectBranch: async (branchId: string): Promise<ApiResponse<BackendAuthResponse>> => {
    const response = await api.post<ApiResponse<BackendAuthResponse>>('/auth/select-branch', { branchId });
    return response.data;
  },
};
