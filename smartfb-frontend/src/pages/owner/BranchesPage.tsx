import { useState } from "react";
import { Building2, CircleCheckBig, CircleDollarSign } from "lucide-react";
import { mockBranchDetails } from "@modules/branch/data/branchDetails";
import { mockActivityLogs } from "@modules/branch/data/activityLogs";
import { useBranchFilters } from "@modules/branch/hooks/useBranchFilters";
import { useCreateBranch } from "@modules/branch/hooks/useCreateBranch";
import { BranchFilterBar } from '@modules/branch/components/BranchFilterBar';
import { BranchTable } from '@modules/branch/components/BranchTable';
import { ActivityLogSection } from "@modules/branch/components/ActivityLogSection";
import { CreateBranchDialog } from "@modules/branch/components/CreateBranchDialog";
import type { CreateBranchFormData } from "@modules/branch/types/branch.types";

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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { mutate: createBranch } = useCreateBranch();

  const {
    filters,
    pagination,
    locations,
    branches,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages,
  } = useBranchFilters(mockBranchDetails);

  const totalBranches = mockBranchDetails.length;
  const activeBranches = mockBranchDetails.filter((b) => b.status === "active").length;
  const todayRevenue = 25500000;

  const handleAddBranch = () => {
    setCreateDialogOpen(true);
  };

  const handleSubmitBranch = (data: CreateBranchFormData) => {
    createBranch(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

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
          onPageChange={updatePage}
        />
      </div>

      {/* Activity Log */}
      <ActivityLogSection logs={mockActivityLogs} />

      {/* Create Branch Dialog */}
      <CreateBranchDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleSubmitBranch}
      />
    </div>
  );
}
