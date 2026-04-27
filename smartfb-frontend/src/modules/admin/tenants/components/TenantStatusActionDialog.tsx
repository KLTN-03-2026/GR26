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
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { AdminTenantSummary } from '../types/adminTenant.types';

interface TenantStatusActionDialogProps {
  tenant: AdminTenantSummary | null;
  action: 'suspend' | 'reactivate' | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmSuspend: (reason: string) => void;
  onConfirmReactivate: () => void;
}

/**
 * Dialog xác nhận tạm khóa hoặc mở khóa tenant.
 */
export const TenantStatusActionDialog = ({
  tenant,
  action,
  isPending,
  onOpenChange,
  onConfirmSuspend,
  onConfirmReactivate,
}: TenantStatusActionDialogProps) => {
  const [reason, setReason] = useState('Quá hạn thanh toán hoặc cần kiểm tra tài khoản');
  const isSuspend = action === 'suspend';

  const handleConfirm = () => {
    if (isSuspend) {
      onConfirmSuspend(reason.trim() || 'Admin tạm khóa tenant');
      return;
    }

    onConfirmReactivate();
  };

  return (
    <Dialog open={Boolean(tenant && action)} onOpenChange={onOpenChange}>
      <DialogContent className="border-admin-gray-200">
        <DialogHeader>
          <DialogTitle className="text-admin-gray-900">
            {isSuspend ? 'Tạm khóa tenant' : 'Mở khóa tenant'}
          </DialogTitle>
          <DialogDescription>
            {isSuspend
              ? 'Tenant bị tạm khóa sẽ không thể sử dụng hệ thống cho đến khi được mở lại.'
              : 'Tenant sẽ được chuyển về trạng thái hoạt động.'}
          </DialogDescription>
        </DialogHeader>

        {tenant ? (
          <div className="rounded-lg bg-admin-gray-50 p-4">
            <p className="text-sm text-admin-gray-500">Tenant</p>
            <p className="mt-1 font-semibold text-admin-gray-900">{tenant.name}</p>
          </div>
        ) : null}

        {isSuspend ? (
          <div className="space-y-2">
            <Label htmlFor="suspend-reason">Lý do tạm khóa</Label>
            <Input
              id="suspend-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="VD: Quá hạn thanh toán 30 ngày"
            />
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
            className={isSuspend ? 'bg-admin-warning hover:bg-admin-warning/90' : 'bg-admin-success hover:bg-admin-success/90'}
            onClick={handleConfirm}
            disabled={isPending || !tenant}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSuspend ? 'Xác nhận tạm khóa' : 'Xác nhận mở khóa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
