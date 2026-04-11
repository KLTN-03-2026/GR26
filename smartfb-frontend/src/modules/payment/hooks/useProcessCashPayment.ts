import { useMutation } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import type { ProcessCashPaymentRequest } from '../types/payment.types';

/**
 * Hook xử lý thanh toán tiền mặt qua backend.
 */
export const useProcessCashPayment = () => {
  return useMutation({
    mutationFn: (payload: ProcessCashPaymentRequest) => {
      return paymentService.processCashPayment(payload);
    },
  });
};
