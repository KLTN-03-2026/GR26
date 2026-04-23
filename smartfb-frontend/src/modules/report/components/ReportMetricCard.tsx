import type { ReactNode } from 'react';
import { cn } from '@shared/utils/cn';

interface ReportMetricCardProps {
  label: string;
  value: string;
  helper?: string;
  icon: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

const toneClassName: Record<NonNullable<ReportMetricCardProps['tone']>, string> = {
  primary: 'bg-primary-light text-primary',
  success: 'bg-success-light text-success-text',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger-text',
  neutral: 'bg-cream text-text-secondary',
};

/**
 * Card KPI dùng chung cho các màn báo cáo.
 */
export const ReportMetricCard = ({
  label,
  value,
  helper,
  icon,
  tone = 'primary',
}: ReportMetricCardProps) => {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-card', toneClassName[tone])}>
          {icon}
        </div>
      </div>
      {helper ? <p className="mt-3 text-sm leading-5 text-text-secondary">{helper}</p> : null}
    </div>
  );
};
