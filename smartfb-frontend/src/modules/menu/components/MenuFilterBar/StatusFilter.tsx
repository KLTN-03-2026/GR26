import { Checkbox } from '@shared/components/ui/checkbox';
import { cn } from '@shared/utils/cn';
import type { MenuStatus } from '@modules/menu/types/menu.types';
import { MENU_STATUS } from '@modules/menu/constants/menu.constants';

interface StatusFilterProps {
  selectedStatuses: MenuStatus[];
  onStatusChange: (status: MenuStatus) => void;
  statusCounts?: Partial<Record<MenuStatus, number>>;
  className?: string;
}

const statusStyles: Record<MenuStatus, string> = {
  selling: 'text-green-600',
  hidden: 'text-red-600',
  pending: 'text-orange-600',
};

export const StatusFilter = ({
  selectedStatuses,
  onStatusChange,
  statusCounts,
  className,
}: StatusFilterProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      {(Object.keys(MENU_STATUS) as MenuStatus[]).map((status) => (
        <div key={status} className="flex items-center space-x-2">
          <Checkbox
            id={`status-${status}`}
            checked={selectedStatuses.includes(status)}
            onCheckedChange={() => onStatusChange(status)}
          />
          <label
            htmlFor={`status-${status}`}
            className={cn(
              'text-sm cursor-pointer select-none',
              statusStyles[status]
            )}
          >
            {MENU_STATUS[status].label}
          </label>
          {statusCounts?.[status] !== undefined && (
            <span className="text-xs text-gray-400 ml-auto">
              {statusCounts[status]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
