import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@shared/constants/queryKeys';
import { getApiErrorMessage } from '@shared/utils/getApiErrorMessage';
import { supplierService } from '../services/supplierService';
import type { CreatePurchaseOrderPayload } from '../types/supplier.types';

/**
 * Hook lấy chi tiết đơn mua hàng.
 *
 * @param id - ID đơn mua hàng
 */
export const usePurchaseOrderDetail = (id?: string) =>
  useQuery({
    queryKey: id ? queryKeys.purchaseOrders.detail(id) : queryKeys.purchaseOrders.detail('unknown'),
    queryFn: () => (id ? supplierService.getPurchaseOrderDetail(id) : null),
    enabled: Boolean(id),
  });

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) =>
      supplierService.createPurchaseOrder(payload),
    onSuccess: (_id, payload) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.orders(payload.supplierId) });
      toast.success('Tạo đơn mua hàng thành công');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Không thể tạo đơn mua hàng'));
    },
  });
};

export const useSendPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; supplierId?: string }) => supplierService.sendPurchaseOrder(id),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(variables.id) });
      if (variables.supplierId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.orders(variables.supplierId) });
      }
      toast.success('Đã xác nhận đã đặt hàng với nhà cung cấp');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Không thể xác nhận đã đặt hàng'));
    },
  });
};

export const useReceivePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; supplierId?: string }) => supplierService.receivePurchaseOrder(id),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(variables.id) });
      if (variables.supplierId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.orders(variables.supplierId) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.transactions.all });
      toast.success('Đã nhận hàng và cập nhật tồn kho');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Không thể xác nhận nhận hàng'));
    },
  });
};
