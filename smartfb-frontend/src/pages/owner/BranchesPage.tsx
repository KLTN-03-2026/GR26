import { type ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CircleCheckBig, CircleOff } from 'lucide-react';
import { BranchFilterBar } from '@modules/branch/components/BranchFilterBar';
import { BranchTable } from '@modules/branch/components/BranchTable';
import { useBranchFilters } from '@modules/branch/hooks/useBranchFilters';
import { useBranches } from '@modules/branch/hooks/useBranches';
import type { BranchListItem } from '@modules/branch/types/branch.types';
import { Button } from '@shared/components/ui/button';
import { ROUTES } from '@shared/constants/routes';

interface StatCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
}

const StatCard = ({ icon, iconBg, label, value, valueColor = 'text-text-primary' }: StatCardProps) => (
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

const resolveBranchLocation = (address: string | null) => {
  if (!address) {
    return 'Chưa phân loại';
  }

  const chunks = address
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  return chunks.at(-1) ?? 'Chưa phân loại';
};

/**
 * Page quản lý chi nhánh.
 * Dữ liệu hiển thị bám theo response thực tế của `GET /api/v1/branches`.
 */
export default function BranchesPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useBranches();

  // Suy ra `location` từ địa chỉ để dùng cho filter khu vực ở FE.
  const branchesData = useMemo<BranchListItem[]>(
    () =>
      (data ?? []).map(branch => ({
        ...branch,
        location: resolveBranchLocation(branch.address),
      })),
    [data],
  );

  const {
    filters,
    pagination,
    locations,
    branches,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages,
  } = useBranchFilters(branchesData);

  const totalBranches = branchesData.length;
  const activeBranches = branchesData.filter(branch => branch.status === 'ACTIVE').length;
  const inactiveBranches = branchesData.filter(branch => branch.status === 'INACTIVE').length;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 font-medium text-red-600">Không thể tải danh sách chi nhánh</p>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Building2 className="h-5 w-5 text-primary" />}
          iconBg="bg-primary-light"
          label="Tổng chi nhánh"
          value={String(totalBranches).padStart(2, '0')}
        />
        <StatCard
          icon={<CircleCheckBig className="h-5 w-5 text-success-text" />}
          iconBg="bg-success-light"
          label="Đang hoạt động"
          value={String(activeBranches).padStart(2, '0')}
          valueColor="text-success-text"
        />
        <StatCard
          icon={<CircleOff className="h-5 w-5 text-warning-text" />}
          iconBg="bg-warning-light"
          label="Ngừng hoạt động"
          value={String(inactiveBranches).padStart(2, '0')}
          valueColor="text-warning-text"
        />
      </div>

      <div className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">
        <BranchFilterBar
          filters={filters}
          locations={locations}
          onSearchChange={(value) => updateFilter('search', value)}
          onStatusChange={(value) => updateFilter('status', value)}
          onLocationChange={(value) => updateFilter('location', value)}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          onAddBranch={() => navigate(ROUTES.OWNER.BRANCHES_NEW)}
        />

        <BranchTable
          branches={branches}
          currentPage={pagination.page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={updatePage}
        />
      </div>
    </div>
  );
}
