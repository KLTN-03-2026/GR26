import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { positionService } from '@modules/staff/services/positionService';
import type { UpdatePositionRequest } from '@modules/staff/types/position.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface UpdatePositionVariables {
  id: string;
  data: UpdatePositionRequest;
}

/**
 * Hook cập nhật tên và mô tả chức vụ.
 */
export const useUpdatePosition = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: UpdatePositionVariables) => positionService.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
      success('Cập nhật chức vụ thành công', 'Thông tin chức vụ đã được lưu');
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật chức vụ', errorMessage);
    },
  });
};
