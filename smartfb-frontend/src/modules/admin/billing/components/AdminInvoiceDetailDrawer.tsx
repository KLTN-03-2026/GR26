import { Button } from '@shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@shared/components/ui/sheet';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDate, formatDateTime } from '@shared/utils/formatDate';
import { AlertTriangle, Loader2, RefreshCcw } from 'lucide-react';
import { useAdminInvoiceDetail } from '../hooks/useAdminInvoiceDetail';
import type { AdminInvoice } from '../types/adminBilling.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface AdminInvoiceDetailDrawerProps {
  invoice: AdminInvoice | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Drawer xem chi tiết hóa đơn subscription.
 */
export const AdminInvoiceDetailDrawer = ({
  invoice,
  onOpenChange,
}: AdminInvoiceDetailDrawerProps) => {
  const {
    data: invoiceDetail,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAdminInvoiceDetail(invoice?.id ?? null);

  const handleRetry = () => {
    void refetch();
  };

  return (
    <Sheet open={Boolean(invoice)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-admin-gray-200 bg-white sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="text-admin-gray-900">Chi tiết hóa đơn</SheetTitle>
          <SheetDescription>
            Thông tin chu kỳ gia hạn, tenant và trạng thái thanh toán.
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="grid min-h-[260px] place-items-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-admin-brand-500" />
              <p className="mt-4 text-sm font-semibold text-admin-gray-900">
                Đang tải chi tiết hóa đơn
              </p>
            </div>
          </div>
        ) : null}

        {isError ? (
          <div className="mt-6 rounded-lg border border-admin-error-light bg-admin-error-light p-4 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-admin-error" />
            <p className="mt-3 font-semibold text-admin-gray-900">
              Không thể tải chi tiết hóa đơn
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

        {invoiceDetail ? (
          <div className="mt-6 space-y-6">
            <section className="rounded-lg border border-admin-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-admin-gray-500">Mã hóa đơn</p>
                  <h3 className="mt-1 text-lg font-semibold text-admin-gray-900">
                    {invoiceDetail.invoiceNumber}
                  </h3>
                </div>
                <InvoiceStatusBadge status={invoiceDetail.status} />
              </div>
              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-admin-gray-500">Tenant</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {invoiceDetail.tenantName}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Gói dịch vụ</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {invoiceDetail.planName}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Số tiền</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {formatVND(invoiceDetail.amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Ngày tạo</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {formatDateTime(invoiceDetail.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Chu kỳ bắt đầu</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {formatDate(invoiceDetail.billingPeriodStart)}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Chu kỳ kết thúc</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {formatDate(invoiceDetail.billingPeriodEnd)}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Phương thức thanh toán</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {invoiceDetail.paymentMethod || 'Chưa có'}
                  </dd>
                </div>
                <div>
                  <dt className="text-admin-gray-500">Thời điểm thanh toán</dt>
                  <dd className="mt-1 font-semibold text-admin-gray-900">
                    {invoiceDetail.paidAt ? formatDateTime(invoiceDetail.paidAt) : 'Chưa thanh toán'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-admin-gray-200 p-4">
              <p className="text-sm font-semibold text-admin-gray-900">Ghi chú</p>
              <p className="mt-2 text-sm leading-6 text-admin-gray-500">
                {invoiceDetail.note || 'Chưa có ghi chú cho hóa đơn này.'}
              </p>
            </section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};
