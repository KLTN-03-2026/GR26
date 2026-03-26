import { type FC, type ReactNode } from 'react';
import { Sidebar } from '@modules/branch/components/Sidebar';
import { Header } from './Header';

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
 */
export const OwnerLayout: FC<LayoutProps> = ({
  children,
  pageTitle,
  branches,
  selectedBranchId,
  onBranchChange,
}) => {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-60">
        <Header
          title={pageTitle}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={onBranchChange}
        />
        <main className="flex-1 overflow-y-auto px-8 py-4">{children}</main>
      </div>
    </div>
  );
};

/**
 * Layout cho Staff
 * Chỉ hiển thị các chức năng được phân công trong sidebar
 * Staff không thấy các menu: Cài đặt, Chi nhánh, Báo cáo doanh thu, v.v.
 */
export const StaffLayout: FC<LayoutProps> = ({
  children,
  pageTitle,
  branches,
  selectedBranchId,
  onBranchChange,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-60">
        <Header
          title={pageTitle}
          branches={branches}
          selectedBranchId={selectedBranchId}
          onBranchChange={onBranchChange}
        />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
};
