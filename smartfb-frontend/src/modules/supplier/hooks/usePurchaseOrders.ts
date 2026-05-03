import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@shared/constants/queryKeys';
import { getApiErrorMessage } from '@shared/utils/getApiErrorMessage';
import { supplierService } from '../services/supplierService';
import type {
  CancelPurchaseOrderPayload,
  CreatePurchaseOrderPayload,
  PurchaseOrderListParams,
  UpdatePurchaseOrderPayload,
} from '../types/supplier.types';

/**
 * Hook lấy danh sách đơn mua hàng.
 *
 * @param params - filter backend hỗ trợ: branchId, status, page, size
 */
export const usePurchaseOrders = (params?: PurchaseOrderListParams) =>
  useQuery({
    queryKey: queryKeys.purchaseOrders.list(params ? { ...params } : undefined),
    queryFn: () => supplierService.getPurchaseOrders(params),
  });

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

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePurchaseOrderPayload }) =>
      supplierService.updatePurchaseOrder(id, payload),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(variables.id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.orders(variables.payload.supplierId) });
      toast.success('Cập nhật đơn mua hàng thành công');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Không thể cập nhật đơn mua hàng'));
    },
  });
};

export const useSendPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplierService.sendPurchaseOrder(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(id) });
      toast.success('Đã gửi đơn mua hàng');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Không thể gửi đơn mua hàng'));
    },
  });
};

export const useReceivePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplierService.receivePurchaseOrder(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.transactions.all });
      toast.success('Đã xác nhận nhận hàng');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Không thể xác nhận nhận hàng'));
    },
  });
};

export const useCancelPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: CancelPurchaseOrderPayload }) =>
      supplierService.cancelPurchaseOrder(id, payload),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.purchaseOrders.detail(variables.id) });
      toast.success('Đã hủy đơn mua hàng');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Không thể hủy đơn mua hàng'));
    },
  });
};
