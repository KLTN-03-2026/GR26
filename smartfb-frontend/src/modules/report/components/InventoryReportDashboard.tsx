import { AlertCircle, PackageCheck, PackageSearch, RefreshCcw, Trash2, TriangleAlert } from 'lucide-react';
import { useExpiringItemsReport, useInventoryStockReport, useWasteReport } from '@modules/report/hooks/useInventoryReports';
import { useRevenueReportFilters } from '@modules/report/hooks/useRevenueReportFilters';
import type { InventoryStockReportItem } from '@modules/report/types/report.types';
import { Button } from '@shared/components/ui/button';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';
import { cn } from '@shared/utils/cn';
import { ReportFilterPanel } from './ReportFilterPanel';
import { ReportMetricCard } from './ReportMetricCard';
import { ReportNavigationTabs } from './ReportNavigationTabs';

const resolveStockStatus = (status: string) => {
  switch (status) {
    case 'OUT_OF_STOCK':
      return { label: 'Hết hàng', className: 'badge badge-cancelled' };
    case 'LOW':
      return { label: 'Tồn thấp', className: 'badge badge-warning' };
    case 'ENOUGH':
      return { label: 'Đủ hàng', className: 'badge badge-success' };
    default:
      return { label: status, className: 'badge bg-cream text-text-secondary' };
  }
};

const sortByStockRisk = (items: InventoryStockReportItem[]) => {
  const priority: Record<string, number> = {
    OUT_OF_STOCK: 0,
    LOW: 1,
    ENOUGH: 2,
  };

  return [...items].sort((a, b) => {
    const priorityDiff = (priority[a.status] ?? 3) - (priority[b.status] ?? 3);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return a.currentQty - b.currentQty;
  });
};

/**
 * Dashboard báo cáo kho dùng cho Owner.
 */
