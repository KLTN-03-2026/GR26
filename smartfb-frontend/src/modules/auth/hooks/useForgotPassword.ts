import { useMutation } from '@tanstack/react-query';
import { authService } from '@modules/auth/services/authService';
import { useToast } from '@shared/hooks/useToast';
import { getAuthMutationErrorMessage } from '../utils/getAuthMutationErrorMessage';
import type { ForgotPasswordPayload } from '../types/auth.types';

/**
 * Hook gửi yêu cầu quên mật khẩu để hệ thống phát hành OTP.
 */
export const useForgotPassword = () => {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authService.forgotPassword(payload),
    onSuccess: (_, payload) => {
      success(
        'Đã ghi nhận yêu cầu khôi phục',
        `Nếu email ${payload.email} tồn tại, hệ thống sẽ gửi mã OTP đến hộp thư của bạn.`
      );
    },
    onError: (mutationError) => {
      error(
        'Không thể gửi mã OTP',
        getAuthMutationErrorMessage(
          mutationError,
          'Yêu cầu khôi phục mật khẩu chưa thể thực hiện. Vui lòng thử lại.'
        )
      );
    },
  });
};
