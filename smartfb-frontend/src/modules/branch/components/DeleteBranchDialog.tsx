import { useState } from 'react';
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
import { useDeleteBranch } from '../hooks/useDeleteBranch';

interface DeleteBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
  onSuccess?: () => void;
}

/**
 * Dialog xác nhận xóa chi nhánh
 */
export const DeleteBranchDialog = ({
  open,
  onOpenChange,
  branchId,
  branchName,
  onSuccess,
}: DeleteBranchDialogProps) => {
  const { mutate: deleteBranch, isPending } = useDeleteBranch();
  // const [isConfirming, setIsConfirming] = useState(false);

  const handleDelete = () => {
    // setIsConfirming(true);
    deleteBranch(branchId, {
      onSuccess: () => {
        // setIsConfirming(false);
        onOpenChange(false);
        onSuccess?.();
      },
      onError: () => {
        // setIsConfirming(false);
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // setIsConfirming(false);
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
              Xóa chi nhánh
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-2">
            Bạn có chắc chắn muốn xóa chi nhánh{' '}
            <span className="font-semibold text-gray-900">{branchName}</span>?
            <br />
            Hành động này <span className="font-semibold text-red-600">không thể hoàn tác</span> và sẽ xóa toàn bộ dữ liệu liên quan.
          </DialogDescription>
        </DialogHeader>

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
