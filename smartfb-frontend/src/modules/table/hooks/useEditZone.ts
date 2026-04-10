import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '@modules/table/services/tableService';
import type { TableArea, UpdateZonePayload } from '@modules/table/types/table.types';

/**
 * Hook cập nhật thông tin khu vực bàn.
 */
export const useEditZone = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateZonePayload }) => {
      const updatedZone = await tableService.updateZone(id, payload);
      return updatedZone;
    },
    onSuccess: (zone: TableArea) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.zones });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      success('Cập nhật khu vực thành công', `Khu vực ${zone.name} đã được cập nhật`);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Cập nhật khu vực thất bại', message);
    },
  });
};
