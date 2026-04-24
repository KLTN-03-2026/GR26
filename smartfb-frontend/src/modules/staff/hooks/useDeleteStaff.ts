import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '../services/staffService';
import { useToast } from '@shared/hooks/useToast';

/**
 * Hook xóa nhân viên
 * @returns mutation object để trigger xóa
 *
 * @example
 * const { mutate: deleteStaff, isPending } = useDeleteStaff();
 * deleteStaff('staff-id', {
 *   onSuccess: () => console.log('Xóa thành công'),
 * });
 */
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: (id: string) => staffService.delete(id),
    onSuccess: () => {
      // Invalidate để refetch danh sách
      queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      success('Xóa nhân viên thành công');
    },
    onError: (errors) => {
      error('Không thể xóa nhân viên', errors.message);
    },
  });
};