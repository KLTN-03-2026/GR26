import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse, PaginatedResult } from '@shared/types/api.types';
import type {
  BranchMenuItemConfig,
  CreateMenuAddonPayload,
  CreateMenuCategoryPayload,
  MenuAddonInfo,
  MenuCategory,
  MenuItem,
  MenuListParams,
  CreateMenuPayload,
  UpdateMenuCategoryPayload,
  UpdateMenuAddonPayload,
  UpdateMenuPayload,
  MenuCategoryInfo,
  UpdateBranchMenuItemPayload,
} from '@modules/menu/types/menu.types';
import { NO_MENU_CATEGORY_LABEL, NO_MENU_CATEGORY_VALUE } from '@modules/menu/constants/menu.constants';

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

interface BackendCategoryResponse {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface BackendAddonResponse {
  id: string;
  name: string;
  extraPrice: number;
  isActive: boolean;
}

interface BackendBranchItemResponse {
  branchId: string;
  itemId: string;
  itemName: string;
  basePrice: number;
  branchPrice: number | null;
  effectivePrice: number;
  isAvailable: boolean;
}

interface BackendCreateMenuItemPayload {
  categoryId: string | null;
  name: string;
  basePrice: number;
  unit: string | null;
  imageUrl: string | null;
  isSyncDelivery: boolean;
}

interface BackendUpdateMenuItemPayload extends BackendCreateMenuItemPayload {
  isActive: boolean;
}

interface BackendCreateCategoryPayload {
  name: string;
  description: string | null;
  displayOrder: number;
}

interface BackendUpdateCategoryPayload extends BackendCreateCategoryPayload {
  isActive: boolean;
}

interface BackendCreateAddonPayload {
  name: string;
  extraPrice: number;
}

interface BackendUpdateAddonPayload extends BackendCreateAddonPayload {
  isActive: boolean;
}

interface BackendSetBranchItemPricePayload {
  branchPrice: number | null;
  isAvailable: boolean;
}

const PAGE_SIZE = 100;

/**
 * Chuẩn hóa ID danh mục để FE dùng nhất quán trong filter và form.
 */
const normalizeCategoryId = (categoryId?: string | null): MenuCategory => {
  return categoryId ?? NO_MENU_CATEGORY_VALUE;
};

/**
 * Chuyển response món ăn từ backend sang model UI của frontend.
 */
const mapMenuItem = (item: BackendMenuItemResponse): MenuItem => {
  const createdAt = Date.parse(item.createdAt);

  return {
    id: item.id,
    name: item.name,
    category: normalizeCategoryId(item.categoryId),
    categoryName: item.categoryId ? undefined : NO_MENU_CATEGORY_LABEL,
    price: Number(item.basePrice),
    basePrice: Number(item.basePrice),
    branchPrice: null,
    effectivePrice: Number(item.basePrice),
    cost: undefined,
    gpPercent: 0,
    image: item.imageUrl ?? '',
    status: item.isActive ? 'selling' : 'hidden',
    tags: [],
    soldCount: 0,
    createdAt: Number.isNaN(createdAt) ? Date.now() : createdAt,
    description: undefined,
    ingredients: [],
    isAvailable: item.isActive,
    unit: item.unit ?? '',
    isSyncDelivery: item.isSyncDelivery,
    isActive: item.isActive,
  };
};

/**
 * Chuyển response cấu hình món theo chi nhánh sang model frontend.
 */
const mapBranchItem = (item: BackendBranchItemResponse): BranchMenuItemConfig => {
  return {
    branchId: item.branchId,
    itemId: item.itemId,
    itemName: item.itemName,
    basePrice: Number(item.basePrice),
    branchPrice: item.branchPrice === null ? null : Number(item.branchPrice),
    effectivePrice: Number(item.effectivePrice),
    isAvailable: Boolean(item.isAvailable),
  };
};

/**
 * Chuyển response danh mục từ backend sang model filter/form của frontend.
 */
const mapCategory = (category: BackendCategoryResponse): MenuCategoryInfo => {
  return {
    id: category.id,
    name: category.name,
    description: category.description ?? undefined,
    count: 0,
    isActive: category.isActive,
    displayOrder: category.displayOrder,
  };
};

/**
 * Chuyển response addon từ backend sang model hiển thị của frontend.
 */
const mapAddon = (addon: BackendAddonResponse): MenuAddonInfo => {
  return {
    id: addon.id,
    name: addon.name,
    extraPrice: Number(addon.extraPrice),
    isActive: addon.isActive,
  };
};

/**
 * Gom toàn bộ dữ liệu phân trang từ backend để FE có thể filter client-side đầy đủ.
 */
const fetchAllPages = async <T>(
  url: string,
  params?: Record<string, string | number | undefined>
): Promise<T[]> => {
  const firstResponse = await api.get<ApiResponse<BackendPageResponse<T>>>(url, {
    params: {
      ...params,
      page: 0,
      size: PAGE_SIZE,
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
          size: PAGE_SIZE,
        },
      });

      return response.data.data.content;
    })
  );

  return [firstPage.content, ...remainingPages].flat();
};

