import { Button } from '@shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@shared/components/ui/sheet';
import { formatNumber, formatVND } from '@shared/utils/formatCurrency';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  GitBranch,
  Loader2,
  Package,
  RefreshCcw,
  ShoppingCart,
  Tag,
  UtensilsCrossed,
  Users,
  XCircle,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useAdminPlanDetail } from '../hooks/useAdminPlanDetail';
import type { AdminPlan } from '../types/adminPlan.types';

interface AdminPlanDetailDrawerProps {
  plan: AdminPlan | null;
  onOpenChange: (open: boolean) => void;
}

interface FeatureMeta {
  label: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
  colorClass: string;
}

// Map feature key → nhãn tiếng Việt, mô tả nghiệp vụ và icon
const FEATURE_META: Record<string, FeatureMeta> = {
  POS: {
    label: 'POS bán hàng',
    description: 'Quản lý đơn và thanh toán tại quầy',
    Icon: ShoppingCart,
    colorClass: 'bg-blue-50 text-blue-600',
  },
  INVENTORY: {
    label: 'Quản lý kho',
    description: 'Nhập, xuất, kiểm kho và cảnh báo tồn',
    Icon: Package,
    colorClass: 'bg-amber-50 text-amber-600',
  },
  PROMOTION: {
    label: 'Voucher & Khuyến mãi',
    description: 'Mã giảm giá và chiến dịch khuyến mãi',
    Icon: Tag,
    colorClass: 'bg-pink-50 text-pink-600',
  },
  REPORT: {
    label: 'Báo cáo nâng cao',
    description: 'Phân tích doanh thu, kho và nhân sự',
    Icon: BarChart3,
    colorClass: 'bg-violet-50 text-violet-600',
  },
  AI: {
    label: 'Dự báo AI',
    description: 'Dự báo tồn kho thông minh bằng AI',
    Icon: Bot,
    colorClass: 'bg-emerald-50 text-emerald-600',
  },
};

const getFeatureMeta = (key: string): FeatureMeta => {
  return (
    FEATURE_META[key] ?? {
      label: key,
      description: '',
      Icon: CheckCircle2,
      colorClass: 'bg-admin-gray-100 text-admin-gray-600',
    }
  );
};

const getLimitDisplay = (value: number | null): string => {
  if (value === null || value === 0) return '∞';
  return formatNumber(value);
};

/**
 * Drawer xem chi tiết gói dịch vụ — bao gồm giá, giới hạn sử dụng và feature flags.
 */
