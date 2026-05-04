import { cn } from '@shared/utils/cn';
import type { LucideIcon } from 'lucide-react';

type AdminStatTone = 'brand' | 'success' | 'warning' | 'error';

interface AdminStatCardProps {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: AdminStatTone;
}

const toneClassName: Record<AdminStatTone, string> = {
  brand: 'bg-admin-brand-50 text-admin-brand-600',
  success: 'bg-admin-success-light text-admin-success',
  warning: 'bg-admin-warning-light text-admin-warning',
  error: 'bg-admin-error-light text-admin-error',
};

/**
 * Card số liệu chuẩn cho dashboard và các màn hình tổng quan admin.
 */
export const AdminStatCard = ({
  title,
  value,
  helper,
  icon: Icon,
  tone = 'brand',
}: AdminStatCardProps) => {
  return (
    <article className="rounded-lg border border-admin-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-admin-gray-500">{title}</p>
          <p className="mt-3 break-words text-2xl font-semibold text-admin-gray-900">
            {value}
          </p>
          <p className="mt-2 text-sm leading-5 text-admin-gray-500">{helper}</p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
            toneClassName[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
};
