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

/**
 * Gộp nhiều dòng tồn kho cùng item thành một option nguyên liệu duy nhất.
 * Dùng tổng quantity để chủ quán có cảm nhận sơ bộ về lượng hàng đang có.
 */
const mapIngredientOptions = (
  balances: BackendInventoryBalanceResponse[]
): RecipeIngredientOption[] => {
  const optionMap = new Map<string, RecipeIngredientOption>();

  balances.forEach((balance) => {
    const itemName = balance.itemName?.trim();

    if (!itemName) {
      return;
    }

    const quantity = Number(balance.quantity);
    const currentOption = optionMap.get(balance.itemId);

    if (!currentOption) {
      optionMap.set(balance.itemId, {
        itemId: balance.itemId,
        itemName,
        unit: balance.unit ?? '',
        branchIds: [balance.branchId],
        quantity: Number.isFinite(quantity) ? quantity : 0,
      });
      return;
    }

    currentOption.quantity += Number.isFinite(quantity) ? quantity : 0;

    if (!currentOption.branchIds.includes(balance.branchId)) {
      currentOption.branchIds.push(balance.branchId);
    }

    if (!currentOption.unit && balance.unit) {
      currentOption.unit = balance.unit;
    }
  });

  return Array.from(optionMap.values()).sort((left, right) => left.itemName.localeCompare(right.itemName, 'vi'));
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
   * Lấy danh sách nguyên liệu khả dụng dựa trên dữ liệu tồn kho hiện có.
   */
  getIngredientOptions: async (): Promise<RecipeIngredientOption[]> => {
    const balances = await fetchAllPages<BackendInventoryBalanceResponse>('/inventory');
    return mapIngredientOptions(balances);
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
