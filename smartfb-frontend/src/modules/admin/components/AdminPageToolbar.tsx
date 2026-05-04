import { cn } from '@shared/utils/cn';
import type { ReactNode } from 'react';

interface AdminPageToolbarProps {
  children: ReactNode;
  meta?: ReactNode;
  className?: string;
}

/**
 * Thanh công cụ chuẩn để đặt filter, tab và thông tin tổng hợp trên admin page.
 */
export const AdminPageToolbar = ({
  children,
  meta,
  className,
}: AdminPageToolbarProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-admin-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {meta ? (
        <div className="shrink-0 text-sm text-admin-gray-500">
          {meta}
        </div>
      ) : null}
    </div>
  );
};
