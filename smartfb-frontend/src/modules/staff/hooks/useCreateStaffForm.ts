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
import type { CreateStaffRequest, StaffGender } from '@modules/staff/types/staff.types';
import { buildStaffAddress } from '@modules/staff/utils/staffAddressFormatter';
import { filterAssignableStaffRoles } from '@modules/staff/utils/filterAssignableStaffRoles';
import {
  buildEmployeeCode,
  buildRandomPassword,
} from '@modules/staff/utils/staffCredentialGenerator';
import { getStaffMutationErrorMessage } from '@modules/staff/utils/getStaffMutationErrorMessage';
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
  city: string;
  positionId: string;
  password: string;
  posPin: string;
  roleId: string;
}

type CreateStaffFormErrorField = keyof CreateStaffFormValues | 'employeeCode';
type CreateStaffFormErrors = Partial<Record<CreateStaffFormErrorField, string>>;

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
  city: '',
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
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const [generatedAt] = useState(() => new Date());

  const [values, setValues] = useState<CreateStaffFormValues>(() => getDefaultValues());
  const [formErrors, setFormErrors] = useState<CreateStaffFormErrors>({});

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

  const validateForm = (): boolean => {
    const nextErrors: CreateStaffFormErrors = {};

    if (!resolvedBranchId.trim()) {
      nextErrors.branchId = 'Chi nhánh làm việc là bắt buộc';
    }

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Họ tên là bắt buộc';
    }

    if (!values.phone.trim()) {
      nextErrors.phone = 'Số điện thoại là bắt buộc';
    } else if (!/^(0[1-9][0-9]{8,9})$/.test(values.phone)) {
      nextErrors.phone = 'Số điện thoại phải có 9-11 số và bắt đầu bằng 0';
    }

    if (!generatedEmployeeCode.trim()) {
      nextErrors.employeeCode = 'Mã nhân viên là bắt buộc';
    }

    if (!values.hireDate) {
      nextErrors.hireDate = 'Ngày vào làm là bắt buộc';
    }

    if (values.password && values.password.trim().length < 8) {
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
      fullName: values.fullName,
      phone: values.phone,
    };

    if (values.email && values.email.trim()) {
      payload.email = values.email;
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
      error(
        'Có lỗi xảy ra',
        getStaffMutationErrorMessage(err) ||
          'Không thể xử lý thông tin nhân viên, vui lòng thử lại sau'
      );
    }
  };

  return {
    formErrors,
    employeeCode: generatedEmployeeCode,
    isPending: isCreating || isAssigningRoles || isAssigningBranch,
    isRolesLoading,
    branches,
    values: formValues,
    onBack: () => {
      navigate(ROUTES.OWNER.STAFF);
    },
    onChange: handleChange,
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
