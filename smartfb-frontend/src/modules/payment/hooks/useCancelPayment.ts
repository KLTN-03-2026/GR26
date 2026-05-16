import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { paymentService } from '../services/paymentService';

/**
 * Hook hủy payment QR đang chờ xử lý.
 * Dùng khi khách muốn thêm món hoặc hủy món sau khi thu ngân đã tạo QR.
 */
export const useCancelPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => paymentService.cancelPayment(paymentId),
    onSuccess: (_response, paymentId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(paymentId) });
    },
  });
};
