import { AdminStatCard } from '@modules/admin/components/AdminStatCard';
import type { LucideIcon } from 'lucide-react';

interface AdminMetricCardProps {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: 'brand' | 'success' | 'warning' | 'error';
}

/**
 * Wrapper tương thích cho metric card cũ, dùng chung nền với `AdminStatCard`.
 */
export const AdminMetricCard = ({
  title,
  value,
  helper,
  icon: Icon,
  tone = 'brand',
}: AdminMetricCardProps) => {
  return (
    <AdminStatCard
      title={title}
      value={value}
      helper={helper}
      icon={Icon}
      tone={tone}
    />
  );
};
