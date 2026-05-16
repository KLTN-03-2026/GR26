import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import type { BranchListItem } from '@modules/branch/types/branch.types';

interface DisableBranchDialogProps {
  branch: BranchListItem | null;
  open: boolean;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Dialog xác nhận vô hiệu hoá chi nhánh.
 * Thao tác này gọi API soft-delete nên chi nhánh chuyển sang INACTIVE thay vì xoá khỏi DB.
 */
export const DisableBranchDialog = ({
  branch,
  open,
  isPending = false,
  onOpenChange,
  onConfirm,
}: DisableBranchDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Vô hiệu hoá chi nhánh
          </DialogTitle>
          <DialogDescription>
            Chi nhánh sẽ ngừng hoạt động và toàn bộ nhân viên đang được gán vào chi nhánh này sẽ bị hủy phân công.
          </DialogDescription>
        </DialogHeader>

        {branch ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">{branch.name}</p>
            <p className="mt-1">
              Mã chi nhánh: <span className="font-medium">{branch.code}</span>
            </p>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={!branch || isPending}
          >
            {isPending ? 'Đang xử lý...' : 'Xác nhận vô hiệu hoá'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
