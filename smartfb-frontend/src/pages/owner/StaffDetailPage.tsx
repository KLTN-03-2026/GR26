import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { ROUTES } from "@shared/constants/routes";
import { useStaffDetail } from "@modules/staff/hooks/useStaffDetail";
import { StaffInfoCard } from "@modules/staff/components/staff-detail/StaffInfoCard";
import { ActivityLogSection } from "@modules/staff/components/staff-detail/ActivityLogSection";
import { ShiftScheduleSection } from "@modules/staff/components/staff-detail/ShiftScheduleSection";
import { EditStaffDialog } from "@modules/staff/components/EditStaffDialog";

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: staffDetail, isLoading, isError, refetch } = useStaffDetail(id || "");

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    refetch();
  };

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy ID nhân viên</p>
        <Button 
          onClick={() => navigate(ROUTES.OWNER.STAFF)}
          className="mt-4"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 font-medium mb-4">Không tìm thấy nhân viên</p>
        <Button onClick={() => navigate(ROUTES.OWNER.STAFF)}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!staffDetail) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không có dữ liệu nhân viên</p>
        <Button 
          onClick={() => navigate(ROUTES.OWNER.STAFF)}
          className="mt-4"
        >
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const staffFullName = staffDetail.fullName || "Chi tiết nhân viên";

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => navigate(ROUTES.OWNER.STAFF)}
          className="hover:text-gray-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">{staffFullName}</span>
      </div>

      {/* Staff Info Card */}
      <StaffInfoCard staff={staffDetail} onEdit={handleEdit} />
      
      <EditStaffDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        staff={staffDetail}
        onSuccess={handleEditSuccess}
      />

      {/* Activity Log & Shift Schedule - Tạm thời ẩn vì chưa có API */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <ActivityLogSection
            logs={[]}
            isLoading={false}
            onViewAll={() => {}}
          />
        </div>
        <div className="col-span-1">
          <ShiftScheduleSection
            shifts={[]}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}