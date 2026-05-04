import { authService } from '@modules/auth/services/authService';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROLES } from '@shared/constants/roles';
import { useToast } from '@shared/hooks/useToast';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { AxiosError } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { LoginCredentials } from '../types/auth.types';

/**
 * Hook xử lý đăng nhập
 * Gọi API POST /api/v1/auth/login
 */
export const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (response, credentials) => {
      // Xóa cache của phiên cũ trước khi set session mới,
      // tránh tài khoản mới thấy data còn sót từ tài khoản trước.
      queryClient.clear();

      setAuthSession(response.data, {
        email: credentials.email,
        fullName: response.data.fullName ?? undefined,
      });

      success('Đăng nhập thành công', 'Chào mừng bạn trở lại!');

      const { session } = useAuthStore.getState();
      const homePage = getRoleHomePage(
        session?.role ?? ROLES.STAFF,
        session?.permissions ?? []
      );
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
