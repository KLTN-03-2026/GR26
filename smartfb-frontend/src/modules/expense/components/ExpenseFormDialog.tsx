import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Textarea } from '@shared/components/ui/textarea';
import type {
  ExpenseEditablePaymentMethod,
  ExpenseFormValues,
  ExpenseItem,
  ExpenseRequest,
} from '../types/expense.types';

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialExpense?: ExpenseItem | null;
  branchName: string | null;
  isPending: boolean;
  onSubmit: (payload: ExpenseRequest) => void;
}

type ExpenseFormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

const DEFAULT_FORM_VALUES: ExpenseFormValues = {
  amount: '',
  categoryName: '',
  description: '',
  expenseDate: '',
  paymentMethod: 'CASH',
};

const PAYMENT_METHOD_OPTIONS: Array<{ value: ExpenseEditablePaymentMethod; label: string }> = [
  { value: 'CASH', label: 'Tiền mặt' },
  { value: 'TRANSFER', label: 'Chuyển khoản' },
];

const padDatePart = (value: number): string => String(value).padStart(2, '0');

const getCurrentDateTimeLocalValue = (): string => {
  const now = new Date();

  return `${now.getFullYear()}-${padDatePart(now.getMonth() + 1)}-${padDatePart(now.getDate())}T${padDatePart(now.getHours())}:${padDatePart(now.getMinutes())}`;
};

const toDateTimeLocalValue = (isoDate?: string | null): string => {
  if (!isoDate) {
    return '';
  }

  const date = new Date(isoDate);

  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
};

const normalizeEditablePaymentMethod = (
  paymentMethod: ExpenseItem['paymentMethod']
): ExpenseEditablePaymentMethod => {
  return paymentMethod === 'CASH' ? 'CASH' : 'TRANSFER';
};

const buildFormValues = (expense?: ExpenseItem | null): ExpenseFormValues => {
  if (!expense) {
    return {
      ...DEFAULT_FORM_VALUES,
      expenseDate: getCurrentDateTimeLocalValue(),
    };
  }

  return {
    amount: String(expense.amount),
    categoryName: expense.categoryName,
    description: expense.description ?? '',
    expenseDate: toDateTimeLocalValue(expense.expenseDate),
    paymentMethod: normalizeEditablePaymentMethod(expense.paymentMethod),
  };
};

const validateExpenseForm = (values: ExpenseFormValues): ExpenseFormErrors => {
  const nextErrors: ExpenseFormErrors = {};
  const amountValue = Number(values.amount);

  if (!values.amount.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
    nextErrors.amount = 'Số tiền phải lớn hơn 0';
  }

  if (!values.categoryName.trim()) {
    nextErrors.categoryName = 'Danh mục chi là bắt buộc';
  } else if (values.categoryName.trim().length > 100) {
    nextErrors.categoryName = 'Danh mục chi không vượt quá 100 ký tự';
  }

  if (values.description.trim().length > 500) {
    nextErrors.description = 'Ghi chú không vượt quá 500 ký tự';
  }

  return nextErrors;
};

/**
 * Dialog tạo hoặc sửa phiếu chi.
 */
export const ExpenseFormDialog = ({
  open,
  onOpenChange,
  initialExpense,
  branchName,
  isPending,
  onSubmit,
}: ExpenseFormDialogProps) => {
  const formKey = `${initialExpense?.id ?? 'create'}-${open ? 'open' : 'closed'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ExpenseFormDialogBody
        key={formKey}
        initialExpense={initialExpense}
        branchName={branchName}
        isPending={isPending}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
};

interface ExpenseFormDialogBodyProps {
  initialExpense?: ExpenseItem | null;
  branchName: string | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: ExpenseRequest) => void;
}

const ExpenseFormDialogBody = ({
  initialExpense,
  branchName,
  isPending,
  onOpenChange,
  onSubmit,
}: ExpenseFormDialogBodyProps) => {
  const [formValues, setFormValues] = useState<ExpenseFormValues>(() => buildFormValues(initialExpense));
  const [formErrors, setFormErrors] = useState<ExpenseFormErrors>({});

  const updateField = <K extends keyof ExpenseFormValues>(field: K, value: ExpenseFormValues[K]) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateExpenseForm(formValues);

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    const resolvedExpenseDate = initialExpense
      ? new Date(formValues.expenseDate).toISOString()
      : new Date().toISOString();

    // Thời gian chi được FE tự chốt ngầm khi tạo mới để giảm thao tác nhập liệu.
    onSubmit({
      amount: Number(formValues.amount),
      categoryName: formValues.categoryName.trim(),
      description: formValues.description.trim() ? formValues.description.trim() : null,
      expenseDate: resolvedExpenseDate,
      paymentMethod: formValues.paymentMethod,
    });
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{initialExpense ? 'Cập nhật phiếu chi' : 'Tạo phiếu chi mới'}</DialogTitle>
        <DialogDescription>
          {branchName
            ? initialExpense
              ? `Phiếu chi của chi nhánh ${branchName} sẽ giữ nguyên thời điểm ghi nhận hiện tại.`
              : `Phiếu chi sẽ được ghi nhận cho chi nhánh ${branchName} theo thời điểm tạo trên hệ thống.`
            : 'Cần có branch context hợp lệ trước khi lưu phiếu chi.'}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="expense-amount">
            Số tiền <span className="text-red-500">*</span>
          </Label>
          <Input
            id="expense-amount"
            type="number"
            min="0"
            step="1000"
            value={formValues.amount}
            onChange={(event) => updateField('amount', event.target.value)}
            placeholder="Ví dụ: 250000"
            disabled={isPending}
          />
          {formErrors.amount ? <p className="text-xs text-red-500">{formErrors.amount}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="expense-category">
            Danh mục chi <span className="text-red-500">*</span>
          </Label>
          <Input
            id="expense-category"
            value={formValues.categoryName}
            onChange={(event) => updateField('categoryName', event.target.value)}
            placeholder="Ví dụ: Mua nguyên liệu"
            disabled={isPending}
          />
          {formErrors.categoryName ? <p className="text-xs text-red-500">{formErrors.categoryName}</p> : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="expense-payment-method">Phương thức chi</Label>
          <Select
            value={formValues.paymentMethod}
            onValueChange={(value) => updateField('paymentMethod', value as ExpenseEditablePaymentMethod)}
            disabled={isPending}
          >
            <SelectTrigger id="expense-payment-method">
              <SelectValue placeholder="Chọn phương thức chi" />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="expense-description">Ghi chú</Label>
          <Textarea
            id="expense-description"
            value={formValues.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="Nhập mô tả chi tiết nếu cần"
            rows={4}
            disabled={isPending}
          />
          {formErrors.description ? <p className="text-xs text-red-500">{formErrors.description}</p> : null}
        </div>
      </div>

      <DialogFooter className="border-t pt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? 'Đang lưu...' : initialExpense ? 'Lưu thay đổi' : 'Tạo phiếu chi'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
