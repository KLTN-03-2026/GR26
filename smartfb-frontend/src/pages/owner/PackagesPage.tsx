import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Package,
  QrCode,
  RefreshCw,
  Users2,
  Utensils,
  Warehouse,
} from 'lucide-react';
import { useCreateTenantRenewalInvoice } from '@modules/subscription/hooks/useCreateTenantRenewalInvoice';
import { useCurrentSubscription } from '@modules/subscription/hooks/useCurrentSubscription';
import { useGeneratePlanPaymentQR } from '@modules/subscription/hooks/useGeneratePlanPaymentQR';
import { useSubscriptionPlans } from '@modules/subscription/hooks/useSubscriptionPlans';
import { useTenantInvoices } from '@modules/subscription/hooks/useTenantInvoices';
import type {
  PlanPaymentMethod,
  PlanQRPayment,
  SubscriptionPlan,
  TenantInvoice,
} from '@modules/subscription/types/subscription.types';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDate } from '@shared/utils/formatDate';
import { cn } from '@shared/utils/cn';

interface PlanLimitCardProps {
  icon: ReactNode;
  label: string;
  value: string;
}

interface SubscriptionStatusBadgeProps {
  status: string;
}

interface InvoiceStatusBadgeProps {
  status: string;
}

const MONTH_OPTIONS = [1, 3, 6, 12, 24];

const PAYMENT_METHOD_OPTIONS: PlanPaymentMethod[] = ['VIETQR', 'MOMO'];

const getLimitDisplay = (value: number | null): string => {
  if (value === null || value === 0) {
    return 'Không giới hạn';
  }

  return String(value);
};

const getFeatureLabel = (key: string): string => {
  const labels: Record<string, string> = {
    POS: 'POS bán hàng',
    INVENTORY: 'Quản lý kho',
    PROMOTION: 'Khuyến mãi',
    REPORT: 'Báo cáo',
    AI: 'Dự báo AI',
    ADVANCED_REPORT: 'Báo cáo nâng cao',
    hasPos: 'POS bán hàng',
    hasInventory: 'Quản lý kho',
    hasPromotion: 'Khuyến mãi',
    hasAi: 'Dự báo AI',
    hasAdvancedReport: 'Báo cáo nâng cao',
  };

  return labels[key] ?? key;
};

const getEnabledFeatures = (plan: SubscriptionPlan): string[] => {
  const features = plan.features ?? {};

  return Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => getFeatureLabel(key));
};

const getInvoiceStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    UNPAID: 'Chờ thanh toán',
    PAID: 'Đã thanh toán',
    CANCELLED: 'Đã hủy',
  };

  return labels[status] ?? status;
};

const SubscriptionStatusBadge = ({ status }: SubscriptionStatusBadgeProps) => {
  const isActive = status === 'ACTIVE';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        isActive ? 'bg-success-light text-success-text' : 'bg-warning-light text-warning-text'
      )}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {isActive ? 'Đang hoạt động' : status}
    </span>
  );
};

const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  const statusClass = {
    UNPAID: 'bg-warning-light text-warning-text',
    PAID: 'bg-success-light text-success-text',
    CANCELLED: 'bg-muted text-text-secondary',
  }[status] ?? 'bg-muted text-text-secondary';

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', statusClass)}>
      {getInvoiceStatusLabel(status)}
    </span>
  );
};

const PlanLimitCard = ({ icon, label, value }: PlanLimitCardProps) => (
  <div className="rounded-card border border-border bg-background p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-card bg-primary-light text-primary">
      {icon}
    </div>
    <p className="text-sm text-text-secondary">{label}</p>
    <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
  </div>
);

/**
 * Trang gói dịch vụ của owner.
 * Cho phép xem gói hiện tại, chọn gói mới/gia hạn, tạo invoice và sinh QR thanh toán.
 */
