import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  CreateRecipePayload,
  RecipeMenuCategory,
  RecipeIngredientOption,
  RecipeLine,
  RecipeMenuItem,
  RecipeMenuListParams,
  RecipeMenuListResult,
  UpdateRecipePayload,
} from '@modules/recipe/types/recipe.types';

interface BackendPageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface BackendMenuItemResponse {
  id: string;
  categoryId: string | null;
  name: string;
  basePrice: number;
  unit: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isSyncDelivery: boolean;
  createdAt: string;
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

interface BackendCategoryResponse {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface BackendRecipeResponse {
  id: string;
  targetItemId: string;
  ingredientItemId: string;
  quantity: number | string;
  unit: string | null;
}

const INVENTORY_PAGE_SIZE = 100;

// Type `INGREDIENT` là catalog nguyên liệu tenant dùng chung cho kho và công thức.
const INGREDIENT_ITEM_TYPE = 'INGREDIENT';

/**
 * Lấy toàn bộ dữ liệu phân trang để FE có đủ dữ liệu cho filter client-side.
 */
const fetchAllPages = async <T>(
  url: string,
  params?: Record<string, string | number | undefined>
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
    })
  );

  return [firstPage.content, ...remainingPages].flat();
};

/**
 * Chuẩn hóa món bán cho màn quản lý công thức.
 */
const mapMenuItem = (item: BackendMenuItemResponse): RecipeMenuItem => {
  return {
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    basePrice: Number(item.basePrice),
    unit: item.unit ?? '',
    isActive: item.isActive,
    createdAt: item.createdAt,
  };
};

/**
 * Chuẩn hóa danh mục món để dùng cho bộ lọc của màn recipe.
 */
const mapMenuCategory = (category: BackendCategoryResponse): RecipeMenuCategory => {
  return {
    id: category.id,
    name: category.name,
  };
};

interface InventoryReferenceSnapshot {
  branchIds: string[];
  quantity: number | null;
  unit: string;
}

/**
 * Gộp tồn kho theo item để giữ dữ liệu tham chiếu cho màn công thức.
 */
const mapInventoryReferenceByItem = (
  balances: BackendInventoryBalanceResponse[]
): Map<string, InventoryReferenceSnapshot> => {
  const referenceMap = new Map<string, InventoryReferenceSnapshot>();

  balances.forEach((balance) => {
    const quantity = Number(balance.quantity);
    const currentReference = referenceMap.get(balance.itemId);

    if (!currentReference) {
      referenceMap.set(balance.itemId, {
        branchIds: [balance.branchId],
        quantity: Number.isFinite(quantity) ? quantity : 0,
        unit: balance.unit ?? '',
      });
      return;
    }

    currentReference.quantity = (currentReference.quantity ?? 0) + (Number.isFinite(quantity) ? quantity : 0);

    if (!currentReference.branchIds.includes(balance.branchId)) {
      currentReference.branchIds.push(balance.branchId);
    }

    if (!currentReference.unit && balance.unit) {
      currentReference.unit = balance.unit;
    }
  });

  return referenceMap;
};

/**
 * Ghép catalog nguyên liệu với tồn kho tham chiếu để recipe vừa tạo được ngay, vừa vẫn nhìn được tồn nếu có.
 */
const mapIngredientOptions = (
  ingredients: BackendIngredientCatalogResponse[],
  balances: BackendInventoryBalanceResponse[]
): RecipeIngredientOption[] => {
  const inventoryReferenceMap = mapInventoryReferenceByItem(balances);

  return ingredients
    .map((ingredient) => {
      const inventoryReference = inventoryReferenceMap.get(ingredient.id);

      return {
        itemId: ingredient.id,
        itemName: ingredient.name,
        unit: ingredient.unit ?? inventoryReference?.unit ?? '',
        branchIds: inventoryReference?.branchIds ?? [],
        quantity: inventoryReference?.quantity ?? null,
      };
    })
    .sort((left, right) => left.itemName.localeCompare(right.itemName, 'vi'));
};

/**
 * Chuẩn hóa response công thức về dạng dùng chung cho FE.
 * Tên nguyên liệu sẽ được hook enrich thêm từ danh sách nguyên liệu.
 */
const mapRecipeLine = (line: BackendRecipeResponse): RecipeLine => {
  return {
    id: line.id,
    targetItemId: line.targetItemId,
    ingredientItemId: line.ingredientItemId,
    ingredientName: line.ingredientItemId,
    quantity: Number(line.quantity),
    unit: line.unit ?? '',
    availableQuantity: null,
  };
};

