import { useMutation } from '@tanstack/react-query';
import type { CreateBranchFormData } from '../types/branch.types';

/**
 * Hook xử lý tạo chi nhánh mới
 * TODO: Thay thế mock API bằng real API service khi backend sẵn sàng
 */
export const useCreateBranch = () => {
  console.log("useCreateBranch" );

  return useMutation({
    mutationFn: async (data: CreateBranchFormData) => {
      // TODO: Replace với real API call
      // return branchService.create(data);
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Creating branch with data:', data);
      
      // Mock response
      return {
        success: true,
        data: {
          id: `branch-${Date.now()}`,
          ...data,
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      };
    },
    onSuccess: (response) => {
      // Invalidate queries để refetch danh sách chi nhánh
      // queryClient.invalidateQueries({ queryKey: ['branches'] });
      
      console.log('Branch created successfully:', response.data);
      
      // TODO: Show toast notification
      // toast({ title: 'Tạo chi nhánh thành công', variant: 'success' });
    },
    onError: (error) => {
      console.error('Failed to create branch:', error);
      
      // TODO: Show error toast
      // toast({ title: 'Có lỗi xảy ra', description: error.message, variant: 'destructive' });
    },
  });
};
