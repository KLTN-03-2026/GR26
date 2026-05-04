import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@modules/subscription/services/subscriptionService';
import { queryKeys } from '@shared/constants/queryKeys';
import type { TenantInvoiceListParams } from '../types/subscription.types';

/**
 * Hook lấy danh sách hóa đơn gói dịch vụ của tenant hiện tại.
 * Tenant được backend xác định từ JWT, FE không truyền tenantId.
 */
export const useTenantInvoices = (params: TenantInvoiceListParams) =>
  useQuery({
    queryKey: queryKeys.subscriptions.invoices({ ...params }),
    queryFn: () => subscriptionService.getMyInvoices(params),
    staleTime: 30 * 1000,
  });
