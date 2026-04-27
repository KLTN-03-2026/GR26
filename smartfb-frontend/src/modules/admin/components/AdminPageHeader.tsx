import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

/**
 * Header chuẩn cho các trang quản trị SaaS.
 */
export const AdminPageHeader = ({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-admin-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide text-admin-brand-600">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-admin-gray-900">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-admin-gray-500">
          {description}
        </p>
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
};
