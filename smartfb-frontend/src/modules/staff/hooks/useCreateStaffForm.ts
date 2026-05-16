import { useMemo, useState } from 'react';
import { useAssignUserToBranch } from '@modules/branch/hooks/useAssignUserToBranch';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { useCreateStaff } from '@modules/staff/hooks/useCreateStaff';
import { useAssignStaffRoles } from '@modules/staff/hooks/useAssignStaffRoles';
import { usePositions } from '@modules/staff/hooks/usePositions';
import { useRolesMatrix } from '@modules/staff/hooks/useRolesMatrix';
import { useStaffList } from '@modules/staff/hooks/useStaffList';
import { useVietnamProvinces, useVietnamWards } from '@modules/staff/hooks/useVietnamAddress';
import type { CreateStaffRequest, StaffGender } from '@modules/staff/types/staff.types';
import { buildStaffAddress } from '@modules/staff/utils/staffAddressFormatter';
import { filterAssignableStaffRoles } from '@modules/staff/utils/filterAssignableStaffRoles';
import {
  buildEmployeeCode,
  buildRandomPassword,
} from '@modules/staff/utils/staffCredentialGenerator';
import {
  getStaffMutationErrorField,
  getStaffMutationErrorMessage,
} from '@modules/staff/utils/getStaffMutationErrorMessage';
import { ROUTES } from '@shared/constants/routes';
import { useToast } from '@shared/hooks/useToast';

export interface CreateStaffFormValues {
  branchId: string;
  fullName: string;
  phone: string;
  email: string;
  hireDate: string;
  dateOfBirth: string;
  gender: StaffGender;
  streetAddress: string;
  wardDistrict: string;
  wardCode: string;
  city: string;
  provinceCode: string;
  positionId: string;
  password: string;
  posPin: string;
  roleId: string;
}

type CreateStaffFormErrorField = keyof CreateStaffFormValues | 'employeeCode';
type CreateStaffFormErrors = Partial<Record<CreateStaffFormErrorField, string>>;

// Tuổi tối thiểu theo chính sách tuyển nhân viên vận hành.
const MIN_STAFF_AGE = 18;

const getDefaultValues = (branchId = ''): CreateStaffFormValues => ({
  branchId,
  fullName: '',
  phone: '',
  email: '',
  hireDate: new Date().toISOString().split('T')[0],
  dateOfBirth: '',
  gender: 'MALE',
  streetAddress: '',
  wardDistrict: '',
  wardCode: '',
  city: '',
  provinceCode: '',
  positionId: '',
  password: '',
  posPin: '',
  roleId: '',
});

const resolveDefaultBranchId = (
  currentBranchId: string | null,
  branchIds: string[]
): string => {
  if (currentBranchId && branchIds.includes(currentBranchId)) {
    return currentBranchId;
  }

  if (branchIds.length === 1) {
    return branchIds[0];
  }

  return '';
};

