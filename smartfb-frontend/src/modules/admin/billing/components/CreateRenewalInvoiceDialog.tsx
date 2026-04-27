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
  AdminBillingPlanOption,
  AdminBillingTenantOption,
  CreateRenewalInvoicePayload,
} from '../types/adminBilling.types';

interface CreateRenewalInvoiceDialogProps {
  open: boolean;
  tenants: AdminBillingTenantOption[];
  plans: AdminBillingPlanOption[];
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateRenewalInvoicePayload) => void;
}

/**
 * Dialog tạo hóa đơn gia hạn subscription cho tenant.
 */
export const CreateRenewalInvoiceDialog = ({
  open,
  tenants,
  plans,
  isPending,
  onOpenChange,
  onSubmit,
}: CreateRenewalInvoiceDialogProps) => {
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? '');
  const [planId, setPlanId] = useState(plans[0]?.id ?? '');
  const [months, setMonths] = useState(1);
  const [note, setNote] = useState('');

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.id === planId) ?? null;
  }, [planId, plans]);

  const estimatedAmount = selectedPlan ? selectedPlan.priceMonthly * months : 0;

  const handleSubmit = () => {
    if (!tenantId || !planId || months < 1) {
      return;
    }

    onSubmit({
      tenantId,
      planId,
      months,
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-admin-gray-200 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-admin-gray-900">Tạo hóa đơn gia hạn</DialogTitle>
          <DialogDescription>
            Tạo invoice UNPAID để theo dõi thanh toán subscription của tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-tenant">Tenant</Label>
            <select
              id="invoice-tenant"
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
              className="h-10 w-full rounded-md border border-admin-gray-200 bg-white px-3 text-sm text-admin-gray-700 outline-none focus:border-admin-brand-500"
            >
              {tenants.length === 0 ? <option value="">Chưa có tenant</option> : null}
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} - {tenant.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-plan">Gói dịch vụ</Label>
            <select
              id="invoice-plan"
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
              className="h-10 w-full rounded-md border border-admin-gray-200 bg-white px-3 text-sm text-admin-gray-700 outline-none focus:border-admin-brand-500"
            >
              {plans.length === 0 ? <option value="">Chưa có gói active</option> : null}
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - {formatVND(plan.priceMonthly)}/tháng
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-months">Số tháng gia hạn</Label>
            <Input
              id="invoice-months"
              type="number"
              min={1}
              max={24}
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
            />
          </div>

          <div className="rounded-lg border border-admin-gray-200 bg-admin-gray-50 p-4">
            <p className="text-sm text-admin-gray-500">Số tiền dự kiến</p>
            <p className="mt-1 text-xl font-semibold text-admin-gray-900">
              {formatVND(estimatedAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice-note">Ghi chú</Label>
            <Textarea
              id="invoice-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="VD: Gia hạn ưu đãi khách hàng VIP"
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
            disabled={isPending || !tenantId || !planId || months < 1}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Tạo hóa đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
