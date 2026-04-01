import type { Role } from '@/shared/constants/roles';

/**
 * Auth related types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  tenant_id?: string;
  branch_id?: string;
  avatar?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  business_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Auth response theo backend API
 */
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  tenantId: string;
  role: string;
  branchId?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Payload đăng ký tenant mới
 */
export type RegisterPayload = {
  tenantName: string;
  email: string;
  password: string;
  ownerName: string;
  planSlug: string;
};

/**
 * Payload quên mật khẩu
 */
export type ForgotPasswordPayload = {
  email: string;
};

/**
 * Payload xác thực OTP
 */
export type VerifyOtpPayload = {
  email: string;
  otp: string;
};

/**
 * Response xác thực OTP
 */
export type VerifyOtpResponse = {
  resetToken: string;
  expiresIn: number;
};

/**
 * Payload đặt lại mật khẩu
 */
export type ResetPasswordPayload = {
  email: string;
  resetToken: string;
  newPassword: string;
};
