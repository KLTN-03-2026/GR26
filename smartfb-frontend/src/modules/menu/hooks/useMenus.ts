import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';
import type { MenuListParams } from '@modules/menu/types/menu.types';

/**
 * Hook lấy danh sách món ăn với filter và pagination
 * @param params - Các tham số filter và pagination
 * @returns Query result với danh sách món ăn
 */
export const useMenus = (params?: MenuListParams) => {
  return useQuery({
    queryKey: queryKeys.menu.list(params),
    queryFn: () => menuService.getList(params),
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút
  });
};
