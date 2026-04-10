import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { NumericInput } from "@shared/components/common/NumericInput";
import { Label } from "@shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { useEditStaff } from "../hooks/useEditStaff";
import type { StaffDetailFull } from "../data/staffDetailMock";
import type { EditStaffFormData } from "../types/staff.types";

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffDetailFull;
  onSuccess?: () => void;
}

type StaffRole = 'manager' | 'chef' | 'waiter' | 'cashier' | 'staff';
type StaffDepartment = 'Quản lý' | 'Phục vụ' | 'Bếp' | 'Tính tiền' | 'Khác';
type StaffShiftType = 'full-time' | 'part-time';

const ROLES: { value: StaffRole; label: string }[] = [
  { value: 'manager', label: 'Quản lý' },
  { value: 'chef', label: 'Đầu bếp' },
  { value: 'waiter', label: 'Phục vụ' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'staff', label: 'Nhân viên' },
];

const DEPARTMENTS: { value: StaffDepartment; label: string }[] = [
  { value: 'Quản lý', label: 'Quản lý' },
  { value: 'Phục vụ', label: 'Phục vụ' },
  { value: 'Bếp', label: 'Bếp' },
  { value: 'Tính tiền', label: 'Tính tiền' },
  { value: 'Khác', label: 'Khác' },
];

const SHIFT_TYPES: { value: StaffShiftType; label: string }[] = [
  { value: 'full-time', label: 'Toàn thời gian' },
  { value: 'part-time', label: 'Bán thời gian' },
];

/**
 * Dialog chỉnh sửa thông tin nhân viên
 * Đáp ứng PB08 AC3: Chỉnh sửa nhân viên
 */
export const EditStaffDialog = ({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: EditStaffDialogProps) => {
  const { mutate: updateStaff, isPending } = useEditStaff();
  
  const [formData, setFormData] = useState<EditStaffFormData>({
    firstName: staff.firstName,
    lastName: staff.lastName,
    email: staff.email,
    phone: staff.phone,
    identityId: staff.identityId,
    dateOfBirth: staff.dateOfBirth,
    address: staff.address,
    city: staff.city,
    role: staff.role,
    department: staff.department,
    salary: staff.salary,
    shiftType: staff.shiftType,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'Họ là bắt buộc';
    if (!formData.lastName.trim()) newErrors.lastName = 'Tên là bắt buộc';
    if (!formData.phone.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^(0[1-9][0-9]{8})$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có 10 số';
    }
    if (!formData.identityId.trim()) newErrors.identityId = 'CMND/CCCD là bắt buộc';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof EditStaffFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    updateStaff(
      { id: staff.id, data: formData },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Chỉnh sửa thông tin nhân viên
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Họ Tên */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                Họ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="mt-1"
              />
              {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                Tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="mt-1"
              />
              {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="mt-1"
              />
              {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Identity & DOB */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="identityId" className="text-sm font-medium text-gray-700">
                CMND/CCCD <span className="text-red-500">*</span>
              </Label>
              <Input
                id="identityId"
                value={formData.identityId}
                onChange={(e) => handleChange('identityId', e.target.value)}
                className="mt-1"
              />
              {errors.identityId && <p className="text-red-600 text-xs mt-1">{errors.identityId}</p>}
            </div>
            <div>
              <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                Ngày sinh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className="mt-1"
              />
              {errors.dateOfBirth && <p className="text-red-600 text-xs mt-1">{errors.dateOfBirth}</p>}
            </div>
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Địa chỉ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                Thành phố <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                Vị trí <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value as StaffRole)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                Phòng ban <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleChange('department', value as StaffDepartment)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary & ShiftType */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salary" className="text-sm font-medium text-gray-700">
                Lương (VND)
              </Label>
              <NumericInput
                id="salary"
                value={formData.salary}
                onValueChange={(value) => handleChange('salary', value)}
                hideZeroValue
                min={0}
                step={1000}
                placeholder="Ví dụ: 8000000"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="shiftType" className="text-sm font-medium text-gray-700">
                Loại ca làm
              </Label>
              <Select
                value={formData.shiftType}
                onValueChange={(value) => handleChange('shiftType', value as StaffShiftType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map(shift => (
                    <SelectItem key={shift.value} value={shift.value}>
                      {shift.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            Huỷ
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 sm:flex-none"
          >
            {isPending ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
