import type { StaffRole } from '@modules/staff/types/role.types';

interface RoleListPanelProps {
  roles: StaffRole[];
  selectedRoleId: string | null;
  onSelectRole: (roleId: string) => void;
}

export const RoleListPanel = ({
  roles,
  selectedRoleId,
  onSelectRole,
}: RoleListPanelProps) => {
  return (
    <div className="rounded-3xl border border-border bg-slate-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-text-secondary">
          Vai trò
        </h3>
        <span className="text-xs text-text-secondary">{roles.length} role</span>
      </div>

      <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
        {roles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
            <p className="font-medium text-text-primary">Chưa có vai trò nào</p>
            <p className="mt-1 text-sm text-text-secondary">
              Tạo role đầu tiên để bắt đầu cấu hình quyền.
            </p>
          </div>
        ) : (
          roles.map((role) => {
            const isSelected = role.id === selectedRoleId;

            return (
              <button
                key={role.id}
                type="button"
                onClick={() => onSelectRole(role.id)}
                className={
                  isSelected
                    ? 'w-full rounded-2xl border border-primary bg-primary/5 px-4 py-3 text-left'
                    : 'w-full rounded-2xl border border-border bg-white px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5'
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-primary">{role.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {role.description || 'Chưa có mô tả'}
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
  );
};
