import { AlertCircle, CalendarDays, Clock, History, Receipt, RefreshCcw, Users2, WalletCards } from 'lucide-react';
import { endOfMonth, format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useAttendanceReport, useCheckinHistoryReport, useHrCostReport, usePayrollReport, useViolationsReport } from '@modules/report/hooks/useHrReports';
import { useRevenueReportFilters } from '@modules/report/hooks/useRevenueReportFilters';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { cn } from '@shared/utils/cn';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';
import { ReportMetricCard } from './ReportMetricCard';
import { ReportNavigationTabs } from './ReportNavigationTabs';
import { TablePagination } from './TablePagination';

// Số bản ghi mỗi trang cho các bảng HR
const PAGE_SIZE = 20;
// Số vi phạm hiển thị rút gọn trong card
const VIOLATIONS_PREVIEW = 8;

const buildCurrentMonth = () => format(new Date(), 'yyyy-MM');

const buildMonthRange = (month: string) => {
  const monthStart = parseISO(`${month}-01`);

  return {
    startDate: format(monthStart, 'yyyy-MM-dd'),
    endDate: format(endOfMonth(monthStart), 'yyyy-MM-dd'),
  };
};

const resolveViolationLabel = (type: string) => {
  switch (type) {
    case 'ABSENT':
      return 'Vắng mặt';
    case 'NO_CHECKIN':
      return 'Không check-in';
    case 'LATE':
    case 'LATE_CHECKIN':
      return 'Đi muộn';
    case 'EARLY_CHECKOUT':
      return 'Về sớm';
    default:
      return type;
  }
};

/**
 * Dashboard báo cáo nhân sự dùng cho Owner.
 */