const parseDateOnly = (value: string): Date | null => {
  const [year, month, day] = value.split('-').map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

const isOlderThanMinimumAge = (dateOfBirth: string): boolean => {
  const birthDate = parseDateOnly(dateOfBirth);

  if (!birthDate) {
    return false;
  }

  const today = new Date();
  const minimumBirthDate = new Date(
    today.getFullYear() - MIN_STAFF_AGE,
    today.getMonth(),
    today.getDate()
  );

  return birthDate.getTime() < minimumBirthDate.getTime();
};

/**
 * Hook điều phối toàn bộ form tạo nhân viên.
 * Bao gồm sinh mã nhân viên, validate FE, tạo user, gán vai trò và gán chi nhánh khi submit.
 */
export const useCreateStaffForm = () => {
  const navigate = useNavigate();
  const { error, success } = useToast();
  const { mutateAsync: createStaff, isPending: isCreating } = useCreateStaff();
  const { mutateAsync: assignStaffRoles, isPending: isAssigningRoles } = useAssignStaffRoles();
  const { mutateAsync: assignUserToBranch, isPending: isAssigningBranch } = useAssignUserToBranch();
  const { data: positions = [] } = usePositions();
  const { data: roleMatrixData, isLoading: isRolesLoading } = useRolesMatrix();
  const { data: branches = [] } = useBranches();
  const { data: staffPage } = useStaffList({ page: 0, size: 1 });
  const {
    data: provinces = [],
    isLoading: isProvincesLoading,
    isError: isProvincesError,
  } = useVietnamProvinces();
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const [generatedAt] = useState(() => new Date());

  const [values, setValues] = useState<CreateStaffFormValues>(() => getDefaultValues());
  const [formErrors, setFormErrors] = useState<CreateStaffFormErrors>({});

  const selectedProvinceCode = useMemo(() => {
    const provinceCode = Number(values.provinceCode);
    return Number.isFinite(provinceCode) && provinceCode > 0 ? provinceCode : null;
  }, [values.provinceCode]);

  const {
    data: wards = [],
    isLoading: isWardsLoading,
    isError: isWardsError,
  } = useVietnamWards(selectedProvinceCode);

  const resolvedBranchId = useMemo(() => {
    return values.branchId || resolveDefaultBranchId(
      currentBranchId,
      branches.map((branch) => branch.id)
    );
  }, [branches, currentBranchId, values.branchId]);

  const branchCode = useMemo(() => {
    if (resolvedBranchId) {
      return branches.find((branch) => branch.id === resolvedBranchId)?.code ?? 'CHAIN';
    }

    return branches.length === 1 ? branches[0].code : 'CHAIN';
  }, [branches, resolvedBranchId]);

  const selectedBranchName = useMemo(() => {
    return branches.find((branch) => branch.id === resolvedBranchId)?.name ?? '';
  }, [branches, resolvedBranchId]);

  const formValues = useMemo<CreateStaffFormValues>(() => {
    return {
      ...values,
      branchId: resolvedBranchId,
    };
  }, [resolvedBranchId, values]);

  const selectedPositionName = useMemo(() => {
    return positions.find((position) => position.id === values.positionId)?.name ?? '';
  }, [positions, values.positionId]);

  const assignableRoles = useMemo(() => {
    return filterAssignableStaffRoles(roleMatrixData?.roles ?? []);
  }, [roleMatrixData?.roles]);

  const generatedEmployeeCode = useMemo(() => {
    return buildEmployeeCode({
      branchCode,
      positionName: selectedPositionName,
      sequence: (staffPage?.totalElements ?? 0) + 1,
      generatedAt,
    });
  }, [branchCode, generatedAt, selectedPositionName, staffPage?.totalElements]);

  const handleChange = <TField extends keyof CreateStaffFormValues>(
    field: TField,
    value: CreateStaffFormValues[TField]
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleProvinceChange = (provinceCode: string) => {
    const selectedProvince = provinces.find((province) => String(province.code) === provinceCode);

    setValues((prev) => ({
      ...prev,
      provinceCode,
      city: selectedProvince?.name ?? '',
      wardCode: '',
      wardDistrict: '',
    }));
    setFormErrors((prev) => ({ ...prev, provinceCode: '', city: '', wardCode: '', wardDistrict: '' }));
  };

  const handleWardChange = (wardCode: string) => {
    const selectedWard = wards.find((ward) => String(ward.code) === wardCode);

    setValues((prev) => ({
      ...prev,
      wardCode,
      wardDistrict: selectedWard?.name ?? '',
    }));
    setFormErrors((prev) => ({ ...prev, wardCode: '', wardDistrict: '' }));
  };

  const validateForm = (): boolean => {
    const nextErrors: CreateStaffFormErrors = {};

    if (!resolvedBranchId.trim()) {
      nextErrors.branchId = 'Chi nhánh làm việc là bắt buộc';
    }

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Họ tên là bắt buộc';
    }

    const normalizedPhone = values.phone.trim();

    if (!normalizedPhone) {
      nextErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[1-9][0-9]{8,9})$/.test(normalizedPhone)) {
      nextErrors.phone = 'Số điện thoại phải có 9-11 số và bắt đầu bằng 0';
    }

    if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = 'Email không đúng định dạng';
    }

    if (!generatedEmployeeCode.trim()) {
      nextErrors.employeeCode = 'Mã nhân viên là bắt buộc';
    }

    if (!values.hireDate) {
      nextErrors.hireDate = 'Ngày vào làm là bắt buộc';
    }

    if (positions.length === 0) {
      nextErrors.positionId = 'Chưa có chức vụ đang hoạt động để gán cho nhân viên';
    } else if (!values.positionId.trim()) {
      nextErrors.positionId = 'Chức vụ là bắt buộc';
    } else if (!positions.some((position) => position.id === values.positionId)) {
      nextErrors.positionId = 'Chức vụ đã chọn không hợp lệ, vui lòng chọn lại';
    }

    if (!values.dateOfBirth) {
      nextErrors.dateOfBirth = 'Ngày sinh là bắt buộc';
    } else if (!parseDateOnly(values.dateOfBirth)) {
      nextErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
    } else if (!isOlderThanMinimumAge(values.dateOfBirth)) {
      nextErrors.dateOfBirth = 'Nhân viên phải trên 18 tuổi';
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Mật khẩu đăng nhập là bắt buộc';
    } else if (values.password.trim().length < 8) {
      nextErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    }

    if (values.posPin && !/^\d{4,6}$/.test(values.posPin.trim())) {
      nextErrors.posPin = 'POS PIN phải có từ 4 đến 6 chữ số';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): CreateStaffRequest => {
    const payload: CreateStaffRequest = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
    };

    if (values.email && values.email.trim()) {
      payload.email = values.email.trim();
    }
    if (generatedEmployeeCode.trim()) {
      payload.employeeCode = generatedEmployeeCode;
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
    const address = buildStaffAddress({
      streetAddress: values.streetAddress,
      wardDistrict: values.wardDistrict,
      city: values.city,
    });

    if (address) {
      payload.address = address;
    }
    if (values.positionId && values.positionId.trim()) {
      payload.positionId = values.positionId;
    }
    if (values.password && values.password.trim()) {
      payload.password = values.password.trim();
    }
    if (values.posPin && values.posPin.trim()) {
      payload.posPin = values.posPin.trim();
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = buildPayload();

    try {
      const createdStaffId = await createStaff(payload);

      success(
        'Thêm nhân viên thành công',
        `Nhân viên ${values.fullName} đã được tạo trong hệ thống.`
      );

      const [assignRoleResult, assignBranchResult] = await Promise.allSettled([
        assignStaffRoles({
          staffId: createdStaffId,
          roleIds: values.roleId ? [values.roleId] : [],
        }),
        assignUserToBranch({
          branchId: resolvedBranchId,
          userId: createdStaffId,
        }),
      ]);

      if (assignRoleResult.status === 'fulfilled') {
        success(
          'Gán vai trò thành công',
          values.roleId
            ? `Đã cập nhật quyền cho nhân viên ${values.fullName}.`
            : `Nhân viên ${values.fullName} hiện chưa có vai trò cụ thể.`
        );
      } else {
        error(
          'Gán vai trò thất bại',
          getStaffMutationErrorMessage(assignRoleResult.reason)
        );
      }

      if (assignBranchResult.status === 'fulfilled') {
        success(
          'Gán chi nhánh thành công',
          selectedBranchName
            ? `Nhân viên ${values.fullName} đã được gán vào chi nhánh ${selectedBranchName}.`
            : `Nhân viên ${values.fullName} đã được gán vào chi nhánh đã chọn.`
        );
      } else {
        error(
          'Gán chi nhánh thất bại',
          getStaffMutationErrorMessage(assignBranchResult.reason)
        );
      }

      navigate(ROUTES.OWNER.STAFF);
    } catch (err: unknown) {
      const errorMessage = getStaffMutationErrorMessage(err);
      const errorField = getStaffMutationErrorField(err);

      if (errorField) {
        setFormErrors((prev) => ({ ...prev, [errorField]: errorMessage }));
      }

      error(
        'Có lỗi xảy ra',
        errorMessage || 'Không thể xử lý thông tin nhân viên, vui lòng thử lại sau'
      );
    }
  };

  return {
    formErrors,
    employeeCode: generatedEmployeeCode,
    isPending: isCreating || isAssigningRoles || isAssigningBranch,
    isRolesLoading,
    branches,
    provinces,
    wards,
    isProvincesLoading,
    isProvincesError,
    isWardsLoading,
    isWardsError,
    values: formValues,
    onBack: () => {
      navigate(ROUTES.OWNER.STAFF);
    },
    onChange: handleChange,
    onProvinceChange: handleProvinceChange,
    onWardChange: handleWardChange,
    onGeneratePassword: () => {
      handleChange(
        'password',
        buildRandomPassword({
          fullName: values.fullName,
          dateOfBirth: values.dateOfBirth,
        })
      );
    },
    onSubmit: handleSubmit,
    positions,
    roles: assignableRoles,
  };
};