/**
 * Chuyển payload tạo/cập nhật từ form frontend sang contract backend.
 */
const toMenuPayload = (payload: CreateMenuPayload | UpdateMenuPayload): BackendCreateMenuItemPayload => {
  return {
    categoryId: payload.category && payload.category !== NO_MENU_CATEGORY_VALUE ? payload.category : null,
    name: payload.name ?? '',
    basePrice: payload.price ?? 0,
    unit: payload.unit?.trim() ? payload.unit.trim() : null,
    imageUrl: payload.image?.trim() ? payload.image.trim() : null,
    isSyncDelivery: Boolean(payload.isSyncDelivery),
  };
};

/**
 * Chuyển payload tạo danh mục từ frontend sang contract backend.
 */
const toCategoryPayload = (payload: CreateMenuCategoryPayload): BackendCreateCategoryPayload => {
  return {
    name: payload.name.trim(),
    description: payload.description?.trim() ? payload.description.trim() : null,
    displayOrder: payload.displayOrder ?? 0,
  };
};

/**
 * Chuyển payload cập nhật danh mục sang contract backend.
 */
const toUpdateCategoryPayload = (payload: UpdateMenuCategoryPayload): BackendUpdateCategoryPayload => {
  return {
    ...toCategoryPayload(payload),
    isActive: payload.isActive,
  };
};

/**
 * Chuyển payload tạo addon sang contract backend.
 */
const toAddonPayload = (payload: CreateMenuAddonPayload): BackendCreateAddonPayload => {
  return {
    name: payload.name.trim(),
    extraPrice: payload.extraPrice,
  };
};

/**
 * Chuyển payload cập nhật addon sang contract backend.
 */
const toUpdateAddonPayload = (payload: UpdateMenuAddonPayload): BackendUpdateAddonPayload => {
  return {
    ...toAddonPayload(payload),
    isActive: payload.isActive,
  };
};

/**
 * Chuyển payload cập nhật món theo chi nhánh sang contract backend.
 */
const toBranchItemPayload = (
  payload: UpdateBranchMenuItemPayload
): BackendSetBranchItemPricePayload => {
  return {
    branchPrice: payload.branchPrice,
    isAvailable: payload.isAvailable,
  };
};

/**
 * Service cho các thao tác API với menu
 */
