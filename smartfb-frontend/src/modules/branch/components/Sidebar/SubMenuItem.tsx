import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@shared/utils/cn';
import type { MenuItem } from '@/data';

interface SubMenuItemProps {
  item: MenuItem;
  isActive: boolean;
}

/**
 * Sub-menu item hiển thị trong menu con mở rộng
 */
export const SubMenuItem: FC<SubMenuItemProps> = ({ item, isActive }) => {
  const Icon = item.icon;

  if (!item.path) return null;

  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors duration-150',
        ' font-medium tracking-wide ml-4',
        !isActive && 'text-text-secondary hover:bg-hover-light hover:text-text-primary',
        isActive && 'bg-primary text-white'
      )}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className='text-xs'>{item.title}</span>
    </Link>
  );
};
