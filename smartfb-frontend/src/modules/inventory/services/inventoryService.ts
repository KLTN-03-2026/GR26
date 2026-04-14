import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  AdjustStockPayload,
  ImportStockPayload,
  InventoryBalance,
  InventoryCatalogItem,
  InventoryItemOption,
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

interface BackendIngredientCatalogResponse {
  id: string;
  name: string;
  unit: string | null;
}

const INVENTORY_PAGE_SIZE = 100;

/**
 * Tải toàn bộ các trang từ backend để FE có thể thao tác filter client-side nhất quán.
 */
const fetchAllPages = async <T>(
  url: string,
  params?: Record<string, string | number | undefined>,
): Promise<T[]> => {
  const firstResponse = await api.get<ApiResponse<BackendPageResponse<T>>>(url, {
    params: {
      ...params,
      page: 0,
      size: INVENTORY_PAGE_SIZE,
    },
  });

  const firstPage = firstResponse.data.data;
  const pages = Array.from({ length: Math.max(firstPage.totalPages - 1, 0) }, (_, index) => index + 1);

  if (pages.length === 0) {
    return firstPage.content;
  }

  const remainingPages = await Promise.all(
    pages.map(async (page) => {
      const response = await api.get<ApiResponse<BackendPageResponse<T>>>(url, {
        params: {
          ...params,
          page,
          size: INVENTORY_PAGE_SIZE,
        },
      });

      return response.data.data.content;
    }),
  );

  return [firstPage.content, ...remainingPages].flat();
};

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
 * Chuyển item danh mục nguyên liệu sang option dùng cho form nhập kho.
 */
const mapInventoryItemOption = (item: InventoryCatalogItem): InventoryItemOption => {
  return {
    itemId: item.id,
    itemName: item.name,
    unit: item.unit,
  };
};

/**
 * Lấy toàn bộ các trang tồn kho để frontend filter đầy đủ theo từ khóa và chi nhánh.
 */
const fetchAllInventoryPages = async (): Promise<InventoryBalance[]> => {
  const balances = await fetchAllPages<BackendInventoryBalanceResponse>('/inventory');
  return balances.map(mapInventoryBalance);
};

/**
 * Lấy catalog nguyên liệu cấp tenant.
 * Dùng cho thao tác nhập kho lần đầu trước khi item có balance ở chi nhánh.
 */
const fetchAllIngredientCatalogPages = async (): Promise<InventoryCatalogItem[]> => {
  const ingredients = await fetchAllPages<BackendIngredientCatalogResponse>('/menu/items', {
    type: 'INGREDIENT',
  });

  return ingredients.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
  }));
};

/**
 * Service gọi API inventory.
 * FE hiện dùng nhóm endpoint xem tồn kho, catalog nguyên liệu, nhập kho, điều chỉnh và hao hụt.
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
   * Lấy danh mục nguyên liệu toàn tenant để form nhập kho chọn item nguồn.
   */
  getIngredientOptions: async (): Promise<InventoryItemOption[]> => {
    const ingredients = await fetchAllIngredientCatalogPages();

    return ingredients
      .map(mapInventoryItemOption)
      .sort((left, right) => left.itemName.localeCompare(right.itemName, 'vi'));
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
