import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, CircleCheckBig, SlidersHorizontal } from 'lucide-react';
import { ROUTES } from '@shared/constants/routes';
import { queryKeys } from '@shared/constants/queryKeys';
import { staffService } from '@modules/staff/services/staffService';
import { mockBranchDetails } from '@modules/branch/data/branchDetails';
import { useStaffFilters } from '@modules/staff/hooks/useStaffFilters';
import { StaffFilterBar } from '@modules/staff/components/StaffFilterBar';
import { StaffTable } from '@modules/staff/components/StaffTable';

const StatCard = ({ icon, iconBg, label, value }: { icon: React.ReactNode; iconBg: string; label: string; value: string }) => (
  <div className="rounded-2xl border border-gray-200 p-4 bg-white shadow-sm">
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>{icon}</div>
      <span>{label}</span>
    </div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
  </div>
);

export default function StaffPage() {
  const navigate = useNavigate();

  // Fetch staff list from service
  const { data: staffList = [], isLoading } = useQuery({
    queryKey: queryKeys.staff.all,
    queryFn: () => staffService.getList(),
  });

  const {
    filters,
    pagination,
    roles,
    staff,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages,
  } = useStaffFilters(staffList);

  const totalStaff = staffList.length;
  const activeStaff = useMemo(() => staffList.filter((s) => s.status === 'active').length, [staffList]);
  const inactiveStaff = totalStaff - activeStaff;

  const branches = useMemo(() => 
    mockBranchDetails.map(b => ({ id: b.id, name: b.name })),
    []
  );

  const handleAddStaff = () => {
    navigate(ROUTES.OWNER.STAFF_NEW);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-100"
          label="Tổng nhân viên"
          value={`${totalStaff}`.padStart(2, '0')}
        />
        <StatCard
          icon={<CircleCheckBig className="w-4 h-4 text-green-600" />}
          iconBg="bg-emerald-100"
          label="Đang làm"
          value={`${activeStaff}`.padStart(2, '0')}
        />
        <StatCard
          icon={<SlidersHorizontal className="w-4 h-4 text-orange-600" />}
          iconBg="bg-orange-100"
          label="Đã nghỉ"
          value={`${inactiveStaff}`.padStart(2, '0')}
        />
      </div>

      <div className="bg-white p-4 space-y-4 rounded-2xl">
        <StaffFilterBar
          filters={filters}
          roles={roles}
          branches={branches}
          onSearchChange={(value) => updateFilter('search', value)}
          onStatusChange={(value) => updateFilter('status', value)}
          onRoleChange={(value) => updateFilter('role', value)}
          onBranchChange={(value) => updateFilter('branchId', value)}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          onAddStaff={handleAddStaff}
        />

        <StaffTable
          staff={staff}
          currentPage={pagination.page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={updatePage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}