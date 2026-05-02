import { useSelectBranch } from '@modules/auth/hooks/useSelectBranch';
import { selectCurrentBranchId, useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { useActivePosSession } from '@modules/pos-session/hooks/usePosSession';
import { Button } from '@shared/components/ui/button';
import { usePermission } from '@shared/hooks/usePermission';
import { cn } from '@shared/utils/cn';
import { AlertCircle, RefreshCw, Store, Wallet } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { OpenPosSessionDialog } from './OpenPosSessionDialog';

interface PosSessionGateProps {
  children: ReactNode;
}

const POS_STATE_CARD_CLASS =
  'flex min-h-[360px] items-center justify-center rounded-lg border border-dashed border-border bg-card px-4 py-10';

export const PosSessionGate = ({ children }: PosSessionGateProps) => {
  const [isOpenDialogVisible, setIsOpenDialogVisible] = useState(false);
  const branchId = useAuthStore(selectCurrentBranchId);
  const { isOwner } = usePermission();
  const activeSessionQuery = useActivePosSession();
  const { data: branches = [], isLoading: isBranchesLoading } = useBranches();
  const selectBranch = useSelectBranch();

  const branchOptions = useMemo(() => {
    return branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
    }));
  }, [branches]);

  if (!branchId) {
    return (
      <div className={POS_STATE_CARD_CLASS}>
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Chọn chi nhánh để vào POS</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            POS session chạy theo từng chi nhánh. Vui lòng chọn một chi nhánh cụ thể trước khi mở ca
            hoặc bán hàng.
          </p>

          {isOwner ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {branchOptions.map((branch) => (
                <Button
                  key={branch.id}
                  type="button"
                  variant="outline"
                  className="justify-start"
                  disabled={selectBranch.isPending}
                  onClick={() => selectBranch.mutate(branch.id)}
                >
                  <Store className="h-4 w-4" />
                  <span className="truncate">{branch.name}</span>
                </Button>
              ))}
              {isBranchesLoading ? (
                <p className="col-span-full text-sm text-text-secondary">Đang tải chi nhánh...</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (activeSessionQuery.isLoading) {
    return (
      <div className={POS_STATE_CARD_CLASS}>
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="font-medium text-text-primary">Đang kiểm tra phiên POS</p>
          <p className="mt-1 text-sm text-text-secondary">Hệ thống đang lấy trạng thái mở ca hiện tại.</p>
        </div>
      </div>
    );
  }

  if (activeSessionQuery.isError) {
    return (
      <div className={POS_STATE_CARD_CLASS}>
        <div className="w-full max-w-md text-center">
          <AlertCircle className="mx-auto mb-3 h-9 w-9 text-red-500" />
          <h2 className="text-lg font-semibold text-text-primary">Không thể kiểm tra phiên POS</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Vui lòng tải lại trạng thái phiên trước khi tiếp tục thao tác bán hàng.
          </p>
          <Button className="mt-5" type="button" onClick={() => void activeSessionQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const activeSession = activeSessionQuery.data;

  if (!activeSession || activeSession.status !== 'OPEN') {
    return (
      <div className={POS_STATE_CARD_CLASS}>
        <div className="w-full max-w-md text-center">
          <div
            className={cn(
              'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full',
              'bg-primary-light text-primary'
            )}
          >
            <Wallet className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Chưa mở ca POS</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Cần mở ca cho chi nhánh hiện tại trước khi tạo đơn, thanh toán hoặc xử lý đơn tại POS.
          </p>
          <Button className="mt-5" type="button" onClick={() => setIsOpenDialogVisible(true)}>
            <Wallet className="h-4 w-4" />
            Mở ca POS
          </Button>
          <OpenPosSessionDialog
            open={isOpenDialogVisible}
            onOpenChange={setIsOpenDialogVisible}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
