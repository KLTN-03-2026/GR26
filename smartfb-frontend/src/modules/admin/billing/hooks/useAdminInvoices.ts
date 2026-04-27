import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminBillingService } from '../services/adminBillingService';
import type { AdminInvoiceListParams } from '../types/adminBilling.types';

/**
 * Hook lấy danh sách invoice subscription có phân trang và filter trạng thái.
 */
export const useAdminInvoices = (params: AdminInvoiceListParams) =>
  useQuery({
    queryKey: queryKeys.admin.invoices({ ...params }),
    queryFn: () => adminBillingService.getInvoices(params),
    staleTime: 60 * 1000,
  });
