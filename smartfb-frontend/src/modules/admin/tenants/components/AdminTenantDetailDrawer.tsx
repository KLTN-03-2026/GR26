import { Button } from '@shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@shared/components/ui/sheet';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import { formatDate, formatDateTime } from '@shared/utils/formatDate';
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  FileText,
  GitBranch,
  Hash,
  Loader2,
  Mail,
  Package,
  Phone,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { useAdminTenantDetail } from '../hooks/useAdminTenantDetail';
import type { AdminTenantSummary } from '../types/adminTenant.types';
import { TenantStatusBadge } from './TenantStatusBadge';

interface AdminTenantDetailDrawerProps {
  tenant: AdminTenantSummary | null;
  onOpenChange: (open: boolean) => void;
}

// Map trạng thái subscription → màu badge
const getSubscriptionStatusClass = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'bg-admin-success-light text-admin-success';
    case 'EXPIRED':
      return 'bg-admin-gray-100 text-admin-gray-500';
    case 'CANCELLED':
      return 'bg-admin-error-light text-admin-error';
    default:
      return 'bg-admin-brand-50 text-admin-brand-600';
  }
};

/**
 * Drawer xem chi tiết tenant — bao gồm thông tin, stats sử dụng và lịch sử subscription.
 */
export const AdminTenantDetailDrawer = ({
  tenant,
  onOpenChange,
}: AdminTenantDetailDrawerProps) => {
  const {
    data: tenantDetail,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAdminTenantDetail(tenant?.id ?? null);

  const handleRetry = () => {
    void refetch();
  };

  return (
    <Sheet open={Boolean(tenant)} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden border-admin-gray-200 bg-white p-0 sm:max-w-[480px]">
        {/* Header ẩn cho accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Chi tiết tenant</SheetTitle>
          <SheetDescription>
            Thông tin subscription, gói hiện tại và lịch sử sử dụng dịch vụ.
          </SheetDescription>
        </SheetHeader>

        {/* Hero header */}
        <div className="relative shrink-0 border-b border-admin-gray-200 bg-gradient-to-br from-violet-50 via-white to-white px-6 pb-6 pt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500">
            Tenant
          </p>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Avatar + tên */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                  <Building2 className="h-5 w-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold text-admin-gray-900">
                    {tenantDetail?.name ?? tenant?.name ?? '—'}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-admin-gray-400">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{tenantDetail?.email ?? tenant?.email}</span>
                  </p>
                </div>
              </div>
            </div>

            {tenantDetail ? (
              <TenantStatusBadge status={tenantDetail.status} />
            ) : null}
          </div>
        </div>

        {/* Nội dung có thể scroll */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading state */}
          {isLoading ? (
            <div className="grid min-h-[280px] place-items-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-admin-brand-500" />
                <p className="mt-4 text-sm font-semibold text-admin-gray-900">
                  Đang tải chi tiết tenant
                </p>
                <p className="mt-1 text-xs text-admin-gray-400">Vui lòng chờ một chút...</p>
              </div>
            </div>
          ) : null}

          {/* Error state */}
          {isError ? (
            <div className="m-6 rounded-xl border border-red-100 bg-red-50 p-6 text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-admin-error" />
              <p className="mt-3 font-semibold text-admin-gray-900">
                Không thể tải chi tiết tenant
              </p>
              <p className="mt-1 text-sm text-admin-gray-500">
                Kiểm tra kết nối hoặc thử tải lại.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-4 bg-admin-brand-500 hover:bg-admin-brand-600"
                onClick={handleRetry}
                disabled={isFetching}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Tải lại
              </Button>
            </div>
          ) : null}

          {tenantDetail ? (
            <div className="space-y-6 p-6">
              {/* Section: Stats nhanh */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                  Tổng quan
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {/* Gói hiện tại */}
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-admin-gray-200 bg-admin-gray-50 px-3 py-4 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100">
                      <Package className="h-4 w-4 text-violet-600" />
                    </div>
                    <p className="line-clamp-1 text-sm font-bold leading-tight text-admin-gray-900">
                      {tenantDetail.planName}
                    </p>
                    <p className="text-xs text-admin-gray-500">Gói hiện tại</p>
                  </div>

                  {/* Chi nhánh */}
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-admin-gray-200 bg-admin-gray-50 px-3 py-4 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                      <GitBranch className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold leading-none text-admin-gray-900">
                      {formatNumber(tenantDetail.branchCount)}
                    </p>
                    <p className="text-xs text-admin-gray-500">Chi nhánh</p>
                  </div>

                  {/* Hóa đơn */}
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-admin-gray-200 bg-admin-gray-50 px-3 py-4 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold leading-none text-admin-gray-900">
                      {formatNumber(tenantDetail.totalInvoices)}
                    </p>
                    <p className="text-xs text-admin-gray-500">Hóa đơn</p>
                  </div>
                </div>
              </section>

              {/* Section: Thông tin chi tiết */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                  Thông tin
                </p>
                <div className="divide-y divide-admin-gray-100 rounded-xl border border-admin-gray-200 bg-white">
                  {/* Slug */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-gray-100">
                      <Hash className="h-3.5 w-3.5 text-admin-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-admin-gray-400">Slug</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-admin-gray-900">
                        {tenantDetail.slug}
                      </p>
                    </div>
                  </div>

                  {/* Điện thoại */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-gray-100">
                      <Phone className="h-3.5 w-3.5 text-admin-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-admin-gray-400">Điện thoại</p>
                      <p className="mt-0.5 text-sm font-semibold text-admin-gray-900">
                        {tenantDetail.phone || 'Chưa có'}
                      </p>
                    </div>
                  </div>

                  {/* Mã số thuế */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-gray-100">
                      <FileText className="h-3.5 w-3.5 text-admin-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-admin-gray-400">Mã số thuế</p>
                      <p className="mt-0.5 text-sm font-semibold text-admin-gray-900">
                        {tenantDetail.taxCode || 'Chưa có'}
                      </p>
                    </div>
                  </div>

                  {/* Ngày tạo */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-gray-100">
                      <CalendarDays className="h-3.5 w-3.5 text-admin-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-admin-gray-400">Ngày tạo</p>
                      <p className="mt-0.5 text-sm font-semibold text-admin-gray-900">
                        {formatDateTime(tenantDetail.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Lịch sử subscription */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                    Lịch sử subscription
                  </p>
                  {tenantDetail.subscriptionHistory.length > 0 ? (
                    <span className="rounded-full bg-admin-brand-50 px-2.5 py-0.5 text-xs font-semibold text-admin-brand-600">
                      {tenantDetail.subscriptionHistory.length} gói
                    </span>
                  ) : null}
                </div>

                {tenantDetail.subscriptionHistory.length > 0 ? (
                  <div className="divide-y divide-admin-gray-100 rounded-xl border border-admin-gray-200 bg-white">
                    {tenantDetail.subscriptionHistory.map((sub) => (
                      <div key={sub.subscriptionId} className="px-4 py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-admin-gray-900">
                              {sub.plan?.name ?? 'Gói không xác định'}
                            </p>
                            <p className="mt-1 text-xs text-admin-gray-400">
                              {sub.startedAt ? formatDate(sub.startedAt) : 'Chưa có'}
                              {' — '}
                              {sub.expiresAt ? formatDate(sub.expiresAt) : 'Không giới hạn'}
                            </p>
                            {sub.plan ? (
                              <p className="mt-1 text-xs font-medium text-admin-gray-500">
                                {formatVND(sub.plan.priceMonthly)}/tháng
                              </p>
                            ) : null}
                          </div>
                          <span
                            className={cn(
                              'inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                              getSubscriptionStatusClass(sub.status)
                            )}
                          >
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-admin-gray-200 px-4 py-8 text-center">
                    <p className="text-sm text-admin-gray-400">Chưa có lịch sử subscription.</p>
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
