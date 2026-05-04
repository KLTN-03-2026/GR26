import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { paymentService } from '../services/paymentService';
import type { ProcessCashPaymentRequest } from '../types/payment.types';

/**
 * Hook xử lý thanh toán tiền mặt qua backend.
 */
export const useProcessCashPayment = () => {
  // Author: Hoàng | date: 2026-05-04 | note: invalidate tables để máy thực hiện thanh toán tự cập nhật bàn về trống ngay
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProcessCashPaymentRequest) => {
      return paymentService.processCashPayment(payload);
    },
    // Author: Hoàng | date: 2026-05-04 | note: sau thanh toán thành công, refetch bàn để đồng bộ trạng thái AVAILABLE
    // Máy khác sẽ nhận qua WebSocket (sau khi BE-1 fix), máy này dùng invalidate làm fallback chắc chắn
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tables.lists });
    },
  });
};
