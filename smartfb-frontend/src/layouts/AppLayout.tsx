import { useAuthStore } from '@modules/auth/stores/authStore';
import { useSelectBranch } from '@modules/auth/hooks/useSelectBranch';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { Button } from '@shared/components/ui/button';
import { PageMeta } from '@shared/components/common/PageMeta';
import { OwnerLayout, StaffLayout } from '@shared/components/layout';
import { usePermission } from '@shared/hooks/usePermission';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle: string;
}

interface StaffBranchSetupStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  isActionDisabled?: boolean;
  onAction?: () => void;
  showSpinner?: boolean;
}

const StaffBranchSetupState = ({
  title,
  description,
  actionLabel,
  isActionDisabled = false,
  onAction,
  showSpinner = false,
}: StaffBranchSetupStateProps) => {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card px-6 py-8 text-center shadow-card">
        <div
          aria-hidden="true"
          className={
            showSpinner
              ? 'mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary'
              : 'mx-auto mb-4 h-10 w-10 rounded-full bg-primary-light'
          }
        />
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>

        {actionLabel && onAction ? (
          <Button className="mt-5" onClick={onAction} disabled={isActionDisabled}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
};

/**
 * Layout dùng chung cho vùng ứng dụng sau đăng nhập.
 * Owner và Staff dùng chung shell nhưng khác mức hiển thị menu.
 */
export const AppLayout = ({ children, pageTitle }: AppLayoutProps) => {
  const { isOwner, isStaff } = usePermission();
  const queryClient = useQueryClient();
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const updateBranchContext = useAuthStore((state) => state.updateBranchContext);
  const autoSelectedBranchIdRef = useRef<string | null>(null);
  const {
    mutateAsync: selectBranch,
    isPending: isSelectingBranch,
    isError: isSelectBranchError,
    reset: resetSelectBranch,
  } = useSelectBranch({
    showSuccessToast: false,
    showErrorToast: false,
  });
  const {
    data: branches = [],
    isLoading: isBranchesLoading,
    isError: isBranchesError,
    refetch: refetchBranches,
  } = useBranches();

  const branchOptions = useMemo(() => {
    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
    }));
  }, [branches]);

  const firstAccessibleBranchId = branchOptions[0]?.id ?? null;
  // const selectedBranchId = isOwner ? (currentBranchId ?? 'all') : (currentBranchId ?? undefined); // Code cũ
  // Cập nhật logic để staff hiển thị chi nhánh đầu tiên trong khi chờ auto-select hoàn tất
  const selectedBranchId = isOwner
    ? (currentBranchId ?? 'all')
    : (currentBranchId ?? firstAccessibleBranchId); 


  useEffect(() => {
    if (currentBranchId) {
      autoSelectedBranchIdRef.current = currentBranchId;
    }
  }, [currentBranchId]);

  useEffect(() => {
    if (!isStaff || currentBranchId || !firstAccessibleBranchId) {
      return;
    }

    if (autoSelectedBranchIdRef.current === firstAccessibleBranchId) {
      return;
    }

    // Staff luôn cần branch context hợp lệ trước khi page con bắn request nghiệp vụ.
    autoSelectedBranchIdRef.current = firstAccessibleBranchId;
    void selectBranch(firstAccessibleBranchId).catch(() => undefined);
  }, [currentBranchId, firstAccessibleBranchId, isStaff, selectBranch]);

  const handleBranchChange = (branchId: string) => {
    if (branchId === 'all') {
      updateBranchContext(null);
      // Invalidate toàn bộ cache vì owner không qua API selectBranch ở nhánh này.
      void queryClient.invalidateQueries();
      return;
    }

    if (branchId === currentBranchId) {
      return;
    }

    void selectBranch(branchId);
  };

  const handleRetryLoadBranches = () => {
    void refetchBranches();
  };

  const handleRetryAutoSelect = () => {
    if (!firstAccessibleBranchId) {
      return;
    }

    resetSelectBranch();
    autoSelectedBranchIdRef.current = null;
    autoSelectedBranchIdRef.current = firstAccessibleBranchId;
    void selectBranch(firstAccessibleBranchId).catch(() => undefined);
  };

  const staffContent = (() => {
    if (!isStaff || currentBranchId) {
      return children;
    }

    if (isBranchesLoading) {
      return (
        <StaffBranchSetupState
          title="Đang tải danh sách chi nhánh"
          description="Hệ thống đang kiểm tra các chi nhánh mà tài khoản staff được phép truy cập."
          showSpinner
        />
      );
    }

    if (isBranchesError) {
      return (
        <StaffBranchSetupState
          title="Không thể tải danh sách chi nhánh"
          description="Vui lòng thử lại để hệ thống thiết lập chi nhánh làm việc mặc định cho tài khoản này."
          actionLabel="Tải lại danh sách"
          onAction={handleRetryLoadBranches}
        />
      );
    }

    if (!firstAccessibleBranchId) {
      return (
        <StaffBranchSetupState
          title="Tài khoản chưa được gán chi nhánh"
          description="Hiện chưa có chi nhánh khả dụng cho tài khoản staff này. Vui lòng liên hệ quản trị viên để được phân công chi nhánh làm việc."
        />
      );
    }

    if (isSelectBranchError) {
      return (
        <StaffBranchSetupState
          title="Không thể thiết lập chi nhánh mặc định"
          description="Hệ thống chưa đồng bộ được branch context cho phiên làm việc hiện tại. Vui lòng thử lại."
          actionLabel="Thử lại"
          onAction={handleRetryAutoSelect}
          isActionDisabled={isSelectingBranch}
        />
      );
    }

    // Spinner chỉ hiển thị khi chưa trigger auto-select hoặc mutation đang in-flight.
    // Nếu auto-select đã hoàn thành nhưng branchId vẫn null → stuck state, hiển thị nút thử lại.
    const autoSelectInProgress =
      autoSelectedBranchIdRef.current !== firstAccessibleBranchId || isSelectingBranch;

    if (autoSelectInProgress) {
      return (
        <StaffBranchSetupState
          title="Đang thiết lập chi nhánh làm việc"
          description="Hệ thống đang tự động chọn chi nhánh đầu tiên để phiên làm việc của staff có branch context hợp lệ."
          showSpinner
        />
      );
    }

    return (
      <StaffBranchSetupState
        title="Không thể thiết lập chi nhánh mặc định"
        description="Hệ thống chưa đồng bộ được branch context cho phiên làm việc hiện tại. Vui lòng thử lại."
        actionLabel="Thử lại"
        onAction={handleRetryAutoSelect}
        isActionDisabled={isSelectingBranch}
      />
    );
  })();

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
        {staffContent}
      </StaffLayout>
    </>
  );
};
