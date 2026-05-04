import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  PackageSearch,
  PiggyBank,
  Receipt,
  RefreshCcw,
  TrendingUp,
  Trophy,
  Users2,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForecastSummary } from '@modules/forecast/hooks/useForecast';
import { useExpiringItemsReport, useInventoryStockReport } from '@modules/report/hooks/useInventoryReports';
import { useRevenueReport } from '@modules/report/hooks/useRevenueReport';
import { useRevenueReportFilters } from '@modules/report/hooks/useRevenueReportFilters';
import { useTopItemsReport } from '@modules/report/hooks/useTopItemsReport';
import { WeatherWidget } from '@modules/forecast/components/WeatherWidget';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';
import { cn } from '@shared/utils/cn';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { getTodayDateValue } from '@shared/utils/datePresets';
import { ReportMetricCard } from './ReportMetricCard';

const today = getTodayDateValue();

const reportLinks = [
  {
    title: 'Báo cáo doanh thu',
    description: 'KPI doanh thu, biểu đồ theo giờ, top món và phương thức thanh toán.',
    path: ROUTES.OWNER.REPORT_REVENUE,
    icon: TrendingUp,
  },
  {
    title: 'Báo cáo kho',
    description: 'Tồn kho, hàng sắp hết hạn và hao hụt nguyên liệu theo kỳ.',
    path: ROUTES.OWNER.REPORT_INVENTORY,
    icon: PackageSearch,
  },
  {
    title: 'Báo cáo nhân sự',
    description: 'Chấm công, chi phí nhân sự và vi phạm ca làm theo tháng.',
    path: ROUTES.OWNER.REPORT_HR,
    icon: Users2,
  },
  {
    title: 'Dự báo AI',
    description: 'Dự báo tiêu thụ nguyên liệu 7 ngày tới, ngày hết hàng dự kiến và gợi ý nhập kho.',
    path: ROUTES.OWNER.AI_FORECAST,
    icon: BrainCircuit,
  },
] as const;

/**
 * Dashboard tổng quan của Owner.
 * Chỉ dùng dữ liệu theo một chi nhánh vì backend all-branches chưa hoàn thiện.
 */
