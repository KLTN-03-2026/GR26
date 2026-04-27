import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminTenantService } from '../services/adminTenantService';

/**
 * Hook lấy chi tiết tenant khi admin mở drawer.
 */
export const useAdminTenantDetail = (tenantId: string | null) =>
  useQuery({
    queryKey: queryKeys.admin.tenantDetail(tenantId ?? 'unknown'),
    queryFn: () => {
      if (!tenantId) {
        throw new Error('Thiếu tenantId để tải chi tiết tenant');
      }

      return adminTenantService.getTenantDetail(tenantId);
    },
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });
