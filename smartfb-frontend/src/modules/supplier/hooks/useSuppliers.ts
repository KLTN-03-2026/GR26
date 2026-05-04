import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { getApiErrorMessage } from '@shared/utils/getApiErrorMessage';
import { supplierService } from '../services/supplierService';
import type { CreateSupplierPayload, UpdateSupplierPayload } from '../types/supplier.types';
import toast from 'react-hot-toast';

export const useSuppliers = () => {
  const queryClient = useQueryClient();

  // Lấy danh sách nhà cung cấp
  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: queryKeys.suppliers.list(),
    queryFn: () => supplierService.getList(),
  });

  // Tạo nhà cung cấp mới
  const createMutation = useMutation({
    mutationFn: (payload: CreateSupplierPayload) => supplierService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success('Thêm nhà cung cấp thành công');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Có lỗi xảy ra khi thêm nhà cung cấp'));
    },
  });

  // Cập nhật nhà cung cấp
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
      currentActive,
    }: {
      id: string;
      payload: UpdateSupplierPayload;
      currentActive: boolean;
    }) => supplierService.update(id, payload, currentActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success('Cập nhật nhà cung cấp thành công');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Có lỗi xảy ra khi cập nhật nhà cung cấp'));
    },
  });

  // Xóa nhà cung cấp
  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.suppliers.all });
      toast.success('Xóa nhà cung cấp thành công');
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, 'Không thể xóa nhà cung cấp này'));
    },
  });

  return {
    suppliers,
    isLoading,
    error,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
