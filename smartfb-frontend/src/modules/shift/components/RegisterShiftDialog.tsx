import { useMemo, useState } from 'react';
import { DatePicker } from '@shared/components/common/DatePicker';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import type { StaffSummary } from '@modules/staff/types/staff.types';
import type { RegisterShiftPayload, ShiftTemplate } from '@modules/shift/types/shift.types';

interface RegisterShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ShiftTemplate[];
  staffList: StaffSummary[];
  defaultDate: string;
  defaultShiftTemplateId?: string;
  isPending: boolean;
  onSubmit: (payload: RegisterShiftPayload) => Promise<unknown>;
}

const EMPTY_FORM: RegisterShiftPayload = {
  userId: '',
  shiftTemplateId: '',
  date: '',
};

/**
 * Dialog owner/branch manager dùng để gán nhân viên vào một ca mẫu cụ thể.
 */
export const RegisterShiftDialog = ({
  open,
  onOpenChange,
  templates,
  staffList,
  defaultDate,
  defaultShiftTemplateId,
  isPending,
  onSubmit,
}: RegisterShiftDialogProps) => {
  const [values, setValues] = useState<RegisterShiftPayload>({
    ...EMPTY_FORM,
    date: defaultDate,
    shiftTemplateId: defaultShiftTemplateId ?? '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const activeTemplates = useMemo(
    () => templates.filter((template) => template.active),
    [templates],
  );

  const activeStaffList = useMemo(
    () => staffList.filter((staff) => staff.status === 'ACTIVE'),
    [staffList],
  );

  const canSubmit = Boolean(values.userId && values.shiftTemplateId && values.date);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setValues({ ...EMPTY_FORM, date: defaultDate, shiftTemplateId: defaultShiftTemplateId ?? '' });
      setFormError(null);
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setFormError('Vui lòng chọn nhân viên, ca mẫu và ngày làm việc.');
      return;
    }

    await onSubmit(values);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gán ca làm cho nhân viên</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nhân viên</Label>
            <Select
              value={values.userId}
              onValueChange={(userId) => setValues((prev) => ({ ...prev, userId }))}
              disabled={isPending || activeStaffList.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhân viên" />
              </SelectTrigger>
              <SelectContent>
                {activeStaffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.fullName} · {staff.employeeCode || staff.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ca mẫu</Label>
            <Select
              value={values.shiftTemplateId}
              onValueChange={(shiftTemplateId) => setValues((prev) => ({ ...prev, shiftTemplateId }))}
              disabled={isPending || activeTemplates.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn ca mẫu" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-shift-date">Ngày làm việc</Label>
            <DatePicker
              id="register-shift-date"
              value={values.date}
              onChange={(date) => setValues((prev) => ({ ...prev, date }))}
              disabled={isPending}
              className="w-full"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}
          {activeTemplates.length === 0 && (
            <p className="text-sm text-warning-text">Chưa có ca mẫu đang hoạt động để gán lịch.</p>
          )}
          {activeStaffList.length === 0 && (
            <p className="text-sm text-warning-text">Chưa có nhân viên đang hoạt động để gán ca.</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending || !canSubmit}>
            {isPending ? 'Đang gán...' : 'Gán ca'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
