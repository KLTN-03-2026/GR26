import { useState, type ReactNode } from 'react';
import { TrendingUp, Receipt, Wallet, PiggyBank, RefreshCcw, AlertCircle, FileText } from 'lucide-react';
import { useHourlyRevenueHeatmap } from '@modules/report/hooks/useHourlyRevenueHeatmap';
import { usePaymentMethodBreakdown } from '@modules/report/hooks/usePaymentMethodBreakdown';
import { useFinancialInvoices, useRevenueReport } from '@modules/report/hooks/useRevenueReport';
import { useRevenueReportFilters } from '@modules/report/hooks/useRevenueReportFilters';
import { useTopItemsReport } from '@modules/report/hooks/useTopItemsReport';
import type { RevenueReportGroupBy } from '@modules/report/types/report.types';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { HourlyRevenueChart } from './HourlyRevenueChart';
import { PaymentBreakdownChart } from './PaymentBreakdownChart';
import { ReportFilterPanel } from './ReportFilterPanel';
import { ReportNavigationTabs } from './ReportNavigationTabs';
import { TopItemsChart } from './TopItemsChart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
}

const KPI_SKELETON_KEYS = ['total-revenue', 'gross-profit', 'order-count', 'average-order-value'];

const KpiCard = ({ label, value, icon }: KpiCardProps) => {
  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-card bg-primary-light text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
};

/**
 * Container chính của page báo cáo doanh thu.
 * Gom toàn bộ query và state filter vào module để page route chỉ còn là wrapper mỏng.
 */
