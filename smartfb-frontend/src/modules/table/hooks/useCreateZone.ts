import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '@modules/table/services/tableService';
import type { CreateZonePayload, TableArea } from '@modules/table/types/table.types';

/**
 * Hook tạo khu vực mới cho chi nhánh hiện tại.
 */
export const useCreateZone = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateZonePayload) => {
      const createdZone = await tableService.createZone(payload);
      return createdZone;
    },
    onSuccess: (zone: TableArea) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.zones });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      success('Tạo khu vực thành công', `Khu vực ${zone.name} đã được thêm`);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Tạo khu vực thất bại', message);
    },
  });
};
