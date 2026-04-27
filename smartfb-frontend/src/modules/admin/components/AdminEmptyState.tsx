import type { ReactNode } from 'react';

interface AdminEmptyStateProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Empty state chuẩn cho các danh sách admin không có dữ liệu phù hợp.
 */
export const AdminEmptyState = ({
  eyebrow,
  title,
  description,
  action,
}: AdminEmptyStateProps) => {
  return (
    <div className="rounded-lg border border-dashed border-admin-gray-300 bg-white p-8 shadow-sm">
      <div className="max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-admin-brand-600">
          {eyebrow}
        </p>
        <h3 className="mt-3 text-xl font-semibold text-admin-gray-900">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-admin-gray-500">
          {description}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
};
