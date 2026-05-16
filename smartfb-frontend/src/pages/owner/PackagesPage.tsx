import { useCallback, useEffect, useMemo, useState } from 'react';
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
  XCircle,
} from 'lucide-react';
import { useCancelTenantInvoice } from '@modules/subscription/hooks/useCancelTenantInvoice';
import { useCreateTenantRenewalInvoice } from '@modules/subscription/hooks/useCreateTenantRenewalInvoice';
import { useCurrentSubscription } from '@modules/subscription/hooks/useCurrentSubscription';
import { useGeneratePlanPaymentQR } from '@modules/subscription/hooks/useGeneratePlanPaymentQR';
import { useSubscriptionPlans } from '@modules/subscription/hooks/useSubscriptionPlans';
import { useSyncPlanPaymentStatus } from '@modules/subscription/hooks/useSyncPlanPaymentStatus';
import { useTenantInvoices } from '@modules/subscription/hooks/useTenantInvoices';
import type {
  PlanPaymentMethod,
  PlanQRPayment,
  SubscriptionPlan,
  TenantInvoice,
} from '@modules/subscription/types/subscription.types';
import { PAYMENT_METHOD_LABELS } from '@modules/subscription/types/subscription.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
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

interface PaymentMethodOption {
  method: PlanPaymentMethod;
  enabled: boolean;
  disabledReason?: string;
}

const MONTH_OPTIONS = [1, 3, 6, 12, 24];
const PAYOS_PAYMENT_POLL_INTERVAL_MS = 5000;
const DEFAULT_PLAN_PAYMENT_METHOD: PlanPaymentMethod = 'PAYOS';

// Hiện luồng thanh toán gói chỉ bật PayOS; VietQR/MoMo giữ lại để user biết các gateway này chưa khả dụng.
const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { method: 'VIETQR', enabled: false, disabledReason: 'Tạm tắt' },
  { method: 'MOMO', enabled: false, disabledReason: 'Tạm tắt' },
  { method: 'PAYOS', enabled: true },
];

