import { type FC, type ReactNode, useState } from 'react';
import { Sidebar } from '@modules/branch/components/Sidebar';
import { Header } from './Header';
import { MobileNav, MobileSidebar } from './MobileNav';
import { cn } from '@shared/utils/cn';

interface LayoutProps {
  children: ReactNode;
  pageTitle: string;
  branches?: { id: string; name: string }[];
  selectedBranchId?: string;
  onBranchChange?: (branchId: string) => void;
}

/**
 * Layout chính cho Owner
 * Hiển thị tất cả các chức năng trong sidebar
 * Responsive: Mobile dùng bottom nav + slide-over sidebar,
 * tablet dùng header với hamburger + slide-over sidebar,
 * desktop dùng sidebar cố định
 */
export const OwnerLayout: FC<LayoutProps> = ({
  children,
  pageTitle,
  branches,
  selectedBranchId,
  onBranchChange,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Desktop Sidebar - chỉ hiển thị từ desktop trở lên */}
      <div className="hidden lg:block">
        <Sidebar
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={onBranchChange}
        />
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col', 'lg:ml-sidebar')}>
        <Header
          title={pageTitle}
          showHamburger
          onHamburgerClick={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:px-6 md:py-6 md:pb-6  lg:pb-4">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav onOpenFullMenu={() => setIsMobileSidebarOpen(true)} />
      </div>

      {/* Mobile/Tablet Slide-over Sidebar */}
      <MobileSidebar
        open={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchChange={onBranchChange}
      />
    </div>
  );
};

/**
 * Layout cho Staff
 * Chỉ hiển thị các chức năng được phân công trong sidebar
 * Staff không thấy các menu: Cài đặt, Chi nhánh, Báo cáo doanh thu, v.v.
 * Responsive: Mobile dùng bottom nav + slide-over sidebar,
 * tablet dùng header với hamburger + slide-over sidebar,
 * desktop dùng sidebar cố định
 */
export const StaffLayout: FC<LayoutProps> = ({
  children,
  pageTitle,
  branches,
  selectedBranchId,
  onBranchChange,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-cream">
      {/* Desktop Sidebar - chỉ hiển thị từ desktop trở lên */}
      <div className="hidden lg:block">
        <Sidebar
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={onBranchChange}
        />
      </div>

      <div className={cn('flex min-w-0 flex-1 flex-col', 'lg:ml-sidebar')}>
        <Header
          title={pageTitle}
          showHamburger
          onHamburgerClick={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-4 pb-20 md:px-6 md:py-6 md:pb-6 lg:px-8 lg:pb-4">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav onOpenFullMenu={() => setIsMobileSidebarOpen(true)} />
      </div>

      {/* Mobile/Tablet Slide-over Sidebar */}
      <MobileSidebar
        open={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchChange={onBranchChange}
      />
    </div>
  );
};
