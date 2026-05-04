import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { adminBillingService } from '../services/adminBillingService';
import type { CreateRenewalInvoicePayload } from '../types/adminBilling.types';
import toast from 'react-hot-toast';

/**
 * Hook tạo hóa đơn gia hạn subscription.
 */
export const useCreateRenewalInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRenewalInvoicePayload) =>
      adminBillingService.createRenewalInvoice(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
      toast.success('Tạo hóa đơn gia hạn thành công');
    },
    onError: () => {
      toast.error('Không thể tạo hóa đơn gia hạn');
    },
  });
};
