import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { inventoryService } from '../services/inventoryService';
import type { InventoryTransactionParams } from '../types/inventory.types';

/**
 * Hook lấy lịch sử giao dịch kho với server-side pagination và filter.
 * Hỗ trợ lọc theo loại giao dịch (IMPORT, WASTE, ADJUSTMENT...) và khoảng thời gian.
 *
 * @param params - Tham số filter: type, from, to, page, size
 */
export const useInventoryTransactions = (params?: InventoryTransactionParams) => {
  return useQuery({
    queryKey: queryKeys.inventory.transactions.list({
      type: params?.type ?? null,
      from: params?.from ?? null,
      to: params?.to ?? null,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    }),
    queryFn: () => inventoryService.getTransactions(params),
    staleTime: 30 * 1000, // 30 giây — lịch sử cần tươi hơn balance
    retry: 1,
  });
};
