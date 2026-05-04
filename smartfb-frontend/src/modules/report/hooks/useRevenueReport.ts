import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { reportService } from '../services/reportService';
import type {
  FinancialInvoiceItem,
  FinancialInvoiceItemResponse,
  FinancialInvoicesParams,
  RevenueReport,
  RevenueReportParams,
  RevenueReportResponse,
} from '../types/report.types';
import {
  normalizeReportNumber,
  normalizeRevenuePaymentBreakdown,
} from '../types/report.types';

const mapRevenueReport = (report: RevenueReportResponse): RevenueReport => {
  return {
    reportDate: report.reportDate,
    totalRevenue: normalizeReportNumber(report.totalRevenue),
    totalGrossProfit: normalizeReportNumber(report.totalGrossProfit),
    totalOrders: report.totalOrders,
    avgOrderValue: normalizeReportNumber(report.avgOrderValue),
    paymentBreakdown: normalizeRevenuePaymentBreakdown(report.paymentBreakdown),
    lines: report.lines.map((line) => ({
      branchName: line.branchName,
      revenue: normalizeReportNumber(line.revenue),
      orderCount: line.orderCount,
      grossProfit: normalizeReportNumber(line.grossProfit),
      breakdown: normalizeRevenuePaymentBreakdown(line.breakdown),
    })),
  };
};

const mapFinancialInvoiceItem = (item: FinancialInvoiceItemResponse): FinancialInvoiceItem => ({
  ...item,
  amount: normalizeReportNumber(item.amount),
});

/**
 * Hook lấy lịch sử hóa đơn Thu/Chi trong khoảng ngày.
 *
 * @param params - Chi nhánh và khoảng ngày cần xem
 */
export const useFinancialInvoices = (params?: FinancialInvoicesParams) => {
  return useQuery({
    queryKey: queryKeys.reports.financialInvoices(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) throw new Error('Thiếu tham số lịch sử hóa đơn');
      const response = await reportService.getFinancialInvoices(params);
      return {
        ...response.data,
        content: response.data.content.map(mapFinancialInvoiceItem),
      };
    },
    enabled: Boolean(params?.branchId && params.startDate && params.endDate),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook lấy báo cáo doanh thu tổng quan theo khoảng ngày cho một chi nhánh.
 *
 * @param params - Filter ngày và chi nhánh cần xem
 * @returns Query state chứa KPI doanh thu đã được chuẩn hóa về number
 */
export const useRevenueReport = (params?: RevenueReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.revenue(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số báo cáo doanh thu');
      }

      const response = await reportService.getRevenueReport(params);
      return mapRevenueReport(response.data);
    },
    enabled: Boolean(params?.branchId && params.startDate && params.endDate),
    staleTime: 60 * 1000,
  });
};
