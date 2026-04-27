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
import { AlertTriangle, Loader2, RefreshCcw } from 'lucide-react';
import { useAdminTenantDetail } from '../hooks/useAdminTenantDetail';
import type { AdminTenantSummary } from '../types/adminTenant.types';
import { TenantStatusBadge } from './TenantStatusBadge';

interface AdminTenantDetailDrawerProps {
  tenant: AdminTenantSummary | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Drawer xem chi tiết tenant và lịch sử subscription.
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
      <SheetContent className="w-full overflow-y-auto border-admin-gray-200 bg-white sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-admin-gray-900">Chi tiết tenant</SheetTitle>
          <SheetDescription>
            Thông tin subscription, gói hiện tại và lịch sử sử dụng dịch vụ.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="grid min-h-[280px] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-admin-brand-500" />
              <p className="mt-4 text-sm font-semibold text-admin-gray-900">
                Đang tải chi tiết tenant
              </p>
            </div>
          </div>
        ) : null}

        {isError ? (
          <div className="mt-6 rounded-lg border border-admin-error-light bg-admin-error-light p-4 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-admin-error" />
            <p className="mt-3 font-semibold text-admin-gray-900">
              Không thể tải chi tiết tenant
            </p>
            <Button
              type="button"
              className="mt-4 bg-admin-brand-500 hover:bg-admin-brand-600"
              onClick={handleRetry}
              disabled={isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Tải lại
            </Button>
          </div>
        ) : null}

        {tenantDetail ? (
          <div className="mt-6 space-y-6">
            <section className="rounded-lg border border-admin-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-admin-gray-900">
                    {tenantDetail.name}
                  </h3>
                  <p className="mt-1 text-sm text-admin-gray-500">{tenantDetail.email}</p>
                </div>
                <TenantStatusBadge status={tenantDetail.status} />
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-admin-gray-500">Slug</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">{tenantDetail.slug}</dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Điện thoại</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {tenantDetail.phone || 'Chưa có'}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Mã số thuế</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {tenantDetail.taxCode || 'Chưa có'}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Ngày tạo</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {formatDateTime(tenantDetail.createdAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-admin-gray-200 p-4">
                <p className="text-sm text-admin-gray-500">Gói hiện tại</p>
                <p className="mt-2 font-semibold text-admin-gray-900">{tenantDetail.planName}</p>
              </div>
              <div className="rounded-lg border border-admin-gray-200 p-4">
                <p className="text-sm text-admin-gray-500">Chi nhánh</p>
                <p className="mt-2 font-semibold text-admin-gray-900">
                  {formatNumber(tenantDetail.branchCount)}
                </p>
              </div>
              <div className="rounded-lg border border-admin-gray-200 p-4">
                <p className="text-sm text-admin-gray-500">Hóa đơn</p>
                <p className="mt-2 font-semibold text-admin-gray-900">
                  {formatNumber(tenantDetail.totalInvoices)}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-admin-gray-200">
              <div className="border-b border-admin-gray-200 px-4 py-3">
                <h3 className="font-semibold text-admin-gray-900">Lịch sử subscription</h3>
              </div>
              <div className="divide-y divide-admin-gray-200">
                {tenantDetail.subscriptionHistory.length > 0 ? (
                  tenantDetail.subscriptionHistory.map((subscription) => (
                    <div key={subscription.subscriptionId} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-admin-gray-900">
                            {subscription.plan?.name ?? 'Gói không xác định'}
                          </p>
                          <p className="mt-1 text-sm text-admin-gray-500">
                            {subscription.startedAt ? formatDate(subscription.startedAt) : 'Chưa có'} -{' '}
                            {subscription.expiresAt ? formatDate(subscription.expiresAt) : 'Không giới hạn'}
                          </p>
                        </div>
                        <span className="rounded-full bg-admin-brand-50 px-2.5 py-1 text-xs font-semibold text-admin-brand-600">
                          {subscription.status}
                        </span>
                      </div>
                      {subscription.plan ? (
                        <p className="mt-2 text-sm text-admin-gray-500">
                          {formatVND(subscription.plan.priceMonthly)} / tháng
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-admin-gray-500">
                    Chưa có lịch sử subscription.
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
