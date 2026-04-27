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

export interface ReportPageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  pageable?: Record<string, unknown>;
  sort?: Record<string, unknown>;
}

export interface InventoryStockReportParams {
  branchId: string;
  page?: number;
  size?: number;
}

export interface ExpiringItemsReportParams {
  branchId: string;
  daysThreshold?: number;
  page?: number;
  size?: number;
}

export interface InventoryWasteReportParams {
  branchId: string;
  startDate: string;
  endDate: string;
}

export type InventoryStockStatus = 'OUT_OF_STOCK' | 'LOW' | 'ENOUGH' | string;

export interface InventoryStockReportItemResponse {
  itemId: string;
  itemName: string;
  unit: string | null;
  currentQty: number | null;
  minLevel: number | null;
  unitCost: ReportNumericValue;
  totalValue: ReportNumericValue;
  nearestExpiryDate: string | null;
  status: InventoryStockStatus;
  branchId: string | null;
  branchName: string | null;
}

export interface InventoryStockReportItem extends InventoryStockReportItemResponse {
  currentQty: number;
  minLevel: number;
  unitCost: number;
  totalValue: number;
}

export interface ExpiringItemReportResponse {
  itemId: string;
  itemName: string;
  unit: string | null;
  batchId: string | null;
  quantityRemaining: number | null;
  unitCost: ReportNumericValue;
  expiryDate: string | null;
  daysToExpire: number | null;
  urgency: 'CRITICAL' | 'WARNING' | string;
  branchId: string | null;
  branchName: string | null;
}

export interface ExpiringItemReport extends ExpiringItemReportResponse {
  quantityRemaining: number;
  unitCost: number;
  daysToExpire: number;
}

export interface WasteReportItemResponse {
  itemId: string;
  itemName: string;
  unit: string | null;
  totalWasteQty: number | null;
  totalWasteCost: ReportNumericValue;
  primaryReason: string | null;
  wastePercentage?: ReportNumericValue;
  reasonCount?: number | null;
}

export interface WasteReportItem extends WasteReportItemResponse {
  totalWasteQty: number;
  totalWasteCost: number;
  wastePercentage: number;
  reasonCount: number;
}

export interface AttendanceReportParams {
  branchId: string;
  month: string;
  page?: number;
  size?: number;
}

export interface HrCostReportParams {
  branchId: string;
  month: string;
}

export interface ViolationsReportParams {
  branchId: string;
  startDate: string;
  endDate: string;
  violationType?: string;
  staffId?: string;
  page?: number;
  pageSize?: number;
}

export interface AttendanceReportItemResponse {
  staffId: string;
  staffName: string;
  position: string | null;
  positionId: string | null;
  workingDays: number | null;
  overtimeHours: ReportNumericValue;
  absentDays: number | null;
  leaveDays: number | null;
  month: string;
  daysInMonth: number | null;
  attendancePercentage: number | null;
  branchId: string | null;
  branchName: string | null;
}

export interface AttendanceReportItem extends AttendanceReportItemResponse {
  workingDays: number;
  overtimeHours: number;
  absentDays: number;
  leaveDays: number;
  daysInMonth: number;
  attendancePercentage: number;
}

export interface HrCostReportResponse {
  branchId: string | null;
  branchName: string | null;
  month: string;
  totalStaff: number | null;
  totalShifts?: number | null;
  totalWorkingHours?: number | null;
  baseSalaryCost?: ReportNumericValue;
  overtimeCost?: ReportNumericValue;
  bonusCost?: ReportNumericValue;
  deductionsCost?: ReportNumericValue;
  totalHrCost: ReportNumericValue;
  costPerStaff?: ReportNumericValue;
  costPerShift?: ReportNumericValue;
  previousMonthCost?: ReportNumericValue;
  costChange?: ReportNumericValue;
  costTrend?: string | null;
}

export interface HrCostReport extends HrCostReportResponse {
  totalStaff: number;
  totalShifts: number;
  totalWorkingHours: number;
  baseSalaryCost: number;
  overtimeCost: number;
  bonusCost: number;
  deductionsCost: number;
  totalHrCost: number;
  costPerStaff: number;
  costPerShift: number;
  previousMonthCost: number;
  costChange: number;
}

export interface ViolationReportItemResponse {
  staffId: string;
  staffName: string;
  position: string | null;
  date: string | null;
  shiftName: string | null;
  shiftStartTime?: string | null;
  shiftEndTime?: string | null;
  actualCheckinTime?: string | null;
  actualCheckoutTime?: string | null;
  minutesViolation: number | null;
  violationType: string;
}

