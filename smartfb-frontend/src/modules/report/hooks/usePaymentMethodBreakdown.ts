import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { reportService } from '../services/reportService';
import type {
  PaymentMethodBreakdown,
  PaymentMethodBreakdownParams,
  PaymentMethodBreakdownResponse,
} from '../types/report.types';
import { normalizeReportNumber, resolvePaymentMethodLabel } from '../types/report.types';

const mapPaymentMethodBreakdown = (
  report: PaymentMethodBreakdownResponse,
): PaymentMethodBreakdown => {
  const methods = [
    report.cashBreakdown,
    report.momoBreakdown,
    report.vietqrBreakdown,
    report.bankingBreakdown,
    report.otherBreakdown,
  ].map((item) => ({
    method: resolvePaymentMethodLabel(item.method),
    amount: normalizeReportNumber(item.amount),
    transactionCount: item.transactionCount,
    percentage: normalizeReportNumber(item.percentage),
  }));

  return {
    date: report.date,
    branchName: report.branchName,
    methods,
    totalRevenue: normalizeReportNumber(report.totalRevenue),
    totalOrders: report.totalOrders,
  };
};

/**
 * Hook lấy breakdown thanh toán theo phương thức của một ngày cụ thể.
 *
 * @param params - Chi nhánh và ngày phân tích
 * @returns Query state chứa tỷ trọng thanh toán đã chuẩn hóa
 */
export const usePaymentMethodBreakdown = (
  params?: PaymentMethodBreakdownParams,
) => {
  return useQuery({
    queryKey: queryKeys.reports.paymentBreakdown(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số breakdown thanh toán');
      }

      const response = await reportService.getPaymentMethodBreakdown(params);
      return mapPaymentMethodBreakdown(response.data);
    },
    enabled: Boolean(params?.branchId && params.date),
    staleTime: 60 * 1000,
  });
};
