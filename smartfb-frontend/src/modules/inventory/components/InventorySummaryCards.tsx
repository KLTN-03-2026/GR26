import type { ReactNode } from 'react';
import { Archive, CircleAlert, Warehouse } from 'lucide-react';

interface InventorySummaryCardsProps {
  lowStockCount: number;
  totalItems: number;
  visibleBranchCount: number;
}

interface InventoryStatCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
}

const InventoryStatCard = ({
  icon,
  iconBg,
  label,
  value,
  valueColor = 'text-text-primary',
}: InventoryStatCardProps) => {
  return (
    <div className="card">
      <div className="mb-1 flex items-center gap-2 text-sm text-text-secondary">
        <div className={`flex h-10 w-10 items-center justify-center rounded-card ${iconBg}`}>
          {icon}
        </div>
        <span className="font-medium text-text-primary">{label}</span>
      </div>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
    </div>
  );
};

/**
 * Cụm thẻ tóm tắt nhanh để người dùng nhìn thấy sức khỏe tồn kho trước khi thao tác.
 */
export const InventorySummaryCards = ({
  lowStockCount,
  totalItems,
  visibleBranchCount,
}: InventorySummaryCardsProps) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <InventoryStatCard
        icon={<Archive className="h-5 w-5 text-primary" />}
        iconBg="bg-primary-light"
        label="Mã tồn kho"
        value={String(totalItems).padStart(2, '0')}
      />
      <InventoryStatCard
        icon={<CircleAlert className="h-5 w-5 text-red-600" />}
        iconBg="bg-red-100"
        label="Sắp hết hàng"
        value={String(lowStockCount).padStart(2, '0')}
        valueColor="text-red-600"
      />
      <InventoryStatCard
        icon={<Warehouse className="h-5 w-5 text-amber-600" />}
        iconBg="bg-amber-100"
        label="Chi nhánh hiển thị"
        value={String(visibleBranchCount).padStart(2, '0')}
        valueColor="text-amber-700"
      />
    </div>
  );
};
