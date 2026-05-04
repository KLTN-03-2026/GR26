import { useOpenPosSession } from '@modules/pos-session/hooks/usePosSession';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useToast } from '@shared/hooks/useToast';
import {
  formatNumericInputValue,
  sanitizeIntegerInputValue,
} from '@shared/utils/numberInput';
import { Wallet } from 'lucide-react';
import { useId, useState } from 'react';

interface OpenPosSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OpenPosSessionDialog = ({ open, onOpenChange }: OpenPosSessionDialogProps) => {
  const cashInputId = useId();
  const [startingCash, setStartingCash] = useState('');
  const { error } = useToast();
  const openSession = useOpenPosSession();

  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset về trạng thái ban đầu khi đóng dialog (cả Hủy lẫn submit thành công)
      setStartingCash('');
    }
    onOpenChange(open);
  };

  const handleSubmit = () => {
    const amount = Number(startingCash);

    if (!Number.isFinite(amount) || amount < 0) {
      error('Tiền đầu ca không hợp lệ', 'Vui lòng nhập số tiền lớn hơn hoặc bằng 0.');
      return;
    }

    openSession.mutate(
      {
        startingCash: amount,
        shiftScheduleId: null,
      },
      {
        onSuccess: () => onOpenChange(false),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Mở ca POS
          </DialogTitle>
          <DialogDescription>
            Nhập tiền mặt đầu ca để bắt đầu bán hàng tại chi nhánh hiện tại.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor={cashInputId}>Tiền mặt đầu ca</Label>
          <Input
            id={cashInputId}
            inputMode="numeric"
            placeholder="Ví dụ: 500000"
            type="text"
            value={formatNumericInputValue(startingCash)}
            onChange={(event) => setStartingCash(sanitizeIntegerInputValue(event.target.value))}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={openSession.isPending}
          >
            Hủy
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={openSession.isPending}>
            {openSession.isPending ? 'Đang mở ca...' : 'Mở ca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
