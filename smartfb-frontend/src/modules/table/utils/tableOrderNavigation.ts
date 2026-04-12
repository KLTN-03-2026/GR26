import type { TableDisplayItem } from '@modules/table/types/table.types';

/**
 * Build query string cho màn POS để có thể khôi phục lại đúng context của bàn sau khi refresh.
 */
export const buildTableOrderSearchParams = (
  table: TableDisplayItem,
  orderId?: string
) => {
  const searchParams = new URLSearchParams();

  if (orderId?.trim()) {
    searchParams.set('orderId', orderId.trim());
  }

  searchParams.set('tableId', table.id);
  searchParams.set('tableName', table.name);

  if (table.zoneId?.trim()) {
    searchParams.set('zoneId', table.zoneId);
  }

  if (table.branchName?.trim()) {
    searchParams.set('branchName', table.branchName);
  }

  return searchParams.toString();
};
