import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type { ChangePasswordPayload, UpdateProfilePayload, UserProfile } from '../types/account.types';

/**
 * Service gọi API tài khoản cá nhân.
 * Không chứa business logic — chỉ gọi HTTP và trả về data.
 */
export const accountService = {
  /**
   * Lấy profile cá nhân của user đang đăng nhập.
   * GET /api/v1/account/me
   */
  getMyProfile: (): Promise<UserProfile> =>
    api.get<ApiResponse<UserProfile>>('/account/me').then((r) => r.data.data),

  /**
   * Cập nhật fullName và phone.
   * PUT /api/v1/account/me
   */
  updateProfile: (payload: UpdateProfilePayload): Promise<UserProfile> =>
    api.put<ApiResponse<UserProfile>>('/account/me', payload).then((r) => r.data.data),

  /**
   * Đổi mật khẩu — yêu cầu nhập mật khẩu hiện tại.
   * PUT /api/v1/account/me/password
   */
  changePassword: (payload: ChangePasswordPayload): Promise<void> =>
    api.put<ApiResponse<void>>('/account/me/password', payload).then(() => undefined),
};
