import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { subscriptionService } from '@modules/subscription/services/subscriptionService';
import { queryKeys } from '@shared/constants/queryKeys';
import type { TenantRenewPayload } from '../types/subscription.types';

/**
 * Hook owner tạo hóa đơn gia hạn/nâng cấp gói dịch vụ.
 */
export const useCreateTenantRenewalInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TenantRenewPayload) =>
      subscriptionService.createRenewalInvoice(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      toast.success('Đã tạo hóa đơn gói dịch vụ');
    },
    onError: () => {
      toast.error('Không thể tạo hóa đơn. Vui lòng kiểm tra hóa đơn chưa thanh toán hiện có.');
    },
  });
};
