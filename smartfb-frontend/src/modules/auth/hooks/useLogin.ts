import { authService } from '@modules/auth/services/authService';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROLES } from '@shared/constants/roles';
import { useToast } from '@shared/hooks/useToast';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { LoginCredentials } from '../types/auth.types';

/**
 * Hook xử lý đăng nhập
 * Gọi API POST /api/v1/auth/login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (response, credentials) => {
      setAuthSession(response.data, {
        email: credentials.email,
      });

      success('Đăng nhập thành công', 'Chào mừng bạn trở lại!');

      const homePage = getRoleHomePage(useAuthStore.getState().session?.role ?? ROLES.STAFF);
      navigate(homePage);
    },
    onError: (err) => {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.data?.message ?? 'Email hoặc mật khẩu không đúng'
          : err instanceof Error
            ? err.message
            : 'Email hoặc mật khẩu không đúng';

      error('Đăng nhập thất bại', errorMessage);
    },
  });
};
