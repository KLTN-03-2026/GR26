import { axiosInstance as api } from '@lib/axios';
import type { ApiResponse } from '@shared/types/api.types';
import type {
  AttendanceReportItemResponse,
  AttendanceReportParams,
  ExpiringItemReportResponse,
  ExpiringItemsReportParams,
  HourlyRevenueHeatmapParams,
  HourlyRevenueHeatmapResponse,
  HrCostReportParams,
  HrCostReportResponse,
  InventoryStockReportItemResponse,
  InventoryStockReportParams,
  InventoryWasteReportParams,
  PaymentMethodBreakdownParams,
  PaymentMethodBreakdownResponse,
  ReportPageResponse,
  RevenueReportParams,
  RevenueReportResponse,
  TopItemsReportParams,
  TopItemsReportResponse,
  ViolationReportItemResponse,
  ViolationsReportParams,
  WasteReportItemResponse,
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

  /**
   * Lấy báo cáo tồn kho hiện tại theo chi nhánh.
   */
  getInventoryStockReport: async (
    params: InventoryStockReportParams,
  ): Promise<ApiResponse<ReportPageResponse<InventoryStockReportItemResponse>>> => {
    return api
      .get<ApiResponse<ReportPageResponse<InventoryStockReportItemResponse>>>('/reports/inventory', { params })
      .then((response) => response.data);
  },

  /**
   * Lấy danh sách lô hàng sắp hết hạn theo ngưỡng ngày.
   */
  getExpiringItemsReport: async (
    params: ExpiringItemsReportParams,
  ): Promise<ApiResponse<ReportPageResponse<ExpiringItemReportResponse>>> => {
    return api
      .get<ApiResponse<ReportPageResponse<ExpiringItemReportResponse>>>('/reports/inventory/expiring', { params })
      .then((response) => response.data);
  },

  /**
   * Lấy báo cáo hao hụt nguyên liệu trong khoảng ngày.
   */
  getWasteReport: async (
    params: InventoryWasteReportParams,
  ): Promise<ApiResponse<WasteReportItemResponse[]>> => {
    return api
      .get<ApiResponse<WasteReportItemResponse[]>>('/reports/inventory/waste', { params })
      .then((response) => response.data);
  },

  /**
   * Lấy báo cáo chấm công tháng theo chi nhánh.
   */
  getAttendanceReport: async (
    params: AttendanceReportParams,
  ): Promise<ApiResponse<ReportPageResponse<AttendanceReportItemResponse>>> => {
    return api
      .get<ApiResponse<ReportPageResponse<AttendanceReportItemResponse>>>('/reports/hr/attendance', { params })
      .then((response) => response.data);
  },

  /**
   * Lấy tổng chi phí nhân sự theo tháng.
   */
  getHrCostReport: async (
    params: HrCostReportParams,
  ): Promise<ApiResponse<HrCostReportResponse>> => {
    return api
      .get<ApiResponse<HrCostReportResponse>>('/reports/hr/cost', { params })
      .then((response) => response.data);
  },

  /**
   * Lấy danh sách vi phạm chấm công trong khoảng ngày.
   */
  getViolationsReport: async (
    params: ViolationsReportParams,
  ): Promise<ApiResponse<ReportPageResponse<ViolationReportItemResponse>>> => {
    return api
      .get<ApiResponse<ReportPageResponse<ViolationReportItemResponse>>>('/reports/hr/violations', { params })
      .then((response) => response.data);
  },
};
