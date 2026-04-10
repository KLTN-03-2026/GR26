import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { menuService } from '@modules/menu/services/menuService';

/**
 * Hook lấy danh sách addon/topping.
 *
 * @returns Query result với danh sách addon trong menu
 */
export const useAddons = () => {
  return useQuery({
    queryKey: queryKeys.menu.addons,
    queryFn: () => menuService.getAddons(),
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
};
