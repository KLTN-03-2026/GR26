import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminTenantService } from '../services/adminTenantService';
import type { ChangeTenantPlanPayload } from '../types/adminTenant.types';
import toast from 'react-hot-toast';

interface ChangeTenantPlanVariables {
  tenantId: string;
  payload: ChangeTenantPlanPayload;
}

/**
 * Hook đổi hoặc nâng cấp gói dịch vụ cho tenant.
 */
export const useChangeTenantPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, payload }: ChangeTenantPlanVariables) =>
      adminTenantService.changeTenantPlan(tenantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Đã đổi gói dịch vụ cho tenant');
    },
    onError: () => {
      toast.error('Không thể đổi gói dịch vụ cho tenant');
    },
  });
};
