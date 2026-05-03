import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import type { Supplier, CreateSupplierPayload } from '../types/supplier.types';

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier;
  onSubmit: (payload: CreateSupplierPayload) => Promise<void>;
  isLoading?: boolean;
}

const createInitialValues = (supplier?: Supplier): CreateSupplierPayload => ({
  name: supplier?.name ?? '',
  tax_code: supplier?.taxCode ?? '',
  address: supplier?.address ?? '',
  phone: supplier?.phone ?? '',
  email: supplier?.email ?? '',
  contact_person: supplier?.contactPerson ?? '',
  bank_account: supplier?.bankAccount ?? '',
  bank_name: supplier?.bankName ?? '',
});

export const SupplierFormDialog = ({
  open,
  onOpenChange,
  supplier,
  onSubmit,
  isLoading = false,
}: SupplierFormDialogProps) => {
  const [values, setValues] = useState<CreateSupplierPayload>(() => createInitialValues(supplier));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setValues(createInitialValues(supplier));
      setErrors({});
    }

    onOpenChange(nextOpen);
  };

  const handleChange = (field: keyof CreateSupplierPayload, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!values.name.trim()) newErrors.name = 'Tên nhà cung cấp là bắt buộc';
    if (!values.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    if (!values.tax_code.trim()) newErrors.tax_code = 'Mã số thuế là bắt buộc';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{supplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="name">Tên nhà cung cấp <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="VD: Công ty TNHH SmartF&B"
              />
              {errors.name && <p className="text-red-600 text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_code">Mã số thuế <span className="text-red-500">*</span></Label>
              <Input
                id="tax_code"
                value={values.tax_code}
                onChange={(e) => handleChange('tax_code', e.target.value)}
                placeholder="0123456789"
              />
              {errors.tax_code && <p className="text-red-600 text-xs">{errors.tax_code}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="0912345678"
              />
              {errors.phone && <p className="text-red-600 text-xs">{errors.phone}</p>}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={values.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Số nhà, tên đường, quận/huyện..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="ncc@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Người liên hệ</Label>
              <Input
                id="contact_person"
                value={values.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                placeholder="Họ và tên người đại diện"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">Ngân hàng</Label>
              <Input
                id="bank_name"
                value={values.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="VD: Vietcombank"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account">Số tài khoản</Label>
              <Input
                id="bank_account"
                value={values.bank_account}
                onChange={(e) => handleChange('bank_account', e.target.value)}
                placeholder="1234567890"
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
              {isLoading ? 'Đang xử lý...' : supplier ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
