import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../services/supplierService';
import { CreateSupplierPayload, UpdateSupplierPayload } from '../types/supplier.types';
import toast from 'react-hot-toast';

export const useSuppliers = () => {
  const queryClient = useQueryClient();

  // Lấy danh sách nhà cung cấp
  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['suppliers'],
    queryFn: supplierService.getList,
  });

  // Tạo nhà cung cấp mới
  const createMutation = useMutation({
    mutationFn: (payload: CreateSupplierPayload) => supplierService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Thêm nhà cung cấp thành công');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi thêm nhà cung cấp');
    },
  });

  // Cập nhật nhà cung cấp
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupplierPayload }) => 
      supplierService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Cập nhật nhà cung cấp thành công');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhà cung cấp');
    },
  });

  // Xóa nhà cung cấp
  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Xóa nhà cung cấp thành công');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể xóa nhà cung cấp này');
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
