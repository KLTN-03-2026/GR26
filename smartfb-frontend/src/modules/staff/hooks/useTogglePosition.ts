import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { positionService } from '@modules/staff/services/positionService';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface TogglePositionVariables {
  id: string;
  active: boolean;
  name: string;
}

/**
 * Hook bật/tắt trạng thái chức vụ.
 * Phiên bản UI hiện tại chủ yếu dùng để "ngừng sử dụng" một chức vụ khỏi danh sách active.
 */
export const useTogglePosition = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, active }: TogglePositionVariables) =>
      positionService.toggleActive(id, active),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
      success(
        variables.active ? 'Đã kích hoạt chức vụ' : 'Đã ngừng sử dụng chức vụ',
        variables.active
          ? `Chức vụ ${variables.name} đã xuất hiện lại trong danh sách`
          : `Chức vụ ${variables.name} đã được ẩn khỏi danh sách active`
      );
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật trạng thái chức vụ', errorMessage);
    },
  });
};
