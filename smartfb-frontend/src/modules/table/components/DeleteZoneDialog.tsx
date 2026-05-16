import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { useDeleteZone } from '@modules/table/hooks/useDeleteZone';

interface DeleteZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zoneId: string;
  zoneName: string;
  tableCount: number;
  onSuccess?: () => void;
}

export const DeleteZoneDialog = ({
  open,
  onOpenChange,
  zoneId,
  zoneName,
  tableCount,
  onSuccess,
}: DeleteZoneDialogProps) => {
  const { mutate: deleteZone, isPending, isError, error } = useDeleteZone();
  const errorMessage = isError && error instanceof Error ? error.message : '';
  const canDelete = tableCount === 0;

  const handleDeleteZone = () => {
    deleteZone(zoneId, {
      onSuccess: () => {
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Xác nhận xóa máy gọi thẻ</DialogTitle>
          <DialogDescription>
            Bạn đang chuẩn bị xóa máy gọi thẻ <strong>{zoneName}</strong>.
          </DialogDescription>
        </DialogHeader>

        {canDelete ? (
          <p className="text-sm text-gray-600">
            Máy gọi thẻ này hiện không còn thẻ nào. Bạn có thể xóa khỏi hệ thống.
          </p>
        ) : (
          <p className="text-sm text-amber-600">
            Máy gọi thẻ này đang có {tableCount} thẻ. Hãy chuyển hoặc xóa các thẻ trước khi xóa.
          </p>
        )}

        {isError && (
          <p className="text-sm text-red-600">{errorMessage || 'Xóa máy gọi thẻ không thành công'}</p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteZone}
            disabled={!canDelete || isPending}
          >
            {isPending ? 'Đang xóa...' : 'Xóa máy gọi thẻ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
