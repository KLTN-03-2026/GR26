import { useActivePosSession } from '@modules/pos-session/hooks/usePosSession';
import { Button } from '@shared/components/ui/button';
import { AlertCircle, Wallet } from 'lucide-react';
import { useState } from 'react';
import { ClosePosSessionDialog } from './ClosePosSessionDialog';
import { OpenPosSessionDialog } from './OpenPosSessionDialog';
import { formatVND } from '@shared/utils/formatCurrency';
import { formatDateTime } from '@shared/utils/formatDate';
import { Clock } from 'lucide-react';

/**
 * Banner trạng thái ca POS hiển thị đầu trang Bàn và Đơn hàng.
 * - Chưa mở ca: hiện cảnh báo nhỏ + nút "Mở ca"
 * - Đang mở ca: hiện thông tin ca + nút "Đóng ca"
 * Không block toàn trang (khác PosSessionGate).
 */
export const PosSessionBanner = () => {
  const [isOpenDialogVisible, setIsOpenDialogVisible] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const { data: activeSession, isLoading } = useActivePosSession();

  // Không hiện gì trong khi đang load để tránh layout shift
  if (isLoading) return null;

  // Đang có ca OPEN
  if (activeSession?.status === 'OPEN') {
    return (
      <>
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white">
              <Wallet className="h-4 w-4" />
              Đang mở ca POS
            </span>
            <span className="inline-flex items-center gap-2 text-emerald-950">
              <Wallet className="h-4 w-4" />
              Tiền đầu ca: <strong>{formatVND(activeSession.startingCash)}</strong>
            </span>
            <span className="inline-flex items-center gap-2 text-emerald-950">
              <Clock className="h-4 w-4" />
              Mở lúc: <strong>{formatDateTime(activeSession.startTime)}</strong>
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-emerald-700 bg-white text-emerald-800 hover:bg-emerald-100"
            onClick={() => setIsCloseDialogOpen(true)}
          >
            Đóng ca
          </Button>
        </div>
        <ClosePosSessionDialog
          session={activeSession}
          open={isCloseDialogOpen}
          onOpenChange={setIsCloseDialogOpen}
        />
      </>
    );
  }

  // Chưa mở ca
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Chưa mở ca POS. Cần mở ca trước khi tạo đơn hoặc thanh toán.</span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-600 bg-white text-amber-800 hover:bg-amber-100"
          onClick={() => setIsOpenDialogVisible(true)}
        >
          <Wallet className="h-4 w-4" />
          Mở ca POS
        </Button>
      </div>
      <OpenPosSessionDialog
        open={isOpenDialogVisible}
        onOpenChange={setIsOpenDialogVisible}
      />
    </>
  );
};
