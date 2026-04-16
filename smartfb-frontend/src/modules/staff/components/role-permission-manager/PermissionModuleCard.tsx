import { ChevronDown } from 'lucide-react';

import type { StaffPermissionDefinition } from '@modules/staff/types/role.types';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';

interface PermissionModuleCardProps {
  moduleName: string;
  permissions: StaffPermissionDefinition[];
  selectedPermissions: StaffPermissionDefinition[];
  selectedCount: number;
  effectivePermissionIds: string[];
  onToggleModulePermissions: (permissionIds: string[], checked: boolean) => void;
  onTogglePermission: (permissionId: string, checked: boolean) => void;
}

export const PermissionModuleCard = ({
  moduleName,
  permissions,
  selectedPermissions,
  selectedCount,
  effectivePermissionIds,
  onToggleModulePermissions,
  onTogglePermission,
}: PermissionModuleCardProps) => {
  return (
    <div className="rounded-3xl border border-border bg-white">
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
            <Button variant="outline" size="sm" className="shrink-0">
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
                  onToggleModulePermissions(
                    permissions.map((permission) => permission.id),
                    Boolean(value)
                  )
                }
                onSelect={(event) => event.preventDefault()}
                className="px-3 py-2 font-medium"
              >
                Chọn toàn bộ module
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {permissions.map((permission) => {
                const checked = effectivePermissionIds.includes(permission.id);

                return (
                  <DropdownMenuCheckboxItem
                    key={permission.id}
                    checked={checked}
                    onCheckedChange={(value) =>
                      onTogglePermission(permission.id, Boolean(value))
                    }
                    onSelect={(event) => event.preventDefault()}
                    className="items-start px-3 py-2"
                  >
                    <div className={` space-y-1  `  }>
                      <p className="font-medium text-text-primary">
                        {permission.description}
                      </p>
                      {/* <p className="text-xs text-text-secondary">{permission.id}</p> */}
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
          <p className="text-sm font-medium text-text-primary">Quyền đang bật</p>
          <button
            type="button"
            onClick={() =>
              onToggleModulePermissions(
                permissions.map((permission) => permission.id),
                false
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
                    onTogglePermission(permission.id, Boolean(value))
                  }
                  className="mt-1"
                />
                <div className="space-y-1">
                  <p className="font-medium text-text-primary">
                    {permission.description}
                  </p>
                  {/* <p className="text-xs text-text-secondary">{permission.id}</p> */}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
            <p className="font-medium text-text-primary">Chưa chọn quyền nào</p>
            <p className="mt-1 text-sm text-text-secondary">
              Mở dropdown để tick các quyền cần dùng cho module này.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
