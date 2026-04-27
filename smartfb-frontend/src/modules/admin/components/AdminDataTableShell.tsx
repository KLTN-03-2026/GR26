import { cn } from '@shared/utils/cn';
import type { ReactNode } from 'react';

interface AdminDataTableShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Khung bảng chuẩn cho admin, giữ border/radius nhất quán và hỗ trợ cuộn ngang.
 */
export const AdminDataTableShell = ({
  children,
  className,
}: AdminDataTableShellProps) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-admin-gray-200 bg-white shadow-sm',
        className
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
};
