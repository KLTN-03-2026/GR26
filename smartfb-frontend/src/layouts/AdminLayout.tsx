import { PageMeta } from '@shared/components/common/PageMeta';
import { AdminHeader } from '@modules/admin/layout/AdminHeader';
import { AdminMobileSidebar } from '@modules/admin/layout/AdminMobileSidebar';
import { AdminSidebar } from '@modules/admin/layout/AdminSidebar';
import { type ReactNode, useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

/**
 * Layout riêng cho khu vực quản trị SaaS.
 * Admin dùng shell riêng để không lẫn với nghiệp vụ vận hành Owner/Staff.
 */
export const AdminLayout = ({ children, pageTitle }: AdminLayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <>
      <PageMeta title={`${pageTitle} Admin`} />
      <div className="min-h-screen bg-admin-gray-50">
        <div className="fixed left-0 top-0 z-40 hidden h-screen lg:block">
          <AdminSidebar />
        </div>

        <div className="flex min-h-screen min-w-0 flex-col lg:pl-admin-sidebar">
          <AdminHeader
            pageTitle={pageTitle}
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          />

          <main className="flex-1 px-4 py-5 md:px-6 md:py-6 xl:px-8">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>

        <AdminMobileSidebar
          open={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>
    </>
  );
};
