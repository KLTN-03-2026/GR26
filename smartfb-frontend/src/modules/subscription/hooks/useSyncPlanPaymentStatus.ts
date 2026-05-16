import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { subscriptionService } from '@modules/subscription/services/subscriptionService';
import { queryKeys } from '@shared/constants/queryKeys';

interface SyncPlanPaymentStatusVariables {
  invoiceId: string;
  showPendingToast?: boolean;
}

type SyncPlanPaymentStatusInput = string | SyncPlanPaymentStatusVariables;

const normalizeSyncVariables = (input: SyncPlanPaymentStatusInput): SyncPlanPaymentStatusVariables => {
  if (typeof input === 'string') {
    return { invoiceId: input, showPendingToast: true };
  }

  return {
    invoiceId: input.invoiceId,
    showPendingToast: input.showPendingToast ?? true,
  };
};

/**
 * Hook đồng bộ trạng thái thanh toán PayOS cho hóa đơn gói dịch vụ.
 * Gọi PayOS API kiểm tra xem payment link đã được thanh toán chưa.
 * Khi paid: invalidate subscription + invoices để UI cập nhật ngay.
 *
 * @author Hoàng | date: 2026-05-16
 */
export const useSyncPlanPaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: SyncPlanPaymentStatusInput) => {
      const { invoiceId } = normalizeSyncVariables(variables);
      return subscriptionService.syncPlanPayment(invoiceId);
    },
    onSuccess: (data, variables) => {
      const { showPendingToast } = normalizeSyncVariables(variables);

      if (data.justPaid) {
        toast.success('Thanh toán đã được xác nhận! Gói dịch vụ đã được gia hạn.');
        // Invalidate để FE cập nhật trạng thái subscription và danh sách invoices
        void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.current });
        void queryClient.invalidateQueries({ queryKey: queryKeys.subscriptions.all });
      } else if (showPendingToast) {
        toast('Hóa đơn chưa được thanh toán. Vui lòng thử lại sau khi hoàn tất.');
      }
    },
    onError: (_error, variables) => {
      const { showPendingToast } = normalizeSyncVariables(variables);
      if (showPendingToast) {
        toast.error('Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại.');
      }
    },
  });
};
