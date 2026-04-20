import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

import { RoleFormDialog } from '@modules/staff/components/RoleFormDialog';
import {
  PermissionFilters,
  PermissionModuleCard,
  RoleListPanel,
  buildFilteredPermissionGroups,
  buildFilteredPermissionModules,
  buildModuleNames,
  buildNextPermissionIds,
  groupPermissionsByModule,
  isPermissionSetEqual,
  normalizePermissionIds,
} from '@modules/staff/components/role-permission-manager';
import { useUpdateRolePermissions } from '@modules/staff/hooks/useUpdateRolePermissions';
import type {
  StaffPermissionDefinition,
  StaffRole,
} from '@modules/staff/types/role.types';
import { Button } from '@shared/components/ui/button';

interface RolePermissionManagerProps {
  roles: StaffRole[];
  allPermissions: StaffPermissionDefinition[];
  isLoading?: boolean;
}

/**
 * Khu quản lý vai trò và ma trận quyền.
 * Backend phân quyền theo role nên UI gom phần này vào cùng trang cơ cấu nhân sự.
 */
export const RolePermissionManager = ({
  roles,
  allPermissions,
  isLoading = false,
}: RolePermissionManagerProps) => {
  const { mutate: updateRolePermissions, isPending } =
    useUpdateRolePermissions();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [draftRoleId, setDraftRoleId] = useState<string | null>(null);
  const [draftPermissionIds, setDraftPermissionIds] = useState<string[]>([]);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [permissionKeyword, setPermissionKeyword] = useState("");
  const [activeModule, setActiveModule] = useState<string>("ALL");

  const selectedRole = useMemo(() => {
    return roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;
  }, [roles, selectedRoleId]);

  const groupedPermissions = useMemo(() => {
    return groupPermissionsByModule(allPermissions);
  }, [allPermissions]);

  const moduleNames = useMemo(() => {
    return buildModuleNames(groupedPermissions);
  }, [groupedPermissions]);

  const effectivePermissionIds = useMemo(() => {
    if (selectedRole && draftRoleId === selectedRole.id) {
      return draftPermissionIds;
    }

    return selectedRole?.permissionIds ?? [];
  }, [draftPermissionIds, draftRoleId, selectedRole]);

  const hasUnsavedChanges = useMemo(() => {
    if (!selectedRole) {
      return false;
    }

    return !isPermissionSetEqual(
      effectivePermissionIds,
      selectedRole.permissionIds,
    );
  }, [effectivePermissionIds, selectedRole]);

  const handleSelectRole = (roleId: string) => {
    setSelectedRoleId(roleId);
    setDraftRoleId(null);
    setDraftPermissionIds([]);
  };

  const handleTogglePermission = (permissionId: string, checked: boolean) => {
    if (!selectedRole) {
      return;
    }

    const source =
      draftRoleId === selectedRole.id
        ? draftPermissionIds
        : selectedRole.permissionIds;
    const nextPermissionIds = buildNextPermissionIds({
      sourcePermissionIds: source,
      permissionIds: [permissionId],
      checked,
    });

    setDraftRoleId(selectedRole.id);
    setDraftPermissionIds(nextPermissionIds);
  };

  const handleToggleModulePermissions = (
    permissionIds: string[],
    checked: boolean,
  ) => {
    if (!selectedRole) {
      return;
    }

    const source =
      draftRoleId === selectedRole.id
        ? draftPermissionIds
        : selectedRole.permissionIds;
    const nextPermissionIds = buildNextPermissionIds({
      sourcePermissionIds: source,
      permissionIds,
      checked,
    });

    setDraftRoleId(selectedRole.id);
    setDraftPermissionIds(nextPermissionIds);
  };

  const handleResetDraft = () => {
    setDraftRoleId(null);
    setDraftPermissionIds([]);
  };

  const handleSavePermissions = () => {
    if (!selectedRole) {
      return;
    }

    updateRolePermissions(
      {
        id: selectedRole.id,
        payload: {
          permissionIds: normalizePermissionIds(effectivePermissionIds),
        },
      },
      {
        onSuccess: () => {
          setDraftRoleId(null);
          setDraftPermissionIds([]);
        },
      },
    );
  };

  const filteredPermissionGroups = useMemo(() => {
    return buildFilteredPermissionGroups({
      groupedPermissions,
      activeModule,
      permissionKeyword,
    });
  }, [activeModule, groupedPermissions, permissionKeyword]);

  const filteredPermissionModules = useMemo(() => {
    return buildFilteredPermissionModules({
      filteredPermissionGroups,
      effectivePermissionIds,
    });
  }, [effectivePermissionIds, filteredPermissionGroups]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">
              Vai trò & phân quyền
            </h3>
            <p className="mt-1 max-w-3xl text-sm text-text-secondary">
              Cấu hình quyền theo mô hình backend hiện tại để sau đó gán vai trò
              cho nhân viên.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleResetDraft}
              disabled={!hasUnsavedChanges || isPending}
            >
              Hoàn tác
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={!hasUnsavedChanges || isPending}
            >
              {isPending ? "Đang lưu..." : "Lưu phân quyền"}
            </Button>
            <Button
              onClick={() => setIsRoleDialogOpen(true)}
              className="gap-2 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Thêm vai trò
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="spinner spinner-md" />
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <RoleListPanel
              roles={roles}
              selectedRoleId={selectedRole?.id ?? null}
              onSelectRole={handleSelectRole}
            />

            <div className="rounded-3xl border border-border bg-slate-50/60 p-4">
              {selectedRole ? (
                <div className="space-y-4">
                  <div className="rounded-3xl border border-border bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-text-secondary">
                          Đang cấu hình cho vai trò
                        </p>
                        <h4 className="text-xl font-semibold text-text-primary">
                          {selectedRole.name}
                        </h4>
                        <p className="mt-1 text-sm text-text-secondary">
                          {selectedRole.description || "Chưa có mô tả nghiệp vụ"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                          {effectivePermissionIds.length} quyền đang bật
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
                          {filteredPermissionModules.length} module đang hiển thị
                        </span>
                      </div>
                    </div>
                  </div>

                  <PermissionFilters
                    permissionKeyword={permissionKeyword}
                    moduleNames={moduleNames}
                    activeModule={activeModule}
                    onPermissionKeywordChange={setPermissionKeyword}
                    onSelectModule={setActiveModule}
                  />

                  <div className="grid gap-4 xl:grid-cols-2">
                    {filteredPermissionModules.map(
                      ({
                        moduleName,
                        permissions,
                        selectedPermissions,
                        selectedCount,
                      }) => (
                        <div
                          key={moduleName}
                        >
                          <PermissionModuleCard
                            moduleName={moduleName}
                            permissions={permissions}
                            selectedPermissions={selectedPermissions}
                            selectedCount={selectedCount}
                            effectivePermissionIds={effectivePermissionIds}
                            onToggleModulePermissions={handleToggleModulePermissions}
                            onTogglePermission={handleTogglePermission}
                          />
                        </div>
                      ),
                    )}
                    {filteredPermissionModules.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-border bg-white px-6 py-10 text-center">
                        <p className="font-semibold text-text-primary">
                          Không có quyền phù hợp
                        </p>
                        <p className="mt-2 text-sm text-text-secondary">
                          Hãy đổi từ khóa tìm kiếm hoặc chọn lại module khác.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-border px-6 text-center">
                  <div>
                    <p className="text-lg font-semibold text-text-primary">
                      Chưa có vai trò để cấu hình
                    </p>
                    <p className="mt-2 text-sm text-text-secondary">
                      Tạo role mới rồi chọn role đó để bật/tắt từng permission
                      theo module.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <RoleFormDialog
        open={isRoleDialogOpen}
        onOpenChange={setIsRoleDialogOpen}
        onCreated={(roleId) => {
          setSelectedRoleId(roleId);
          setDraftRoleId(null);
          setDraftPermissionIds([]);
        }}
      />
    </>
  );
};
