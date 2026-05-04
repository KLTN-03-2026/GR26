import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminPlanService } from '../services/adminPlanService';
import type { CreateAdminPlanPayload } from '../types/adminPlan.types';
import toast from 'react-hot-toast';

/**
 * Hook tạo gói dịch vụ mới trong khu vực admin.
 */
export const useCreateAdminPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAdminPlanPayload) => adminPlanService.createPlan(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Tạo gói dịch vụ thành công');
    },
    onError: () => {
      toast.error('Tạo gói dịch vụ thất bại');
    },
  });
};
