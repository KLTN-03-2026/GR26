import { useMemo, useState } from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import { useUpdateRolePermissions } from "@modules/staff/hooks/useUpdateRolePermissions";
import { RoleFormDialog } from "@modules/staff/components/RoleFormDialog";
import type {
  StaffPermissionDefinition,
  StaffRole,
} from "@modules/staff/types/role.types";
import { Button } from "@shared/components/ui/button";
import { Checkbox } from "@shared/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Input } from "@shared/components/ui/input";
import { cn } from "@shared/utils/cn";

interface RolePermissionManagerProps {
  roles: StaffRole[];
  allPermissions: StaffPermissionDefinition[];
  isLoading?: boolean;
}

const normalizePermissionIds = (permissionIds: string[]): string[] => {
  return [...permissionIds].sort((left, right) => left.localeCompare(right));
};

const isPermissionSetEqual = (left: string[], right: string[]): boolean => {
  const normalizedLeft = normalizePermissionIds(left);
  const normalizedRight = normalizePermissionIds(right);

  if (normalizedLeft.length !== normalizedRight.length) {
    return false;
  }

  return normalizedLeft.every(
    (permissionId, index) => permissionId === normalizedRight[index],
  );
};

/**
 * Hợp nhất hoặc loại bỏ permission khỏi bản nháp trước khi lưu xuống backend.
 * Dùng chung cho thao tác bật/tắt từng quyền và thao tác chọn nhanh theo module.
 */
