/**
 * @author Đào Thu Thiên
 * @description Hook lấy chi tiết phiếu kiểm kho (session + details)
 * @created 2026-04-16
 */

import { useQuery } from '@tanstack/react-query';
import { inventoryCheckService } from '../services/inventoryCheckService';

export const useInventoryCheckDetail = (sessionId: string) => {
    const sessionQuery = useQuery({
        queryKey: ['inventoryChecks', 'detail', sessionId],
        queryFn: () => inventoryCheckService.getSessionById(sessionId),
        enabled: !!sessionId,
        staleTime: 60 * 1000,
    });

    const detailsQuery = useQuery({
        queryKey: ['inventoryChecks', 'details', sessionId],
        queryFn: () => inventoryCheckService.getDetails(sessionId),
        enabled: !!sessionId && sessionQuery.isSuccess,
        staleTime: 60 * 1000,
    });

    return {
        session: sessionQuery.data,
        details: detailsQuery.data ?? [],
        isLoading: sessionQuery.isLoading || detailsQuery.isLoading,
        isError: sessionQuery.isError || detailsQuery.isError,
        refetch: () => {
            sessionQuery.refetch();
            detailsQuery.refetch();
        },
    };
};