// author: Hoàng | date: 2026-05-01 | note: Bỏ modal trung gian — click button mở thẳng ClosePosSessionDialog (ca mở) hoặc OpenPosSessionDialog (chưa mở ca).
import { useActivePosSession } from '@modules/pos-session/hooks/usePosSession';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/utils/cn';
import { AlertCircle, LockKeyhole, RefreshCw, Wallet } from 'lucide-react';
import { useState } from 'react';
import { ClosePosSessionDialog } from './ClosePosSessionDialog';
import { OpenPosSessionDialog } from './OpenPosSessionDialog';

interface PosSessionStatusControlProps {
  className?: string;
}

const statusButtonClassName =
  'h-10 gap-2 rounded-xl border bg-white px-4 text-sm font-semibold shadow-sm transition-all';

/**
 * Button trạng thái ca POS.
 * - Ca đang mở  → click mở thẳng ClosePosSessionDialog (kiểm kê + đóng ca)
 * - Chưa mở ca → click mở OpenPosSessionDialog
 * author: Hoàng | date: 2026-05-01 | note: Loại bỏ modal status trung gian để giảm số bước thao tác.
 */
export const PosSessionStatusControl = ({ className }: PosSessionStatusControlProps) => {
  const activeSessionQuery = useActivePosSession();
  const activeSession = activeSessionQuery.data ?? null;
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);

  const isSessionOpen = activeSession?.status === 'OPEN';
  const isDisabled = activeSessionQuery.isLoading;

  const handleClick = () => {
    if (activeSessionQuery.isError) {
      void activeSessionQuery.refetch();
      return;
    }
    if (isSessionOpen) {
      setIsCloseDialogOpen(true);
    } else {
      setIsOpenDialogOpen(true);
    }
  };

  const renderButtonContent = () => {
    if (activeSessionQuery.isLoading) {
      return (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Đang kiểm tra ca
        </>
      );
    }
    if (activeSessionQuery.isError) {
      return (
        <>
          <AlertCircle className="h-4 w-4" />
          Lỗi trạng thái POS
        </>
      );
    }
    if (isSessionOpen) {
      return (
        <>
          <LockKeyhole className="h-4 w-4" />
          Ca POS đang mở
        </>
      );
    }
    return (
      <>
        <Wallet className="h-4 w-4" />
        Chưa mở ca POS
      </>
    );
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        disabled={isDisabled}
        className={cn(
          statusButtonClassName,
          isSessionOpen
            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
            : 'border-amber-300 text-amber-700 hover:bg-amber-50',
          activeSessionQuery.isError && 'border-red-300 text-red-700 hover:bg-red-50',
          className,
        )}
        onClick={handleClick}
      >
        {renderButtonContent()}
      </Button>

      <OpenPosSessionDialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen} />

      {activeSession ? (
        <ClosePosSessionDialog
          session={activeSession}
          open={isCloseDialogOpen}
          onOpenChange={setIsCloseDialogOpen}
        />
      ) : null}
    </>
  );
};
