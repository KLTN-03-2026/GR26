import { useMutation } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';

/**
 * Hook để thu ngân xác nhận thủ công thanh toán QR.
 * Dùng khi webhook từ gateway không về — thu ngân tự kiểm tra
 * sổ phụ ngân hàng thấy tiền đã vào rồi bấm xác nhận.
 */
export const useManualConfirmQRPayment = () => {
  return useMutation({
    mutationFn: (paymentId: string) =>
      paymentService.manualConfirmQRPayment(paymentId),
  });
};
