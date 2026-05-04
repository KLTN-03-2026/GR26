import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { subscriptionService } from '@modules/subscription/services/subscriptionService';
import type { GeneratePlanPaymentQRPayload } from '../types/subscription.types';

/**
 * Hook sinh mã QR thanh toán cho hóa đơn gói dịch vụ.
 */
export const useGeneratePlanPaymentQR = () =>
  useMutation({
    mutationFn: (payload: GeneratePlanPaymentQRPayload) =>
      subscriptionService.generatePaymentQR(payload),
    onError: () => {
      toast.error('Không thể tạo mã QR thanh toán');
    },
  });
