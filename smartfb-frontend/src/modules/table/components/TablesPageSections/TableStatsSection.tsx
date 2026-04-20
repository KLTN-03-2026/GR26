import { Coffee, LayoutGrid, Users } from 'lucide-react';

import { StatCard } from './StatCard';

interface TableStatsSectionProps {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
}

export const TableStatsSection = ({
  totalTables,
  availableTables,
  occupiedTables,
}: TableStatsSectionProps) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard
        icon={<LayoutGrid className="h-5 w-5" style={{ color: '#2563EB' }} />}
        iconBg="bg-blue-100"
        label="Tổng số bàn"
        value={String(totalTables).padStart(2, '0')}
      />
      <StatCard
        icon={<Users className="h-5 w-5" style={{ color: '#16A34A' }} />}
        iconBg="bg-green-100"
        label="Bàn trống"
        value={String(availableTables).padStart(2, '0')}
        valueColor="text-green-600"
      />
      <StatCard
        icon={<Coffee className="h-5 w-5" style={{ color: '#E86A2C' }} />}
        iconBg="bg-orange-100"
        label="Đang có khách"
        value={String(occupiedTables).padStart(2, '0')}
        valueColor="text-orange-600"
      />
    </div>
  );
};
