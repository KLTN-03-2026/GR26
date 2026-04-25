import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@shared/constants/queryKeys';
import { reportService } from '../services/reportService';
import type {
  AttendanceReportItem,
  AttendanceReportItemResponse,
  AttendanceReportParams,
  HrCostReport,
  HrCostReportParams,
  HrCostReportResponse,
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
