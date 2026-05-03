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
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  Loader2,
  Package,
  Receipt,
  RefreshCcw,
} from 'lucide-react';
import { useAdminInvoiceDetail } from '../hooks/useAdminInvoiceDetail';
import type { AdminInvoice } from '../types/adminBilling.types';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface AdminInvoiceDetailDrawerProps {
  invoice: AdminInvoice | null;
  onOpenChange: (open: boolean) => void;
}

// Map phương thức thanh toán → nhãn tiếng Việt
const getPaymentMethodLabel = (method: string | null | undefined): string => {
  if (!method) return 'Chưa có';
  const map: Record<string, string> = {
    BANK_TRANSFER: 'Chuyển khoản ngân hàng',
    CASH: 'Tiền mặt',
    MOMO: 'MoMo',
    ZALOPAY: 'ZaloPay',
  };
  return map[method] ?? method;
};

/**
 * Drawer xem chi tiết hóa đơn subscription — bao gồm tenant, gói dịch vụ, chu kỳ và thanh toán.
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
      <SheetContent className="flex w-full flex-col overflow-hidden border-admin-gray-200 bg-white p-0 sm:max-w-[480px]">
        {/* Header ẩn cho accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Chi tiết hóa đơn</SheetTitle>
          <SheetDescription>
            Thông tin chu kỳ gia hạn, tenant và trạng thái thanh toán.
          </SheetDescription>
        </SheetHeader>

        {/* Hero header */}
        <div className="relative shrink-0 border-b border-admin-gray-200 bg-gradient-to-br from-amber-50 via-white to-white px-6 pb-6 pt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
            Hóa đơn subscription
          </p>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Icon + số hóa đơn */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                  <Receipt className="h-5 w-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-mono text-lg font-bold text-admin-gray-900">
                    {invoiceDetail?.invoiceNumber ?? invoice?.invoiceNumber ?? '—'}
                  </h2>
                  <p className="mt-0.5 text-sm text-admin-gray-400">
                    {invoiceDetail?.tenantName ?? invoice?.tenantName}
                  </p>
                </div>
              </div>
            </div>

            {invoiceDetail ? (
              <InvoiceStatusBadge status={invoiceDetail.status} />
            ) : invoice ? (
              <InvoiceStatusBadge status={invoice.status} />
            ) : null}
          </div>

          {/* Số tiền nổi bật */}
          {invoiceDetail ? (
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-admin-gray-900">
                {formatVND(invoiceDetail.amount)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Nội dung có thể scroll */}
        <div className="flex-1 overflow-y-auto">
          {/* Loading state */}
          {isLoading ? (
            <div className="grid min-h-[280px] place-items-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-admin-brand-500" />
                <p className="mt-4 text-sm font-semibold text-admin-gray-900">
                  Đang tải chi tiết hóa đơn
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
                Không thể tải chi tiết hóa đơn
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

          {invoiceDetail ? (
            <div className="space-y-6 p-6">
              {/* Section: Tenant & Gói dịch vụ */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                  Thông tin
                </p>
                <div className="divide-y divide-admin-gray-100 rounded-xl border border-admin-gray-200 bg-white">
                  {/* Tenant */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                      <Building2 className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-admin-gray-400">Tenant</p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-admin-gray-900">
                        {invoiceDetail.tenantName}
                      </p>
                    </div>
                  </div>

                  {/* Gói dịch vụ */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <Package className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-admin-gray-400">Gói dịch vụ</p>
                      <p className="mt-0.5 text-sm font-semibold text-admin-gray-900">
                        {invoiceDetail.planName}
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
                        {formatDateTime(invoiceDetail.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Chu kỳ thanh toán */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                  Chu kỳ gia hạn
                </p>
                <div className="rounded-xl border border-admin-gray-200 bg-admin-gray-50 px-4 py-4">
                  <div className="flex items-center gap-3">
                    {/* Ngày bắt đầu */}
                    <div className="flex-1 text-center">
                      <p className="text-xs text-admin-gray-400">Bắt đầu</p>
                      <p className="mt-1 text-sm font-bold text-admin-gray-900">
                        {formatDate(invoiceDetail.billingPeriodStart)}
                      </p>
                    </div>

                    {/* Mũi tên */}
                    <div className="flex shrink-0 items-center gap-1">
                      <div className="h-px w-8 bg-admin-gray-300" />
                      <ArrowRight className="h-4 w-4 text-admin-gray-400" />
                    </div>

                    {/* Ngày kết thúc */}
                    <div className="flex-1 text-center">
                      <p className="text-xs text-admin-gray-400">Kết thúc</p>
                      <p className="mt-1 text-sm font-bold text-admin-gray-900">
                        {formatDate(invoiceDetail.billingPeriodEnd)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Thanh toán */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                  Thanh toán
                </p>
                <div className="divide-y divide-admin-gray-100 rounded-xl border border-admin-gray-200 bg-white">
                  {/* Phương thức */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-admin-gray-400">Phương thức</p>
                      <p className="mt-0.5 text-sm font-semibold text-admin-gray-900">
                        {getPaymentMethodLabel(invoiceDetail.paymentMethod)}
                      </p>
                    </div>
                  </div>

                  {/* Thời điểm thanh toán */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-admin-gray-100">
                      <CalendarDays className="h-3.5 w-3.5 text-admin-gray-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-admin-gray-400">Thời điểm thanh toán</p>
                      <p className="mt-0.5 text-sm font-semibold text-admin-gray-900">
                        {invoiceDetail.paidAt
                          ? formatDateTime(invoiceDetail.paidAt)
                          : 'Chưa thanh toán'}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section: Ghi chú (chỉ hiện nếu có) */}
              {invoiceDetail.note ? (
                <section>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                    Ghi chú
                  </p>
                  <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <p className="text-sm leading-6 text-amber-900">{invoiceDetail.note}</p>
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
};
