import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { useDeleteStaff } from '../hooks/useDeleteStaff';
import { useState } from 'react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';

interface DeleteStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  onSuccess?: () => void;
}

export const DeleteStaffDialog = ({
  open,
  onOpenChange,
  staffId,
  staffName,
  onSuccess,
}: DeleteStaffDialogProps) => {
  const { mutate: deleteStaff, isPending } = useDeleteStaff();
  const [reason, setReason] = useState('');

  const handleDelete = () => {
    // NẾU KHÔNG NHẬP LÝ DO, VẪN GỬI REASON MẶC ĐỊNH
    const finalReason = reason.trim() || 'Xóa nhân viên từ giao diện quản lý';
    
    deleteStaff(
      { id: staffId, reason: finalReason },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason('');
          onSuccess?.();
        },
      }
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Xóa nhân viên
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-2">
            Bạn có chắc chắn muốn xóa nhân viên{' '}
            <span className="font-semibold text-gray-900">{staffName}</span>?
            <br />
            Hành động này <span className="font-semibold text-red-600">không thể hoàn tác</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">Lý do xóa (tùy chọn)</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do xóa nhân viên..."
            disabled={isPending}
          />
          <p className="text-xs text-gray-400">Nếu để trống, sẽ dùng lý do mặc định</p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            Huỷ
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            {isPending ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};