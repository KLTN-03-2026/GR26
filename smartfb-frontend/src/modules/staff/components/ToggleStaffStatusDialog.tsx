import { Lock, Unlock } from 'lucide-react'; // Bỏ AlertTriangle không dùng
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { useToggleStaffStatus } from '../hooks/useToggleStaffStatus';

interface ToggleStaffStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  currentStatus: 'active' | 'inactive';
  onSuccess?: () => void;
}

/**
 * Dialog xác nhận khóa/mở khóa nhân viên
 * Đáp ứng PB08 AC5: Khóa/mở khóa nhân viên
 */
export const ToggleStaffStatusDialog = ({
  open,
  onOpenChange,
  staffId,
  staffName,
  currentStatus,
  onSuccess,
}: ToggleStaffStatusDialogProps) => {
  const { mutate: toggleStatus, isPending } = useToggleStaffStatus();
  
  const isActivating = currentStatus === 'inactive';
  const newStatus = isActivating ? 'active' : 'inactive';
  const actionText = isActivating ? 'mở khóa' : 'khóa';
  const actionTextDisplay = isActivating ? 'Mở khóa' : 'Khóa';

  const handleConfirm = () => {
    toggleStatus(
      { id: staffId, status: newStatus },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${isActivating ? 'bg-green-100' : 'bg-orange-100'} flex items-center justify-center`}>
              {isActivating ? (
                <Unlock className="w-5 h-5 text-green-600" />
              ) : (
                <Lock className="w-5 h-5 text-orange-600" />
              )}
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {actionTextDisplay} nhân viên
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-2">
            Bạn có chắc chắn muốn {actionText} nhân viên{' '}
            <span className="font-semibold text-gray-900">{staffName}</span>?
            <br />
            {isActivating 
              ? 'Nhân viên sẽ có thể đăng nhập và làm việc trở lại.'
              : 'Nhân viên sẽ không thể đăng nhập vào hệ thống.'}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            Huỷ
          </Button>
          <Button
            variant={isActivating ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            {isPending ? 'Đang xử lý...' : `Xác nhận ${actionTextDisplay}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};