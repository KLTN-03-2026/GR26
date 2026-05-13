import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '@modules/table/services/tableService';
import type { CreateZonePayload, TableArea } from '@modules/table/types/table.types';

/**
 * Hook tạo máy gọi thẻ mới cho chi nhánh hiện tại.
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
      success('Tạo máy gọi thẻ thành công', `Máy gọi thẻ ${zone.name} đã được thêm`);
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Tạo máy gọi thẻ thất bại', message);
    },
  });
};
