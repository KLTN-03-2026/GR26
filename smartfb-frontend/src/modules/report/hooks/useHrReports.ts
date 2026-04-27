import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { reportService } from '../services/reportService';
import type {
  AttendanceReportItem,
  AttendanceReportItemResponse,
  AttendanceReportParams,
  CheckinHistoryItem,
  CheckinHistoryItemResponse,
  CheckinHistoryParams,
  HrCostReport,
  HrCostReportParams,
  HrCostReportResponse,
  PayrollReportItem,
  PayrollReportItemResponse,
  PayrollReportParams,
  ReportPageResponse,
  ViolationReportItem,
  ViolationReportItemResponse,
  ViolationsReportParams,
} from '../types/report.types';
import { normalizeReportNumber } from '../types/report.types';

const mapPageResponse = <TResponse, TMapped>(
  page: ReportPageResponse<TResponse>,
  mapper: (item: TResponse) => TMapped,
): ReportPageResponse<TMapped> => ({
  ...page,
  content: page.content.map(mapper),
});

const mapAttendanceItem = (
  item: AttendanceReportItemResponse,
): AttendanceReportItem => ({
  ...item,
  workingDays: item.workingDays ?? 0,
  overtimeHours: normalizeReportNumber(item.overtimeHours),
  absentDays: item.absentDays ?? 0,
  leaveDays: item.leaveDays ?? 0,
  daysInMonth: item.daysInMonth ?? 0,
  attendancePercentage: item.attendancePercentage ?? 0,
});

const mapHrCost = (report: HrCostReportResponse): HrCostReport => ({
  branchId: report.branchId,
  branchName: report.branchName,
  month: report.month,
  totalStaff: report.totalStaff ?? 0,
  totalShifts: report.totalShifts ?? 0,
  totalWorkingHours: report.totalWorkingHours ?? 0,
  baseSalaryCost: normalizeReportNumber(report.baseSalaryCost),
  overtimeCost: normalizeReportNumber(report.overtimeCost),
  bonusCost: normalizeReportNumber(report.bonusCost),
  deductionsCost: normalizeReportNumber(report.deductionsCost),
  totalHrCost: normalizeReportNumber(report.totalHrCost),
  costPerStaff: normalizeReportNumber(report.costPerStaff),
  costPerShift: normalizeReportNumber(report.costPerShift),
  previousMonthCost: normalizeReportNumber(report.previousMonthCost),
  costChange: normalizeReportNumber(report.costChange),
  costTrend: report.costTrend,
});

const mapViolationItem = (
  item: ViolationReportItemResponse,
): ViolationReportItem => ({
  ...item,
  minutesViolation: item.minutesViolation ?? 0,
});

const mapPayrollItem = (item: PayrollReportItemResponse): PayrollReportItem => ({
  ...item,
  workingDays: item.workingDays ?? 0,
  baseSalary: normalizeReportNumber(item.baseSalary),
  overtimeHours: normalizeReportNumber(item.overtimeHours),
  overtimePay: normalizeReportNumber(item.overtimePay),
  totalBonuses: normalizeReportNumber(item.totalBonuses),
  totalDeductions: normalizeReportNumber(item.totalDeductions),
  grossSalary: normalizeReportNumber(item.grossSalary),
});

const mapCheckinHistoryItem = (item: CheckinHistoryItemResponse): CheckinHistoryItem => item;

/**
 * Hook lấy báo cáo chấm công tháng theo chi nhánh.
 *
 * @param params - Chi nhánh, tháng và phân trang cần xem
 */
export const useAttendanceReport = (params?: AttendanceReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.hrAttendance(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số báo cáo chấm công');
      }

      const response = await reportService.getAttendanceReport(params);
      return mapPageResponse(response.data, mapAttendanceItem);
    },
    enabled: Boolean(params?.branchId && params.month),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook lấy tổng chi phí nhân sự tháng theo chi nhánh.
 *
 * @param params - Chi nhánh và tháng cần xem
 */
export const useHrCostReport = (params?: HrCostReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.hrCost(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số chi phí nhân sự');
      }

      const response = await reportService.getHrCostReport(params);
      return mapHrCost(response.data);
    },
    enabled: Boolean(params?.branchId && params.month),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook lấy danh sách vi phạm chấm công trong khoảng ngày.
 *
 * @param params - Chi nhánh, khoảng ngày và bộ lọc vi phạm
 */
export const useViolationsReport = (params?: ViolationsReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.hrViolations(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) {
        throw new Error('Thiếu tham số báo cáo vi phạm');
      }

      const response = await reportService.getViolationsReport(params);
      return mapPageResponse(response.data, mapViolationItem);
    },
    enabled: Boolean(params?.branchId && params.startDate && params.endDate),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook lấy bảng lương tháng theo chi nhánh.
 *
 * @param params - Chi nhánh, tháng và staffId (tùy chọn)
 */
export const usePayrollReport = (params?: PayrollReportParams) => {
  return useQuery({
    queryKey: queryKeys.reports.hrPayroll(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) throw new Error('Thiếu tham số bảng lương');
      const response = await reportService.getPayrollReport(params);
      return mapPageResponse(response.data, mapPayrollItem);
    },
    enabled: Boolean(params?.branchId && params.month),
    staleTime: 60 * 1000,
  });
};

/**
 * Hook lấy lịch sử check-in chi tiết từng ca làm việc.
 *
 * @param params - Chi nhánh, khoảng ngày và staffId (tùy chọn)
 */
export const useCheckinHistoryReport = (params?: CheckinHistoryParams) => {
  return useQuery({
    queryKey: queryKeys.reports.hrCheckinHistory(params ? { ...params } : undefined),
    queryFn: async () => {
      if (!params) throw new Error('Thiếu tham số lịch sử check-in');
      const response = await reportService.getCheckinHistoryReport(params);
      return mapPageResponse(response.data, mapCheckinHistoryItem);
    },
    enabled: Boolean(params?.branchId && params.startDate && params.endDate),
    staleTime: 60 * 1000,
  });
};
