import { useMutation } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import type { ProcessQRPaymentRequest } from '../types/payment.types';

/**
 * Hook tạo QR code thanh toán cho đơn hàng.
 * Gọi BE tạo Payment (PENDING) và trả về URL QR để render.
 */
export const useProcessQRPayment = () => {
  return useMutation({
    mutationFn: (payload: ProcessQRPaymentRequest) =>
      paymentService.processQRPayment(payload),
  });
};
