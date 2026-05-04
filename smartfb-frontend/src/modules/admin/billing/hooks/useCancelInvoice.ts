import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminBillingService } from '../services/adminBillingService';
import type { CancelInvoicePayload } from '../types/adminBilling.types';
import toast from 'react-hot-toast';

interface CancelInvoiceVariables {
  invoiceId: string;
  payload: CancelInvoicePayload;
}

/**
 * Hook hủy invoice chưa thanh toán.
 */
export const useCancelInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, payload }: CancelInvoiceVariables) =>
      adminBillingService.cancelInvoice(invoiceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Đã hủy hóa đơn');
    },
    onError: () => {
      toast.error('Không thể hủy hóa đơn');
    },
  });
};
