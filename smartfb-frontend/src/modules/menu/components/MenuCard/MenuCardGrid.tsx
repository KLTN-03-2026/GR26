import { type FC, type ReactNode } from 'react';
import { cn } from '@shared/utils/cn';

interface MenuCardGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * Grid layout cho Menu Card.
 * Dùng auto-fit để card tự lấp đầy chiều ngang, tránh dư khoảng trắng lớn ở tablet/desktop hẹp.
 */
export const MenuCardGrid: FC<MenuCardGridProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-[repeat(auto-fit,minmax(176px,1fr))] gap-3 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] xl:grid-cols-[repeat(auto-fit,minmax(236px,1fr))]',
        className
      )}
    >
      {children}
    </div>
  );
};
