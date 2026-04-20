import type { StaffRole } from '@modules/staff/types/role.types';
import { Checkbox } from '@shared/components/ui/checkbox';
import { cn } from '@shared/utils/cn';

interface StaffRoleSelectorProps {
  roles: StaffRole[];
  selectedRoleIds: string[];
  onToggleRole: (roleId: string, checked: boolean) => void;
  isLoading?: boolean;
}

/**
 * Khu chọn vai trò cho nhân viên.
 * Role được tick ở đây sẽ là nguồn quyền thực tế của nhân viên sau khi lưu.
 */
export const StaffRoleSelector = ({
  roles,
  selectedRoleIds,
  onToggleRole,
  isLoading = false,
}: StaffRoleSelectorProps) => {
  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-border bg-slate-50">
        <div className="spinner spinner-sm" />
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-slate-50 px-4 py-6 text-center">
        <p className="font-medium text-text-primary">Chưa có vai trò nào để gán</p>
        <p className="mt-1 text-sm text-text-secondary">
          Hãy tạo vai trò trước trong mục Chức vụ {'>'} Vai trò & quyền.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {roles.map((role) => {
        const checked = selectedRoleIds.includes(role.id);

        return (
          <label
            key={role.id}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition-colors',
              checked
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-white hover:border-primary/30 hover:bg-slate-50'
            )}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(value) => onToggleRole(role.id, Boolean(value))}
              className="mt-1"
            />
            <div className="space-y-1">
              <p className="font-medium text-text-primary">{role.name}</p>
              <p className="text-sm text-text-secondary">
                {role.description || 'Chưa có mô tả nghiệp vụ'}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
};
