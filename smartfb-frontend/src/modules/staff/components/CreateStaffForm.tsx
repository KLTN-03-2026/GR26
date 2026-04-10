import type { StaffRole, StaffStatus } from '@modules/staff/types/staff.types';
import { ArrowLeft } from 'lucide-react';
import { STAFF_ROLE_OPTIONS, useCreateStaffForm } from '@modules/staff/hooks/useCreateStaffForm';
import { NumericInput } from '@shared/components/common/NumericInput';
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

const FormError = ({ message }: { message?: string }) => {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
};

/**
 * Form tạo nhân viên mới.
 */
export const CreateStaffForm = () => {
  const {
    branchOptions,
    formErrors,
    isPending,
    statusOptions,
    values,
    onBack,
    onChange,
    onSubmit,
  } = useCreateStaffForm();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Thêm nhân viên mới</h1>
            <p className="text-sm text-gray-500">Điền thông tin để tạo tài khoản nhân viên</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">
              Họ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={values.firstName}
              onChange={(event) => onChange('firstName', event.target.value)}
            />
            <FormError message={formErrors.firstName} />
          </div>

          <div>
            <Label htmlFor="lastName">
              Tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={values.lastName}
              onChange={(event) => onChange('lastName', event.target.value)}
            />
            <FormError message={formErrors.lastName} />
          </div>

          <div>
            <Label htmlFor="phone">
              Số điện thoại <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={values.phone}
              onChange={(event) => onChange('phone', event.target.value)}
              placeholder="0912345678"
            />
            <FormError message={formErrors.phone} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(event) => onChange('email', event.target.value)}
              placeholder="nhanvien@example.com"
            />
            <FormError message={formErrors.email} />
          </div>

          <div>
            <Label htmlFor="identityId">
              CMND/CCCD <span className="text-red-500">*</span>
            </Label>
            <Input
              id="identityId"
              value={values.identityId}
              onChange={(event) => onChange('identityId', event.target.value)}
              placeholder="123456789012"
            />
            <FormError message={formErrors.identityId} />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">
              Ngày sinh <span className="text-red-500">*</span>
            </Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={values.dateOfBirth}
              onChange={(event) => onChange('dateOfBirth', event.target.value)}
            />
            <FormError message={formErrors.dateOfBirth} />
          </div>

          <div>
            <Label htmlFor="address">
              Địa chỉ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              value={values.address}
              onChange={(event) => onChange('address', event.target.value)}
              placeholder="Số nhà, đường"
            />
            <FormError message={formErrors.address} />
          </div>

          <div>
            <Label htmlFor="city">
              Thành phố <span className="text-red-500">*</span>
            </Label>
            <Input
              id="city"
              value={values.city}
              onChange={(event) => onChange('city', event.target.value)}
              placeholder="TP. Hồ Chí Minh"
            />
            <FormError message={formErrors.city} />
          </div>

          <div>
            <Label htmlFor="role">
              Vị trí <span className="text-red-500">*</span>
            </Label>
            <Select
              value={values.role}
              onValueChange={(value) => onChange('role', value as StaffRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vị trí" />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError message={formErrors.role} />
          </div>

          <div>
            <Label htmlFor="branchId">
              Chi nhánh <span className="text-red-500">*</span>
            </Label>
            <Select value={values.branchId} onValueChange={(value) => onChange('branchId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.value} value={branch.value}>
                    {branch.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormError message={formErrors.branchId} />
          </div>

          <div>
            <Label htmlFor="pinPos">
              PIN POS <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pinPos"
              type="password"
              value={values.pinPos}
              onChange={(event) => onChange('pinPos', event.target.value)}
              placeholder="1234"
              maxLength={6}
            />
            <FormError message={formErrors.pinPos} />
          </div>

          <div>
            <Label htmlFor="salary">Lương (VNĐ)</Label>
            <NumericInput
              id="salary"
              value={values.salary}
              onValueChange={(value) => onChange('salary', value)}
              hideZeroValue
              min={0}
              step={1000}
              placeholder="Ví dụ: 8000000"
            />
            <FormError message={formErrors.salary} />
          </div>

          <div>
            <Label htmlFor="hireDate">
              Ngày vào làm <span className="text-red-500">*</span>
            </Label>
            <Input
              id="hireDate"
              type="date"
              value={values.hireDate}
              onChange={(event) => onChange('hireDate', event.target.value)}
            />
            <FormError message={formErrors.hireDate} />
          </div>

          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <Select
              value={values.status}
              onValueChange={(value) => onChange('status', value as StaffStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? 'Đang lưu...' : 'Tạo nhân viên'}
          </Button>
        </div>
      </div>
    </div>
  );
};
