import { useNavigate } from "react-router-dom";
import { Building2, CircleCheckBig, CircleDollarSign } from "lucide-react";
import { useBranches } from "@modules/branch/hooks/useBranches";
import { useBranchFilters } from "@modules/branch/hooks/useBranchFilters";
import { BranchFilterBar } from '@modules/branch/components/BranchFilterBar';
import { BranchTable } from '@modules/branch/components/BranchTable';
import { ROUTES } from "@shared/constants/routes";
import { Button } from '@shared/components/ui/button';

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  valueColor?: string;
}

const StatCard = ({ icon, iconBg, label, value, valueColor = "text-gray-900" }: StatCardProps) => (
  <div className="card">
    <div className="text-sm text-gray-500 mb-1 flex items-center gap-2">
      <div className={`w-10 h-10 flex justify-center items-center rounded-2xl ${iconBg}`}>
        {icon}
      </div>
      <span className="text-amber-950 font-medium">{label}</span>
    </div>
    <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
  </div>
);

/**
 * Page quản lý chi nhánh
 */
export default function BranchesPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useBranches();

  // Convert từ Branch API response sang BranchDetail format
  const branchesData = data?.map(branch => ({
    id: branch.id,
    name: branch.name,
    code: branch.code,
    address: branch.address,
    phone: branch.phone,
    status: branch.status === 'ACTIVE' ? 'active' : 'inactive' as 'active' | 'inactive',
    location: branch.address?.split(',').pop()?.trim() || '',
    revenue: 0, // TODO: Lấy từ API report
    createdAt: branch.createdAt,
  })) ?? [];

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
  const activeBranches = branchesData.filter((b) => b.status === "active").length;
  const todayRevenue = 25500000; // TODO: Lấy từ API report

  const handleAddBranch = () => {
    navigate(ROUTES.OWNER.BRANCHES_NEW);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium mb-4">Không thể tải danh sách chi nhánh</p>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Building2 className="h-5 w-5" style={{ color: "#2563EB" }} />}
          iconBg="bg-blue-100"
          label="Tổng chi nhánh"
          value={String(totalBranches).padStart(2, "0")}
        />
        <StatCard
          icon={<CircleCheckBig className="h-5 w-5" style={{ color: "#16A34A" }} />}
          iconBg="bg-green-100"
          label="Đang hoạt động"
          value={String(activeBranches).padStart(2, "0")}
          valueColor="text-green-600"
        />
        <StatCard
          icon={<CircleDollarSign className="h-5 w-5" style={{ color: "#E86A2C" }} />}
          iconBg="bg-orange-100"
          label="Doanh thu hôm nay"
          value={`${todayRevenue.toLocaleString('vi-VN')}đ`}
        />
      </div>

      <div className="bg-white p-4 space-y-4 rounded-2xl">
        {/* Filter Bar */}
        <BranchFilterBar
          filters={filters}
          locations={locations}
          onSearchChange={(value) => updateFilter("search", value)}
          onStatusChange={(value) => updateFilter("status", value)}
          onLocationChange={(value) => updateFilter("location", value)}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          onAddBranch={handleAddBranch}
        />

        {/* Table */}
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
