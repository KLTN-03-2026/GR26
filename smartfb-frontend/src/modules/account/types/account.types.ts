/**
 * Thông tin profile cá nhân trả về từ GET/PUT /api/v1/account/me.
 * Không chứa passwordHash, posPin hay thông tin nhạy cảm.
 */
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
}

/**
 * Payload cập nhật profile — PUT /api/v1/account/me
 * Email không được phép thay đổi qua endpoint này.
 */
export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
}

/**
 * Payload đổi mật khẩu — PUT /api/v1/account/me/password
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