const buildNextPermissionIds = ({
  sourcePermissionIds,
  permissionIds,
  checked,
}: {
  sourcePermissionIds: string[];
  permissionIds: string[];
  checked: boolean;
}): string[] => {
  if (checked) {
    return Array.from(new Set([...sourcePermissionIds, ...permissionIds]));
  }

  return sourcePermissionIds.filter(
    (permissionId) => !permissionIds.includes(permissionId),
  );
};

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
    return allPermissions.reduce<Record<string, StaffPermissionDefinition[]>>(
      (result, permission) => {
        const moduleKey = permission.module || "OTHER";

        if (!result[moduleKey]) {
          result[moduleKey] = [];
        }

        result[moduleKey].push(permission);
        return result;
      },
      {},
    );
  }, [allPermissions]);

  const moduleNames = useMemo(() => {
    return [
      "ALL",
      ...Object.keys(groupedPermissions).sort((left, right) =>
        left.localeCompare(right),
      ),
    ];
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
    const normalizedKeyword = permissionKeyword.trim().toLowerCase();
    const entries = Object.entries(groupedPermissions).filter(
      ([moduleName]) => {
        return activeModule === "ALL" || moduleName === activeModule;
      },
    );

    return entries
      .map(([moduleName, permissions]) => {
        const filteredPermissions = permissions.filter((permission) => {
          if (!normalizedKeyword) {
            return true;
          }

          const searchableText =
            `${permission.id} ${permission.description}`.toLowerCase();
          return searchableText.includes(normalizedKeyword);
        });

        return [moduleName, filteredPermissions] as const;
      })
      .filter(([, permissions]) => permissions.length > 0);
  }, [activeModule, groupedPermissions, permissionKeyword]);

  const filteredPermissionModules = useMemo(() => {
    return filteredPermissionGroups.map(([moduleName, permissions]) => {
      const selectedPermissions = permissions.filter((permission) =>
        effectivePermissionIds.includes(permission.id),
      );

      return {
        moduleName,
        permissions,
        selectedPermissions,
        selectedCount: selectedPermissions.length,
      };
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
            <div className="rounded-3xl border border-border bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-secondary">
                  Vai trò
                </h3>
                <span className="text-xs text-text-secondary">
                  {roles.length} role
                </span>
              </div>

              <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {roles.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
                    <p className="font-medium text-text-primary">
                      Chưa có vai trò nào
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      Tạo role đầu tiên để bắt đầu cấu hình quyền.
                    </p>
                  </div>
                ) : (
                  roles.map((role) => {
                    const isSelected = role.id === (selectedRole?.id ?? null);

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleSelectRole(role.id)}
                        className={
                          isSelected
                            ? "w-full rounded-2xl border border-primary bg-primary/5 px-4 py-3 text-left"
                            : "w-full rounded-2xl border border-border bg-white px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-text-primary">
                              {role.name}
                            </p>
                            <p className="mt-1 text-sm text-text-secondary">
                              {role.description || "Chưa có mô tả"}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {role.permissionIds.length} quyền
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

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

                  <div className="grid gap-3 rounded-3xl border border-border bg-white p-4">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                      <Input
                        value={permissionKeyword}
                        onChange={(event) =>
                          setPermissionKeyword(event.target.value)
                        }
                        placeholder="Tìm quyền theo tên hoặc mô tả"
                        className="pl-9"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {moduleNames.map((moduleName) => (
                        <button
                          key={moduleName}
                          type="button"
                          onClick={() => setActiveModule(moduleName)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                            activeModule === moduleName
                              ? "bg-primary text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                          )}
                        >
                          {moduleName === "ALL" ? "Tất cả module" : moduleName}
                        </button>
                      ))}
                    </div>
                  </div>

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
                          className="rounded-3xl border border-border bg-white"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4">
                            <div>
                              <h4 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-secondary">
                                {moduleName}
                              </h4>
                              <p className="mt-1 text-sm text-text-secondary">
                                Đã chọn {selectedCount}/{permissions.length} quyền
                              </p>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0"
                                >
                                  Chọn quyền
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent
                                align="end"
                                className="w-[22rem] max-w-[calc(100vw-2rem)] p-0"
                              >
                                <div className="max-h-80 overflow-y-auto p-1">
                                  <DropdownMenuLabel className="px-3 py-2 text-xs uppercase tracking-[0.14em] text-text-secondary">
                                    {moduleName}
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuCheckboxItem
                                    checked={selectedCount === permissions.length}
                                    onCheckedChange={(value) =>
                                      handleToggleModulePermissions(
                                        permissions.map(
                                          (permission) => permission.id,
                                        ),
                                        Boolean(value),
                                      )
                                    }
                                    onSelect={(event) => event.preventDefault()}
                                    className="px-3 py-2 font-medium"
                                  >
                                    Chọn toàn bộ module
                                  </DropdownMenuCheckboxItem>
                                  <DropdownMenuSeparator />
                                  {permissions.map((permission) => {
                                    const checked = effectivePermissionIds.includes(
                                      permission.id,
                                    );

                                    return (
                                      <DropdownMenuCheckboxItem
                                        key={permission.id}
                                        checked={checked}
                                        onCheckedChange={(value) =>
                                          handleTogglePermission(
                                            permission.id,
                                            Boolean(value),
                                          )
                                        }
                                        onSelect={(event) =>
                                          event.preventDefault()
                                        }
                                        className="items-start px-3 py-2"
                                      >
                                        <div className="space-y-1">
                                          <p className="font-medium text-text-primary">
                                            {permission.description}
                                          </p>
                                          <p className="text-xs text-text-secondary">
                                            {permission.id}
                                          </p>
                                        </div>
                                      </DropdownMenuCheckboxItem>
                                    );
                                  })}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-3 px-4 py-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-text-primary">
                                Quyền đang bật
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleModulePermissions(
                                    permissions.map((permission) => permission.id),
                                    false,
                                  )
                                }
                                className="text-xs font-medium text-text-secondary transition-colors hover:text-primary"
                                disabled={selectedCount === 0}
                              >
                                Bỏ chọn module
                              </button>
                            </div>

                            {selectedPermissions.length > 0 ? (
                              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                                {selectedPermissions.map((permission) => (
                                  <label
                                    key={permission.id}
                                    className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-3"
                                  >
                                    <Checkbox
                                      checked
                                      onCheckedChange={(value) =>
                                        handleTogglePermission(
                                          permission.id,
                                          Boolean(value),
                                        )
                                      }
                                      className="mt-1"
                                    />
                                    <div className="space-y-1">
                                      <p className="font-medium text-text-primary">
                                        {permission.description}
                                      </p>
                                      <p className="text-xs text-text-secondary">
                                        {permission.id}
                                      </p>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
                                <p className="font-medium text-text-primary">
                                  Chưa chọn quyền nào
                                </p>
                                <p className="mt-1 text-sm text-text-secondary">
                                  Mở dropdown để tick các quyền cần dùng cho
                                  module này.
                                </p>
                              </div>
                            )}
                          </div>
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
