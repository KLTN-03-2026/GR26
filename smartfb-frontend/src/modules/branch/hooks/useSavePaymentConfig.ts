import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/useToast';
import { queryKeys } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';
import type { PaymentGatewayConfigPayload } from '../types/branch.types';

/**
 * Hook lưu cấu hình PayOS cho chi nhánh.
 * Sau khi lưu thành công, tự động invalidate query để refetch config mới.
 *
 * @param branchId - ID chi nhánh cần lưu config
 */
export const useSavePaymentConfig = (branchId: string) => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (payload: PaymentGatewayConfigPayload) =>
      branchService.savePaymentConfig(branchId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.branches.paymentConfig(branchId),
      });
      success('Lưu cấu hình thanh toán thành công');
    },
    onError: () => {
      error(
        'Lưu cấu hình thất bại');
    },
  });
};
