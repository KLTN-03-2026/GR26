import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminPlanService } from '../services/adminPlanService';
import type { UpdateAdminPlanPayload } from '../types/adminPlan.types';
import toast from 'react-hot-toast';

interface UpdateAdminPlanVariables {
  planId: string;
  payload: UpdateAdminPlanPayload;
}

/**
 * Hook cập nhật thông tin gói dịch vụ.
 */
export const useUpdateAdminPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, payload }: UpdateAdminPlanVariables) =>
      adminPlanService.updatePlan(planId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Cập nhật gói dịch vụ thành công');
    },
    onError: () => {
      toast.error('Cập nhật gói dịch vụ thất bại');
    },
  });
};
