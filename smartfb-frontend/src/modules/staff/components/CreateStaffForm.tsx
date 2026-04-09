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
import { useCreateStaffForm } from '../hooks/useCreateStaffForm';

export const CreateStaffForm = () => {
  const {
    formErrors,
    isPending,
    values,
    onBack,
    onChange,
    onSubmit,
  } = useCreateStaffForm();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Thêm nhân viên mới</h1>
          <p className="text-sm text-gray-500">Điền thông tin để tạo tài khoản nhân viên</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="fullName">Họ tên <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              value={values.fullName}
              onChange={(e) => onChange('fullName', e.target.value)}
              placeholder="Nguyễn Văn A"
            />
            {formErrors.fullName && <p className="text-red-600 text-xs mt-1">{formErrors.fullName}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              value={values.phone}
              onChange={(e) => onChange('phone', e.target.value)}
              placeholder="0912345678"
            />
            {formErrors.phone && <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => onChange('email', e.target.value)}
              placeholder="nhanvien@example.com"
            />
          </div>

          <div>
            <Label htmlFor="employeeCode">Mã nhân viên <span className="text-red-500">*</span></Label>
            <Input
              id="employeeCode"
              value={values.employeeCode}
              onChange={(e) => onChange('employeeCode', e.target.value)}
              placeholder="NV001"
            />
            {formErrors.employeeCode && <p className="text-red-600 text-xs mt-1">{formErrors.employeeCode}</p>}
          </div>

          <div>
            <Label htmlFor="hireDate">Ngày vào làm <span className="text-red-500">*</span></Label>
            <Input
              id="hireDate"
              type="date"
              value={values.hireDate}
              onChange={(e) => onChange('hireDate', e.target.value)}
            />
            {formErrors.hireDate && <p className="text-red-600 text-xs mt-1">{formErrors.hireDate}</p>}
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={values.dateOfBirth}
              onChange={(e) => onChange('dateOfBirth', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="gender">Giới tính</Label>
            <Select value={values.gender} onValueChange={(value) => onChange('gender', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Nam</SelectItem>
                <SelectItem value="FEMALE">Nữ</SelectItem>
                <SelectItem value="OTHER">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={values.address}
              onChange={(e) => onChange('address', e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
            />
          </div>

          <div>
            <Label htmlFor="positionId">Chức vụ</Label>
            <Input
              id="positionId"
              value={values.positionId}
              onChange={(e) => onChange('positionId', e.target.value)}
              placeholder="UUID của chức vụ (nếu có)"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
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