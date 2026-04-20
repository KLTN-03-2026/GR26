import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { paymentService } from '../services/paymentService';
import type { InvoiceResponse } from '../types/payment.types';

/**
 * Hook lấy chi tiết hóa đơn thu theo đúng endpoint invoice detail của backend.
 *
 * @param invoiceId - ID hóa đơn cần xem
 * @param enabled - Chỉ bật query khi dialog đang mở và có id hợp lệ
 */
export const useInvoiceDetail = (invoiceId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.payments.invoiceDetail(invoiceId ?? 'unknown'),
    queryFn: async (): Promise<InvoiceResponse> => {
      if (!invoiceId) {
        throw new Error('Thiếu invoiceId để tải chi tiết hóa đơn');
      }

      return paymentService.getInvoice(invoiceId).then((response) => response.data);
    },
    enabled: enabled && Boolean(invoiceId),
    staleTime: 60 * 1000,
    retry: 1,
  });
};
