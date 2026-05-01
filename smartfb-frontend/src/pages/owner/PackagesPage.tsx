import type { ReactNode } from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Package, RefreshCw, Users2, Utensils, Warehouse } from 'lucide-react';
import { useCurrentSubscription } from '@modules/subscription/hooks/useCurrentSubscription';
import type { SubscriptionPlan } from '@modules/subscription/types/subscription.types';
import { Button } from '@shared/components/ui/button';
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

const PlanLimitCard = ({ icon, label, value }: PlanLimitCardProps) => (
  <div className="rounded-card border border-border bg-background p-4">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-card bg-primary-light text-primary">
      {icon}
    </div>
    <p className="text-sm text-text-secondary">{label}</p>
    <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
  </div>
);

const getEnabledFeatures = (plan: SubscriptionPlan): string[] => {
  const features = plan.features ?? {};

  return Object.entries(features)
    .filter(([, enabled]) => enabled)
    .map(([key]) => getFeatureLabel(key));
};

/**
 * Trang gói dịch vụ của owner.
 * Hiển thị subscription hiện tại từ `GET /api/v1/subscriptions/current`.
 */
export default function PackagesPage() {
  const { data: subscription, isLoading, isError, refetch } = useCurrentSubscription();

  const plan = subscription?.plan ?? null;
  const enabledFeatures = plan ? getEnabledFeatures(plan) : [];

  const pageHeader = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-primary-light">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Gói dịch vụ</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Theo dõi gói dịch vụ hiện tại của tài khoản đang đăng nhập.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isLoading}>
        <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
        Làm mới
      </Button>
    </div>
  );

  if (isLoading) {
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

  if (isError) {
    return (
      <div className="space-y-6 pb-8">
        {pageHeader}
        <div className="flex min-h-[360px] items-center justify-center rounded-card border border-border bg-card shadow-card">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-500" />
            <p className="font-medium text-text-primary">Không thể tải gói dịch vụ hiện tại</p>
            <p className="mt-1 text-sm text-text-secondary">
              Vui lòng kiểm tra phiên đăng nhập hoặc thử lại sau.
            </p>
            <Button type="button" className="mt-4" onClick={() => void refetch()}>
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!subscription || !plan) {
    return (
      <div className="space-y-6 pb-8">
        {pageHeader}
        <div className="flex min-h-[360px] items-center justify-center rounded-card border border-dashed border-border">
          <div className="text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-text-secondary" />
            <p className="font-medium text-text-primary">Chưa có gói dịch vụ</p>
            <p className="mt-1 text-sm text-text-secondary">
              Tài khoản hiện tại chưa có gói dịch vụ đang hoạt động.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {pageHeader}

      <section className="rounded-card border border-border bg-card p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-text-primary">{plan.name}</h2>
              <SubscriptionStatusBadge status={subscription.status} />
            </div>
            <p className="text-sm text-text-secondary">
              Mã gói: <span className="font-semibold text-text-primary">{plan.slug}</span>
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              Gói này đang áp dụng cho toàn bộ tài khoản doanh nghiệp hiện tại.
            </p>
          </div>

          <div className="rounded-card bg-primary-light px-5 py-4 text-right">
            <p className="text-sm font-medium text-primary">Giá theo tháng</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{formatVND(plan.priceMonthly)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PlanLimitCard
            icon={<Warehouse className="h-5 w-5" />}
            label="Số chi nhánh tối đa"
            value={getLimitDisplay(plan.maxBranches)}
          />
          <PlanLimitCard
            icon={<Users2 className="h-5 w-5" />}
            label="Số nhân viên tối đa"
            value={getLimitDisplay(plan.maxStaff)}
          />
          <PlanLimitCard
            icon={<Utensils className="h-5 w-5" />}
            label="Số món tối đa"
            value={getLimitDisplay(plan.maxMenuItems)}
          />
          <PlanLimitCard
            icon={<CalendarClock className="h-5 w-5" />}
            label="Ngày hết hạn"
            value={subscription.expiresAt ? formatDate(subscription.expiresAt) : 'Không giới hạn'}
          />
        </div>
      </section>

      <section className="rounded-card border border-border bg-card p-6 shadow-card">
        <h2 className="text-lg font-bold text-text-primary">Tính năng đang bật</h2>
        {enabledFeatures.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
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
          <p className="mt-3 text-sm text-text-secondary">Gói hiện tại chưa có tính năng nào được bật.</p>
        )}
      </section>
    </div>
  );
}