/**
 * Lấy catalog nguyên liệu cấp tenant để tạo công thức ngay cả khi item chưa nhập kho.
 */
const fetchAllIngredientCatalogPages = async (): Promise<BackendIngredientCatalogResponse[]> => {
  return fetchAllPages<BackendIngredientCatalogResponse>('/menu/items', {
    type: INGREDIENT_ITEM_TYPE,
  });
};

/**
 * Lấy toàn bộ snapshot tồn kho hiện có để enrich phần tồn tham chiếu.
 */
const fetchAllInventoryBalancePages = async (): Promise<BackendInventoryBalanceResponse[]> => {
  return fetchAllPages<BackendInventoryBalanceResponse>('/inventory');
};

/**
 * Catalog là nguồn chính của recipe; tồn kho chỉ là dữ liệu bổ sung nếu lấy được.
 */
const fetchRecipeIngredientOptions = async (): Promise<RecipeIngredientOption[]> => {
  const [catalogResult, balancesResult] = await Promise.allSettled([
    fetchAllIngredientCatalogPages(),
    fetchAllInventoryBalancePages(),
  ]);

  if (catalogResult.status !== 'fulfilled') {
    throw catalogResult.reason;
  }

  const balances = balancesResult.status === 'fulfilled' ? balancesResult.value : [];

  return mapIngredientOptions(catalogResult.value, balances);
};

/**
 * Service cho màn quản lý công thức.
 */
export const recipeService = {
  /**
   * Lấy danh sách món bán theo trang nhỏ để giảm tải khi số lượng món lớn.
   */
  getMenuItems: async (params?: RecipeMenuListParams): Promise<RecipeMenuListResult> => {
    const response = await api.get<ApiResponse<BackendPageResponse<BackendMenuItemResponse>>>('/menu/items', {
      params: {
        keyword: params?.keyword?.trim() ? params.keyword.trim() : undefined,
        page: params?.page ?? 0,
        size: params?.size ?? 10,
      },
    });

    const pageData = response.data.data;

    return {
      items: pageData.content.map(mapMenuItem),
      page: pageData.page,
      size: pageData.size,
      totalElements: pageData.totalElements,
      totalPages: pageData.totalPages,
      hasNext: pageData.page + 1 < pageData.totalPages,
    };
  },

  /**
   * Lấy danh sách danh mục active cho bộ lọc món bán.
   */
  getMenuCategories: async (): Promise<RecipeMenuCategory[]> => {
    const response = await api.get<ApiResponse<BackendCategoryResponse[]>>('/menu/categories/active');
    return response.data.data.map(mapMenuCategory).sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  },

  /**
   * Lấy danh sách nguyên liệu từ catalog `INGREDIENT` và ghép tồn kho tham chiếu nếu có.
   */
  getIngredientOptions: async (): Promise<RecipeIngredientOption[]> => {
    return fetchRecipeIngredientOptions();
  },

  /**
   * Lấy danh sách dòng công thức của một món bán.
   */
  getRecipeByItem: async (itemId: string): Promise<RecipeLine[]> => {
    const response = await api.get<ApiResponse<BackendRecipeResponse[]>>(`/menu/items/${itemId}/recipe`);
    return response.data.data.map(mapRecipeLine);
  },

  /**
   * Tạo mới một dòng công thức.
   */
  createRecipe: async (payload: CreateRecipePayload): Promise<RecipeLine> => {
    const response = await api.post<ApiResponse<BackendRecipeResponse>>('/menu/recipes', {
      targetItemId: payload.targetItemId,
      ingredientItemId: payload.ingredientItemId,
      quantity: payload.quantity,
      unit: payload.unit.trim(),
    });

    return mapRecipeLine(response.data.data);
  },

  /**
   * Cập nhật định lượng của một dòng công thức.
   */
  updateRecipe: async (recipeId: string, payload: UpdateRecipePayload): Promise<RecipeLine> => {
    const response = await api.put<ApiResponse<BackendRecipeResponse>>(`/menu/recipes/${recipeId}`, {
      quantity: payload.quantity,
      unit: payload.unit.trim(),
    });

    return mapRecipeLine(response.data.data);
  },

  /**
   * Xóa một dòng công thức.
   */
  deleteRecipe: async (recipeId: string): Promise<void> => {
    await api.delete(`/menu/recipes/${recipeId}`);
  },
};
