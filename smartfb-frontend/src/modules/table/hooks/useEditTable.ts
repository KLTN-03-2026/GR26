import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '../services/tableService';
import type { UpdateTablePayload, TableItem } from '../types/table.types';

/**
 * Hook cập nhật thông tin thẻ.
 * Sau khi lưu sẽ refresh cả danh sách thẻ lẫn cache chi tiết của thẻ vừa chỉnh sửa.
 */
export const useEditTable = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateTablePayload }) => {
      const updatedTable = await tableService.update(id, payload);
      return updatedTable;
    },
    onSuccess: (table: TableItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.detail(table.id) });
      success('Cập nhật thẻ thành công', `Thẻ ${table.name} đã được cập nhật`);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Cập nhật thẻ thất bại', message);
    },
  });
};