export const ReportsOverviewDashboard = () => {
  const {
    branches,
    selectedBranchId,
    selectedBranch,
    isBranchLoading,
    isBranchError,
    refetchBranches,
  } = useRevenueReportFilters();

  const revenueQuery = useRevenueReport(
    selectedBranchId
      ? {
          branchId: selectedBranchId,
          startDate: today,
          endDate: today,
          groupBy: 'daily',
        }
      : undefined,
  );
  const stockQuery = useInventoryStockReport(
    selectedBranchId ? { branchId: selectedBranchId, page: 0, size: 200 } : undefined,
  );
  const expiringQuery = useExpiringItemsReport(
    selectedBranchId
      ? { branchId: selectedBranchId, daysThreshold: 7, page: 0, size: 20 }
      : undefined,
  );
  const topItemsQuery = useTopItemsReport(
    selectedBranchId ? { branchId: selectedBranchId, date: today, limit: 3 } : undefined,
  );
  const forecastSummaryQuery = useForecastSummary(selectedBranchId ?? undefined);

  const stockItems = stockQuery.data?.content ?? [];
  const lowStockCount = stockItems.filter((item) => item.status === 'LOW').length;
  const outOfStockCount = stockItems.filter((item) => item.status === 'OUT_OF_STOCK').length;
  const stockAlertCount = lowStockCount + outOfStockCount;
  const expiringCount = expiringQuery.data?.totalElements ?? 0;
  const branchName = selectedBranch?.name ?? 'Chưa chọn chi nhánh';

  const handleRefresh = async () => {
    await Promise.all([
      refetchBranches(),
      revenueQuery.refetch(),
      stockQuery.refetch(),
      expiringQuery.refetch(),
      topItemsQuery.refetch(),
      forecastSummaryQuery.refetch(),
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
        <Button type="button" variant="outline" onClick={() => refetchBranches()}>
          <RefreshCcw className="h-4 w-4" />
          Tải lại
        </Button>
      </section>
    );
  }

  if (!branches.length) {
    return (
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-text-primary">Chưa có chi nhánh để lập dashboard</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Tạo chi nhánh trước khi xem các chỉ số vận hành.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-secondary">Dashboard</p>
          <h2 className="mt-1 text-2xl font-bold text-text-primary">Tổng quan hôm nay</h2>
          <p className="mt-1 text-sm text-text-secondary">{branchName} · {today}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void handleRefresh();
          }}
          disabled={revenueQuery.isFetching || stockQuery.isFetching || expiringQuery.isFetching || topItemsQuery.isFetching || forecastSummaryQuery.isFetching}
        >
          <RefreshCcw className="h-4 w-4" />
          Làm mới
        </Button>
      </section>

      <div className="grid gap-4 grid-cols-2 xl:grid-cols-5">
        <ReportMetricCard
          label="Doanh thu hôm nay"
          value={formatVND(revenueQuery.data?.totalRevenue ?? 0)}
          helper={revenueQuery.isError ? 'Chưa lấy được dữ liệu doanh thu.' : 'Theo chi nhánh đang chọn.'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <ReportMetricCard
          label="Lợi nhuận gộp"
          value={formatVND(revenueQuery.data?.totalGrossProfit ?? 0)}
          helper="Doanh thu trừ chi phí nguyên liệu trong ngày."
          icon={<PiggyBank className="h-5 w-5" />}
          tone="success"
        />
        <ReportMetricCard
          label="Tổng đơn"
          value={formatNumber(revenueQuery.data?.totalOrders ?? 0)}
          helper="Đơn đã được tổng hợp vào báo cáo ngày."
          icon={<Receipt className="h-5 w-5" />}
          tone="neutral"
        />
        <ReportMetricCard
          label="Giá trị đơn trung bình"
          value={formatVND(revenueQuery.data?.avgOrderValue ?? 0)}
          helper="Theo doanh thu và tổng đơn trong ngày."
          icon={<Wallet className="h-5 w-5" />}
          tone="neutral"
        />
        <ReportMetricCard
          label="Cảnh báo kho"
          value={formatNumber(stockAlertCount + expiringCount)}
          helper={`${lowStockCount} tồn thấp, ${outOfStockCount} hết hàng, ${expiringCount} sắp hết hạn.`}
          icon={<PackageSearch className="h-5 w-5" />}
          tone={stockAlertCount + expiringCount > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Widget thời tiết — chỉ render khi AI Service có dữ liệu, không block loading chính */}
      {selectedBranchId && <WeatherWidget branchId={selectedBranchId} />}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="card flex min-h-36 flex-col justify-between p-5 transition-colors hover:border-primary"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-card bg-primary-light text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        {/* Top 3 món bán chạy hôm nay */}
        <div className="card overflow-hidden">
          <div className="border-b border-border p-5">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-text-primary">Top 3 món hôm nay</h3>
            </div>
            <p className="mt-1 text-sm text-text-secondary">{today} · {branchName}</p>
          </div>
          <div className="p-5">
            {topItemsQuery.isLoading ? (
              <div className="h-28 animate-pulse rounded-card bg-cream" />
            ) : topItemsQuery.isError || !topItemsQuery.data?.topItems.length ? (
              <p className="text-sm text-text-secondary">Chưa có dữ liệu bán hàng hôm nay.</p>
            ) : (
              <div className="space-y-4">
                {topItemsQuery.data.topItems.slice(0, 3).map((item, idx) => (
                  <div key={item.itemId} className="flex items-center gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-text-primary">{item.itemName}</p>
                      <p className="text-xs text-text-secondary">{formatNumber(item.qtySold)} phần đã bán</p>
                    </div>
                    <span className="font-semibold text-text-primary">{formatVND(item.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Dự báo AI + Điều hướng nhanh */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-text-primary">Dự báo AI</h3>
              </div>
              <Link
                to={ROUTES.OWNER.AI_FORECAST}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Xem chi tiết
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {forecastSummaryQuery.isLoading ? (
                <div className="h-20 animate-pulse rounded-card bg-cream" />
              ) : forecastSummaryQuery.isError || !forecastSummaryQuery.data ? (
                <p className="text-sm text-text-secondary">Chưa có dữ liệu dự báo.</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Cần nhập ngay</span>
                    <span className={cn('badge', forecastSummaryQuery.data.urgent_count > 0 ? 'badge-cancelled' : 'badge-success')}>
                      {forecastSummaryQuery.data.urgent_count} nguyên liệu
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Sắp hết</span>
                    <span className={cn('badge', forecastSummaryQuery.data.warning_count > 0 ? 'badge-warning' : 'badge-success')}>
                      {forecastSummaryQuery.data.warning_count} nguyên liệu
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Đủ hàng</span>
                    <span className="badge badge-success">
                      {forecastSummaryQuery.data.ok_count} nguyên liệu
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-lg font-semibold text-text-primary">Điều hướng nhanh</h3>
            <div className="mt-4 space-y-3">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to={ROUTES.POS_MANAGEMENT}>
                  Quản lý đơn hàng
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to={ROUTES.OWNER.INVENTORY}>
                  Quản lý kho
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link to={ROUTES.OWNER.AI_FORECAST}>
                  Dự báo AI kho
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