export const menuService = {
  /**
   * Lấy danh sách món ăn với filter và pagination
   */
  getList: async (params?: MenuListParams): Promise<PaginatedResult<MenuItem>> => {
    const items = await fetchAllPages<BackendMenuItemResponse>('/menu/items', {
      keyword: typeof params?.search === 'string' && params.search.trim() ? params.search.trim() : undefined,
    });

    const mappedItems = items.map(mapMenuItem);

    return {
      data: mappedItems,
      meta: {
        current_page: 1,
        per_page: mappedItems.length,
        total: mappedItems.length,
        last_page: 1,
      },
    };
  },

  /**
   * Lấy chi tiết món ăn theo ID
   */
  getById: async (id: string): Promise<ApiResponse<MenuItem>> => {
    const response = await api.get<ApiResponse<BackendMenuItemResponse>>(`/menu/items/${id}`);

    return {
      ...response.data,
      data: mapMenuItem(response.data.data),
    };
  },

  /**
   * Tạo mới món ăn
   */
  create: async (payload: CreateMenuPayload): Promise<ApiResponse<MenuItem>> => {
    const response = await api.post<ApiResponse<BackendMenuItemResponse>>('/menu/items', toMenuPayload(payload));

    return {
      ...response.data,
      data: mapMenuItem(response.data.data),
    };
  },

  /**
   * Cập nhật món ăn
   */
  update: async (id: string, payload: UpdateMenuPayload): Promise<ApiResponse<MenuItem>> => {
    const response = await api.put<ApiResponse<BackendMenuItemResponse>>(`/menu/items/${id}`, {
      ...toMenuPayload(payload),
      isActive: payload.isActive ?? payload.isAvailable ?? true,
    } satisfies BackendUpdateMenuItemPayload);

    return {
      ...response.data,
      data: mapMenuItem(response.data.data),
    };
  },

  /**
   * Xóa món ăn
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/menu/items/${id}`);
    return response.data;
  },

  /**
   * Toggle trạng thái bán hàng (isAvailable)
   */
  toggle: async (menu: MenuItem, isAvailable: boolean): Promise<ApiResponse<MenuItem>> => {
    return menuService.update(menu.id, {
      name: menu.name,
      category: menu.category,
      price: menu.price,
      image: menu.image,
      unit: menu.unit,
      isSyncDelivery: menu.isSyncDelivery,
      isActive: isAvailable,
      isAvailable,
    });
  },

  /**
   * Cập nhật trạng thái kinh doanh
   */
  updateStatus: async (
    id: string,
    status: 'selling' | 'hidden'
  ): Promise<ApiResponse<MenuItem>> => {
    const currentMenu = await menuService.getById(id);

    return menuService.toggle(currentMenu.data, status === 'selling');
  },

  /**
   * Lấy danh sách danh mục
   */
  getCategories: async (): Promise<ApiResponse<MenuCategoryInfo[]>> => {
    const categories = await fetchAllPages<BackendCategoryResponse>('/menu/categories');

    return {
      success: true,
      data: categories.map(mapCategory),
    };
  },

  /**
   * Tạo mới danh mục món ăn
   */
  createCategory: async (payload: CreateMenuCategoryPayload): Promise<ApiResponse<MenuCategoryInfo>> => {
    const response = await api.post<ApiResponse<BackendCategoryResponse>>(
      '/menu/categories',
      toCategoryPayload(payload)
    );

    return {
      ...response.data,
      data: mapCategory(response.data.data),
    };
  },

  /**
   * Cập nhật thông tin danh mục món ăn
   */
  updateCategory: async (
    id: string,
    payload: UpdateMenuCategoryPayload
  ): Promise<ApiResponse<MenuCategoryInfo>> => {
    const response = await api.put<ApiResponse<BackendCategoryResponse>>(
      `/menu/categories/${id}`,
      toUpdateCategoryPayload(payload)
    );

    return {
      ...response.data,
      data: mapCategory(response.data.data),
    };
  },

  /**
   * Xóa mềm danh mục món ăn
   */
  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/menu/categories/${id}`);
  },

  /**
   * Lấy danh sách addon/topping trong menu.
   */
  getAddons: async (): Promise<ApiResponse<MenuAddonInfo[]>> => {
    const addons = await fetchAllPages<BackendAddonResponse>('/menu/addons');

    return {
      success: true,
      data: addons.map(mapAddon),
    };
  },

  /**
   * Tạo mới addon/topping.
   */
  createAddon: async (payload: CreateMenuAddonPayload): Promise<ApiResponse<MenuAddonInfo>> => {
    const response = await api.post<ApiResponse<BackendAddonResponse>>('/menu/addons', toAddonPayload(payload));

    return {
      ...response.data,
      data: mapAddon(response.data.data),
    };
  },

  /**
   * Cập nhật thông tin addon/topping.
   */
  updateAddon: async (
    id: string,
    payload: UpdateMenuAddonPayload
  ): Promise<ApiResponse<MenuAddonInfo>> => {
    const response = await api.put<ApiResponse<BackendAddonResponse>>(
      `/menu/addons/${id}`,
      toUpdateAddonPayload(payload)
    );

    return {
      ...response.data,
      data: mapAddon(response.data.data),
    };
  },

  /**
   * Xóa mềm addon/topping.
   */
  deleteAddon: async (id: string): Promise<void> => {
    await api.delete(`/menu/addons/${id}`);
  },

  /**
   * Lấy cấu hình món ăn tại một chi nhánh cụ thể.
   */
  getBranchItem: async (
    branchId: string,
    itemId: string
  ): Promise<ApiResponse<BranchMenuItemConfig>> => {
    const response = await api.get<ApiResponse<BackendBranchItemResponse>>(
      `/menu/branches/${branchId}/items/${itemId}`
    );

    return {
      ...response.data,
      data: mapBranchItem(response.data.data),
    };
  },

  /**
   * Cập nhật giá và trạng thái phục vụ món ăn theo chi nhánh.
   */
  updateBranchItem: async (
    branchId: string,
    itemId: string,
    payload: UpdateBranchMenuItemPayload
  ): Promise<ApiResponse<void>> => {
    const response = await api.put<ApiResponse<void>>(
      `/menu/branches/${branchId}/items/${itemId}/price`,
      toBranchItemPayload(payload)
    );

    return response.data;
  },

  /**
   * Upload ảnh món ăn (mock)
   */
  uploadImage: async (formData: FormData): Promise<ApiResponse<{ url: string }>> => {
    void formData;

    return {
      success: true,
      data: {
        url: '',
      },
      message: 'Backend chưa hỗ trợ upload ảnh trực tiếp cho menu',
    };
  },
};
