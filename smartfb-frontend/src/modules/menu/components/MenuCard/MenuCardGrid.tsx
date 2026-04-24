import { type FC, type ReactNode } from 'react';
import { cn } from '@shared/utils/cn';

interface MenuCardGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Grid layout cho Menu Card
 * Desktop: 3 columns
 * Tablet: 2 columns
 * Mobile: 1 column
 */
export const MenuCardGrid: FC<MenuCardGridProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
};
