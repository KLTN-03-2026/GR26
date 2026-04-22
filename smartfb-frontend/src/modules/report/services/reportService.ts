import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  HourlyRevenueHeatmapParams,
  HourlyRevenueHeatmapResponse,
  PaymentMethodBreakdownParams,
  PaymentMethodBreakdownResponse,
  RevenueReportParams,
  RevenueReportResponse,
  TopItemsReportParams,
  TopItemsReportResponse,
} from '../types/report.types';

/**
 * Service gọi API cho module báo cáo doanh thu hiện có ở backend.
 * Giữ service thuần request/response để phần chuẩn hóa dữ liệu nằm ở hook.
 */
export const reportService = {
  /**
   * Lấy báo cáo doanh thu tổng quan theo khoảng ngày.
   */
  getRevenueReport: async (
    params: RevenueReportParams,
  ): Promise<ApiResponse<RevenueReportResponse>> => {
    return api
      .get<ApiResponse<RevenueReportResponse>>('/reports/revenue', { params })
      .then((response) => response.data);
  },

  /**
   * Lấy doanh thu theo từng giờ trong ngày để dựng chart cột.
   */
  getHourlyRevenueHeatmap: async (
    params: HourlyRevenueHeatmapParams,
  ): Promise<ApiResponse<HourlyRevenueHeatmapResponse>> => {
    return api
      .get<ApiResponse<HourlyRevenueHeatmapResponse>>('/reports/revenue/hourly-heatmap', { params })
      .then((response) => response.data);
  },

  /**
   * Lấy top sản phẩm bán chạy của chi nhánh trong ngày.
   */
  getTopItemsReport: async (
    params: TopItemsReportParams,
  ): Promise<ApiResponse<TopItemsReportResponse>> => {
    return api
      .get<ApiResponse<TopItemsReportResponse>>('/reports/top-items', { params })
      .then((response) => response.data);
  },

  /**
   * Lấy tỷ trọng thanh toán theo phương thức để hiển thị breakdown.
   */
  getPaymentMethodBreakdown: async (
    params: PaymentMethodBreakdownParams,
  ): Promise<ApiResponse<PaymentMethodBreakdownResponse>> => {
    return api
      .get<ApiResponse<PaymentMethodBreakdownResponse>>('/reports/payment-breakdown', { params })
      .then((response) => response.data);
  },
};