export interface ViolationReportItem extends ViolationReportItemResponse {
  minutesViolation: number;
}

// ─── Inventory Movement ───────────────────────────────────────────────────────

export interface InventoryMovementReportParams {
  branchId: string;
  startDate: string;
  endDate: string;
  groupBy?: 'daily' | 'weekly' | 'monthly';
  page?: number;
  size?: number;
}

export interface InventoryMovementReportItemResponse {
  itemId: string;
  itemName: string;
  unit: string | null;
  beginningBalance: number | null;
  importQty: number | null;
  exportQty: number | null;
  endingBalance: number | null;
  beginningValue: ReportNumericValue;
  importValue: ReportNumericValue;
  exportValue: ReportNumericValue;
  endingValue: ReportNumericValue;
  variance: number | null;
  varianceStatus: string | null;
  date: string | null;
  week: string | null;
  month: string | null;
  branchId: string | null;
  branchName: string | null;
}

export interface InventoryMovementReportItem extends InventoryMovementReportItemResponse {
  beginningBalance: number;
  importQty: number;
  exportQty: number;
  endingBalance: number;
  beginningValue: number;
  importValue: number;
  exportValue: number;
  endingValue: number;
  variance: number;
}

// ─── COGS ─────────────────────────────────────────────────────────────────────

export interface CogsReportParams {
  branchId: string;
  startDate: string;
  endDate: string;
  page?: number;
  pageSize?: number;
}

export interface CogsReportItemResponse {
  itemId: string;
  itemName: string;
  unit: string | null;
  date: string | null;
  qtyUsed: number | null;
  unitCost: ReportNumericValue;
  totalCost: ReportNumericValue;
  transactionType: string | null;
  relatedOrderId: string | null;
  notes: string | null;
  batchId: string | null;
  batchImportedAt: string | null;
  branchId: string | null;
  branchName: string | null;
}

export interface CogsReportItem extends CogsReportItemResponse {
  qtyUsed: number;
  unitCost: number;
  totalCost: number;
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export interface PayrollReportParams {
  branchId: string;
  month: string;
  staffId?: string;
  page?: number;
  size?: number;
}

export interface PayrollReportItemResponse {
  staffId: string;
  staffName: string;
  position: string | null;
  branchId: string | null;
  branchName: string | null;
  month: string;
  baseSalary: ReportNumericValue;
  workingDays: number | null;
  overtimeHours: ReportNumericValue;
  overtimePay: ReportNumericValue;
  totalBonuses: ReportNumericValue;
  totalDeductions: ReportNumericValue;
  grossSalary: ReportNumericValue;
  status: string | null;
  approvedBy: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
}

export interface PayrollReportItem extends PayrollReportItemResponse {
  workingDays: number;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  totalBonuses: number;
  totalDeductions: number;
  grossSalary: number;
}

// ─── Checkin History ──────────────────────────────────────────────────────────

export interface CheckinHistoryParams {
  branchId: string;
  startDate: string;
  endDate: string;
  staffId?: string;
  page?: number;
  pageSize?: number;
}

export interface CheckinHistoryItemResponse {
  staffId: string;
  staffName: string;
  position: string | null;
  branchId: string | null;
  branchName: string | null;
  date: string | null;
  shiftName: string | null;
  shiftStartTime: string | null;
  shiftEndTime: string | null;
  expectedCheckinTime: string | null;
  actualCheckinTime: string | null;
  expectedCheckoutTime: string | null;
  actualCheckoutTime: string | null;
  actualWorkingMinutes: number | null;
  overtimeMinutes: number | null;
  checkinStatus: string | null;
  shiftStatus: string | null;
  notes: string | null;
}

export type CheckinHistoryItem = CheckinHistoryItemResponse;

// ─── Financial Invoices ───────────────────────────────────────────────────────

// Loại giao dịch dùng cho sổ thu chi tổng hợp: ALL lấy cả thu và chi.
export type FinancialInvoiceType = 'ALL' | 'INCOME' | 'EXPENSE';

export interface FinancialInvoicesParams {
  branchId: string;
  startDate: string;
  endDate: string;
  type?: FinancialInvoiceType;
  page?: number;
  size?: number;
}

export interface FinancialInvoiceItemResponse {
  id: string;
  type: 'INCOME' | 'EXPENSE' | string;
  referenceCode: string | null;
  amount: ReportNumericValue;
  transactionDate: string | null;
  paymentMethod: string | null;
  description: string | null;
}

export interface FinancialInvoiceItem extends FinancialInvoiceItemResponse {
  amount: number;
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
