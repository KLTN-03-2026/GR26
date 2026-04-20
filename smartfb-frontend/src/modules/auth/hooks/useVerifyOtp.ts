import { useMutation } from '@tanstack/react-query';
import { authService } from '@modules/auth/services/authService';
import { useToast } from '@shared/hooks/useToast';
import { getAuthMutationErrorMessage } from '../utils/getAuthMutationErrorMessage';
import type { VerifyOtpPayload } from '../types/auth.types';

/**
 * Hook xác thực OTP quên mật khẩu và nhận reset token tạm thời.
 */
export const useVerifyOtp = () => {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: VerifyOtpPayload) => authService.verifyOtp(payload),
    onSuccess: () => {
      success('Xác thực OTP thành công', 'Bạn có thể đặt lại mật khẩu mới ngay bây giờ.');
    },
    onError: (mutationError) => {
      error(
        'Xác thực OTP thất bại',
        getAuthMutationErrorMessage(
          mutationError,
          'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.'
        )
      );
    },
  });
};
