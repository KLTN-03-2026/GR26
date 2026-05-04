import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { AdminPlan } from '../types/adminPlan.types';

interface DeactivatePlanDialogProps {
  plan: AdminPlan | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Dialog xác nhận ẩn gói dịch vụ.
 */
export const DeactivatePlanDialog = ({
  plan,
  isPending,
  onOpenChange,
  onConfirm,
}: DeactivatePlanDialogProps) => {
  return (
    <Dialog open={Boolean(plan)} onOpenChange={onOpenChange}>
      <DialogContent className="border-admin-gray-200 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-admin-gray-900">Ẩn gói dịch vụ</DialogTitle>
          <DialogDescription>
            Gói đã ẩn sẽ không còn xuất hiện trong danh sách gói active. Backend sẽ từ chối nếu
            vẫn còn tenant đang dùng gói này.
          </DialogDescription>
        </DialogHeader>

        {plan ? (
          <div className="rounded-lg bg-admin-gray-50 p-4">
            <p className="text-sm text-admin-gray-500">Gói cần ẩn</p>
            <p className="mt-1 font-semibold text-admin-gray-900">{plan.name}</p>
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
            disabled={isPending || !plan}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Xác nhận ẩn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
