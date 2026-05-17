import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { subscriptionService } from '@modules/subscription/services/subscriptionService';
import { queryKeys } from '@shared/constants/queryKeys';

/**
 * Hook hủy hóa đơn gói đang chờ thanh toán.
 * Dùng khi owner đã tạo QR nhưng muốn đổi sang gói khác hoặc tạo invoice mới.
 */
export const useCancelTenantInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invoiceId: string) => subscriptionService.cancelInvoice(invoiceId),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.current });
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.plans });
      toast.success(data.message || 'Đã hủy thanh toán gói. Bạn có thể chọn gói khác.');
    },
    onError: () => {
      toast.error('Không thể hủy thanh toán gói. Vui lòng kiểm tra lại trạng thái hóa đơn.');
    },
  });
};
