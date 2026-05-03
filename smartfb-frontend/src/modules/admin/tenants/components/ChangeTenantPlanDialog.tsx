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
import { Textarea } from '@shared/components/ui/textarea';
import { formatVND } from '@shared/utils/formatCurrency';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  AdminTenantPlan,
  AdminTenantSummary,
  ChangeTenantPlanPayload,
} from '../types/adminTenant.types';

interface ChangeTenantPlanDialogProps {
  tenant: AdminTenantSummary | null;
  plans: AdminTenantPlan[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ChangeTenantPlanPayload) => void;
}

const getDefaultExpireDate = (): string => {
  const nextDate = new Date();
  nextDate.setFullYear(nextDate.getFullYear() + 1);
  return nextDate.toISOString().slice(0, 10);
};

/**
 * Dialog đổi gói dịch vụ cho tenant.
 */
export const ChangeTenantPlanDialog = ({
  tenant,
  plans,
  isPending,
  onOpenChange,
  onSubmit,
}: ChangeTenantPlanDialogProps) => {
  const defaultPlanId = plans[0]?.id ?? '';
  const [newPlanId, setNewPlanId] = useState(defaultPlanId);
  const [newExpiresAt, setNewExpiresAt] = useState(getDefaultExpireDate);
  const [note, setNote] = useState('');

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.id === newPlanId) ?? null;
  }, [newPlanId, plans]);

  const handleSubmit = () => {
    if (!newPlanId || !newExpiresAt) {
      return;
    }

    onSubmit({
      newPlanId,
      newExpiresAt,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={Boolean(tenant)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-admin-gray-200 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-admin-gray-900">Đổi gói dịch vụ</DialogTitle>
          <DialogDescription>
            Chọn gói mới và ngày hết hạn mới cho tenant.
          </DialogDescription>
        </DialogHeader>

        {tenant ? (
          <div className="rounded-lg bg-admin-gray-50 p-4">
            <p className="text-sm text-admin-gray-500">Tenant</p>
            <p className="mt-1 font-semibold text-admin-gray-900">{tenant.name}</p>
            <p className="mt-1 text-sm text-admin-gray-500">Gói hiện tại: {tenant.planName}</p>
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-new-plan">Gói mới</Label>
            <select
              id="tenant-new-plan"
              value={newPlanId}
              onChange={(event) => setNewPlanId(event.target.value)}
              className="h-10 w-full rounded-md border border-admin-gray-200 bg-white px-3 text-sm text-admin-gray-700 outline-none focus:border-admin-brand-500"
            >
              {plans.length === 0 ? (
                <option value="">Chưa có gói active</option>
              ) : null}
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatVND(plan.priceMonthly)}/tháng
                </option>
              ))}
            </select>
          </div>

          {selectedPlan ? (
            <div className="grid gap-3 rounded-lg border border-admin-gray-200 p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-admin-gray-500">Chi nhánh</p>
                <p className="mt-1 font-semibold text-admin-gray-900">
                  {selectedPlan.maxBranches ?? 'Không giới hạn'}
                </p>
              </div>
              <div>
                <p className="text-admin-gray-500">Nhân viên</p>
                <p className="mt-1 font-semibold text-admin-gray-900">
                  {selectedPlan.maxStaff ?? 'Không giới hạn'}
                </p>
              </div>
              <div>
                <p className="text-admin-gray-500">Món</p>
                <p className="mt-1 font-semibold text-admin-gray-900">
                  {selectedPlan.maxMenuItems ?? 'Không giới hạn'}
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="tenant-new-expire-date">Ngày hết hạn mới</Label>
            <Input
              id="tenant-new-expire-date"
              type="date"
              value={newExpiresAt}
              onChange={(event) => setNewExpiresAt(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenant-change-plan-note">Ghi chú</Label>
            <Textarea
              id="tenant-change-plan-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="VD: Nâng cấp theo yêu cầu khách hàng"
            />
          </div>
        </div>

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
            className="bg-admin-brand-500 hover:bg-admin-brand-600"
            onClick={handleSubmit}
            disabled={isPending || !newPlanId || !newExpiresAt}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Xác nhận đổi gói
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
