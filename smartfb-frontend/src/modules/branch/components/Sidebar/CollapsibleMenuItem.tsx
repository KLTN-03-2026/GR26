import { type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import type { MenuItem } from '@/data';

interface CollapsibleItemProps {
  item: MenuItem;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  level?: number;
}

/**
 * Menu item có thể mở rộng để hiển thị sub-menu
 */
export const CollapsibleMenuItem: FC<CollapsibleItemProps> = ({
  item,
  isActive,
  isExpanded,
  onToggle,
  level = 0,
}) => {
  const location = useLocation();
  const Icon = item.icon;

  const hasChildren = item.children && item.children.length > 0;
  const isChildActive = item.children?.some(
    (child) => location.pathname === child.path
  );

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      onToggle();
    }
  };

  const baseClasses = cn(
    'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors duration-150',
    'text-sm font-medium tracking-wide hover:',
    !isActive && !isChildActive && 'text-text-secondary hover:bg-hover-light hover:text-primary',
    (isActive || isChildActive) && 'text-primary',
    level > 0 && 'pl-8'
  );

  if (item.path && !hasChildren) {
    return (
      <Link to={item.path} className={baseClasses}>
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        <span>{item.title}</span>
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={cn(baseClasses, 'w-full text-left')}>
      <span className="flex-1 text-md">{item.title}</span>
      {hasChildren && (
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      )}
    </button>
  );
};
