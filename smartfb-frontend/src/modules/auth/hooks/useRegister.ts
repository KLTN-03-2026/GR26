import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@modules/auth/services/authService';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useToast } from '@shared/hooks/useToast';
import type { RegisterPayload, User } from '../types/auth.types';
import { type Role } from '@shared/constants/roles';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { ROUTES } from '@shared/constants/routes';

/**
 * Hook xử lý đăng ký tenant mới
 * Gọi API POST /api/v1/auth/register
 *
 * @example
 * const { mutate, isPending } = useRegister();
 * mutate({ tenantName, email, password, ownerName, planSlug: 'free' });
 */
export const useRegister = () => {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      return authService.register(payload);
    },
    onSuccess: (response) => {
      const { accessToken, refreshToken, role, tenantId, userId } = response.data;

      // Convert role từ uppercase (backend) sang lowercase (frontend)
      const normalizedRole = role.toLowerCase() as Role;

      // Lưu token vào localStorage
      setTokens(accessToken, refreshToken);

      // Lưu tenantId vào localStorage cho axios interceptor
      localStorage.setItem('tenant_id', tenantId);

      // Tạo user object từ response
      const user: User = {
        id: userId,
        email: '', // Sẽ được lấy từ profile API sau
        name: 'User', // Sẽ được lấy từ profile API sau
        role: normalizedRole,
        tenant_id: tenantId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Lưu user info vào Zustand store
      setUser(user);

      success('Đăng ký thành công', 'Chào mừng bạn đến với SmartF&B!');

      // Redirect về trang dashboard của owner
      navigate(ROUTES.OWNER.DASHBOARD);
    },
    onError: (err) => {
      console.error('Register failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.';
      error('Đăng ký thất bại', errorMessage);
    },
  });
};
