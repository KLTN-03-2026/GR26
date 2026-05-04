import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CircleCheckBig, SlidersHorizontal } from 'lucide-react';
import { ROUTES } from '@shared/constants/routes';
import { usePositions } from '@modules/staff/hooks/usePositions';
import { useStaffFilters } from '@modules/staff/hooks/useStaffFilters';
import { useStaffList } from '@modules/staff/hooks/useStaffList';
import { useVisibleStaff } from '@modules/staff/hooks/useVisibleStaff';
import { StaffFilterBar } from '@modules/staff/components/StaffFilterBar';
import { StaffTable } from '@modules/staff/components/StaffTable';
import type { StaffStatus, StaffSummary } from '@modules/staff/types/staff.types';

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
  const { data: positionsData = [] } = usePositions();
  const { data: staffData, isLoading, refetch } = useStaffList({ page: 0, size: 100 });
  
  const staffList = useMemo(() => staffData?.content ?? [], [staffData]);
  const visibleStaffList = useVisibleStaff(staffList);

  // Lấy danh sách unique position names từ staff list
  const positions = useMemo(
    () =>
      positionsData.map((position) => ({
        id: position.id,
        name: position.name,
      })),
    [positionsData]
  );

  const {
    filters,
    pagination,
    staff,
    totalItems,
    hasActiveFilters,
    updateFilter,
    clearFilters,
    updatePage,
    totalPages,
  } = useStaffFilters(visibleStaffList);

  const totalStaff = visibleStaffList.length;
  const activeStaff = useMemo(
    () => visibleStaffList.filter((s: StaffSummary) => s.status === 'ACTIVE').length,
    [visibleStaffList]
  );
  const inactiveStaff = totalStaff - activeStaff;

  const handleAddStaff = () => {
    navigate(ROUTES.OWNER.STAFF_NEW);
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading && visibleStaffList.length === 0) {
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
          positions={positions}
          onSearchChange={(value) => updateFilter('keyword', value)}
          onStatusChange={(value) =>
            updateFilter('status', value === 'all' ? undefined : (value as StaffStatus))
          }
          onPositionChange={(value) => updateFilter('positionId', value === 'all' ? undefined : value)}
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
          onRefresh={handleRefresh}
          isLoading={isLoading && visibleStaffList.length === 0}
        />
      </div>
    </div>
  );
}