const getLimitDisplay = (value: number | null): string => {
  if (value === null) {
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
  const [paymentMethod, setPaymentMethod] = useState<PlanPaymentMethod>(DEFAULT_PLAN_PAYMENT_METHOD);
  const [note, setNote] = useState('');
  const [qrPayment, setQrPayment] = useState<PlanQRPayment | null>(null);
  const [qrInvoice, setQrInvoice] = useState<TenantInvoice | null>(null);
  const [invoiceToCancel, setInvoiceToCancel] = useState<TenantInvoice | null>(null);
  const [planToConfirm, setPlanToConfirm] = useState<SubscriptionPlan | null>(null);

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
  const syncPaymentMutation = useSyncPlanPaymentStatus();
  const cancelInvoiceMutation = useCancelTenantInvoice();

  const currentPlan = subscription?.plan ?? null;
  const enabledFeatures = currentPlan ? getEnabledFeatures(currentPlan) : [];
  const activePlans = useMemo(
    () => (plans ?? []).filter((plan) => plan.isActive),
    [plans]
  );
  const recentInvoices = invoicePage?.content ?? [];
  const unpaidInvoice = recentInvoices.find((invoice) => invoice.status === 'UNPAID') ?? null;
  const isInitialLoading = isSubscriptionLoading || isPlansLoading;
  const isActionPending =
    createInvoiceMutation.isPending ||
    generateQRMutation.isPending ||
    syncPaymentMutation.isPending ||
    cancelInvoiceMutation.isPending;
  const isCancelDialogOpen = Boolean(invoiceToCancel);
  const isPaymentConfirmDialogOpen = Boolean(planToConfirm);
  const confirmPlanFeatures = planToConfirm ? getEnabledFeatures(planToConfirm) : [];
  const confirmEstimatedAmount = planToConfirm ? planToConfirm.priceMonthly * selectedMonths : 0;
  const confirmActionLabel = !planToConfirm
    ? 'Xác nhận gói'
    : !currentPlan
      ? 'Đăng ký gói'
      : currentPlan.id === planToConfirm.id
        ? 'Gia hạn gói'
        : 'Nâng cấp gói';

  const handleRefresh = useCallback(() => {
    void refetchSubscription();
    void refetchPlans();
    void refetchInvoices();
  }, [refetchInvoices, refetchPlans, refetchSubscription]);

  /** Kiểm tra thanh toán thông minh: PAYOS → gọi sync API, còn lại → refetch */
  const handleCheckPayment = useCallback(() => {
    if (qrPayment?.paymentMethod === 'PAYOS' && qrInvoice) {
      syncPaymentMutation.mutate({ invoiceId: qrInvoice.id, showPendingToast: true }, {
        onSuccess: () => {
          void refetchInvoices();
          void refetchSubscription();
        },
      });
    } else {
      handleRefresh();
    }
  }, [handleRefresh, qrInvoice, qrPayment?.paymentMethod, refetchInvoices, refetchSubscription, syncPaymentMutation]);

  useEffect(() => {
    if (qrPayment?.paymentMethod !== 'PAYOS' || !qrInvoice || qrInvoice.status !== 'UNPAID') {
      return;
    }

    const syncSilently = () => {
      if (syncPaymentMutation.isPending) return;

      syncPaymentMutation.mutate(
        { invoiceId: qrInvoice.id, showPendingToast: false },
        {
          onSuccess: (data) => {
            if (!data.justPaid) return;
            setQrPayment(null);
            setQrInvoice(null);
            void refetchInvoices();
            void refetchSubscription();
          },
        }
      );
    };

    const firstSyncTimer = window.setTimeout(syncSilently, 3000);
    const intervalId = window.setInterval(syncSilently, PAYOS_PAYMENT_POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(firstSyncTimer);
      window.clearInterval(intervalId);
    };
  }, [qrInvoice, qrPayment?.paymentMethod, refetchInvoices, refetchSubscription, syncPaymentMutation]);

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
      method: DEFAULT_PLAN_PAYMENT_METHOD,
    });
    setQrInvoice(invoice);
    setQrPayment(qr);
  };

  /** Mở dialog xác nhận để owner chọn số tháng và phương thức trước khi tạo invoice. */
  const handleOpenPaymentConfirmDialog = (plan: SubscriptionPlan) => {
    setSelectedMonths(3);
    setPaymentMethod(DEFAULT_PLAN_PAYMENT_METHOD);
    setNote('');
    setPlanToConfirm(plan);
  };

  /** Đóng dialog xác nhận thanh toán, chặn đóng trong lúc đang tạo invoice hoặc sinh QR. */
  const handlePaymentConfirmDialogOpenChange = (open: boolean) => {
    if (open || createInvoiceMutation.isPending || generateQRMutation.isPending) return;
    setPlanToConfirm(null);
  };

  /** Xác nhận lựa chọn trong modal rồi mới tạo hóa đơn và QR thanh toán. */
  const handleConfirmCreatePayment = async () => {
    if (!planToConfirm) return;

    await handleCreatePayment(planToConfirm);
    setPlanToConfirm(null);
  };

  /** Mở dialog xác nhận hủy invoice chờ thanh toán, không yêu cầu owner nhập lý do. */
  const handleOpenCancelInvoiceDialog = (invoice: TenantInvoice) => {
    setInvoiceToCancel(invoice);
  };

  /** Đóng dialog hủy invoice, giữ nguyên khi mutation đang chạy để tránh double submit. */
  const handleCancelInvoiceDialogOpenChange = (open: boolean) => {
    if (open || cancelInvoiceMutation.isPending) return;
    setInvoiceToCancel(null);
  };

  /** Hủy invoice gói đang chờ thanh toán và xóa QR hiện tại nếu QR thuộc invoice đó. */
  const handleConfirmCancelInvoice = () => {
    if (!invoiceToCancel) return;

    const cancellingInvoiceId = invoiceToCancel.id;
    cancelInvoiceMutation.mutate(cancellingInvoiceId, {
      onSuccess: () => {
        if (qrInvoice?.id === cancellingInvoiceId || qrPayment?.invoiceId === cancellingInvoiceId) {
          setQrPayment(null);
          setQrInvoice(null);
        }

        setInvoiceToCancel(null);
        void refetchInvoices();
        void refetchSubscription();
      },
    });
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
        <div className="flex flex-col gap-2">
          <div>
            <h2 className="text-lg font-bold text-text-primary">Chọn gói gia hạn hoặc nâng cấp</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Bấm chọn gói để xem lại chi tiết, số tháng đăng ký và phương thức thanh toán trước khi tạo QR.
            </p>
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
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => void handlePayInvoice(unpaidInvoice)}
                  disabled={isActionPending}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Tạo lại QR
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleOpenCancelInvoiceDialog(unpaidInvoice)}
                  disabled={isActionPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Hủy thanh toán
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {activePlans.length > 0 ? (
            activePlans.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id;
              const features = getEnabledFeatures(plan);
              const planActionLabel = !currentPlan
                ? 'Đăng ký gói này'
                : isCurrentPlan
                  ? 'Gia hạn gói này'
                  : 'Nâng cấp gói này';

              return (
                <article key={plan.id} className="flex flex-col justify-around rounded-card border border-border bg-background p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{plan.name}</h3>
                    </div>
                    {isCurrentPlan ? (
                      <span className="rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-primary">
                        Gói hiện tại
                      </span>
                    ) : null}
                  </div>

                  <p className=" text-2xl font-bold text-text-primary">{formatVND(plan.priceMonthly)} </p>
                  <p className="text-sm text-text-secondary">/ mỗi tháng</p>

                  <div className="h-full py-4">
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
  
                  </div>
                  <div className=" border-t border-border pt-4">
                    <p className="mt-1 text-lg font-bold text-text-primary">{formatVND(plan.priceMonthly)} / tháng</p>
                  </div>

                  <Button
                    type="button"
                    className="mt-4 w-full"
                    variant={isCurrentPlan ? 'outline' : 'default'}
                    onClick={() => handleOpenPaymentConfirmDialog(plan)}
                    disabled={isActionPending || Boolean(unpaidInvoice)}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {planActionLabel}
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
              {qrPayment.paymentMethod === 'PAYOS' ? (
                <p className="mt-2 rounded-md bg-primary-light px-3 py-2 text-xs text-primary">
                  Dùng app ngân hàng bất kỳ để quét mã QR PayOS. Sau khi thanh toán, bấm kiểm tra để cập nhật hóa đơn.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-center gap-3">
              {qrPayment.qrCodeUrl || qrPayment.qrCodeData ? (
                <div className="flex flex-col items-center gap-3 rounded-card bg-muted p-4">
                  
                  <div className="flex h-48 w-48 items-center justify-center rounded-card bg-background shadow-sm">
                    <img
                      src={
                        qrPayment.paymentMethod === 'PAYOS'
                          ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayment.qrCodeData || qrPayment.qrCodeUrl)}`
                          : qrPayment.qrCodeUrl
                      }
                      alt={`QR thanh toán ${qrPayment.invoiceNumber}`}
                      className="h-44 w-44 rounded-md object-contain"
                    />
                  </div>
                  <p className="text-xs text-text-secondary">
                    {qrPayment.paymentMethod === 'PAYOS'
                      ? ''
                      : PAYMENT_METHOD_LABELS[qrPayment.paymentMethod as PlanPaymentMethod]?.description ?? 'Quét mã QR để thanh toán'}
                  </p>
                </div>
              ) : null}
              {!qrPayment.qrCodeUrl && !qrPayment.qrCodeData ? (
                <div className="flex h-48 w-48 items-center justify-center rounded-card border border-dashed border-border p-4 text-center text-sm text-text-secondary">
                  Gateway không trả URL ảnh QR.
                </div>
              ) : null}
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckPayment}
                  disabled={syncPaymentMutation.isPending || cancelInvoiceMutation.isPending}
                >
                  <RefreshCw className={cn('mr-2 h-4 w-4', syncPaymentMutation.isPending && 'animate-spin')} />
                  Kiểm tra thanh toán
                </Button>
                {qrInvoice?.status === 'UNPAID' ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleOpenCancelInvoiceDialog(qrInvoice)}
                    disabled={isActionPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Hủy thanh toán
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {qrPayment.paymentMethod !== 'PAYOS' && qrPayment.qrCodeData ? (
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
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handlePayInvoice(invoice)}
                          disabled={isActionPending}
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          QR
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => handleOpenCancelInvoiceDialog(invoice)}
                          disabled={isActionPending}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Hủy
                        </Button>
                      </div>
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

      <Dialog open={isPaymentConfirmDialogOpen} onOpenChange={handlePaymentConfirmDialogOpenChange}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-0">
          {/* Header */}
          <div className="border-b border-border bg-gradient-to-br from-primary-light to-background px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary text-white shadow-sm">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-text-primary">{confirmActionLabel}</DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-text-secondary">
                  Kiểm tra lại gói, số tháng đăng ký và phương thức thanh toán trước khi tạo hóa đơn QR.
                </DialogDescription>
              </div>
            </div>
          </div>

          {planToConfirm ? (
            <div className="space-y-5 px-6 py-5">
              {/* Plan summary card */}
              <div className="overflow-hidden rounded-card border border-border bg-muted/50">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-text-primary">{planToConfirm.name}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">{planToConfirm.slug}</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end">
                    <p className="text-xs text-text-secondary">Giá theo tháng</p>
                    <p className="mt-0.5 text-2xl font-extrabold text-primary">{formatVND(planToConfirm.priceMonthly)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                  <div className="px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Chi nhánh</p>
                    <p className="mt-1 text-xl font-bold text-text-primary">{getLimitDisplay(planToConfirm.maxBranches)}</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Nhân viên</p>
                    <p className="mt-1 text-xl font-bold text-text-primary">{getLimitDisplay(planToConfirm.maxStaff)}</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Món</p>
                    <p className="mt-1 text-xl font-bold text-text-primary">{getLimitDisplay(planToConfirm.maxMenuItems)}</p>
                  </div>
                </div>
              </div>

              {/* Features */}
              {confirmPlanFeatures.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-text-primary">Tính năng trong gói</p>
                  <div className="flex flex-wrap gap-2">
                    {confirmPlanFeatures.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-secondary"
                      >
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Month selector - chip style */}
              <div className="space-y-2">
                <Label>Số tháng đăng ký</Label>
                <div className="flex flex-wrap gap-2">
                  {MONTH_OPTIONS.map((month) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => setSelectedMonths(month)}
                      className={cn(
                        'rounded-card border px-4 py-2 text-sm font-semibold transition-all',
                        selectedMonths === month
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-border bg-background text-text-secondary hover:border-primary hover:text-primary'
                      )}
                    >
                      {month} tháng
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method - card style */}
              <div className="space-y-2">
                <Label>Phương thức thanh toán</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHOD_OPTIONS.map(({ method, enabled, disabledReason }) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      disabled={!enabled}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-card border px-3 py-3 text-xs font-semibold transition-all',
                        paymentMethod === method
                          ? 'border-primary bg-primary-light text-primary shadow-sm'
                          : 'border-border bg-background text-text-secondary hover:border-primary hover:text-primary',
                        !enabled && 'cursor-not-allowed opacity-50 hover:border-border hover:text-text-secondary'
                      )}
                    >
                      <CreditCard className={cn('h-5 w-5', paymentMethod === method ? 'text-primary' : 'text-text-secondary')} />
                      <span>{PAYMENT_METHOD_LABELS[method].label}</span>
                      {!enabled && disabledReason ? (
                        <span className="text-[10px] font-medium text-text-secondary">{disabledReason}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label htmlFor="confirm-package-note">Ghi chú</Label>
                <Input
                  id="confirm-package-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Tùy chọn"
                />
              </div>

              {/* Estimated total */}
              <div className="overflow-hidden rounded-card border border-primary/30 bg-gradient-to-r from-primary-light to-background">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-primary">Tạm tính</p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      {selectedMonths} tháng × {formatVND(planToConfirm.priceMonthly)}
                    </p>
                  </div>
                  <p className="text-3xl font-extrabold text-text-primary">{formatVND(confirmEstimatedAmount)}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPlanToConfirm(null)}
              disabled={createInvoiceMutation.isPending || generateQRMutation.isPending}
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={() => void handleConfirmCreatePayment()}
              disabled={createInvoiceMutation.isPending || generateQRMutation.isPending}
              className="gap-2"
            >
              <QrCode className="h-4 w-4" />
              {createInvoiceMutation.isPending || generateQRMutation.isPending ? 'Đang tạo QR...' : 'Xác nhận tạo QR'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelDialogOpen} onOpenChange={handleCancelInvoiceDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hủy thanh toán gói</DialogTitle>
            <DialogDescription>
              Hóa đơn {invoiceToCancel?.invoiceNumber} sẽ được hủy để bạn chọn lại gói hoặc tạo hóa đơn mới.
              Thao tác này không cần nhập lý do.
            </DialogDescription>
          </DialogHeader>

          {invoiceToCancel ? (
            <div className="rounded-card border border-border bg-muted p-3 text-sm">
              <p className="font-semibold text-text-primary">{invoiceToCancel.planName}</p>
              <p className="mt-1 text-text-secondary">{formatVND(invoiceToCancel.amount)}</p>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInvoiceToCancel(null)}
              disabled={cancelInvoiceMutation.isPending}
            >
              Giữ lại
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmCancelInvoice}
              disabled={cancelInvoiceMutation.isPending}
            >
              {cancelInvoiceMutation.isPending ? 'Đang hủy...' : 'Hủy thanh toán'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
