import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
}

export const StatCard = ({
  icon,
  iconBg,
  label,
  value,
  valueColor = 'text-gray-900',
}: StatCardProps) => {
  return (
    <div className="card">
      <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconBg}`}>
          {icon}
        </div>
        <span className="font-medium text-amber-950">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
};
