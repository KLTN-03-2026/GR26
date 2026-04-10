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

/**
 * Page hiển thị chi tiết nhân viên
 * URL: /owner/staff/:id
 */
export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useStaffDetail(id || "");

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    refetch();
  };

  if (!id) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy ID nhân viên</p>
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

  const handleEdit = () => {
    setIsEditDialogOpen(true);
  };

  const handleViewAllActivity = () => {
    // TODO: Mở page/modal xem tất cả hoạt động
    console.log("View all activity for:", id);
  };

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
        <span className="text-gray-900 font-medium">
          {data?.staff.firstName && data?.staff.lastName
            ? `${data.staff.firstName} ${data.staff.lastName}`
            : "Chi tiết nhân viên"}
        </span>
      </div>

      {/* Staff Info Card */}
      {data?.staff && (
        <>
          <StaffInfoCard staff={data.staff} onEdit={handleEdit} />
          <EditStaffDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            staff={data.staff}
            onSuccess={handleEditSuccess}
          />
        </>
      )}

      {/* Activity Log & Shift Schedule */}
      <div className="grid grid-cols-3 gap-6">
        {/* Activity Log - 2/3 width */}
        <div className="col-span-2">
          <ActivityLogSection
            logs={data?.activityLogs || []}
            isLoading={isLoading}
            onViewAll={handleViewAllActivity}
          />
        </div>

        {/* Shift Schedule - 1/3 width */}
        <div className="col-span-1">
          <ShiftScheduleSection
            shifts={data?.shifts || []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}