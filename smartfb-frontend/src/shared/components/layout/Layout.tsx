import { type FC, type ReactNode, useState } from 'react';
import { Sidebar } from '@modules/branch/components/Sidebar';
import { Header } from './Header';
import { MobileNav, MobileSidebar } from './MobileNav';
import { Menu } from 'lucide-react';
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
 * Responsive: Mobile dùng bottom nav + slide-over sidebar
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
      {/* Desktop Sidebar - ẩn trên mobile */}
      <div className="hidden md:block">
        <Sidebar
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={onBranchChange}
        />
      </div>

      {/* Mobile Content */}
      <div className={cn('flex-1 flex flex-col min-w-0', 'md:ml-60')}>
        {/* Mobile Header với hamburger menu */}
        <div className="md:hidden">
          <Header
            title={pageTitle}
            showHamburger
            onHamburgerClick={() => setIsMobileSidebarOpen(true)}
          />
        </div>

        {/* Desktop Header - ẩn trên mobile */}
        <div className="hidden md:block">
          <Header title={pageTitle} />
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 pb-20 md:pb-4">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav onOpenFullMenu={() => setIsMobileSidebarOpen(true)} />
      </div>

      {/* Mobile Slide-over Sidebar */}
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
 * Responsive: Mobile dùng bottom nav + slide-over sidebar
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
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar - ẩn trên mobile */}
      <div className="hidden md:block">
        <Sidebar
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={onBranchChange}
        />
      </div>

      {/* Mobile Content */}
      <div className={cn('flex-1 flex flex-col min-w-0', 'md:ml-60')}>
        {/* Mobile Header với hamburger menu */}
        <div className="md:hidden">
          <Header
            title={pageTitle}
            showHamburger
            onHamburgerClick={() => setIsMobileSidebarOpen(true)}
          />
        </div>

        {/* Desktop Header - ẩn trên mobile */}
        <div className="hidden md:block">
          <Header title={pageTitle} />
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 pb-20 md:pb-4">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav onOpenFullMenu={() => setIsMobileSidebarOpen(true)} />
      </div>

      {/* Mobile Slide-over Sidebar */}
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
