import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { reportService } from '../services/reportService';
import type {
  TopItemsReport,
  TopItemsReportParams,
  TopItemsReportResponse,
} from '../types/report.types';
import { normalizeReportNumber } from '../types/report.types';

const mapTopItemsReport = (report: TopItemsReportResponse): TopItemsReport => {
  return {
    date: report.date,
    branchName: report.branchName,
    topItems: report.topItems.map((item) => ({
      itemId: item.itemId,
      itemName: item.itemName,
      qtySold: item.qtySold,
      revenue: normalizeReportNumber(item.revenue),
      grossMargin: normalizeReportNumber(item.grossMargin),
      rank: item.rank,
    })),
  };
};

/**
 * Hook lấy danh sách món bán chạy để dựng chart top sản phẩm.
 *
 * @param params - Chi nhánh, ngày và giới hạn số món cần xem
 * @returns Query state chứa top items đã chuẩn hóa dữ liệu số
 */
export const useTopItemsReport = (params?: TopItemsReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.topItems(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số top sản phẩm');
      }

      const response = await reportService.getTopItemsReport(params);
      return mapTopItemsReport(response.data);
    },
    enabled: Boolean(params?.branchId && params.date),
    staleTime: 60 * 1000,
  });
};
