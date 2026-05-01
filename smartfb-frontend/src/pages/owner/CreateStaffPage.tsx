import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@shared/components/ui/select';
import { useToast } from '@shared/hooks/useToast';
import { useCreateStaff } from '@modules/staff/hooks/useCreateStaff';
import { mockBranchDetails } from '@modules/branch/data/branchDetails';
import { ROUTES } from '@shared/constants/routes';
import type { CreateStaffFormData, StaffStatus, StaffShiftType } from '@modules/staff/types/staff.types';
import { positionService } from '@modules/staff/services/positionService';
import { useQuery } from '@tanstack/react-query';

type FormValues = {
  fullName: string;
  phone: string;
  email: string;
  identityId: string;
  dateOfBirth: string;
  address: string;
  city: string;
  positionId: string;
  branchId: string;
  posPin: string;
  status: StaffStatus;
  salary: number;
  hireDate: string;
};

/**
 * Trang tạo nhân viên mới
 * Đã cập nhật theo Module 4 Spec (fullName, positionId, posPin)
 */
export default function CreateStaffPage() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { mutate: createStaff, isPending } = useCreateStaff();

  // Lấy danh sách chức vụ
  const { data: posResponse } = useQuery({
    queryKey: ['staff', 'positions'],
    queryFn: () => positionService.getList(),
  });
  const positions = posResponse?.data || [];

  const [values, setValues] = useState<FormValues>({
    fullName: '',
    phone: '',
    email: '',
    identityId: '',
    dateOfBirth: '',
    address: '',
    city: '',
    positionId: '',
    branchId: mockBranchDetails?.[0]?.id ?? '',
    posPin: '',
    status: 'active',
    salary: 0,
    hireDate: new Date().toISOString().split('T')[0],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof FormValues, value: string | number) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!values.fullName.trim()) errors.fullName = 'Họ và tên là bắt buộc';
    if (!values.phone.trim()) errors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^(0[1-9][0-9]{8})$/.test(values.phone)) {
      errors.phone = 'Số điện thoại phải có 10 số và bắt đầu bằng 0';
    }
    if (!values.identityId.trim()) errors.identityId = 'CMND/CCCD là bắt buộc';
    if (!values.dateOfBirth) errors.dateOfBirth = 'Ngày sinh là bắt buộc';
    if (!values.address.trim()) errors.address = 'Địa chỉ là bắt buộc';
    if (!values.city.trim()) errors.city = 'Thành phố là bắt buộc';
    if (!values.branchId) errors.branchId = 'Chi nhánh là bắt buộc';
    if (!values.positionId) errors.positionId = 'Chức vụ là bắt buộc';
    if (!values.posPin.trim()) errors.posPin = 'PIN POS là bắt buộc';
    if (!values.hireDate) errors.hireDate = 'Ngày vào làm là bắt buộc';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const branch = mockBranchDetails.find(b => b.id === values.branchId);
    
    const createPayload: CreateStaffFormData = {
      fullName: values.fullName,
      email: values.email || '',
      phone: values.phone,
      identityId: values.identityId,
      dateOfBirth: values.dateOfBirth,
      address: values.address,
      city: values.city,
      branchId: values.branchId,
      positionId: values.positionId,
      shiftType: 'full-time' as StaffShiftType, // Default
      salary: values.salary,
      hireDate: values.hireDate,
      posPin: values.posPin,
      status: values.status,
    };

    createStaff(createPayload, {
      onSuccess: () => {
        success('Thêm nhân viên thành công', `Nhân viên ${values.fullName} đã được thêm.`);
        navigate(ROUTES.OWNER.STAFF);
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Không thể xử lý thông tin nhân viên, vui lòng thử lại sau';
        error('Có lỗi xảy ra', message);
      },
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.OWNER.STAFF)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Thêm nhân viên mới</h1>
            <p className="text-sm text-gray-500">Điền thông tin để tạo tài khoản nhân viên</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="space-y-4">
          {/* Họ Tên */}
          <div>
            <Label htmlFor="fullName">Họ và tên <span className="text-red-500">*</span></Label>
            <Input
              id="fullName"
              value={values.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="VD: Nguyễn Văn A"
            />
            {formErrors.fullName && <p className="text-red-600 text-xs mt-1">{formErrors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Số điện thoại <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                value={values.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
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
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="nhanvien@example.com"
              />
              {formErrors.email && <p className="text-red-600 text-xs mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <Label htmlFor="identityId">CMND/CCCD <span className="text-red-500">*</span></Label>
              <Input
                id="identityId"
                value={values.identityId}
                onChange={(e) => handleChange('identityId', e.target.value)}
                placeholder="123456789012"
              />
              {formErrors.identityId && <p className="text-red-600 text-xs mt-1">{formErrors.identityId}</p>}
            </div>

            <div>
              <Label htmlFor="dateOfBirth">Ngày sinh <span className="text-red-500">*</span></Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={values.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
              {formErrors.dateOfBirth && <p className="text-red-600 text-xs mt-1">{formErrors.dateOfBirth}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="address">Địa chỉ <span className="text-red-500">*</span></Label>
              <Input
                id="address"
                value={values.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Số nhà, đường"
              />
              {formErrors.address && <p className="text-red-600 text-xs mt-1">{formErrors.address}</p>}
            </div>

            <div>
              <Label htmlFor="city">Thành phố <span className="text-red-500">*</span></Label>
              <Input
                id="city"
                value={values.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="TP. Hồ Chí Minh"
              />
              {formErrors.city && <p className="text-red-600 text-xs mt-1">{formErrors.city}</p>}
            </div>

            <div>
              <Label htmlFor="position">Chức vụ <span className="text-red-500">*</span></Label>
              <Select value={values.positionId} onValueChange={(val) => handleChange('positionId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chức vụ" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.positionId && <p className="text-red-600 text-xs mt-1">{formErrors.positionId}</p>}
            </div>

            <div>
              <Label htmlFor="branchId">Chi nhánh <span className="text-red-500">*</span></Label>
              <Select value={values.branchId} onValueChange={(val) => handleChange('branchId', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {mockBranchDetails.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.branchId && <p className="text-red-600 text-xs mt-1">{formErrors.branchId}</p>}
            </div>

            <div>
              <Label htmlFor="posPin">PIN POS <span className="text-red-500">*</span></Label>
              <Input
                id="posPin"
                type="password"
                value={values.posPin}
                onChange={(e) => handleChange('posPin', e.target.value)}
                placeholder="1234"
                maxLength={6}
              />
              {formErrors.posPin && <p className="text-red-600 text-xs mt-1">{formErrors.posPin}</p>}
            </div>

            <div>
              <Label htmlFor="salary">Lương (VNĐ)</Label>
              <Input
                id="salary"
                type="number"
                value={values.salary}
                onChange={(e) => handleChange('salary', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              {formErrors.salary && <p className="text-red-600 text-xs mt-1">{formErrors.salary}</p>}
            </div>

            <div>
              <Label htmlFor="hireDate">Ngày vào làm <span className="text-red-500">*</span></Label>
              <Input
                id="hireDate"
                type="date"
                value={values.hireDate}
                onChange={(e) => handleChange('hireDate', e.target.value)}
              />
              {formErrors.hireDate && <p className="text-red-600 text-xs mt-1">{formErrors.hireDate}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={() => navigate(ROUTES.OWNER.STAFF)} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Đang lưu...' : 'Tạo nhân viên'}
          </Button>
        </div>
      </div>
    </div>
  );
}