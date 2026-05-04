import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminTenantService } from '../services/adminTenantService';
import type { AdminTenantListParams } from '../types/adminTenant.types';

/**
 * Hook lấy danh sách tenant có phân trang và filter.
 */
export const useAdminTenants = (params: AdminTenantListParams) =>
  useQuery({
    queryKey: queryKeys.admin.tenants({ ...params }),
    queryFn: () => adminTenantService.getTenants(params),
    staleTime: 60 * 1000,
  });
