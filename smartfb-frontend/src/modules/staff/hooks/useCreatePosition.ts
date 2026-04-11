import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { positionService } from '@modules/staff/services/positionService';
import type { CreatePositionRequest } from '@modules/staff/types/position.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

/**
 * Hook tạo chức vụ mới cho tenant hiện tại.
 */
export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: CreatePositionRequest) => positionService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
      success('Tạo chức vụ thành công', 'Danh sách chức vụ đã được cập nhật');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể tạo chức vụ', errorMessage);
    },
  });
};
