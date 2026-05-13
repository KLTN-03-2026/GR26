import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminTenantService } from '../services/adminTenantService';
import toast from 'react-hot-toast';

/**
 * Hook mở khóa khách hàng.
 */
export const useReactivateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => adminTenantService.reactivateTenant(tenantId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Đã mở khóa khách hàng');
    },
    onError: () => {
      toast.error('Không thể mở khóa khách hàng');
    },
  });
};
