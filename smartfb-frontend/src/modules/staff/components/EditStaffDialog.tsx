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
} from "@shared/components/ui/select";
import { useEditStaff } from "../hooks/useEditStaff";
import type { StaffDetailFull } from "../data/staffDetailMock";
import type { EditStaffFormData, StaffStatus, StaffShiftType } from "../types/staff.types";
import { positionService } from "../services/positionService";
import { useQuery } from "@tanstack/react-query";

interface EditStaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffDetailFull;
  onSuccess?: () => void;
}

const SHIFT_TYPES: { value: StaffShiftType; label: string }[] = [
  { value: 'full-time', label: 'Toàn thời gian' },
  { value: 'part-time', label: 'Bán thời gian' },
];

const STATUSES: { value: StaffStatus; label: string }[] = [
  { value: 'active', label: 'Đang làm' },
  { value: 'inactive', label: 'Đã nghỉ' },
];

/**
 * Dialog chỉnh sửa thông tin nhân viên
 * Đã cập nhật theo Module 4 Spec (fullName, positionId, status)
 */
export const EditStaffDialog = ({
  open,
  onOpenChange,
  staff,
  onSuccess,
}: EditStaffDialogProps) => {
  const { mutate: updateStaff, isPending } = useEditStaff();
  
  // Lấy danh sách chức vụ từ service
  const { data: posResponse } = useQuery({
    queryKey: ['staff', 'positions'],
    queryFn: () => positionService.getList(),
  });
  const positions = posResponse?.data || [];
  
  const [formData, setFormData] = useState<EditStaffFormData>({
    fullName: staff.fullName,
    email: staff.email,
    phone: staff.phone,
    identityId: staff.identityId,
    dateOfBirth: staff.dateOfBirth,
    address: staff.address,
    city: staff.city,
    positionId: staff.positionId,
    salary: staff.salary,
    shiftType: staff.shiftType,
    status: staff.status,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
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
          <div>
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              className="mt-1"
              placeholder="VD: Nguyễn Văn A"
            />
            {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
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

          {/* Position & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="position" className="text-sm font-medium text-gray-700">
                Chức vụ <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.positionId}
                onValueChange={(value) => handleChange('positionId', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn chức vụ" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map(pos => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                Trạng thái <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleChange('status', value as StaffStatus)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
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
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => handleChange('salary', parseInt(e.target.value) || 0)}
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