import { authService } from '@modules/auth/services/authService';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROLES } from '@shared/constants/roles';
import { useToast } from '@shared/hooks/useToast';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';
import { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { RegisterPayload } from '../types/auth.types';

/**
 * Hook xử lý đăng ký tenant mới
 * Gọi API POST /api/v1/auth/register
 *
 * @example
 * const { mutate, isPending } = useRegister();
 * mutate({ email, password, ownerName, planSlug: 'trial' });
 */
export const useRegister = () => {
  const navigate = useNavigate();
  const setAuthSession = useAuthStore((state) => state.setAuthSession);
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (response, payload) => {
      setAuthSession(response.data, {
        email: payload.email,
        fullName: payload.ownerName,
        phone: payload.phone,
      });

      success('Đăng ký thành công', 'Chào mừng bạn đến với SmartF&B!');

      const { session } = useAuthStore.getState();
      const homePage = getRoleHomePage(
        session?.role ?? ROLES.OWNER,
        session?.permissions ?? []
      );
      navigate(homePage);
    },
    onError: (err) => {
      const errorMessage =
        err instanceof AxiosError
          ? err.response?.data?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.'
          : err instanceof Error
            ? err.message
            : 'Đăng ký thất bại. Vui lòng thử lại.';

      error('Đăng ký thất bại', errorMessage);
    },
  });
};
