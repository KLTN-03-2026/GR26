import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockBranchDetails } from '@modules/branch/data/branchDetails';
import { mockStaffList } from '@modules/staff/data/staffList';
import { useCreateStaff } from '@modules/staff/hooks/useCreateStaff';
import type {
  CreateStaffFormData,
  StaffDepartment,
  StaffRole,
  StaffStatus,
} from '@modules/staff/types/staff.types';
import { ROUTES } from '@shared/constants/routes';
import { useToast } from '@shared/hooks/useToast';

export interface CreateStaffFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  identityId: string;
  dateOfBirth: string;
  address: string;
  city: string;
  role: StaffRole;
  branchId: string;
  pinPos: string;
  status: StaffStatus;
  salary: number;
  hireDate: string;
}

type CreateStaffFormErrors = Partial<Record<keyof CreateStaffFormValues, string>>;

export const STAFF_ROLE_OPTIONS: Array<{ value: StaffRole; label: string }> = [
  { value: 'manager', label: 'Quản lý' },
  { value: 'chef', label: 'Đầu bếp' },
  { value: 'waiter', label: 'Phục vụ' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'staff', label: 'Nhân viên' },
];

const getDepartmentFromRole = (role: StaffRole): StaffDepartment => {
  const departmentMap: Record<StaffRole, StaffDepartment> = {
    manager: 'Quản lý',
    chef: 'Bếp',
    waiter: 'Phục vụ',
    cashier: 'Tính tiền',
    staff: 'Khác',
  };

  return departmentMap[role];
};

const getDefaultValues = (): CreateStaffFormValues => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  identityId: '',
  dateOfBirth: '',
  address: '',
  city: '',
  role: 'staff',
  branchId: mockBranchDetails[0]?.id ?? '',
  pinPos: '',
  status: 'active',
  salary: 0,
  hireDate: new Date().toISOString().split('T')[0] ?? '',
});

/**
 * Hook quản lý form tạo nhân viên.
 * Validate, map payload và submit được gom về module staff thay vì để page trực tiếp xử lý.
 */
export const useCreateStaffForm = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { mutate: createStaff, isPending } = useCreateStaff();

  const [values, setValues] = useState<CreateStaffFormValues>(getDefaultValues);
  const [formErrors, setFormErrors] = useState<CreateStaffFormErrors>({});

  const handleChange = <TField extends keyof CreateStaffFormValues>(
    field: TField,
    value: CreateStaffFormValues[TField]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const nextErrors: CreateStaffFormErrors = {};

    if (!values.firstName.trim()) nextErrors.firstName = 'Họ là bắt buộc';
    if (!values.lastName.trim()) nextErrors.lastName = 'Tên là bắt buộc';

    if (!values.phone.trim()) {
      nextErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[1-9][0-9]{8})$/.test(values.phone)) {
      nextErrors.phone = 'Số điện thoại phải có 10 số và bắt đầu bằng 0';
    }

    if (!values.identityId.trim()) nextErrors.identityId = 'CMND/CCCD là bắt buộc';
    if (!values.dateOfBirth) nextErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    if (!values.address.trim()) nextErrors.address = 'Địa chỉ là bắt buộc';
    if (!values.city.trim()) nextErrors.city = 'Thành phố là bắt buộc';
    if (!values.branchId) nextErrors.branchId = 'Chi nhánh là bắt buộc';
    if (!values.pinPos.trim()) nextErrors.pinPos = 'PIN POS là bắt buộc';
    if (!values.hireDate) nextErrors.hireDate = 'Ngày vào làm là bắt buộc';

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): CreateStaffFormData | null => {
    const branch = mockBranchDetails.find((item) => item.id === values.branchId);

    if (!branch) {
      setFormErrors((prev) => ({ ...prev, branchId: 'Chi nhánh không hợp lệ' }));
      return null;
    }

    return {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email || '',
      phone: values.phone,
      identityId: values.identityId,
      dateOfBirth: values.dateOfBirth,
      address: values.address,
      city: values.city,
      branchId: values.branchId,
      branchName: branch.name,
      role: values.role,
      department: getDepartmentFromRole(values.role),
      shiftType: 'full-time',
      salary: values.salary,
      hireDate: values.hireDate,
      pinPos: values.pinPos,
      status: values.status,
    };
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const duplicatePhone = mockStaffList.some((staff) => staff.phone === values.phone);

    if (duplicatePhone) {
      setFormErrors((prev) => ({ ...prev, phone: 'Số điện thoại đã tồn tại' }));
      return;
    }

    const createPayload = buildPayload();

    if (!createPayload) {
      return;
    }

    createStaff(createPayload, {
      onSuccess: () => {
        success(
          'Thêm nhân viên thành công',
          `Nhân viên ${values.firstName} ${values.lastName} đã được thêm.`
        );
        navigate(ROUTES.OWNER.STAFF);
      },
      onError: (err) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Không thể xử lý thông tin nhân viên, vui lòng thử lại sau';
        error('Có lỗi xảy ra', message);
      },
    });
  };

  return {
    branchOptions: mockBranchDetails.map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
    formErrors,
    isPending,
    statusOptions: [
      { value: 'active' as const, label: 'Đang làm' },
      { value: 'inactive' as const, label: 'Đã nghỉ' },
    ],
    values,
    onBack: () => {
      navigate(ROUTES.OWNER.STAFF);
    },
    onChange: handleChange,
    onSubmit: handleSubmit,
  };
};
