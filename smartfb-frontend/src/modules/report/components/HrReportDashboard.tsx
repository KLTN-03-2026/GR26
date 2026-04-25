import { AlertCircle, CalendarDays, Clock, RefreshCcw, Users2, WalletCards } from 'lucide-react';
import { endOfMonth, format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useAttendanceReport, useHrCostReport, useViolationsReport } from '@modules/report/hooks/useHrReports';
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
  const monthRange = buildMonthRange(month);
  const selectedBranchName = selectedBranch?.name ?? 'Chưa chọn chi nhánh';

  const attendanceQuery = useAttendanceReport(
    selectedBranchId ? { branchId: selectedBranchId, month, page: 0, size: 20 } : undefined,
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
          pageSize: 20,
        }
      : undefined,
  );

  const attendanceItems = attendanceQuery.data?.content ?? [];
  const violations = violationsQuery.data?.content ?? [];
  const avgAttendance = attendanceItems.length
    ? Math.round(
        attendanceItems.reduce((sum, item) => sum + item.attendancePercentage, 0) /
          attendanceItems.length,
      )
    : 0;
  const totalOvertimeHours = attendanceItems.reduce((sum, item) => sum + item.overtimeHours, 0);
  const totalStaff = hrCostQuery.data?.totalStaff ?? attendanceQuery.data?.totalElements ?? 0;
  const isRefreshing = attendanceQuery.isFetching || hrCostQuery.isFetching || violationsQuery.isFetching;

  const handleRefresh = async () => {
    await Promise.all([
      refetchBranches(),
      attendanceQuery.refetch(),
      hrCostQuery.refetch(),
      violationsQuery.refetch(),
    ]);
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
              onValueChange={setSelectedBranchId}
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
                  setMonth(event.target.value);
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-cream text-left text-text-secondary">
                  <tr>
                    <th className="px-5 py-3 font-medium">Nhân viên</th>
                    <th className="px-5 py-3 font-medium">Ngày công</th>
                    <th className="px-5 py-3 font-medium">Vắng</th>
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
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning" />
            <h3 className="text-lg font-semibold text-text-primary">Vi phạm chấm công</h3>
          </div>
          <div className="mt-4 space-y-3">
            {violationsQuery.isLoading ? (
              <div className="h-40 animate-pulse rounded-card bg-cream" />
            ) : violationsQuery.isError ? (
              <p className="text-sm text-danger-text">Không thể tải báo cáo vi phạm.</p>
            ) : violations.length === 0 ? (
              <p className="text-sm text-text-secondary">Không có vi phạm trong kỳ.</p>
            ) : (
              violations.slice(0, 8).map((item) => (
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
    </div>
  );
};
