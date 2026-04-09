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
import { Label } from "@shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { useEditStaff } from "../hooks/useEditStaff";
import type { StaffDetail, UpdateStaffRequest, StaffGender } from "../types/staff.types";

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffDetail;
  onSuccess?: () => void;
}

export const EditStaffDialog = ({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: EditStaffDialogProps) => {
  const { mutate: updateStaff, isPending } = useEditStaff();
  
  const [formData, setFormData] = useState<UpdateStaffRequest>({
    fullName: staff.fullName,
    phone: staff.phone,
    email: staff.email,
    employeeCode: staff.employeeCode,
    hireDate: staff.hireDate,
    dateOfBirth: staff.dateOfBirth,
    gender: staff.gender,
    address: staff.address,
    positionId: staff.positionId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName?.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
    if (!formData.phone?.trim()) newErrors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^(0[1-9][0-9]{8,9})$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại phải có 9-11 số';
    }
    if (!formData.employeeCode?.trim()) newErrors.employeeCode = 'Mã nhân viên là bắt buộc';
    if (!formData.hireDate) newErrors.hireDate = 'Ngày vào làm là bắt buộc';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof UpdateStaffRequest, value: string) => {
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
          <div>
            <Label htmlFor="fullName">Họ tên <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              value={formData.fullName || ''}
              onChange={(e) => handleChange('fullName', e.target.value)}
            />
            {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
            {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="employeeCode">Mã nhân viên <span className="text-red-500">*</span></Label>
            <Input
              id="employeeCode"
              value={formData.employeeCode || ''}
              onChange={(e) => handleChange('employeeCode', e.target.value)}
            />
            {errors.employeeCode && <p className="text-red-600 text-xs mt-1">{errors.employeeCode}</p>}
          </div>

          <div>
            <Label htmlFor="hireDate">Ngày vào làm <span className="text-red-500">*</span></Label>
            <Input
              id="hireDate"
              type="date"
              value={formData.hireDate || ''}
              onChange={(e) => handleChange('hireDate', e.target.value)}
            />
            {errors.hireDate && <p className="text-red-600 text-xs mt-1">{errors.hireDate}</p>}
          </div>

          <div>
            <Label htmlFor="dateOfBirth">Ngày sinh</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth || ''}
              onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="gender">Giới tính</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => handleChange('gender', value as StaffGender)}
            >
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

          <div>
            <Label htmlFor="address">Địa chỉ</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
            />
          </div>

          <div>
            <Label htmlFor="positionId">Chức vụ (ID)</Label>
            <Input
              id="positionId"
              value={formData.positionId || ''}
              onChange={(e) => handleChange('positionId', e.target.value)}
              placeholder="UUID của chức vụ"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Đang cập nhật...' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};