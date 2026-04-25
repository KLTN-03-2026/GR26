import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { reportService } from '../services/reportService';
import type {
  HourlyRevenueHeatmap,
  HourlyRevenueHeatmapParams,
  HourlyRevenueHeatmapResponse,
} from '../types/report.types';
import { normalizeReportNumber } from '../types/report.types';

const mapHourlyRevenueHeatmap = (report: HourlyRevenueHeatmapResponse): HourlyRevenueHeatmap => {
  // Build a lookup from the backend data (only hours with orders)
  const hourlyMap = new Map(
    report.hourlyData.map((item) => [
      item.hour,
      {
        hour: item.hour,
        orderCount: item.orderCount,
        revenue: normalizeReportNumber(item.revenue),
        avgOrderValue: normalizeReportNumber(item.avgOrderValue),
      },
    ]),
  );

  // Always return all 24 hours (0–23), filling missing hours with zeroes
  const fullDayData = Array.from({ length: 24 }, (_, h) =>
    hourlyMap.get(h) ?? { hour: h, orderCount: 0, revenue: 0, avgOrderValue: 0 },
  );

  return {
    date: report.date,
    branchName: report.branchName,
    hourlyData: fullDayData,
  };
};

/**
 * Hook lấy dữ liệu doanh thu theo giờ để dựng biểu đồ cột trong ngày.
 *
 * @param params - Chi nhánh và ngày phân tích
 * @returns Query state chứa 24 mốc giờ đã chuẩn hóa về number
 */
export const useHourlyRevenueHeatmap = (params?: HourlyRevenueHeatmapParams) => {
  return useQuery({
    queryKey: queryKeys.reports.hourlyHeatmap(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số heatmap doanh thu');
      }

      const response = await reportService.getHourlyRevenueHeatmap(params);
      return mapHourlyRevenueHeatmap(response.data);
    },
    enabled: Boolean(params?.branchId && params.date),
    staleTime: 60 * 1000,
  });
};