export const InventoryReportDashboard = () => {
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

  const startDate = dateRange.from ?? analysisDate;
  const endDate = dateRange.to ?? dateRange.from ?? analysisDate;
  const selectedBranchName = selectedBranch?.name ?? 'Chưa chọn chi nhánh';

  const stockQuery = useInventoryStockReport(
    selectedBranchId ? { branchId: selectedBranchId, page: 0, size: 200 } : undefined,
  );
  const expiringQuery = useExpiringItemsReport(
    selectedBranchId
      ? { branchId: selectedBranchId, daysThreshold: 7, page: 0, size: 20 }
      : undefined,
  );
  const wasteQuery = useWasteReport(
    selectedBranchId
      ? {
          branchId: selectedBranchId,
          startDate,
          endDate,
        }
      : undefined,
  );

  const stockItems = stockQuery.data?.content ?? [];
  const expiringItems = expiringQuery.data?.content ?? [];
  const wasteItems = wasteQuery.data ?? [];
  const lowStockCount = stockItems.filter((item) => item.status === 'LOW').length;
  const outOfStockCount = stockItems.filter((item) => item.status === 'OUT_OF_STOCK').length;
  const totalStockValue = stockItems.reduce((sum, item) => sum + item.totalValue, 0);
  const totalWasteCost = wasteItems.reduce((sum, item) => sum + item.totalWasteCost, 0);
  const riskyStockItems = sortByStockRisk(stockItems).slice(0, 8);
  const isRefreshing = stockQuery.isFetching || expiringQuery.isFetching || wasteQuery.isFetching;

  const handleRefresh = async () => {
    await Promise.all([
      refetchBranches(),
      stockQuery.refetch(),
      expiringQuery.refetch(),
      wasteQuery.refetch(),
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
          <h2 className="text-lg font-semibold text-text-primary">Chưa có chi nhánh để lập báo cáo kho</h2>
          <p className="mt-2 text-sm text-text-secondary">Tạo chi nhánh trước khi xem tồn kho.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <ReportNavigationTabs />

      <ReportFilterPanel
        kicker="Kho hàng"
        title="Báo cáo kho theo chi nhánh"
        dateRangeLabel="Khoảng ngày hao hụt"
        branchOptions={branchOptions}
        selectedBranchId={selectedBranchId}
        selectedBranchName={selectedBranchName}
        dateRange={dateRange}
        analysisDate={analysisDate}
        isBranchLoading={isBranchLoading}
        isRefreshing={isRefreshing}
        showAnalysisDate={false}
        onBranchChange={setSelectedBranchId}
        onDateRangeChange={setDateRange}
        onRefresh={() => {
          void handleRefresh();
        }}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ReportMetricCard
          label="Giá trị tồn kho"
          value={formatVND(totalStockValue)}
          helper="Tổng giá trị theo tồn hiện tại."
          icon={<PackageCheck className="h-5 w-5" />}
        />
        <ReportMetricCard
          label="Tồn thấp"
          value={formatNumber(lowStockCount)}
          helper="Mặt hàng còn dưới hoặc bằng mức tối thiểu."
          icon={<TriangleAlert className="h-5 w-5" />}
          tone={lowStockCount > 0 ? 'warning' : 'success'}
        />
        <ReportMetricCard
          label="Hết hàng"
          value={formatNumber(outOfStockCount)}
          helper="Mặt hàng có số lượng tồn bằng 0."
          icon={<AlertCircle className="h-5 w-5" />}
          tone={outOfStockCount > 0 ? 'danger' : 'success'}
        />
        <ReportMetricCard
          label="Hao hụt trong kỳ"
          value={formatVND(totalWasteCost)}
          helper={`${formatDate(startDate)} - ${formatDate(endDate)}`}
          icon={<Trash2 className="h-5 w-5" />}
          tone={totalWasteCost > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-border p-5">
            <h3 className="text-lg font-semibold text-text-primary">Tồn kho cần chú ý</h3>
            <p className="mt-1 text-sm text-text-secondary">Hiển thị tối đa 8 mặt hàng có rủi ro cao nhất.</p>
          </div>
          {stockQuery.isLoading ? (
            <div className="p-5">
              <div className="h-40 animate-pulse rounded-card bg-cream" />
            </div>
          ) : stockQuery.isError ? (
            <div className="p-5 text-sm text-danger-text">Không thể tải báo cáo tồn kho.</div>
          ) : riskyStockItems.length === 0 ? (
            <div className="p-5 text-sm text-text-secondary">Chưa có dữ liệu tồn kho.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead className="bg-cream text-left text-text-secondary">
                  <tr>
                    <th className="px-5 py-3 font-medium">Mặt hàng</th>
                    <th className="px-5 py-3 font-medium">Tồn</th>
                    <th className="px-5 py-3 font-medium">Mức tối thiểu</th>
                    <th className="px-5 py-3 font-medium">Giá trị</th>
                    <th className="px-5 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {riskyStockItems.map((item) => {
                    const status = resolveStockStatus(item.status);

                    return (
                      <tr key={item.itemId} className="border-t border-border">
                        <td className="px-5 py-3 font-semibold text-text-primary">{item.itemName}</td>
                        <td className="px-5 py-3 text-text-secondary">
                          {formatNumber(item.currentQty)} {item.unit ?? ''}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">
                          {formatNumber(item.minLevel)} {item.unit ?? ''}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">{formatVND(item.totalValue)}</td>
                        <td className="px-5 py-3">
                          <span className={cn(status.className)}>{status.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <PackageSearch className="h-5 w-5 text-warning" />
              <h3 className="text-lg font-semibold text-text-primary">Sắp hết hạn</h3>
            </div>
            <div className="mt-4 space-y-3">
              {expiringQuery.isLoading ? (
                <div className="h-28 animate-pulse rounded-card bg-cream" />
              ) : expiringQuery.isError ? (
                <p className="text-sm text-danger-text">Không thể tải hàng sắp hết hạn.</p>
              ) : expiringItems.length === 0 ? (
                <p className="text-sm text-text-secondary">Không có lô sắp hết hạn trong 7 ngày.</p>
              ) : (
                expiringItems.slice(0, 5).map((item) => (
                  <div key={item.batchId ?? `${item.itemId}-${item.expiryDate}`} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{item.itemName}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {formatNumber(item.quantityRemaining)} {item.unit ?? ''} · HSD {item.expiryDate ? formatDate(item.expiryDate) : 'chưa rõ'}
                        </p>
                      </div>
                      <span className={cn('badge', item.urgency === 'CRITICAL' ? 'badge-cancelled' : 'badge-warning')}>
                        {item.daysToExpire} ngày
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-danger-text" />
              <h3 className="text-lg font-semibold text-text-primary">Hao hụt cao</h3>
            </div>
            <div className="mt-4 space-y-3">
              {wasteQuery.isLoading ? (
                <div className="h-28 animate-pulse rounded-card bg-cream" />
              ) : wasteQuery.isError ? (
                <p className="text-sm text-danger-text">Không thể tải báo cáo hao hụt.</p>
              ) : wasteItems.length === 0 ? (
                <p className="text-sm text-text-secondary">Không có ghi nhận hao hụt trong kỳ.</p>
              ) : (
                wasteItems.slice(0, 5).map((item) => (
                  <div key={item.itemId} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-text-primary">{item.itemName}</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {formatNumber(item.totalWasteQty)} {item.unit ?? ''} · {item.primaryReason ?? 'Chưa phân loại'}
                        </p>
                      </div>
                      <span className="font-semibold text-danger-text">{formatVND(item.totalWasteCost)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
