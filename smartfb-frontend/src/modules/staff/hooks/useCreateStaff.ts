import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { CreateStaffRequest } from '../types/staff.types';

/**
 * Hook tạo nhân viên mới.
 * Sau khi tạo thành công sẽ invalidate toàn bộ danh sách nhân viên để UI refetch dữ liệu mới nhất.
 */
export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStaffRequest) => {
      const response = await staffService.create(data);
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
    },
  });
};
