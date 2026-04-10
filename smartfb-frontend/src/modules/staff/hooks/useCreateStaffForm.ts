import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateStaff } from '@modules/staff/hooks/useCreateStaff';
import type { CreateStaffRequest, StaffGender } from '@modules/staff/types/staff.types';
import { ROUTES } from '@shared/constants/routes';
import { useToast } from '@shared/hooks/useToast';

export interface CreateStaffFormValues {
  fullName: string;
  phone: string;
  email: string;
  employeeCode: string;
  hireDate: string;
  dateOfBirth: string;
  gender: StaffGender;
  address: string;
  positionId: string;
}

type CreateStaffFormErrors = Partial<Record<keyof CreateStaffFormValues, string>>;

const getDefaultValues = (): CreateStaffFormValues => ({
  fullName: '',
  phone: '',
  email: '',
  employeeCode: '',
  hireDate: new Date().toISOString().split('T')[0],
  dateOfBirth: '',
  gender: 'MALE',
  address: '',
  positionId: '',
});

export const useCreateStaffForm = () => {
  const navigate = useNavigate();
  const { error, success } = useToast();
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

  const validateForm = (): boolean => {
    const nextErrors: CreateStaffFormErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Họ tên là bắt buộc';
    }

    if (!values.phone.trim()) {
      nextErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[1-9][0-9]{8,9})$/.test(values.phone)) {
      nextErrors.phone = 'Số điện thoại phải có 9-11 số và bắt đầu bằng 0';
    }

    if (!values.employeeCode.trim()) {
      nextErrors.employeeCode = 'Mã nhân viên là bắt buộc';
    }

    if (!values.hireDate) {
      nextErrors.hireDate = 'Ngày vào làm là bắt buộc';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

 const buildPayload = (): CreateStaffRequest => {
  const payload: CreateStaffRequest = {
    fullName: values.fullName,
    phone: values.phone,
  };

  if (values.email && values.email.trim()) {
    payload.email = values.email;
  }
  if (values.employeeCode && values.employeeCode.trim()) {
    payload.employeeCode = values.employeeCode;
  }
  if (values.hireDate) {
    payload.hireDate = values.hireDate;
  }
  if (values.dateOfBirth) {
    payload.dateOfBirth = values.dateOfBirth;
  }
  if (values.gender) {
    payload.gender = values.gender;
  }
  if (values.address && values.address.trim()) {
    payload.address = values.address;
  }
  if (values.positionId && values.positionId.trim()) {
    payload.positionId = values.positionId;
  }
  
  return payload;
};

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const payload = buildPayload();

    createStaff(payload, {
      onSuccess: () => {
        success('Thêm nhân viên thành công', `Nhân viên ${values.fullName} đã được thêm.`);
        navigate(ROUTES.OWNER.STAFF);
      },
      onError: (err: any) => {
        const message = err.response?.data?.error?.message || err.message || 'Không thể xử lý thông tin nhân viên, vui lòng thử lại sau';
        error('Có lỗi xảy ra', message);
      },
    });
  };

  return {
    formErrors,
    isPending,
    values,
    onBack: () => {
      navigate(ROUTES.OWNER.STAFF);
    },
    onChange: handleChange,
    onSubmit: handleSubmit,
  };
};