export const AdminPlanDetailDrawer = ({
  plan,
  onOpenChange,
}: AdminPlanDetailDrawerProps) => {
  const {
    data: planDetail,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useAdminPlanDetail(plan?.id ?? null);

  const featureEntries = Object.entries(planDetail?.features ?? {});
  const enabledCount = featureEntries.filter(([, enabled]) => enabled).length;

  const handleRetry = () => {
    void refetch();
  };

  return (
    <Sheet open={Boolean(plan)} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden border-admin-gray-200 bg-white p-0 sm:max-w-[480px]">
        {/* Header ẩn cho accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Chi tiết gói dịch vụ</SheetTitle>
          <SheetDescription>
            Thông tin giá, giới hạn sử dụng và feature flag của plan.
          </SheetDescription>
        </SheetHeader>

        {/* Hero header — gradient brand */}
        <div className="relative shrink-0 border-b border-admin-gray-200 bg-gradient-to-br from-admin-brand-50 via-white to-white px-6 pb-6 pt-10">
          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-widest text-admin-brand-500">
            Gói dịch vụ
          </p>

          {/* Tên và status badge */}
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-bold text-admin-gray-900">
                {planDetail?.name ?? plan?.name ?? '—'}
              </h2>
              <code className="mt-0.5 block text-sm text-admin-gray-400">
                /{planDetail?.slug ?? plan?.slug}
              </code>
            </div>
            {planDetail ? (
              <span
                className={
                  planDetail.isActive
                    ? 'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-admin-success-light px-3 py-1 text-xs font-semibold text-admin-success'
                    : 'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-admin-gray-100 px-3 py-1 text-xs font-semibold text-admin-gray-500'
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {planDetail.isActive ? 'Đang bán' : 'Đã ẩn'}
              </span>
            ) : null}
          </div>

          {/* Giá */}
          {planDetail ? (
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-admin-gray-900">
                {formatVND(planDetail.priceMonthly)}
              </span>
              <span className="text-sm text-admin-gray-400">/tháng</span>
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
                  Đang tải chi tiết gói
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
                Không thể tải chi tiết gói
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

          {planDetail ? (
            <div className="space-y-6 p-6">
              {/* Section: Giới hạn sử dụng */}
              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                  Giới hạn sử dụng
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {/* Chi nhánh */}
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-admin-gray-200 bg-admin-gray-50 px-3 py-4 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                      <GitBranch className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold leading-none text-admin-gray-900">
                      {getLimitDisplay(planDetail.maxBranches)}
                    </p>
                    <p className="text-xs text-admin-gray-500">Chi nhánh</p>
                  </div>

                  {/* Nhân viên */}
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-admin-gray-200 bg-admin-gray-50 px-3 py-4 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100">
                      <Users className="h-4 w-4 text-violet-600" />
                    </div>
                    <p className="text-2xl font-bold leading-none text-admin-gray-900">
                      {getLimitDisplay(planDetail.maxStaff)}
                    </p>
                    <p className="text-xs text-admin-gray-500">Nhân viên</p>
                  </div>

                  {/* Món */}
                  <div className="flex flex-col items-center gap-2 rounded-xl border border-admin-gray-200 bg-admin-gray-50 px-3 py-4 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                      <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold leading-none text-admin-gray-900">
                      {getLimitDisplay(planDetail.maxMenuItems)}
                    </p>
                    <p className="text-xs text-admin-gray-500">Món</p>
                  </div>
                </div>
              </section>

              {/* Section: Tính năng */}
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-admin-gray-400">
                    Tính năng
                  </p>
                  {featureEntries.length > 0 ? (
                    <span className="rounded-full bg-admin-brand-50 px-2.5 py-0.5 text-xs font-semibold text-admin-brand-600">
                      {enabledCount}/{featureEntries.length} bật
                    </span>
                  ) : null}
                </div>

                {featureEntries.length > 0 ? (
                  <div className="divide-y divide-admin-gray-100 rounded-xl border border-admin-gray-200 bg-white">
                    {featureEntries.map(([key, enabled]) => {
                      const meta = getFeatureMeta(key);
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-4 px-4 py-3.5"
                        >
                          {/* Icon */}
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.colorClass}`}
                          >
                            <meta.Icon className="h-4 w-4" />
                          </div>

                          {/* Label + mô tả */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-admin-gray-900">
                              {meta.label}
                            </p>
                            {meta.description ? (
                              <p className="mt-0.5 text-xs text-admin-gray-400">
                                {meta.description}
                              </p>
                            ) : null}
                          </div>

                          {/* Trạng thái bật/tắt */}
                          <span
                            className={
                              enabled
                                ? 'inline-flex shrink-0 items-center gap-1 rounded-full bg-admin-success-light px-2.5 py-1 text-xs font-semibold text-admin-success'
                                : 'inline-flex shrink-0 items-center gap-1 rounded-full bg-admin-gray-100 px-2.5 py-1 text-xs font-semibold text-admin-gray-400'
                            }
                          >
                            {enabled
                              ? <CheckCircle2 className="h-3 w-3" />
                              : <XCircle className="h-3 w-3" />}
                            {enabled ? 'Bật' : 'Tắt'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-admin-gray-200 px-4 py-8 text-center">
                    <p className="text-sm text-admin-gray-400">
                      Gói này chưa có cấu hình tính năng.
                    </p>
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
