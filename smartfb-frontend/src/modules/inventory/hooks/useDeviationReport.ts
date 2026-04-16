/**
 * @author Đào Thu Thiên
 * @description Hook lấy báo cáo lệch kho
 * @created 2026-04-16
 */

import { useQuery } from '@tanstack/react-query';
import { inventoryCheckService } from '../services/inventoryCheckService';

export const useDeviationReport = (sessionId: string) => {
    return useQuery({
        queryKey: ['inventoryChecks', 'deviationReport', sessionId],
        queryFn: () => inventoryCheckService.getDeviationReport(sessionId),
        enabled: !!sessionId,
        staleTime: 60 * 1000,
    });
};