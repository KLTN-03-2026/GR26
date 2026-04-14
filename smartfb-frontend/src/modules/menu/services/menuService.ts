import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse, PaginatedResult } from '@shared/types/api.types';
import type { 
  MenuItem, 
  MenuListParams, 
  CategoryResponse, 
  MenuItemCategory 
} from '@modules/menu/types/menu.types';

/**
 * Service cho các thao tác API với menu
 */
export const menuService = {
  /**
   * Lấy danh sách món ăn đang kinh doanh (dành cho POS)
   */
  getList: async (params?: MenuListParams): Promise<PaginatedResult<MenuItem>> => {
    // POS thường lấy danh sách món đang active
    const response = await api.get<ApiResponse<any[]>>('/menu/items/active');
    
    let items: MenuItem[] = response.data.data.map(item => ({
      id: item.id,
      name: item.name,
      price: item.basePrice || 0,
      category: item.categoryId,
      image: item.imageUrl, // No fallback, handle in UI
      isAvailable: item.isActive,
      description: item.description,
      unit: item.unit,
      status: item.isActive ? 'selling' : 'hidden',
      createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now()
    }));

    // Apply local filters if needed (Search/Category)
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q));
    }

    if (params?.category && params.category !== 'all') {
      items = items.filter(i => i.category === params.category);
    }

    return {
      data: items,
      meta: {
        current_page: 1,
        per_page: items.length,
        total: items.length,
        last_page: 1
      }
    };
  },

  /**
   * Lấy danh sách danh mục đang kích hoạt
   */
  getCategories: async (): Promise<ApiResponse<MenuItemCategory[]>> => {
    const response = await api.get<ApiResponse<CategoryResponse[]>>('/menu/categories/active');
    
    const categories: MenuItemCategory[] = response.data.data.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: 0 // Will be handled if needed
    }));

    return {
      ...response.data,
      data: categories
    };
  },

  /**
   * Lấy chi tiết món ăn theo ID
   */
  getById: async (id: string): Promise<ApiResponse<MenuItem>> => {
    const response = await api.get<ApiResponse<any>>(`/menu/items/${id}`);
    const item = response.data.data;
    
    return {
      ...response.data,
      data: {
        id: item.id,
        name: item.name,
        price: item.basePrice || 0,
        category: item.categoryId,
        image: item.imageUrl,
        isAvailable: item.isActive,
        description: item.description,
        unit: item.unit,
        status: item.isActive ? 'selling' : 'hidden',
        createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now()
      }
    };
  },
};
