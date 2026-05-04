import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { paymentService } from '../services/paymentService';
import type { ProcessQRPaymentRequest } from '../types/payment.types';

/**
 * Hook tạo QR code thanh toán cho đơn hàng.
 * Gọi BE tạo Payment (PENDING) và trả về URL QR để render.
 */
export const useProcessQRPayment = () => {
  // Author: Hoàng | date: 2026-05-04 | note: invalidate tables để máy thực hiện thanh toán tự cập nhật bàn về trống ngay
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessQRPaymentRequest) =>
      paymentService.processQRPayment(payload),
    // Author: Hoàng | date: 2026-05-04 | note: sau QR payment thành công, refetch bàn để đồng bộ trạng thái AVAILABLE
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.lists });
    },
  });
};