export const RevenueReportDashboard = () => {
  const {
    branches,
    branchOptions,
    selectedBranchId,
    selectedBranch,
    dateRange,
    analysisDate,
    isBranchLoading,
    isBranchError,
    setSelectedBranchId,
    setDateRange,
    refetchBranches,
  } = useRevenueReportFilters();
  const [hourlyDate, setHourlyDate] = useState(() => analysisDate);
  const [paymentBreakdownDate, setPaymentBreakdownDate] = useState(() => analysisDate);
  const [topItemsDate, setTopItemsDate] = useState(() => analysisDate);
  const [groupBy, setGroupBy] = useState<RevenueReportGroupBy>('daily');

  const startDate = dateRange.from ?? analysisDate;
  const endDate = dateRange.to ?? dateRange.from ?? analysisDate;
  const selectedBranchName = selectedBranch?.name ?? 'Chưa chọn chi nhánh';

  const revenueReportQuery = useRevenueReport(
    selectedBranchId
      ? { branchId: selectedBranchId, startDate, endDate, groupBy }
      : undefined,
  );
  const financialInvoicesQuery = useFinancialInvoices(
    selectedBranchId
      ? { branchId: selectedBranchId, startDate, endDate, page: 0, size: 20 }
      : undefined,
  );

  const hourlyHeatmapQuery = useHourlyRevenueHeatmap(
    selectedBranchId
      ? {
          branchId: selectedBranchId,
          date: hourlyDate,
        }
      : undefined,
  );

  const topItemsQuery = useTopItemsReport(
    selectedBranchId
      ? {
          branchId: selectedBranchId,
          date: topItemsDate,
          limit: 5,
        }
      : undefined,
  );

  const paymentBreakdownQuery = usePaymentMethodBreakdown(
    selectedBranchId
      ? {
          branchId: selectedBranchId,
          date: paymentBreakdownDate,
        }
      : undefined,
  );

  const isRefreshing =
    revenueReportQuery.isFetching ||
    hourlyHeatmapQuery.isFetching ||
    topItemsQuery.isFetching ||
    paymentBreakdownQuery.isFetching ||
    financialInvoicesQuery.isFetching;

  const handleRefresh = async () => {
    await Promise.all([
      refetchBranches(),
      revenueReportQuery.refetch(),
      hourlyHeatmapQuery.refetch(),
      topItemsQuery.refetch(),
      paymentBreakdownQuery.refetch(),
      financialInvoicesQuery.refetch(),
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
      <section className="card space-y-4 p-6">
        <div className="flex items-center gap-3 text-danger-text">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Không thể tải danh sách chi nhánh</h2>
        </div>
        <p className="text-sm leading-6 text-text-secondary">
          Màn báo cáo cần danh sách chi nhánh để gọi đúng API `reports`.
          Hãy thử lại sau khi kiểm tra kết nối backend.
        </p>
        <div>
          <Button type="button" variant="outline" onClick={() => refetchBranches()}>
            <RefreshCcw className="h-4 w-4" />
            Thử tải lại chi nhánh
          </Button>
        </div>
      </section>
    );
  }

  if (!branches.length) {
    return (
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-semibold text-text-primary">Chưa có chi nhánh để lập báo cáo</h2>
        <p className="text-sm leading-6 text-text-secondary">
          Hệ thống báo cáo hiện chạy theo từng chi nhánh. Tenant của bạn cần ít nhất một chi nhánh để hiển thị dashboard doanh thu.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <ReportNavigationTabs />

      <ReportFilterPanel
        branchOptions={branchOptions}
        selectedBranchId={selectedBranchId}
        selectedBranchName={selectedBranchName}
        dateRange={dateRange}
        isBranchLoading={isBranchLoading}
        isRefreshing={isRefreshing}
        showAnalysisDate={false}
        onBranchChange={setSelectedBranchId}
        onDateRangeChange={setDateRange}
        onRefresh={() => {
          void handleRefresh();
        }}
      />

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-text-secondary">Nhóm theo:</span>
        <Select value={groupBy} onValueChange={(v) => { setGroupBy(v as RevenueReportGroupBy); }}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Theo ngày</SelectItem>
            <SelectItem value="weekly">Theo tuần</SelectItem>
            <SelectItem value="monthly">Theo tháng</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {revenueReportQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {KPI_SKELETON_KEYS.map((key) => (
            <div key={key} className="card h-36 animate-pulse bg-[#f5efe8]" />
          ))}
        </div>
      ) : revenueReportQuery.isError ? (
        <section className="card space-y-4 p-6">
          <div className="flex items-center gap-3 text-danger-text">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Không thể tải KPI doanh thu tổng quan</h2>
          </div>
          <p className="text-sm leading-6 text-text-secondary">
            API `/reports/revenue` đang trả lỗi hoặc chi nhánh hiện tại chưa có dữ liệu tổng hợp.
          </p>
          <div>
            <Button type="button" variant="outline" onClick={() => revenueReportQuery.refetch()}>
              <RefreshCcw className="h-4 w-4" />
              Thử lại
            </Button>
          </div>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Tổng doanh thu"
            value={formatVND(revenueReportQuery.data?.totalRevenue ?? 0)}
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <KpiCard
            label="Tổng Lợi nhuận"
            value={formatVND(revenueReportQuery.data?.totalGrossProfit ?? 0)}
            icon={<PiggyBank className="h-5 w-5" />}
          />
          <KpiCard
            label="Tổng đơn"
            value={formatNumber(revenueReportQuery.data?.totalOrders ?? 0)}
            icon={<Receipt className="h-5 w-5" />}
          />
          <KpiCard
            label="Giá trị đơn trung bình"
            value={formatVND(revenueReportQuery.data?.avgOrderValue ?? 0)}
            icon={<Wallet className="h-5 w-5" />}
          />
        </div>
      )}

      <HourlyRevenueChart
        data={hourlyHeatmapQuery.data}
        branchName={selectedBranchName}
        isLoading={hourlyHeatmapQuery.isLoading}
        isError={hourlyHeatmapQuery.isError}
        selectedDate={hourlyDate}
        onDateChange={setHourlyDate}
        onRetry={() => {
          void hourlyHeatmapQuery.refetch();
        }}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <PaymentBreakdownChart
          data={paymentBreakdownQuery.data}
          branchName={selectedBranchName}
          isLoading={paymentBreakdownQuery.isLoading}
          isError={paymentBreakdownQuery.isError}
          selectedDate={paymentBreakdownDate}
          onDateChange={setPaymentBreakdownDate}
          onRetry={() => {
            void paymentBreakdownQuery.refetch();
          }}
        />

        <TopItemsChart
          data={topItemsQuery.data}
          branchName={selectedBranchName}
          isLoading={topItemsQuery.isLoading}
          isError={topItemsQuery.isError}
          selectedDate={topItemsDate}
          onDateChange={setTopItemsDate}
          onRetry={() => {
            void topItemsQuery.refetch();
          }}
        />
      </div>

      {/* Lịch sử hóa đơn Thu/Chi */}
      <section className="card overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Lịch sử hóa đơn Thu / Chi</h3>
          </div>
          <p className="mt-1 text-sm text-text-secondary">Tổng hợp doanh thu và chi phí trong khoảng ngày đang chọn</p>
        </div>
        {financialInvoicesQuery.isLoading ? (
          <div className="p-5"><div className="h-40 animate-pulse rounded-card bg-cream" /></div>
        ) : financialInvoicesQuery.isError ? (
          <div className="p-5">
            <div className="flex items-center gap-3 text-danger-text">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Không thể tải lịch sử hóa đơn.</p>
            </div>
            <Button type="button" variant="outline" className="mt-3" onClick={() => { void financialInvoicesQuery.refetch(); }}>
              <RefreshCcw className="h-4 w-4" /> Thử lại
            </Button>
          </div>
        ) : !financialInvoicesQuery.data?.content.length ? (
          <div className="p-5 text-sm text-text-secondary">Chưa có giao dịch nào trong khoảng ngày này.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-cream text-left text-text-secondary">
                <tr>
                  <th className="px-5 py-3 font-medium">Loại</th>
                  <th className="px-5 py-3 font-medium">Mã / Mô tả</th>
                  <th className="px-5 py-3 font-medium">Phương thức</th>
                  <th className="px-5 py-3 font-medium">Thời gian</th>
                  <th className="px-5 py-3 font-medium text-right">Số tiền</th>
                </tr>
              </thead>
              <tbody>
                {financialInvoicesQuery.data.content.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <span className={cn('badge', item.type === 'INCOME' ? 'badge-success' : 'badge-cancelled')}>
                        {item.type === 'INCOME' ? 'Thu' : 'Chi'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-text-primary">{item.referenceCode ?? '—'}</p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-text-secondary">{item.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{item.paymentMethod ?? '—'}</td>
                    <td className="px-5 py-3 text-text-secondary text-xs">
                      {item.transactionDate ? new Date(item.transactionDate).toLocaleString('vi-VN') : '—'}
                    </td>
                    <td className={cn('px-5 py-3 text-right font-semibold', item.type === 'INCOME' ? 'text-success-text' : 'text-danger-text')}>
                      {item.type === 'INCOME' ? '+' : '-'}{formatVND(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
