import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';

/**
 * Hook lấy danh sách danh mục món ăn
 * @returns Query result với danh sách danh mục
 */
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.menu.categories,
    queryFn: () => menuService.getCategories(),
    staleTime: 10 * 60 * 1000, // 10 phút
    gcTime: 20 * 60 * 1000, // 20 phút
  });
};
