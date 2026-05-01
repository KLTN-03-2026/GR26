import { useMutation } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { accountService } from '../services/accountService';
import type { ChangePasswordPayload } from '../types/account.types';

/**
 * Hook đổi mật khẩu tài khoản cá nhân.
 * Yêu cầu nhập mật khẩu hiện tại để xác thực danh tính.
 */
export const useChangePassword = () => {
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => accountService.changePassword(payload),
    onSuccess: () => {
      success('Đổi mật khẩu thành công');
    },
    onError: () => {
      error('Đổi mật khẩu thất bại', 'Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.');
    },
  });
};
