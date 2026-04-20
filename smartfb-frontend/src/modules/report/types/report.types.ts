export type ReportNumericValue = number | string | null;

/**
 * Backend hiện nhận `groupBy` cho báo cáo doanh thu nhưng mới xử lý ổn định nhất ở mức `daily`.
 * FE vẫn giữ type đầy đủ để không phải đổi contract khi BE hoàn thiện tiếp.
 */
export type RevenueReportGroupBy = 'daily' | 'weekly' | 'monthly';

export interface RevenueReportParams {
  branchId: string;
  startDate: string;
  endDate: string;
  groupBy?: RevenueReportGroupBy;
}

export interface HourlyRevenueHeatmapParams {
  branchId: string;
  date: string;
}

export interface TopItemsReportParams {
  branchId: string;
  date: string;
  limit?: number;
}

export interface PaymentMethodBreakdownParams {
  branchId: string;
  date: string;
}

export interface RevenuePaymentBreakdownResponse {
  cash: ReportNumericValue;
  momo: ReportNumericValue;
  vietqr: ReportNumericValue;
  banking: ReportNumericValue;
  other: ReportNumericValue;
  total: ReportNumericValue;
}

export interface RevenueLineResponse {
  branchName: string;
  revenue: ReportNumericValue;
  orderCount: number;
  grossProfit: ReportNumericValue;
  breakdown: RevenuePaymentBreakdownResponse | null;
}

export interface RevenueReportResponse {
  reportDate: string;
  totalRevenue: ReportNumericValue;
  totalGrossProfit: ReportNumericValue;
  totalOrders: number;
  avgOrderValue: ReportNumericValue;
  paymentBreakdown: RevenuePaymentBreakdownResponse | null;
  lines: RevenueLineResponse[];
}

export interface HourlyRevenueDataPointResponse {
  hour: number;
  orderCount: number;
  revenue: ReportNumericValue;
  avgOrderValue: ReportNumericValue;
}

export interface HourlyRevenueHeatmapResponse {
  date: string;
  branchName: string;
  hourlyData: HourlyRevenueDataPointResponse[];
}

export interface TopItemResponse {
  itemId: string;
  itemName: string;
  qtySold: number;
  revenue: ReportNumericValue;
  grossMargin: ReportNumericValue;
  rank: number;
}

export interface TopItemsReportResponse {
  date: string;
  branchName: string;
  topItems: TopItemResponse[];
}

export interface PaymentMethodResponse {
  method: string;
  amount: ReportNumericValue;
  transactionCount: number;
  percentage: ReportNumericValue;
}

export interface PaymentMethodBreakdownResponse {
  date: string;
  branchName: string;
  cashBreakdown: PaymentMethodResponse;
  momoBreakdown: PaymentMethodResponse;
  vietqrBreakdown: PaymentMethodResponse;
  bankingBreakdown: PaymentMethodResponse;
  otherBreakdown: PaymentMethodResponse;
  totalRevenue: ReportNumericValue;
  totalOrders: number;
}

export interface RevenuePaymentBreakdown {
  cash: number;
  momo: number;
  vietqr: number;
  banking: number;
  other: number;
  total: number;
}

export interface RevenueLine {
  branchName: string;
  revenue: number;
  orderCount: number;
  grossProfit: number;
  breakdown: RevenuePaymentBreakdown | null;
}

export interface RevenueReport {
  reportDate: string;
  totalRevenue: number;
  totalGrossProfit: number;
  totalOrders: number;
  avgOrderValue: number;
  paymentBreakdown: RevenuePaymentBreakdown | null;
  lines: RevenueLine[];
}

export interface HourlyRevenueDataPoint {
  hour: number;
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
}

export interface HourlyRevenueHeatmap {
  date: string;
  branchName: string;
  hourlyData: HourlyRevenueDataPoint[];
}

export interface TopItem {
  itemId: string;
  itemName: string;
  qtySold: number;
  revenue: number;
  grossMargin: number;
  rank: number;
}

export interface TopItemsReport {
  date: string;
  branchName: string;
  topItems: TopItem[];
}

export interface PaymentMethod {
  method: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  date: string;
  branchName: string;
  methods: PaymentMethod[];
  totalRevenue: number;
  totalOrders: number;
}

/**
 * Chuẩn hóa kiểu số từ backend vì BigDecimal có thể serialize thành `number` hoặc `string`.
 *
 * @param value - Giá trị số từ backend
 * @returns Giá trị number an toàn để FE tính toán và render chart
 */
export const normalizeReportNumber = (value: ReportNumericValue | undefined): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

/**
 * Chuẩn hóa breakdown doanh thu về object số để dùng cho KPI và bảng tỷ trọng.
 *
 * @param breakdown - Breakdown gốc từ backend
 * @returns Breakdown đã convert toàn bộ field sang number
 */
export const normalizeRevenuePaymentBreakdown = (
  breakdown: RevenuePaymentBreakdownResponse | null | undefined,
): RevenuePaymentBreakdown | null => {
  if (!breakdown) {
    return null;
  }

  return {
    cash: normalizeReportNumber(breakdown.cash),
    momo: normalizeReportNumber(breakdown.momo),
    vietqr: normalizeReportNumber(breakdown.vietqr),
    banking: normalizeReportNumber(breakdown.banking),
    other: normalizeReportNumber(breakdown.other),
    total: normalizeReportNumber(breakdown.total),
  };
};

/**
 * Chuyển method code của backend sang nhãn tiếng Việt dễ đọc trong UI.
 *
 * @param method - Mã phương thức thanh toán
 * @returns Tên hiển thị tiếng Việt
 */
export const resolvePaymentMethodLabel = (method: string): string => {
  switch (method) {
    case 'CASH':
      return 'Tiền mặt';
    case 'MOMO':
      return 'MOMO';
    case 'VIETQR':
      return 'VietQR';
    case 'BANKING':
      return 'Chuyển khoản';
    case 'OTHER':
      return 'Khác';
    default:
      return method;
  }
};
