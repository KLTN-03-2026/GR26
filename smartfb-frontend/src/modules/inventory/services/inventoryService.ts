import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  AdjustStockPayload,
  ImportStockPayload,
  InventoryBalance,
  InventoryCatalogItem,
  InventoryCatalogItemType,
  InventoryItemOption,
  InventoryListResult,
  InventoryResolvedItemType,
  InventoryTransaction,
  InventoryTransactionListResult,
  InventoryTransactionParams,
  ProductionBatch,
  ProductionBatchListResult,
  ProductionBatchParams,
  RecordProductionBatchPayload,
  UpdateThresholdPayload,
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

interface BackendCatalogItemResponse {
  id: string;
  name: string;
  unit: string | null;
}

interface BackendTransactionResponse {
  id: string;
  type: string;
  itemId: string;
  itemName: string | null;
  quantity: number | string;
  costPerUnit: number | string | null;
  userId: string | null;
  staffName: string | null;
  referenceId: string | null;
  referenceType: string | null;
  note: string | null;
  createdAt: string;
}

interface BackendProductionBatchResponse {
  id: string;
  subAssemblyItemId: string;
  subAssemblyItemName: string | null;
  expectedOutput: number | string;
  actualOutput: number | string;
  deltaOutput: number | string;
  unit: string;
  producedBy: string | null;
  staffName: string | null;
  producedAt: string;
  note: string | null;
  status: string;
  createdAt: string;
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
const mapInventoryBalance = (
  balance: BackendInventoryBalanceResponse,
  itemType: InventoryResolvedItemType,
): InventoryBalance => {
  return {
    id: balance.id,
    branchId: balance.branchId,
    itemId: balance.itemId,
    itemName: balance.itemName,
    unit: balance.unit,
    itemType,
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
 * Tạo map itemId -> type từ catalog để FE tách nguyên liệu và bán thành phẩm trong cùng bảng tồn kho.
 */
const buildCatalogTypeMap = (catalogItems: InventoryCatalogItem[]): Map<string, InventoryCatalogItemType> => {
  return new Map(catalogItems.map((item) => [item.id, item.type]));
};

/**
 * Chuẩn hóa response mẻ sản xuất để UI xử lý số liệu và trạng thái ổn định.
 */
const mapProductionBatch = (batch: BackendProductionBatchResponse): ProductionBatch => {
  return {
    id: batch.id,
    subAssemblyItemId: batch.subAssemblyItemId,
    subAssemblyItemName: batch.subAssemblyItemName,
    expectedOutput: Number(batch.expectedOutput),
    actualOutput: Number(batch.actualOutput),
    deltaOutput: Number(batch.deltaOutput),
    unit: batch.unit,
    producedBy: batch.producedBy,
    staffName: batch.staffName,
    producedAt: batch.producedAt,
    note: batch.note,
    status: batch.status as ProductionBatch['status'],
    createdAt: batch.createdAt,
  };
};

/**
 * Lấy toàn bộ các trang tồn kho để frontend filter đầy đủ theo từ khóa và chi nhánh.
 */
const fetchAllInventoryPages = async (
  catalogTypeMap?: Map<string, InventoryCatalogItemType>,
): Promise<InventoryBalance[]> => {
  const balances = await fetchAllPages<BackendInventoryBalanceResponse>('/inventory');
  return balances.map((balance) =>
    mapInventoryBalance(balance, catalogTypeMap?.get(balance.itemId) ?? 'UNKNOWN'),
  );
};

/**
 * Lấy catalog item cấp tenant theo type.
 * Dùng để tách nguồn nguyên liệu và bán thành phẩm khỏi snapshot tồn kho.
 */
const fetchAllCatalogPages = async (
  type: InventoryCatalogItemType,
): Promise<InventoryCatalogItem[]> => {
  const items = await fetchAllPages<BackendCatalogItemResponse>('/menu/items', {
    type,
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
    type,
  }));
};

/**
 * Service gọi API inventory.
 * FE hiện dùng nhóm endpoint xem tồn kho, catalog item, nhập kho, sản xuất, điều chỉnh và hao hụt.
 */
export const inventoryService = {
  /**
   * Lấy toàn bộ tồn kho để frontend có thể filter/paginate client-side.
   */
  getList: async (): Promise<InventoryListResult> => {
    const [ingredientCatalogResult, semiProductCatalogResult] = await Promise.allSettled([
      fetchAllCatalogPages('INGREDIENT'),
      fetchAllCatalogPages('SUB_ASSEMBLY'),
    ]);
    const catalogItems = [
      ...(ingredientCatalogResult.status === 'fulfilled' ? ingredientCatalogResult.value : []),
      ...(semiProductCatalogResult.status === 'fulfilled' ? semiProductCatalogResult.value : []),
    ];
    const catalogTypeMap = buildCatalogTypeMap(catalogItems);
    const balances = await fetchAllInventoryPages(catalogTypeMap);

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
    const ingredients = await fetchAllCatalogPages('INGREDIENT');

    return ingredients
      .map(mapInventoryItemOption)
      .sort((left, right) => left.itemName.localeCompare(right.itemName, 'vi'));
  },

  /**
   * Lấy danh mục bán thành phẩm toàn tenant để tab bán thành phẩm thao tác trên catalog `SUB_ASSEMBLY`.
   */
  getSemiProductOptions: async (): Promise<InventoryItemOption[]> => {
    const semiProducts = await fetchAllCatalogPages('SUB_ASSEMBLY');

    return semiProducts
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

  /**
   * Ghi nhận một mẻ sản xuất bán thành phẩm.
   * Backend sẽ tự sinh `PRODUCTION_OUT` cho đầu vào và `PRODUCTION_IN` cho đầu ra.
   */
  recordProductionBatch: async (payload: RecordProductionBatchPayload): Promise<ApiResponse<string>> => {
    const response = await api.post<ApiResponse<string>>('/inventory/production-batches', {
      subAssemblyItemId: payload.subAssemblyItemId,
      expectedOutputQuantity: payload.expectedOutputQuantity,
      actualOutputQuantity: payload.actualOutputQuantity,
      unit: payload.unit.trim(),
      note: payload.note?.trim() ? payload.note.trim() : null,
    });

    return response.data;
  },

  /**
   * Cập nhật mức tồn tối thiểu để hệ thống tự động đánh dấu low-stock.
   * Endpoint: PATCH /inventory/balances/{id}/threshold
   */
  updateThreshold: async (payload: UpdateThresholdPayload): Promise<ApiResponse<void>> => {
    const response = await api.patch<ApiResponse<void>>(
      `/inventory/balances/${payload.balanceId}/threshold`,
      { minLevel: payload.minLevel },
    );

    return response.data;
  },

  /**
   * Lấy lịch sử giao dịch kho (server-side pagination).
   * Hỗ trợ lọc theo loại giao dịch và khoảng thời gian.
   */
  getTransactions: async (params?: InventoryTransactionParams): Promise<InventoryTransactionListResult> => {
    const response = await api.get<ApiResponse<BackendPageResponse<BackendTransactionResponse>>>(
      '/inventory/transactions',
      {
        params: {
          type: params?.type ?? undefined,
          from: params?.from ?? undefined,
          to: params?.to ?? undefined,
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        },
      },
    );

    const page = response.data.data;

    const data: InventoryTransaction[] = page.content.map((item) => ({
      id: item.id,
      type: item.type as InventoryTransaction['type'],
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: Number(item.quantity),
      costPerUnit: item.costPerUnit != null ? Number(item.costPerUnit) : null,
      userId: item.userId,
      staffName: item.staffName,
      referenceId: item.referenceId,
      referenceType: item.referenceType,
      note: item.note,
      createdAt: item.createdAt,
    }));

    return {
      data,
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      page: page.page,
      size: page.size,
    };
  },

  /**
   * Lấy lịch sử mẻ sản xuất bán thành phẩm theo chi nhánh đang làm việc.
   */
  getProductionBatches: async (params?: ProductionBatchParams): Promise<ProductionBatchListResult> => {
    const response = await api.get<ApiResponse<BackendPageResponse<BackendProductionBatchResponse>>>(
      '/inventory/production-batches',
      {
        params: {
          page: params?.page ?? 0,
          size: params?.size ?? 20,
        },
      },
    );

    const page = response.data.data;

    return {
      data: page.content.map(mapProductionBatch),
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      page: page.page,
      size: page.size,
    };
  },

  /**
   * Lấy chi tiết một mẻ sản xuất bán thành phẩm.
   */
  getProductionBatch: async (id: string): Promise<ProductionBatch> => {
    const response = await api.get<ApiResponse<BackendProductionBatchResponse>>(
      `/inventory/production-batches/${id}`,
    );

    return mapProductionBatch(response.data.data);
  },
};
