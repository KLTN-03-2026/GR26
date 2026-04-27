import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminTenantService } from '../services/adminTenantService';
import type { SuspendTenantPayload } from '../types/adminTenant.types';
import toast from 'react-hot-toast';

interface SuspendTenantVariables {
  tenantId: string;
  payload: SuspendTenantPayload;
}

/**
 * Hook tạm khóa tenant.
 */
export const useSuspendTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, payload }: SuspendTenantVariables) =>
      adminTenantService.suspendTenant(tenantId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Đã tạm khóa tenant');
    },
    onError: () => {
      toast.error('Không thể tạm khóa tenant');
    },
  });
};
