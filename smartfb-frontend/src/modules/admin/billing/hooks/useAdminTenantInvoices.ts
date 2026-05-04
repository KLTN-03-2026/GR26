import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminBillingService } from '../services/adminBillingService';

interface AdminTenantInvoiceListParams {
  page?: number;
  size?: number;
}

/**
 * Hook lấy danh sách hóa đơn subscription của một tenant cụ thể.
 */
export const useAdminTenantInvoices = (
  tenantId: string,
  params: AdminTenantInvoiceListParams
) =>
  useQuery({
    queryKey: queryKeys.admin.tenantInvoices(tenantId, { ...params }),
    queryFn: () => adminBillingService.getTenantInvoices(tenantId, params),
    enabled: Boolean(tenantId),
    staleTime: 60 * 1000,
  });
