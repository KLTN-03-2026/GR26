import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  AdjustStockPayload,
  ImportStockPayload,
  InventoryBalance,
  InventoryListResult,
  WasteRecordPayload,
} from '../types/inventory.types';

interface BackendPageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface BackendInventoryBalanceResponse {
  id: string;
  branchId: string;
  itemId: string;
  itemName: string | null;
  unit: string | null;
  quantity: number | string;
  minLevel: number | string;
  isLowStock: boolean;
  updatedAt: string;
}

const INVENTORY_PAGE_SIZE = 100;

/**
 * Chuyển response tồn kho từ backend sang model frontend.
 */
const mapInventoryBalance = (balance: BackendInventoryBalanceResponse): InventoryBalance => {
  return {
    id: balance.id,
    branchId: balance.branchId,
    itemId: balance.itemId,
    itemName: balance.itemName,
    unit: balance.unit,
    quantity: Number(balance.quantity),
    minLevel: Number(balance.minLevel),
    isLowStock: balance.isLowStock,
    updatedAt: balance.updatedAt,
  };
};

/**
 * Lấy toàn bộ các trang tồn kho để frontend filter đầy đủ theo từ khóa và chi nhánh.
 */
const fetchAllInventoryPages = async (): Promise<InventoryBalance[]> => {
  const firstResponse = await api.get<ApiResponse<BackendPageResponse<BackendInventoryBalanceResponse>>>('/inventory', {
    params: {
      page: 0,
      size: INVENTORY_PAGE_SIZE,
    },
  });

  const firstPage = firstResponse.data.data;
  const pages = Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) => index + 1);

  if (pages.length === 0) {
    return firstPage.content.map(mapInventoryBalance);
  }

  const remainingPages = await Promise.all(
    pages.map(async (page) => {
      const response = await api.get<ApiResponse<BackendPageResponse<BackendInventoryBalanceResponse>>>('/inventory', {
        params: {
          page,
          size: INVENTORY_PAGE_SIZE,
        },
      });

      return response.data.data.content.map(mapInventoryBalance);
    }),
  );

  return [firstPage.content.map(mapInventoryBalance), ...remainingPages].flat();
};

/**
 * Service gọi API inventory.
 * Backend hiện chỉ có các endpoint xem tồn kho, nhập kho, điều chỉnh và hao hụt.
 */
export const inventoryService = {
  /**
   * Lấy toàn bộ tồn kho để frontend có thể filter/paginate client-side.
   */
  getList: async (): Promise<InventoryListResult> => {
    const balances = await fetchAllInventoryPages();

    return {
      data: balances,
      meta: {
        current_page: 1,
        per_page: balances.length,
        total: balances.length,
        last_page: 1,
      },
    };
  },

  /**
   * Gọi API nhập kho nguyên liệu.
   */
  importStock: async (payload: ImportStockPayload): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>('/inventory/import', {
      itemId: payload.itemId,
      supplierId: payload.supplierId?.trim() ? payload.supplierId.trim() : null,
      quantity: payload.quantity,
      costPerUnit: payload.costPerUnit,
      expiresAt: payload.expiresAt?.trim() ? new Date(payload.expiresAt).toISOString() : null,
      note: payload.note?.trim() ? payload.note.trim() : null,
    });

    return response.data;
  },

  /**
   * Gọi API điều chỉnh tồn kho thủ công.
   */
  adjustStock: async (payload: AdjustStockPayload): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/inventory/adjust', {
      itemId: payload.itemId,
      newQuantity: payload.newQuantity,
      reason: payload.reason.trim(),
    });

    return response.data;
  },

  /**
   * Gọi API ghi nhận hao hụt nguyên liệu.
   */
  recordWaste: async (payload: WasteRecordPayload): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/inventory/waste', {
      itemId: payload.itemId,
      quantity: payload.quantity,
      reason: payload.reason.trim(),
    });

    return response.data;
  },
};
