import { useTogglePosition } from '@modules/staff/hooks/useTogglePosition';
import type { StaffPosition } from '@modules/staff/types/position.types';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';

interface PositionToggleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: StaffPosition | null;
}

/**
 * Dialog xác nhận ngừng sử dụng chức vụ.
 * Backend hiện chỉ trả position đang active, nên sau khi tắt bản ghi sẽ biến mất khỏi danh sách.
 */
export const PositionToggleDialog = ({
  open,
  onOpenChange,
  position = null,
}: PositionToggleDialogProps) => {
  const { mutate: togglePosition, isPending } = useTogglePosition();

  const handleConfirm = () => {
    if (!position) {
      return;
    }

    togglePosition(
      {
        id: position.id,
        active: false,
        name: position.name,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Ngừng sử dụng chức vụ</DialogTitle>
          <DialogDescription>
            {position ? (
              <>
                Chức vụ <span className="font-semibold text-text-primary">{position.name}</span> sẽ
                bị ẩn khỏi danh sách active sau thao tác này.
              </>
            ) : (
              'Chức vụ được chọn sẽ bị ẩn khỏi danh sách active.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Backend hiện chưa có endpoint lấy lại danh sách chức vụ đã tắt. Nếu muốn bật lại, cần
          backend expose danh sách inactive hoặc thao tác qua công cụ khác có sẵn ID.
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Đang cập nhật...' : 'Ngừng sử dụng'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
