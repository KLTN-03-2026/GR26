import {axiosInstance as api } from '@lib/axios';
import type {
  LoginCredentials,
  BackendAuthResponse,
  RegisterPayload,
  ForgotPasswordPayload,
  VerifyOtpPayload,
  VerifyOtpResponse,
  ResetPasswordPayload,
} from '../types/auth.types';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Auth service - gọi API xác thực
 * Base URL: /api/v1/auth
 */
export const authService = {
  /**
   * Đăng nhập bằng email và mật khẩu
   * POST /api/v1/auth/login
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<BackendAuthResponse>> => {
    return api.post<ApiResponse<BackendAuthResponse>>('/auth/login', credentials).then(r => r.data);
  },

  /**
   * Làm mới access token
   * POST /api/v1/auth/refresh
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<BackendAuthResponse>> => {
    return api
      .post<ApiResponse<BackendAuthResponse>>('/auth/refresh', { refreshToken })
      .then(r => r.data);
  },

  /**
   * Đăng ký tenant mới
   * POST /api/v1/auth/register
   */
  register: async (payload: RegisterPayload): Promise<ApiResponse<BackendAuthResponse>> => {
    return api.post<ApiResponse<BackendAuthResponse>>('/auth/register', payload).then(r => r.data);
  },

  /**
   * Gửi OTP quên mật khẩu
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<ApiResponse<void>> => {
    return api.post<ApiResponse<void>>('/auth/forgot-password', payload).then(r => r.data);
  },

  /**
   * Xác thực OTP
   * POST /api/v1/auth/verify-otp
   */
  verifyOtp: async (payload: VerifyOtpPayload): Promise<ApiResponse<VerifyOtpResponse>> => {
    return api.post<ApiResponse<VerifyOtpResponse>>('/auth/verify-otp', payload).then(r => r.data);
  },

  /**
   * Đặt lại mật khẩu mới
   * POST /api/v1/auth/reset-password
   */
  resetPassword: async (payload: ResetPasswordPayload): Promise<ApiResponse<void>> => {
    return api.post<ApiResponse<void>>('/auth/reset-password', payload).then(r => r.data);
  },

  /**
   * Chọn chi nhánh làm việc
   * POST /api/v1/auth/select-branch
   */
  selectBranch: async (branchId: string): Promise<ApiResponse<BackendAuthResponse>> => {
    return api.post<ApiResponse<BackendAuthResponse>>('/auth/select-branch', { branchId }).then(r => r.data);
  },
};
