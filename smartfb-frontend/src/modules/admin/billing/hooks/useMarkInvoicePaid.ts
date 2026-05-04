import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminBillingService } from '../services/adminBillingService';
import type { MarkInvoicePaidPayload } from '../types/adminBilling.types';
import toast from 'react-hot-toast';

interface MarkInvoicePaidVariables {
  invoiceId: string;
  payload: MarkInvoicePaidPayload;
}

/**
 * Hook xác nhận invoice đã thanh toán.
 */
export const useMarkInvoicePaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, payload }: MarkInvoicePaidVariables) =>
      adminBillingService.markInvoicePaid(invoiceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Đã xác nhận thanh toán hóa đơn');
    },
    onError: () => {
      toast.error('Không thể xác nhận thanh toán hóa đơn');
    },
  });
};
