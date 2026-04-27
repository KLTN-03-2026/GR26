import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminTenantService } from '../services/adminTenantService';

/**
 * Hook lấy danh sách gói active để form đổi gói tenant sử dụng.
 */
export const useAdminActivePlans = () =>
  useQuery({
    queryKey: queryKeys.admin.activePlans(),
    queryFn: adminTenantService.getActivePlans,
    staleTime: 5 * 60 * 1000,
  });
