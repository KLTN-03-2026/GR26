import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { menuService } from '@modules/menu/services/menuService';
import type { UpdateBranchMenuItemPayload } from '@modules/menu/types/menu.types';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import type { ApiResponse } from '@shared/types/api.types';

interface UpdateBranchMenuItemParams {
  branchId: string;
  itemId: string;
  payload: UpdateBranchMenuItemPayload;
  itemName?: string;
}

/**
 * Hook cập nhật cấu hình món ăn theo chi nhánh.
 */
export const useUpdateBranchMenuItem = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: ({ branchId, itemId, payload }: UpdateBranchMenuItemParams) =>
      menuService.updateBranchItem(branchId, itemId, payload),
    onSuccess: (_response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.menu.branchItems(variables.branchId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.menu.branchItemDetail(variables.branchId, variables.itemId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.menu.activeList(variables.branchId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.recipes.branchMenuItems(variables.branchId),
      });

      success(
        'Đã cập nhật cấu hình chi nhánh',
        variables.itemName
          ? `Đã lưu giá bán và trạng thái phục vụ cho món ${variables.itemName}`
          : 'Đã lưu giá bán và trạng thái phục vụ theo chi nhánh'
      );
    },
    onError: (err) => {
      if (isAxiosError<ApiResponse<unknown>>(err) && err.response) {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Vui lòng thử lại sau';
      error('Không thể cập nhật cấu hình chi nhánh', errorMessage);
    },
  });
};