export const HrReportDashboard = () => {
  const {
    branches,
    branchOptions,
    selectedBranchId,
    selectedBranch,
    isBranchLoading,
    isBranchError,
    setSelectedBranchId,
    refetchBranches,
  } = useRevenueReportFilters();

  const [month, setMonth] = useState(() => buildCurrentMonth());

  // State phân trang cho từng bảng (0-indexed)
  const [attendancePage, setAttendancePage] = useState(0);
  const [payrollPage, setPayrollPage] = useState(0);
  const [checkinPage, setCheckinPage] = useState(0);

  // State expand cho card vi phạm
  const [showAllViolations, setShowAllViolations] = useState(false);

  // Reset page về 0 khi đổi tháng hoặc chi nhánh
  const handleMonthChange = (value: string) => {
    setMonth(value);
    setAttendancePage(0);
    setPayrollPage(0);
    setCheckinPage(0);
    setShowAllViolations(false);
  };

  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value);
    setAttendancePage(0);
    setPayrollPage(0);
    setCheckinPage(0);
    setShowAllViolations(false);
  };

  const monthRange = buildMonthRange(month);
  const selectedBranchName = selectedBranch?.name ?? 'Chưa chọn chi nhánh';

  const attendanceQuery = useAttendanceReport(
    selectedBranchId
      ? { branchId: selectedBranchId, month, page: attendancePage, size: PAGE_SIZE }
      : undefined,
  );
  const hrCostQuery = useHrCostReport(
    selectedBranchId ? { branchId: selectedBranchId, month } : undefined,
  );
  const violationsQuery = useViolationsReport(
    selectedBranchId
      ? {
          branchId: selectedBranchId,
          startDate: monthRange.startDate,
          endDate: monthRange.endDate,
          page: 0,
          pageSize: 50,
        }
      : undefined,
  );
  const payrollQuery = usePayrollReport(
    selectedBranchId
      ? { branchId: selectedBranchId, month, page: payrollPage, size: PAGE_SIZE }
      : undefined,
  );
  const checkinHistoryQuery = useCheckinHistoryReport(
    selectedBranchId
      ? {
          branchId: selectedBranchId,
          startDate: monthRange.startDate,
          endDate: monthRange.endDate,
          page: checkinPage,
          pageSize: PAGE_SIZE,
        }
      : undefined,
  );

  const attendanceItems = attendanceQuery.data?.content ?? [];
  const violations = violationsQuery.data?.content ?? [];
  const visibleViolations = showAllViolations ? violations : violations.slice(0, VIOLATIONS_PREVIEW);
  const avgAttendance = attendanceItems.length
    ? Math.round(
        attendanceItems.reduce((sum, item) => sum + item.attendancePercentage, 0) /
          attendanceItems.length,
      )
    : 0;
  const totalOvertimeHours = attendanceItems.reduce((sum, item) => sum + item.overtimeHours, 0);
  const totalStaff = hrCostQuery.data?.totalStaff ?? attendanceQuery.data?.totalElements ?? 0;
  const payrollItems = payrollQuery.data?.content ?? [];
  const checkinItems = checkinHistoryQuery.data?.content ?? [];
  const isRefreshing =
    attendanceQuery.isFetching ||
    hrCostQuery.isFetching ||
    violationsQuery.isFetching ||
    payrollQuery.isFetching ||
    checkinHistoryQuery.isFetching;

  const handleRefresh = async () => {
    await Promise.all([
      refetchBranches(),
      attendanceQuery.refetch(),
      hrCostQuery.refetch(),
      violationsQuery.refetch(),
      payrollQuery.refetch(),
      checkinHistoryQuery.refetch(),
    ]);
  };

  const resolvePayrollStatus = (status: string | null) => {
    switch (status) {
      case 'PAID': return { label: 'Đã trả', className: 'badge-success' };
      case 'APPROVED': return { label: 'Đã duyệt', className: 'badge-success' };
      case 'SUBMITTED': return { label: 'Chờ duyệt', className: 'badge-warning' };
      case 'DRAFT': return { label: 'Nháp', className: 'bg-cream text-text-secondary' };
      default: return { label: status ?? '—', className: 'bg-cream text-text-secondary' };
    }
  };

  const resolveCheckinStatus = (status: string | null) => {
    switch (status) {
      case 'ON_TIME': return { label: 'Đúng giờ', className: 'badge-success' };
      case 'LATE': return { label: 'Đi muộn', className: 'badge-warning' };
      case 'ABSENT': return { label: 'Vắng mặt', className: 'badge-cancelled' };
      case 'EXCUSED': return { label: 'Có phép', className: 'bg-cream text-text-secondary' };
      default: return { label: status ?? '—', className: 'bg-cream text-text-secondary' };
    }
  };

  if (isBranchLoading && !branches.length) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (isBranchError) {
    return (
      <div className="space-y-4">
        <ReportNavigationTabs />
        <section className="card space-y-4 p-6">
          <div className="flex items-center gap-3 text-danger-text">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Không thể tải danh sách chi nhánh</h2>
          </div>
          <Button type="button" variant="outline" onClick={() => refetchBranches()}>
            <RefreshCcw className="h-4 w-4" />
            Tải lại
          </Button>
        </section>
      </div>
    );
  }

  if (!branches.length) {
    return (
      <div className="space-y-4">
        <ReportNavigationTabs />
        <section className="card p-6">
          <h2 className="text-lg font-semibold text-text-primary">Chưa có chi nhánh để lập báo cáo nhân sự</h2>
          <p className="mt-2 text-sm text-text-secondary">Tạo chi nhánh trước khi xem chấm công.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <ReportNavigationTabs />

      <section className="card space-y-4 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Users2 className="h-3.5 w-3.5" />
              Nhân sự
            </div>
            <h2 className="mt-2 text-2xl font-bold text-text-primary">Báo cáo nhân sự theo chi nhánh</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void handleRefresh();
            }}
            disabled={isRefreshing || isBranchLoading || !selectedBranchId}
          >
            <RefreshCcw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            {isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.8fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary" htmlFor="hr-report-branch">
              Chi nhánh
            </label>
            <Select
              value={selectedBranchId}
              onValueChange={handleBranchChange}
              disabled={isBranchLoading || branchOptions.length === 0}
            >
              <SelectTrigger id="hr-report-branch" className="w-full">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.value} value={branch.value}>
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary" htmlFor="hr-report-month">
              Tháng báo cáo
            </label>
            <Input
              id="hr-report-month"
              type="month"
              value={month}
              onChange={(event) => {
                if (event.target.value) {
                  handleMonthChange(event.target.value);
                }
              }}
              disabled={isBranchLoading}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
          <span className="rounded-full bg-white px-3 py-1 shadow-card">
            Chi nhánh đang xem: <span className="font-semibold text-text-primary">{selectedBranchName}</span>
          </span>
          <span className="rounded-full bg-white px-3 py-1 shadow-card">
            Kỳ báo cáo: <span className="font-semibold text-text-primary">{month}</span>
          </span>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard
          label="Nhân sự trong kỳ"
          value={formatNumber(totalStaff)}
          helper="Tổng nhân sự có dữ liệu chấm công hoặc lương."
          icon={<Users2 className="h-5 w-5" />}
        />
        <ReportMetricCard
          label="Chi phí nhân sự"
          value={formatVND(hrCostQuery.data?.totalHrCost ?? 0)}
          helper="Tổng lương, OT, thưởng và khấu trừ."
          icon={<WalletCards className="h-5 w-5" />}
          tone="success"
        />
        <ReportMetricCard
          label="Tỷ lệ chuyên cần"
          value={`${formatNumber(avgAttendance)}%`}
          helper="Trung bình trên danh sách chấm công."
          icon={<CalendarDays className="h-5 w-5" />}
          tone={avgAttendance >= 90 ? 'success' : 'warning'}
        />
        <ReportMetricCard
          label="Giờ OT"
          value={formatNumber(totalOvertimeHours)}
          helper="Tổng giờ làm thêm đã ghi nhận."
          icon={<Clock className="h-5 w-5" />}
          tone="neutral"
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        {/* Bảng chấm công tháng */}
        <div className="card overflow-hidden">
          <div className="border-b border-border p-5">
            <h3 className="text-lg font-semibold text-text-primary">Chấm công tháng</h3>
            <p className="mt-1 text-sm text-text-secondary">{formatDate(monthRange.startDate)} - {formatDate(monthRange.endDate)}</p>
          </div>
          {attendanceQuery.isLoading ? (
            <div className="p-5">
              <div className="h-40 animate-pulse rounded-card bg-cream" />
            </div>
          ) : attendanceQuery.isError ? (
            <div className="p-5 text-sm text-danger-text">Không thể tải báo cáo chấm công.</div>
          ) : attendanceItems.length === 0 ? (
            <div className="p-5 text-sm text-text-secondary">Chưa có dữ liệu chấm công trong tháng.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-cream text-left text-text-secondary">
                    <tr>
                      <th className="px-5 py-3 font-medium">Nhân viên</th>
                      <th className="px-5 py-3 font-medium">Ngày công</th>
                      <th className="px-5 py-3 font-medium">Vắng</th>
                      <th className="px-5 py-3 font-medium">Nghỉ phép</th>
                      <th className="px-5 py-3 font-medium">OT</th>
                      <th className="px-5 py-3 font-medium">Chuyên cần</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceItems.map((item) => (
                      <tr key={item.staffId} className="border-t border-border">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-text-primary">{item.staffName}</p>
                          <p className="text-xs text-text-secondary">{item.position ?? 'Chưa có chức vụ'}</p>
                        </td>
                        <td className="px-5 py-3 text-text-secondary">{formatNumber(item.workingDays)}</td>
                        <td className="px-5 py-3 text-text-secondary">{formatNumber(item.absentDays)}</td>
                        <td className="px-5 py-3 text-text-secondary">{formatNumber(item.leaveDays)}</td>
                        <td className="px-5 py-3 text-text-secondary">{formatNumber(item.overtimeHours)}</td>
                        <td className="px-5 py-3">
                          <span className={cn('badge', item.attendancePercentage >= 90 ? 'badge-success' : 'badge-warning')}>
                            {formatNumber(item.attendancePercentage)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePagination
                page={attendancePage}
                totalPages={attendanceQuery.data?.totalPages ?? 1}
                totalElements={attendanceQuery.data?.totalElements ?? 0}
                pageSize={PAGE_SIZE}
                onPageChange={setAttendancePage}
                isLoading={attendanceQuery.isFetching}
              />
            </>
          )}
        </div>

        {/* Card vi phạm chấm công */}
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h3 className="text-lg font-semibold text-text-primary">Vi phạm chấm công</h3>
            </div>
            {violations.length > VIOLATIONS_PREVIEW && (
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => { setShowAllViolations((prev) => !prev); }}
              >
                {showAllViolations ? 'Thu gọn' : `Xem tất cả (${violations.length})`}
              </button>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {violationsQuery.isLoading ? (
              <div className="h-40 animate-pulse rounded-card bg-cream" />
            ) : violationsQuery.isError ? (
              <p className="text-sm text-danger-text">Không thể tải báo cáo vi phạm.</p>
            ) : violations.length === 0 ? (
              <p className="text-sm text-text-secondary">Không có vi phạm trong kỳ.</p>
            ) : (
              visibleViolations.map((item) => (
                <div key={`${item.staffId}-${item.date}-${item.violationType}`} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-text-primary">{item.staffName}</p>
                      <p className="mt-1 text-xs text-text-secondary">
                        {item.date ? formatDate(item.date) : 'Chưa rõ ngày'} · {item.shiftName ?? 'Chưa rõ ca'}
                      </p>
                    </div>
                    <span className="badge badge-warning">{resolveViolationLabel(item.violationType)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Bảng lương tháng */}
      <section className="card overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Bảng lương tháng</h3>
          </div>
          <p className="mt-1 text-sm text-text-secondary">Lương cơ bản · OT · Thưởng · Khấu trừ · Thực lĩnh · {month}</p>
        </div>
        {payrollQuery.isLoading ? (
          <div className="p-5"><div className="h-40 animate-pulse rounded-card bg-cream" /></div>
        ) : payrollQuery.isError ? (
          <div className="p-5 text-sm text-danger-text">Không thể tải bảng lương.</div>
        ) : payrollItems.length === 0 ? (
          <div className="p-5 text-sm text-text-secondary">Chưa có dữ liệu lương trong tháng.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-cream text-left text-text-secondary">
                  <tr>
                    <th className="px-5 py-3 font-medium">Nhân viên</th>
                    <th className="px-5 py-3 font-medium text-right">Lương cơ bản</th>
                    <th className="px-5 py-3 font-medium text-right">OT</th>
                    <th className="px-5 py-3 font-medium text-right">Thưởng</th>
                    <th className="px-5 py-3 font-medium text-right">Khấu trừ</th>
                    <th className="px-5 py-3 font-medium text-right">Thực lĩnh</th>
                    <th className="px-5 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollItems.map((item) => {
                    const status = resolvePayrollStatus(item.status);
                    return (
                      <tr key={item.staffId} className="border-t border-border">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-text-primary">{item.staffName}</p>
                          <p className="text-xs text-text-secondary">{item.position ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3 text-right text-text-secondary">{formatVND(item.baseSalary)}</td>
                        <td className="px-5 py-3 text-right text-text-secondary">{formatVND(item.overtimePay)}</td>
                        <td className="px-5 py-3 text-right text-success-text">{formatVND(item.totalBonuses)}</td>
                        <td className="px-5 py-3 text-right text-danger-text">{formatVND(item.totalDeductions)}</td>
                        <td className="px-5 py-3 text-right font-bold text-text-primary">{formatVND(item.grossSalary)}</td>
                        <td className="px-5 py-3">
                          <span className={cn('badge', status.className)}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={payrollPage}
              totalPages={payrollQuery.data?.totalPages ?? 1}
              totalElements={payrollQuery.data?.totalElements ?? 0}
              pageSize={PAGE_SIZE}
              onPageChange={setPayrollPage}
              isLoading={payrollQuery.isFetching}
            />
          </>
        )}
      </section>

      {/* Lịch sử check-in chi tiết */}
      <section className="card overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Lịch sử check-in chi tiết</h3>
          </div>
          <p className="mt-1 text-sm text-text-secondary">{formatDate(monthRange.startDate)} - {formatDate(monthRange.endDate)} · Giờ vào/ra thực tế theo từng ca</p>
        </div>
        {checkinHistoryQuery.isLoading ? (
          <div className="p-5"><div className="h-40 animate-pulse rounded-card bg-cream" /></div>
        ) : checkinHistoryQuery.isError ? (
          <div className="p-5 text-sm text-danger-text">Không thể tải lịch sử check-in.</div>
        ) : checkinItems.length === 0 ? (
          <div className="p-5 text-sm text-text-secondary">Chưa có dữ liệu check-in trong kỳ.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-cream text-left text-text-secondary">
                  <tr>
                    <th className="px-5 py-3 font-medium">Nhân viên</th>
                    <th className="px-5 py-3 font-medium">Ngày · Ca</th>
                    <th className="px-5 py-3 font-medium">Giờ vào</th>
                    <th className="px-5 py-3 font-medium">Giờ ra</th>
                    <th className="px-5 py-3 font-medium text-right">Thực làm (phút)</th>
                    <th className="px-5 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {checkinItems.map((item, idx) => {
                    const status = resolveCheckinStatus(item.checkinStatus);
                    return (
                      <tr key={`${item.staffId}-${item.date ?? ''}-${idx}`} className="border-t border-border">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-text-primary">{item.staffName}</p>
                          <p className="text-xs text-text-secondary">{item.position ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          <p>{item.date ? formatDate(item.date) : '—'}</p>
                          <p className="text-xs">{item.shiftName ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          <p>{item.actualCheckinTime ?? '—'}</p>
                          <p className="text-xs text-text-secondary">KH: {item.expectedCheckinTime ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          <p>{item.actualCheckoutTime ?? '—'}</p>
                          <p className="text-xs text-text-secondary">KH: {item.expectedCheckoutTime ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3 text-right text-text-secondary">
                          {item.actualWorkingMinutes != null ? formatNumber(item.actualWorkingMinutes) : '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn('badge', status.className)}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={checkinPage}
              totalPages={checkinHistoryQuery.data?.totalPages ?? 1}
              totalElements={checkinHistoryQuery.data?.totalElements ?? 0}
              pageSize={PAGE_SIZE}
              onPageChange={setCheckinPage}
              isLoading={checkinHistoryQuery.isFetching}
            />
          </>
        )}
      </section>
    </div>
  );
};
