import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { useToast } from '@shared/hooks/useToast';
import { tableService } from '@modules/table/services/tableService';
import type {
  CreateBulkTablesPayload,
  CreateBulkTablesResult,
  CreateTablePayload,
} from '@modules/table/types/table.types';

/**
 * Sinh danh sách payload tạo bàn theo tiền tố và số bắt đầu.
 */
const buildBulkCreatePayloads = (payload: CreateBulkTablesPayload): CreateTablePayload[] => {
  const normalizedPrefix = payload.namePrefix.trim();

  return Array.from({ length: payload.quantity }, (_, index) => ({
    zoneId: payload.zoneId,
    name: `${normalizedPrefix}${payload.startNumber + index}`,
    capacity: payload.capacity,
  }));
};

/**
 * Hook tạo nhiều bàn cùng lúc bằng cách gọi lại API tạo bàn hiện có.
 */
export const useCreateBulkTables = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  return useMutation({
    mutationFn: async (payload: CreateBulkTablesPayload): Promise<CreateBulkTablesResult> => {
      const createPayloads = buildBulkCreatePayloads(payload);
      const settledResults = await Promise.allSettled(
        createPayloads.map((item) => tableService.create(item))
      );

      const createdTables: CreateBulkTablesResult['createdTables'] = [];
      const failedTables: CreateBulkTablesResult['failedTables'] = [];

      settledResults.forEach((result, index) => {
        const tableName = createPayloads[index]?.name ?? `Bàn ${index + 1}`;

        if (result.status === 'fulfilled') {
          createdTables.push(result.value);
          return;
        }

        failedTables.push({
          name: tableName,
          message: result.reason instanceof Error ? result.reason.message : 'Không thể tạo bàn',
        });
      });

      if (createdTables.length === 0 && failedTables.length > 0) {
        throw new Error(failedTables[0].message);
      }

      return {
        createdTables,
        failedTables,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.list() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tables.zones });

      if (result.failedTables.length === 0) {
        success('Tạo bàn hàng loạt thành công', `Đã tạo ${result.createdTables.length} bàn mới`);
        return;
      }

      success(
        'Tạo bàn hàng loạt hoàn tất',
        `Đã tạo ${result.createdTables.length} bàn, lỗi ${result.failedTables.length} bàn`
      );
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Vui lòng thử lại';
      error('Tạo bàn hàng loạt thất bại', message);
    },
  });
};
