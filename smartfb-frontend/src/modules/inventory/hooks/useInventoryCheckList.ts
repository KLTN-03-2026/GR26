/**
 * @author Đào Thu Thiên
 * @description Hook lấy danh sách phiếu kiểm kho
 * @created 2026-04-16
 */

import { useQuery } from '@tanstack/react-query';
import { inventoryCheckService } from '../services/inventoryCheckService';
import type { InventoryCheckFilters } from '../types/inventoryCheck.types';

export const useInventoryCheckList = (filters?: InventoryCheckFilters) => {
    return useQuery({
        queryKey: ['inventoryChecks', 'list', filters],
        queryFn: () => inventoryCheckService.getSessions(filters),
        staleTime: 30 * 1000, // 30 giây
        retry: 1,
    });
};