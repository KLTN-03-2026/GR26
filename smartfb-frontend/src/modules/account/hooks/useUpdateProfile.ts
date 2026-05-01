import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { accountService } from '../services/accountService';
import type { UpdateProfilePayload } from '../types/account.types';

/**
 * Hook cập nhật fullName và phone của tài khoản cá nhân.
 * Sau khi thành công, đồng bộ lại authStore để hiển thị tên mới trên header/sidebar.
 */
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const { success, error } = useToast();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => accountService.updateProfile(payload),
    onSuccess: (updated) => {
      // Cập nhật cache profile
      qc.setQueryData(queryKeys.account.me, updated);

      // Đồng bộ tên và số điện thoại mới vào authStore để header hiển thị đúng
      updateUser({
        fullName: updated.fullName,
        phone: updated.phone ?? undefined,
      });

      success('Cập nhật thông tin thành công');
    },
    onError: () => {
      error('Cập nhật thất bại', 'Vui lòng thử lại sau.');
    },
  });
};
