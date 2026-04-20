import { Search } from 'lucide-react';

import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/utils/cn';

import { ALL_PERMISSION_MODULES } from './rolePermissionManager.utils';

interface PermissionFiltersProps {
  permissionKeyword: string;
  moduleNames: string[];
  activeModule: string;
  onPermissionKeywordChange: (value: string) => void;
  onSelectModule: (moduleName: string) => void;
}

export const PermissionFilters = ({
  permissionKeyword,
  moduleNames,
  activeModule,
  onPermissionKeywordChange,
  onSelectModule,
}: PermissionFiltersProps) => {
  return (
    <div className="grid gap-3 rounded-3xl border border-border bg-white p-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <Input
          value={permissionKeyword}
          onChange={(event) => onPermissionKeywordChange(event.target.value)}
          placeholder="Tìm quyền theo tên hoặc mô tả"
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {moduleNames.map((moduleName) => (
          <button
            key={moduleName}
            type="button"
            onClick={() => onSelectModule(moduleName)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              activeModule === moduleName
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {moduleName === ALL_PERMISSION_MODULES ? 'Tất cả module' : moduleName}
          </button>
        ))}
      </div>
    </div>
  );
};
