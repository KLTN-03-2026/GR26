import { PageMeta } from '@shared/components/common/PageMeta';
import { type ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

/**
 * Layout tối giản cho khu vực quản trị SaaS.
 * Tạm thời giữ nhẹ để tách vùng Admin khỏi Owner/Staff.
 */
export const AdminLayout = ({ children, pageTitle }: AdminLayoutProps) => {
  return (
    <>
      <PageMeta title={`${pageTitle} Admin`} />
      <div className="min-h-screen bg-cream">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-text-secondary">
                SmartF&amp;B Admin
              </p>
              <h1 className="mt-1 text-2xl font-bold text-text-primary">{pageTitle}</h1>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
      </div>
    </>
  );
};
