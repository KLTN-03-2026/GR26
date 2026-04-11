import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import type { UpdateStaffRequest } from '../types/staff.types';

export const useEditStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateStaffRequest }) => {
      await staffService.update(id, data);
      return { id, data };
    },
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.detail(variables.id) });
    },
  });
};
