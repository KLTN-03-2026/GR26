import { useAuthStore } from '@modules/auth/stores/authStore';
import { useSelectBranch } from '@modules/auth/hooks/useSelectBranch';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { PageMeta } from '@shared/components/common/PageMeta';
import { OwnerLayout, StaffLayout } from '@shared/components/layout';
import { usePermission } from '@shared/hooks/usePermission';
import { type ReactNode, useMemo } from 'react';

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
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const updateBranchContext = useAuthStore((state) => state.updateBranchContext);
  const { mutate: selectBranch } = useSelectBranch();
  const { data: branches = [] } = useBranches();

  const branchOptions = useMemo(() => {
    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
    }));
  }, [branches]);

  const selectedBranchId = currentBranchId ?? 'all';

  const handleBranchChange = (branchId: string) => {
    if (branchId === 'all') {
      updateBranchContext(null);
      return;
    }

    if (branchId === currentBranchId) {
      return;
    }

    selectBranch(branchId);
  };

  if (isOwner) {
    return (
      <>
        <PageMeta title={pageTitle} />
        <OwnerLayout
          pageTitle={pageTitle}
          branches={branchOptions}
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
          branches={branchOptions}
          selectedBranchId={selectedBranchId}
          onBranchChange={handleBranchChange}
        >
        {children}
      </StaffLayout>
    </>
  );
};