export default function PackagesPage() {
  const [selectedMonths, setSelectedMonths] = useState(3);
  const [paymentMethod, setPaymentMethod] = useState<PlanPaymentMethod>('VIETQR');
  const [note, setNote] = useState('');
  const [qrPayment, setQrPayment] = useState<PlanQRPayment | null>(null);
  const [qrInvoice, setQrInvoice] = useState<TenantInvoice | null>(null);

  const {
    data: subscription,
    isLoading: isSubscriptionLoading,
    isError: isSubscriptionError,
    refetch: refetchSubscription,
  } = useCurrentSubscription();
  const {
    data: plans,
    isLoading: isPlansLoading,
    isError: isPlansError,
    refetch: refetchPlans,
  } = useSubscriptionPlans();
  const {
    data: invoicePage,
    isLoading: isInvoicesLoading,
    refetch: refetchInvoices,
  } = useTenantInvoices({ page: 0, size: 5 });

  const createInvoiceMutation = useCreateTenantRenewalInvoice();
  const generateQRMutation = useGeneratePlanPaymentQR();

  const currentPlan = subscription?.plan ?? null;
  const enabledFeatures = currentPlan ? getEnabledFeatures(currentPlan) : [];
  const activePlans = useMemo(
    () => (plans ?? []).filter((plan) => plan.isActive),
    [plans]
  );
  const recentInvoices = invoicePage?.content ?? [];
  const unpaidInvoice = recentInvoices.find((invoice) => invoice.status === 'UNPAID') ?? null;
  const isInitialLoading = isSubscriptionLoading || isPlansLoading;
  const isActionPending = createInvoiceMutation.isPending || generateQRMutation.isPending;

  const handleRefresh = () => {
    void refetchSubscription();
    void refetchPlans();
    void refetchInvoices();
  };

  const handleCreatePayment = async (plan: SubscriptionPlan) => {
    const invoice = await createInvoiceMutation.mutateAsync({
      planId: plan.id,
      months: selectedMonths,
      note: note.trim() || undefined,
    });
    const qr = await generateQRMutation.mutateAsync({
      invoiceId: invoice.id,
      method: paymentMethod,
    });
    setQrInvoice(invoice);
    setQrPayment(qr);
    void refetchInvoices();
  };

  const handlePayInvoice = async (invoice: TenantInvoice) => {
    const qr = await generateQRMutation.mutateAsync({
      invoiceId: invoice.id,
      method: paymentMethod,
    });
    setQrInvoice(invoice);
    setQrPayment(qr);
  };

  const pageHeader = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary-light">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Gói dịch vụ</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Theo dõi gói hiện tại, gia hạn hoặc nâng cấp bằng QR thanh toán.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" onClick={handleRefresh} disabled={isInitialLoading}>
        <RefreshCw className={cn('mr-2 h-4 w-4', isInitialLoading && 'animate-spin')} />
        Làm mới
      </Button>
    </div>
  );

  if (isInitialLoading) {
    return (
      <div className="space-y-6 pb-8">
        {pageHeader}
        <div className="flex min-h-[360px] items-center justify-center rounded-card border border-border bg-card shadow-card">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-text-secondary">Đang tải thông tin gói dịch vụ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubscriptionError || isPlansError) {
    return (
      <div className="space-y-6 pb-8">
        {pageHeader}
        <div className="flex min-h-[360px] items-center justify-center rounded-card border border-border bg-card shadow-card">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <p className="font-medium text-text-primary">Không thể tải dữ liệu gói dịch vụ</p>
            <p className="mt-1 text-sm text-text-secondary">
              Vui lòng kiểm tra phiên đăng nhập hoặc thử lại sau.
            </p>
            <Button type="button" className="mt-4" onClick={handleRefresh}>
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {pageHeader}

      {currentPlan ? (
        <section className="rounded-card border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-text-primary">{currentPlan.name}</h2>
                <SubscriptionStatusBadge status={subscription?.status ?? 'ACTIVE'} />
              </div>
              <p className="text-sm text-text-secondary">
                Mã gói: <span className="font-semibold text-text-primary">{currentPlan.slug}</span>
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                Gói này đang áp dụng cho toàn bộ tài khoản doanh nghiệp hiện tại.
              </p>
            </div>

            <div className="rounded-card bg-primary-light px-5 py-4 text-right">
              <p className="text-sm font-medium text-primary">Giá theo tháng</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{formatVND(currentPlan.priceMonthly)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PlanLimitCard
              icon={<Warehouse className="h-5 w-5" />}
              label="Số chi nhánh tối đa"
              value={getLimitDisplay(currentPlan.maxBranches)}
            />
            <PlanLimitCard
              icon={<Users2 className="h-5 w-5" />}
              label="Số nhân viên tối đa"
              value={getLimitDisplay(currentPlan.maxStaff)}
            />
            <PlanLimitCard
              icon={<Utensils className="h-5 w-5" />}
              label="Số món tối đa"
              value={getLimitDisplay(currentPlan.maxMenuItems)}
            />
            <PlanLimitCard
              icon={<CalendarClock className="h-5 w-5" />}
              label="Ngày hết hạn"
              value={subscription?.expiresAt ? formatDate(subscription.expiresAt) : 'Không giới hạn'}
            />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-text-primary">Tính năng đang bật</h3>
            {enabledFeatures.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {enabledFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-1 rounded-full bg-success-light px-3 py-1 text-sm font-medium text-success-text"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {feature}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-text-secondary">Gói hiện tại chưa có tính năng nào được bật.</p>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-card border border-dashed border-border p-6 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-text-secondary" />
          <p className="font-medium text-text-primary">Chưa có gói dịch vụ</p>
          <p className="mt-1 text-sm text-text-secondary">
            Hãy chọn một gói bên dưới để tạo hóa đơn thanh toán.
          </p>
        </section>
      )}

      <section className="rounded-card border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Chọn gói gia hạn hoặc nâng cấp</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Hệ thống sẽ tạo hóa đơn chờ thanh toán và sinh QR theo phương thức bạn chọn.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
            <div className="space-y-2">
              <Label htmlFor="package-months">Số tháng</Label>
              <select
                id="package-months"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                value={selectedMonths}
                onChange={(event) => setSelectedMonths(Number(event.target.value))}
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month} value={month}>
                    {month} tháng
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-payment-method">Thanh toán</Label>
              <select
                id="package-payment-method"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-text-primary"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PlanPaymentMethod)}
              >
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="package-note">Ghi chú</Label>
              <Input
                id="package-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Tùy chọn"
              />
            </div>
          </div>
        </div>

        {unpaidInvoice ? (
          <div className="mt-5 rounded-card border border-warning bg-warning-light p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-text-primary">
                  Bạn đang có hóa đơn chờ thanh toán: {unpaidInvoice.invoiceNumber}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {unpaidInvoice.planName} - {formatVND(unpaidInvoice.amount)}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => void handlePayInvoice(unpaidInvoice)}
                disabled={generateQRMutation.isPending}
              >
                <QrCode className="mr-2 h-4 w-4" />
                Tạo lại QR
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {activePlans.length > 0 ? (
            activePlans.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id;
              const features = getEnabledFeatures(plan);
              const estimatedAmount = plan.priceMonthly * selectedMonths;

              return (
                <article key={plan.id} className="rounded-card border border-border bg-background p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{plan.slug}</p>
                    </div>
                    {isCurrentPlan ? (
                      <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
                        Gói hiện tại
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-4 text-2xl font-bold text-text-primary">{formatVND(plan.priceMonthly)}</p>
                  <p className="text-sm text-text-secondary">mỗi tháng</p>

                  <div className="mt-4 space-y-2 text-sm text-text-secondary">
                    <p>Chi nhánh: {getLimitDisplay(plan.maxBranches)}</p>
                    <p>Nhân viên: {getLimitDisplay(plan.maxStaff)}</p>
                    <p>Món: {getLimitDisplay(plan.maxMenuItems)}</p>
                  </div>

                  <div className="mt-4 min-h-16">
                    {features.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {features.slice(0, 4).map((feature) => (
                          <span key={feature} className="rounded-full bg-muted px-2.5 py-1 text-xs text-text-secondary">
                            {feature}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary">Chưa có feature flag.</p>
                    )}
                  </div>

                  <div className="mt-5 border-t border-border pt-4">
                    <p className="text-sm text-text-secondary">Tạm tính {selectedMonths} tháng</p>
                    <p className="mt-1 text-lg font-bold text-text-primary">{formatVND(estimatedAmount)}</p>
                  </div>

                  <Button
                    type="button"
                    className="mt-4 w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    onClick={() => void handleCreatePayment(plan)}
                    disabled={isActionPending || Boolean(unpaidInvoice)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {isCurrentPlan ? 'Gia hạn gói này' : 'Nâng cấp gói này'}
                  </Button>
                </article>
              );
            })
          ) : (
            <div className="col-span-full rounded-card border border-dashed border-border p-6 text-center">
              <Package className="mx-auto mb-3 h-8 w-8 text-text-secondary" />
              <p className="font-medium text-text-primary">Chưa có gói đang mở bán</p>
              <p className="mt-1 text-sm text-text-secondary">Vui lòng liên hệ admin hệ thống để được hỗ trợ.</p>
            </div>
          )}
        </div>
      </section>

      {qrPayment ? (
        <section className="rounded-card border border-primary bg-card p-6 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-text-primary">QR thanh toán</h2>
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                Hóa đơn {qrPayment.invoiceNumber} - {formatVND(qrPayment.amount)}
              </p>
              {qrInvoice ? (
                <p className="mt-1 text-sm text-text-secondary">
                  Gói {qrInvoice.planName}, chu kỳ {formatDate(qrInvoice.billingPeriodStart)} -{' '}
                  {formatDate(qrInvoice.billingPeriodEnd)}
                </p>
              ) : null}
              <p className="mt-1 text-sm text-text-secondary">
                QR hết hạn sau khoảng {Math.round(qrPayment.expiresInSeconds / 60)} phút.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              {qrPayment.qrCodeUrl ? (
                <img
                  src={qrPayment.qrCodeUrl}
                  alt={`QR thanh toán ${qrPayment.invoiceNumber}`}
                  className="h-48 w-48 rounded-card border border-border object-contain"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-card border border-dashed border-border p-4 text-center text-sm text-text-secondary">
                  Gateway không trả URL ảnh QR.
                </div>
              )}
              <Button type="button" variant="outline" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Kiểm tra thanh toán
              </Button>
            </div>
          </div>

          {qrPayment.qrCodeData ? (
            <div className="mt-4 rounded-card bg-muted p-3">
              <p className="mb-1 text-xs font-semibold text-text-secondary">Dữ liệu QR</p>
              <p className="break-all text-xs text-text-secondary">{qrPayment.qrCodeData}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-card border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Hóa đơn gần đây</h2>
            <p className="mt-1 text-sm text-text-secondary">Danh sách hóa đơn gói dịch vụ của tenant hiện tại.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void refetchInvoices()} disabled={isInvoicesLoading}>
            <RefreshCw className={cn('mr-2 h-4 w-4', isInvoicesLoading && 'animate-spin')} />
            Tải lại
          </Button>
        </div>

        <div className="mt-5 overflow-hidden rounded-card border border-border">
          {recentInvoices.length > 0 ? (
            <div className="divide-y divide-border">
              {recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-primary">{invoice.invoiceNumber}</p>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {invoice.planName} - {formatDate(invoice.billingPeriodStart)} đến {formatDate(invoice.billingPeriodEnd)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 md:text-right">
                    <div>
                      <p className="font-bold text-text-primary">{formatVND(invoice.amount)}</p>
                      <p className="text-xs text-text-secondary">
                        {invoice.paidAt ? `Thanh toán ${formatDate(invoice.paidAt)}` : 'Chưa thanh toán'}
                      </p>
                    </div>
                    {invoice.status === 'UNPAID' ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handlePayInvoice(invoice)}
                        disabled={generateQRMutation.isPending}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        QR
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <CreditCard className="mx-auto mb-3 h-8 w-8 text-text-secondary" />
              <p className="font-medium text-text-primary">Chưa có hóa đơn gói dịch vụ</p>
              <p className="mt-1 text-sm text-text-secondary">Chọn một gói ở trên để tạo hóa đơn đầu tiên.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
