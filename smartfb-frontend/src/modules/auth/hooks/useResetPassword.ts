import { useMutation } from '@tanstack/react-query';
import { authService } from '@modules/auth/services/authService';
import { useToast } from '@shared/hooks/useToast';
import { getAuthMutationErrorMessage } from '../utils/getAuthMutationErrorMessage';
import type { ResetPasswordPayload } from '../types/auth.types';

/**
 * Hook đặt lại mật khẩu mới sau khi OTP đã được xác thực.
 */
export const useResetPassword = () => {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authService.resetPassword(payload),
    onSuccess: () => {
      success('Đặt lại mật khẩu thành công', 'Bạn có thể đăng nhập bằng mật khẩu mới.');
    },
    onError: (mutationError) => {
      error(
        'Đặt lại mật khẩu thất bại',
        getAuthMutationErrorMessage(
          mutationError,
          'Không thể cập nhật mật khẩu mới. Vui lòng thử lại.'
        )
      );
    },
  });
};
