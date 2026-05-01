import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse, PaginatedResult } from '@shared/types/api.types';
import type {
  MenuItem,
  MenuListParams,
  CreateMenuPayload,
  UpdateMenuPayload,
  MenuCategoryInfo,
} from '@modules/menu/types/menu.types';
import { mockMenus } from '../data/mockMenus';
import { MENU_CATEGORIES } from '../constants/menu.constants';
import { calculateGpPercent } from '../schemas/menu.schema';

// State lưu trữ data để simulate CRUD
let menuData: MenuItem[] = [...mockMenus];

/**
 * Service cho các thao tác API với menu
 * Hiện tại dùng mock data, sẽ thay thế bằng API thật sau
 */
export const menuService = {
  /**
   * Lấy danh sách món ăn với filter và pagination
   */
  getList: async (params?: MenuListParams): Promise<PaginatedResult<MenuItem>> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    let result = [...menuData];

    // Apply filters
    if (params?.search) {
      result = result.filter((item) =>
        item.name.toLowerCase().includes(params.search!.toLowerCase())
      );
    }

    if (params?.category) {
      result = result.filter((item) => item.category === params.category);
    }

    if (params?.status) {
      result = result.filter((item) => item.status === params.status);
    }

    if (params?.minPrice !== undefined) {
      result = result.filter((item) => item.price >= params.minPrice!);
    }

    if (params?.maxPrice !== undefined) {
      result = result.filter((item) => item.price <= params.maxPrice!);
    }

    // Apply sorting
    switch (params?.sortBy) {
      case 'newest':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'bestseller':
        result.sort((a, b) => b.soldCount - a.soldCount);
        break;
    }

    // Apply pagination
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const total = result.length;
    const lastPage = Math.ceil(total / pageSize);
    const startIdx = (page - 1) * pageSize;
    const paginatedData = result.slice(startIdx, startIdx + pageSize);

    return {
      data: paginatedData,
      meta: {
        current_page: page,
        per_page: pageSize,
        total,
        last_page: lastPage,
      },
    };
  },

  /**
   * Lấy chi tiết món ăn theo ID
   */
  getById: async (id: string): Promise<ApiResponse<MenuItem>> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const item = menuData.find((m) => m.id === id);
    if (!item) {
      throw new Error('Không tìm thấy món ăn');
    }
    return {
      success: true,
      data: item,
    };
  },

  /**
   * Tạo mới món ăn
   */
  create: async (payload: CreateMenuPayload): Promise<ApiResponse<MenuItem>> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const gpPercent = calculateGpPercent(payload.price, payload.cost);
    const newItem: MenuItem = {
      id: `menu-${Date.now()}`,
      ...payload,
      gpPercent,
      status: 'selling',
      soldCount: 0,
      createdAt: Date.now(),
      isAvailable: true,
      tags: payload.tags || [],
    };

    menuData.unshift(newItem);

    return {
      success: true,
      data: newItem,
      message: 'Tạo món ăn thành công',
    };
  },

  /**
   * Cập nhật món ăn
   */
  update: async (id: string, payload: UpdateMenuPayload): Promise<ApiResponse<MenuItem>> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = menuData.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy món ăn');
    }

    const updatedItem: MenuItem = {
      ...menuData[index],
      ...payload,
    };

    // Recalculate GP% if price or cost changed
    if (payload.price !== undefined || payload.cost !== undefined) {
      updatedItem.gpPercent = calculateGpPercent(
        payload.price ?? updatedItem.price,
        payload.cost ?? updatedItem.cost
      );
    }

    menuData[index] = updatedItem;

    return {
      success: true,
      data: updatedItem,
      message: 'Cập nhật món ăn thành công',
    };
  },

  /**
   * Xóa món ăn
   */
  delete: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = menuData.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy món ăn');
    }

    menuData = menuData.filter((m) => m.id !== id);

    return {
      success: true,
      message: 'Xóa món ăn thành công',
    };
  },

  /**
   * Toggle trạng thái bán hàng (isAvailable)
   */
  toggle: async (id: string, isAvailable: boolean): Promise<ApiResponse<MenuItem>> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const index = menuData.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy món ăn');
    }

    menuData[index] = {
      ...menuData[index],
      isAvailable,
    };

    return {
      success: true,
      data: menuData[index],
    };
  },

  /**
   * Cập nhật trạng thái kinh doanh
   */
  updateStatus: async (
    id: string,
    status: 'selling' | 'hidden' | 'pending'
  ): Promise<ApiResponse<MenuItem>> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const index = menuData.findIndex((m) => m.id === id);
    if (index === -1) {
      throw new Error('Không tìm thấy món ăn');
    }

    menuData[index] = {
      ...menuData[index],
      status,
    };

    return {
      success: true,
      data: menuData[index],
    };
  },

  /**
   * Lấy danh sách danh mục
   */
  getCategories: async (): Promise<ApiResponse<MenuCategoryInfo[]>> => {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Đếm số lượng món theo danh mục
    const categoriesWithCount = MENU_CATEGORIES.map((cat) => ({
      ...cat,
      count: menuData.filter((m) => m.category === cat.id).length,
    }));

    return {
      success: true,
      data: categoriesWithCount,
    };
  },

  /**
   * Upload ảnh món ăn (mock)
   */
  uploadImage: async (formData: FormData): Promise<ApiResponse<{ url: string }>> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mock upload - trả về URL placeholder
    return {
      success: true,
      data: {
        url: 'https://images.unsplash.com/photo-1593443320739-77f74952dabd?w=400',
      },
      message: 'Upload ảnh thành công',
    };
  },
};
