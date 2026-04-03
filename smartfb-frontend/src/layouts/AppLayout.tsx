import { mockBranches } from '@/data';
import { PageMeta } from '@shared/components/common/PageMeta';
import { OwnerLayout, StaffLayout } from '@shared/components/layout';
import { usePermission } from '@shared/hooks/usePermission';
import { type ReactNode, useState } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

/**
 * Layout dùng chung cho vùng ứng dụng sau đăng nhập.
 * Owner và Staff dùng chung shell nhưng khác mức hiển thị menu.
 */
export const AppLayout = ({ children, pageTitle }: AppLayoutProps) => {
  const { isOwner } = usePermission();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
  };

  if (isOwner) {
    return (
      <>
        <PageMeta title={pageTitle} />
        <OwnerLayout
          pageTitle={pageTitle}
          branches={mockBranches}
          selectedBranchId={selectedBranchId}
          onBranchChange={handleBranchChange}
        >
          {children}
        </OwnerLayout>
      </>
    );
  }

  return (
    <>
      <PageMeta title={pageTitle} />
      <StaffLayout
        pageTitle={pageTitle}
        branches={mockBranches}
        selectedBranchId={selectedBranchId}
        onBranchChange={handleBranchChange}
      >
        {children}
      </StaffLayout>
    </>
  );
};
