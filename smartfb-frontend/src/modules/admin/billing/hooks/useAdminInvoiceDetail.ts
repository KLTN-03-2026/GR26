import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminBillingService } from '../services/adminBillingService';

/**
 * Hook lấy chi tiết invoice khi admin mở drawer.
 */
export const useAdminInvoiceDetail = (invoiceId: string | null) =>
  useQuery({
    queryKey: queryKeys.admin.invoiceDetail(invoiceId ?? 'unknown'),
    queryFn: () => {
      if (!invoiceId) {
        throw new Error('Thiếu invoiceId để tải chi tiết hóa đơn');
      }

      return adminBillingService.getInvoiceDetail(invoiceId);
    },
    enabled: Boolean(invoiceId),
    staleTime: 60 * 1000,
  });
