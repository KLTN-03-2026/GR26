import type { PosSession } from '@modules/pos-session/types/posSession.types';
import { Button } from '@shared/components/ui/button';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDateTime } from '@shared/utils/formatDate';
import { Clock, LockKeyhole, Wallet } from 'lucide-react';
import { useState } from 'react';
import { ClosePosSessionDialog } from './ClosePosSessionDialog';

interface PosSessionStatusBarProps {
  session: PosSession;
}

export const PosSessionStatusBar = ({ session }: PosSessionStatusBarProps) => {
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white">
          <LockKeyhole className="h-4 w-4" />
          Đang mở ca POS
        </span>
        <span className="inline-flex items-center gap-2 text-emerald-950">
          <Wallet className="h-4 w-4" />
          Tiền đầu ca: <strong>{formatVND(session.startingCash)}</strong>
        </span>
        <span className="inline-flex items-center gap-2 text-emerald-950">
          <Clock className="h-4 w-4" />
          Mở lúc: <strong>{formatDateTime(session.startTime)}</strong>
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-100"
        onClick={() => setIsCloseDialogOpen(true)}
      >
        Đóng ca
      </Button>

      <ClosePosSessionDialog
        session={session}
        open={isCloseDialogOpen}
        onOpenChange={setIsCloseDialogOpen}
      />
    </div>
  );
};
