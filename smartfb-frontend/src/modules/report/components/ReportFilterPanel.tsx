import { Building2, CalendarRange, RefreshCw } from 'lucide-react';
import {
  DateRangePicker,
  type DateRangePickerValue,
} from '@shared/components/common/DateRangePicker';
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
import { formatDate } from '@shared/utils/formatDate';
import type { ReportBranchOption } from '../hooks/useRevenueReportFilters';

interface ReportFilterPanelProps {
  branchOptions: ReportBranchOption[];
  selectedBranchId: string;
  selectedBranchName: string;
  dateRange: DateRangePickerValue;
  analysisDate: string;
  isBranchLoading: boolean;
  isRefreshing: boolean;
  onBranchChange: (branchId: string) => void;
  onDateRangeChange: (value: DateRangePickerValue) => void;
  onAnalysisDateChange: (value: string) => void;
  onRefresh: () => void;
}

/**
 * Thanh filter chính cho màn báo cáo.
 * Tách riêng để page dễ đọc và có thể tái sử dụng nếu sau này thêm report overview.
 */
export const ReportFilterPanel = ({
  branchOptions,
  selectedBranchId,
  selectedBranchName,
  dateRange,
  analysisDate,
  isBranchLoading,
  isRefreshing,
  onBranchChange,
  onDateRangeChange,
  onAnalysisDateChange,
  onRefresh,
}: ReportFilterPanelProps) => {
  const formattedAnalysisDate = analysisDate ? formatDate(analysisDate) : 'Chưa chọn ngày';

  return (
    <section className="card space-y-2 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Building2 className="h-3.5 w-3.5" />
            Doanh thu
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Báo cáo doanh thu theo chi nhánh</h2>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={onRefresh}
          disabled={isBranchLoading || isRefreshing || !selectedBranchId}
        >
          <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          {isRefreshing ? 'Đang làm mới...' : 'Làm mới dữ liệu'}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_0.8fr]">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary" htmlFor="report-branch">
            Chi nhánh
          </label>
          <Select
            value={selectedBranchId}
            onValueChange={onBranchChange}
            disabled={isBranchLoading || branchOptions.length === 0}
          >
            <SelectTrigger id="report-branch" className="w-full">
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
          <label className="text-sm font-medium text-text-primary" htmlFor="report-date-range">
            Khoảng ngày tổng quan
          </label>
          <DateRangePicker
            id="report-date-range"
            value={dateRange}
            onChange={onDateRangeChange}
            className="w-full justify-start"
            disabled={isBranchLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-primary" htmlFor="report-analysis-date">
            Ngày phân tích biểu đồ
          </label>
          <div className="relative">
            <CalendarRange className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <Input
              id="report-analysis-date"
              type="date"
              value={analysisDate}
              onChange={(event) => onAnalysisDateChange(event.target.value)}
              className="pl-10"
              disabled={isBranchLoading}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary">
        <span className="rounded-full bg-white px-3 py-1 shadow-card">
          Chi nhánh đang xem: <span className="font-semibold text-text-primary">{selectedBranchName}</span>
        </span>
        <span className="rounded-full bg-white px-3 py-1 shadow-card">
          Dữ liệu chi tiết theo ngày: <span className="font-semibold text-text-primary">{formattedAnalysisDate}</span>
        </span>
      </div>
    </section>
  );
};
