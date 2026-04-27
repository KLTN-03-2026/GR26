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
import { Switch } from '@shared/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type {
  AdminPlan,
  AdminPlanFeatureFlags,
  AdminPlanFormValues,
} from '../types/adminPlan.types';

interface AdminPlanFormDialogProps {
  open: boolean;
  plan?: AdminPlan | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AdminPlanFormValues) => void;
}

const DEFAULT_FEATURES: AdminPlanFeatureFlags = {
  POS: true,
  INVENTORY: true,
  PROMOTION: false,
  REPORT: true,
  AI: false,
};

const FEATURE_OPTIONS: Array<{
  key: keyof AdminPlanFeatureFlags;
  label: string;
  description: string;
}> = [
  { key: 'POS', label: 'POS', description: 'Bán hàng và quản lý đơn tại quầy' },
  { key: 'INVENTORY', label: 'Kho', description: 'Nhập, xuất, kiểm kho và cảnh báo tồn' },
  { key: 'PROMOTION', label: 'Voucher', description: 'Khuyến mãi và mã giảm giá' },
  { key: 'REPORT', label: 'Báo cáo', description: 'Doanh thu, kho và nhân sự' },
  { key: 'AI', label: 'AI Forecast', description: 'Dự báo tồn kho bằng AI' },
];

const getInitialFormValues = (plan?: AdminPlan | null): AdminPlanFormValues => {
  if (!plan) {
    return {
      name: '',
      slug: '',
      priceMonthly: 0,
      maxBranches: 1,
      maxStaff: 5,
      maxMenuItems: 50,
      features: DEFAULT_FEATURES,
      isActive: true,
    };
  }

  return {
    name: plan.name,
    slug: plan.slug,
    priceMonthly: plan.priceMonthly,
    maxBranches: plan.maxBranches ?? 0,
    maxStaff: plan.maxStaff ?? 0,
    maxMenuItems: plan.maxMenuItems ?? 0,
    features: {
      ...DEFAULT_FEATURES,
      ...plan.features,
    },
    isActive: plan.isActive,
  };
};

/**
 * Dialog tạo hoặc chỉnh sửa gói dịch vụ.
 */
export const AdminPlanFormDialog = ({
  open,
  plan,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: AdminPlanFormDialogProps) => {
  const initialValues = useMemo(() => getInitialFormValues(plan), [plan]);
  const [formValues, setFormValues] = useState<AdminPlanFormValues>(initialValues);
  const isEditMode = Boolean(plan);

  const updateField = <K extends keyof AdminPlanFormValues>(
    field: K,
    value: AdminPlanFormValues[K]
  ) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  };

  const updateFeature = (feature: keyof AdminPlanFeatureFlags, value: boolean) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      features: {
        ...currentValues.features,
        [feature]: value,
      },
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-admin-gray-200 sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-admin-gray-900">
              {isEditMode ? 'Cập nhật gói dịch vụ' : 'Tạo gói dịch vụ'}
            </DialogTitle>
            <DialogDescription>
              Cấu hình giới hạn và tính năng cho tenant sử dụng SmartF&amp;B.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Tên gói</Label>
              <Input
                id="plan-name"
                value={formValues.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="VD: Pro"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-slug">Slug</Label>
              <Input
                id="plan-slug"
                value={formValues.slug}
                onChange={(event) => updateField('slug', event.target.value)}
                placeholder="VD: pro"
                disabled={isEditMode}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-price">Giá theo tháng</Label>
              <Input
                id="plan-price"
                type="number"
                min={0}
                value={formValues.priceMonthly}
                onChange={(event) => updateField('priceMonthly', Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-branches">Số chi nhánh tối đa</Label>
              <Input
                id="plan-branches"
                type="number"
                min={0}
                value={formValues.maxBranches}
                onChange={(event) => updateField('maxBranches', Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-staff">Số nhân viên tối đa</Label>
              <Input
                id="plan-staff"
                type="number"
                min={0}
                value={formValues.maxStaff}
                onChange={(event) => updateField('maxStaff', Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-menu-items">Số món tối đa</Label>
              <Input
                id="plan-menu-items"
                type="number"
                min={0}
                value={formValues.maxMenuItems}
                onChange={(event) => updateField('maxMenuItems', Number(event.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-admin-gray-900">Tính năng</h3>
              <p className="mt-1 text-sm text-admin-gray-500">
                Bật các module được phép sử dụng trong gói.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {FEATURE_OPTIONS.map((feature) => (
                <label
                  key={feature.key}
                  className="flex items-start justify-between gap-4 rounded-lg border border-admin-gray-200 p-3"
                >
                  <span>
                    <span className="block text-sm font-semibold text-admin-gray-900">
                      {feature.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-admin-gray-500">
                      {feature.description}
                    </span>
                  </span>
                  <Switch
                    checked={formValues.features[feature.key]}
                    onCheckedChange={(checked) => updateFeature(feature.key, checked)}
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between rounded-lg border border-admin-gray-200 p-3">
            <span>
              <span className="block text-sm font-semibold text-admin-gray-900">Đang bán</span>
              <span className="mt-1 block text-xs text-admin-gray-500">
                Gói active sẽ hiển thị cho tenant đăng ký hoặc đổi gói.
              </span>
            </span>
            <Switch
              checked={formValues.isActive}
              onCheckedChange={(checked) => updateField('isActive', checked)}
            />
          </label>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-admin-brand-500 hover:bg-admin-brand-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEditMode ? 'Lưu thay đổi' : 'Tạo gói'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
