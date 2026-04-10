import { cn } from '@shared/utils/cn';
import type { MenuStatus } from '@modules/menu/types/menu.types';
import { MENU_STATUS } from '@modules/menu/constants/menu.constants';

interface ProductStatusBadgeProps {
  status: MenuStatus;
  className?: string;
}

const statusStyles: Record<MenuStatus, string> = {
  selling: 'bg-green-100 text-green-700 border-green-200',
  hidden: 'bg-red-100 text-red-700 border-red-200',
};

export const ProductStatusBadge = ({ status, className }: ProductStatusBadgeProps) => {
  const config = MENU_STATUS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status],
        className
      )}
    >
      {config.label}
    </span>
  );
};
