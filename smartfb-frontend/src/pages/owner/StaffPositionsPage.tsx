import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BriefcaseBusiness, ShieldCheck, Plus, Search } from "lucide-react";
import {
  PositionFormDialog,
  PositionTable,
  PositionToggleDialog,
  RolePermissionManager,
} from "@modules/staff/components";
import { usePositionFilters } from "@modules/staff/hooks/usePositionFilters";
import { usePositions } from "@modules/staff/hooks/usePositions";
import { useRolesMatrix } from "@modules/staff/hooks/useRolesMatrix";
import { useStaffList } from "@modules/staff/hooks/useStaffList";
import { useVisibleStaff } from "@modules/staff/hooks/useVisibleStaff";
import { filterAssignableStaffRoles } from "@modules/staff/utils/filterAssignableStaffRoles";
import type { StaffPosition } from "@modules/staff/types/position.types";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { ROUTES } from "@shared/constants/routes";
import { cn } from "@shared/utils/cn";

type StaffStructureView = "positions" | "roles";

/**
 * Page quản lý chức vụ trong module Nhân sự.
 * Trang này bám theo tài liệu API `staff-permission-api-for-frontend.md`.
 */
export default function StaffPositionsPage() {
  const navigate = useNavigate();
  const {
    data: rawPositions = [],
    isLoading,
    isError,
    refetch,
  } = usePositions();
  const { data: roleMatrixData, isLoading: isRolesLoading } = useRolesMatrix();
  const { data: staffData } = useStaffList({ page: 0, size: 100 });
  const staffList = useMemo(() => staffData?.content ?? [], [staffData]);
  const visibleStaffList = useVisibleStaff(staffList);
  const visibleRoles = useMemo(() => {
    return filterAssignableStaffRoles(roleMatrixData?.roles ?? []);
  }, [roleMatrixData?.roles]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<StaffPosition | null>(
    null,
  );
  const [archivingPosition, setArchivingPosition] =
    useState<StaffPosition | null>(null);
  const [activeView, setActiveView] = useState<StaffStructureView>("positions");

  const {
    keyword,
    setKeyword,
    clearKeyword,
    hasActiveFilters,
    positions,
  } = usePositionFilters(rawPositions, visibleStaffList);

  const openCreateDialog = () => {
    setEditingPosition(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (position: StaffPosition) => {
    setEditingPosition(position);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner spinner-md" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-red-200 bg-red-50 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-red-700">
          Không thể tải danh sách chức vụ
        </p>
        <p className="mt-2 text-sm text-red-600">
          Kiểm tra lại kết nối API `positions` hoặc quyền truy cập của tài khoản
          hiện tại.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.OWNER.STAFF)}
          >
            Quay về Nhân viên
          </Button>
          <Button onClick={() => refetch()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            Cơ cấu nhân sự
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Cơ cấu chức vụ nhân sự
            </h1>
           
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.OWNER.STAFF)}
          >
            Danh sách nhân viên
          </Button>
          {activeView === "positions" ? (
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Thêm chức vụ
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full border border-border bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setActiveView("positions")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeView === "positions"
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Chức vụ
            </button>
            <button
              type="button"
              onClick={() => setActiveView("roles")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activeView === "roles"
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              Vai trò & quyền
            </button>
          </div>

          
        </div>

        {activeView === "positions" ? (
          <>
            <div className="rounded-3xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-text-primary">
                    Danh sách chức vụ
                  </h2>
                  <p className="text-sm text-text-secondary">
                    Quản lý các chức vụ đang hoạt động và được gán cho nhân
                    viên.
                  </p>
                </div>

                {hasActiveFilters ? (
                  <Button variant="ghost" size="sm" onClick={clearKeyword}>
                    Xóa lọc
                  </Button>
                ) : null}
              </div>

              <div className="mt-4 relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Tìm chức vụ theo tên hoặc mô tả"
                  className="pl-9"
                />
              </div>
            </div>

            <PositionTable
              positions={positions}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearKeyword}
              onCreatePosition={openCreateDialog}
              onEditPosition={openEditDialog}
              onTogglePosition={(position) => setArchivingPosition(position)}
            />
          </>
        ) : (
          <div className="rounded-3xl border border-border bg-white p-4">
            
            <div className="mt-4">
              <RolePermissionManager
                roles={visibleRoles}
                allPermissions={roleMatrixData?.allPermissions ?? []}
                isLoading={isRolesLoading}
              />
            </div>
          </div>
        )}
      </div>

      <PositionFormDialog
        open={isFormOpen}
        onOpenChange={(nextOpen) => {
          setIsFormOpen(nextOpen);

          if (!nextOpen) {
            setEditingPosition(null);
          }
        }}
        position={editingPosition}
      />

      <PositionToggleDialog
        open={Boolean(archivingPosition)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setArchivingPosition(null);
          }
        }}
        position={archivingPosition}
      />
    </div>
  );
}
