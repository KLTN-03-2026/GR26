import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminPlanService } from '../services/adminPlanService';
import toast from 'react-hot-toast';

/**
 * Hook ẩn gói dịch vụ khỏi danh sách đang bán.
 */
export const useDeactivateAdminPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => adminPlanService.deactivatePlan(planId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Đã ẩn gói dịch vụ');
    },
    onError: () => {
      toast.error('Không thể ẩn gói dịch vụ');
    },
  });
};
