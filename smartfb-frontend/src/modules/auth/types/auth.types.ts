import type { Role } from '@shared/constants/roles';

/**
 * Thông tin người dùng cần dùng ở phía frontend sau khi đăng nhập.
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  tenantId: string;
  branchId: string | null;
}

/**
 * Hồ sơ tối thiểu cần persist để dựng lại `user` sau khi reload app.
 */
export interface AuthProfile {
  email: string;
  fullName: string;
  phone?: string;
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

/**
 * Payload auth trả về từ backend.
 */
export interface BackendAuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: string;
  tenantId: string;
  role: string;
  branchId?: string | null;
}

/**
 * Session xác thực chuẩn hóa để lưu trong store.
 */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  userId: string;
  tenantId: string;
  role: Role;
  branchId: string | null;
  permissions: string[];
}

/**
 * Context bổ sung từ form FE để bù vào các trường backend chưa trả.
 */
export interface AuthResponseContext {
  email?: string;
  fullName?: string;
  phone?: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
}

/**
 * Payload đăng ký tenant mới
 */
export type RegisterPayload = {
  tenantName: string;
  email: string;
  password: string;
  ownerName: string;
  phone?: string;
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
