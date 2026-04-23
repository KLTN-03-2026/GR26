import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  PackageSearch,
  Receipt,
  RefreshCcw,
  TrendingUp,
  Users2,
  Wallet,
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { useExpiringItemsReport, useInventoryStockReport } from '@modules/report/hooks/useInventoryReports';
import { useRevenueReport } from '@modules/report/hooks/useRevenueReport';
import { useRevenueReportFilters } from '@modules/report/hooks/useRevenueReportFilters';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { ReportMetricCard } from './ReportMetricCard';

const today = format(new Date(), 'yyyy-MM-dd');

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
          disabled={revenueQuery.isFetching || stockQuery.isFetching || expiringQuery.isFetching}
        >
          <RefreshCcw className="h-4 w-4" />
          Làm mới
        </Button>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard
          label="Doanh thu hôm nay"
          value={formatVND(revenueQuery.data?.totalRevenue ?? 0)}
          helper={revenueQuery.isError ? 'Chưa lấy được dữ liệu doanh thu.' : 'Theo chi nhánh đang chọn.'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <ReportMetricCard
          label="Tổng đơn"
          value={formatNumber(revenueQuery.data?.totalOrders ?? 0)}
          helper="Đơn đã được tổng hợp vào báo cáo ngày."
          icon={<Receipt className="h-5 w-5" />}
          tone="success"
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

      <section className="grid gap-4 lg:grid-cols-3">
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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Tình trạng dữ liệu</h3>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="card p-4">
              <p className="text-sm text-text-secondary">Doanh thu</p>
              <p className="mt-2 font-semibold text-text-primary">
                {revenueQuery.isLoading ? 'Đang tải' : revenueQuery.isError ? 'Lỗi' : 'Sẵn sàng'}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-text-secondary">Tồn kho</p>
              <p className="mt-2 font-semibold text-text-primary">
                {stockQuery.isLoading ? 'Đang tải' : stockQuery.isError ? 'Lỗi' : 'Sẵn sàng'}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-text-secondary">Hàng hết hạn</p>
              <p className="mt-2 font-semibold text-text-primary">
                {expiringQuery.isLoading ? 'Đang tải' : expiringQuery.isError ? 'Lỗi' : 'Sẵn sàng'}
              </p>
            </div>
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
          </div>
        </div>
      </section>
    </div>
  );
};
