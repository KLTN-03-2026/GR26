import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService } from '@modules/auth/services/authService';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useToast } from '@shared/hooks/useToast';
import type { LoginCredentials, User } from '../types/auth.types';
import {  type Role } from '@shared/constants/roles';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';

/**
 * Hook xử lý đăng nhập
 * Gọi API POST /api/v1/auth/login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      return authService.login(credentials);
    },
    onSuccess: (response) => {
      const { accessToken, refreshToken, role, tenantId, branchId, userId } = response.data;

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
        branch_id: branchId,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Lưu user info vào Zustand store
      setUser(user);

      success('Đăng nhập thành công', 'Chào mừng bạn trở lại!');

      // Redirect về trang chính theo role
      const homePage = getRoleHomePage(normalizedRole);
      navigate(homePage);
    },
    onError: (err) => {
      console.error('Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Email hoặc mật khẩu không đúng';
      error('Đăng nhập thất bại', errorMessage);
    },
  });
};
