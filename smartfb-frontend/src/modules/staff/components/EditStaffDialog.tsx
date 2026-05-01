import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { useAssignUserToBranch } from '@modules/branch/hooks/useAssignUserToBranch';
import { useBranches } from '@modules/branch/hooks/useBranches';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { usePositions } from '@modules/staff/hooks/usePositions';
import { useAssignStaffRoles } from '@modules/staff/hooks/useAssignStaffRoles';
import { useRolesMatrix } from '@modules/staff/hooks/useRolesMatrix';
import { StaffDatePickerField } from '@modules/staff/components/StaffDatePickerField';
import {
  buildStaffAddress,
  parseStaffAddress,
} from '@modules/staff/utils/staffAddressFormatter';
import { filterAssignableStaffRoles } from '@modules/staff/utils/filterAssignableStaffRoles';
import { getStaffMutationErrorMessage } from '@modules/staff/utils/getStaffMutationErrorMessage';
import { useToast } from '@shared/hooks/useToast';
import { useEditStaff } from '../hooks/useEditStaff';
import type { StaffDetail, UpdateStaffRequest, StaffGender } from '../types/staff.types';

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
  const initialAddress = parseStaffAddress(staff.address);
  const { data: positions = [] } = usePositions();
  const { data: branches = [] } = useBranches();
  const { data: roleMatrixData, isLoading: isRolesLoading } = useRolesMatrix();
  const assignableRoles = filterAssignableStaffRoles(roleMatrixData?.roles ?? []);
  const { mutateAsync: updateStaff, isPending: isUpdatingStaff } = useEditStaff();
  const { mutateAsync: assignStaffRoles, isPending: isAssigningRoles } = useAssignStaffRoles();
  const { mutateAsync: assignUserToBranch, isPending: isAssigningBranch } = useAssignUserToBranch();
  const { success, error } = useToast();
  const NO_POSITION_VALUE = '__no_position__';
  const NO_BRANCH_VALUE = '__no_branch__';

  const [formData, setFormData] = useState<UpdateStaffRequest>({
    fullName: staff.fullName,
    phone: staff.phone,
    email: staff.email,
    employeeCode: staff.employeeCode,
    hireDate: staff.hireDate,
    dateOfBirth: staff.dateOfBirth,
    gender: staff.gender,
    address: '',
    positionId: staff.positionId,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [streetAddress, setStreetAddress] = useState(initialAddress.streetAddress);
  const [wardDistrict, setWardDistrict] = useState(initialAddress.wardDistrict);
  const [city, setCity] = useState(initialAddress.city);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(staff.roles[0]?.id ?? '');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const isPending = isUpdatingStaff || isAssigningRoles || isAssigningBranch;

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedBranchId('');
    }

    onOpenChange(nextOpen);
  };

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

  const handleChange = <TField extends keyof UpdateStaffRequest>(
    field: TField,
    value: UpdateStaffRequest[TField]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      const payload: UpdateStaffRequest = {
        ...formData,
        address: buildStaffAddress({
          streetAddress,
          wardDistrict,
          city,
        }),
      };

      await updateStaff({ id: staff.id, data: payload });
      await assignStaffRoles({ staffId: staff.id, roleIds: selectedRoleId ? [selectedRoleId] : [] });

      if (selectedBranchId) {
        await assignUserToBranch({
          branchId: selectedBranchId,
          userId: staff.id,
        });
      }

      const selectedBranchName =
        branches.find((branch) => branch.id === selectedBranchId)?.name ?? '';

      success(
        'Cập nhật thành công',
        selectedBranchId && selectedBranchName
          ? `Thông tin nhân viên đã được cập nhật và gán thêm vào chi nhánh ${selectedBranchName}`
          : 'Thông tin nhân viên và vai trò đã được cập nhật'
      );
      setSelectedBranchId('');
      handleDialogOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      error('Không thể cập nhật', getStaffMutationErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
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

          <StaffDatePickerField
            id="hireDate"
            label="Ngày vào làm"
            required
            value={formData.hireDate}
            onChange={(nextValue) => handleChange('hireDate', nextValue)}
            placeholder="dd/mm/yyyy"
            errorMessage={errors.hireDate}
          />

          <StaffDatePickerField
            id="dateOfBirth"
            label="Ngày sinh"
            value={formData.dateOfBirth}
            onChange={(nextValue) => handleChange('dateOfBirth', nextValue)}
            placeholder="dd/mm/yyyy"
          />

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
            <Label htmlFor="streetAddress">Số nhà, đường</Label>
            <Input
              id="streetAddress"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder="Ví dụ: 12 Nguyễn Trãi"
            />
          </div>

          <div>
            <Label htmlFor="wardDistrict">Phường/quận</Label>
            <Input
              id="wardDistrict"
              value={wardDistrict}
              onChange={(e) => setWardDistrict(e.target.value)}
              placeholder="Ví dụ: Phường Bến Thành, Quận 1"
            />
          </div>

          <div>
            <Label htmlFor="city">Thành phố</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ví dụ: Hồ Chí Minh"
            />
          </div>

          <div>
            <Label htmlFor="positionId">Chức vụ</Label>
            <Select
              value={formData.positionId || NO_POSITION_VALUE}
              onValueChange={(value) =>
                handleChange('positionId', value === NO_POSITION_VALUE ? undefined : value)
              }
            >
              <SelectTrigger id="positionId">
                <SelectValue placeholder="Chọn chức vụ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_POSITION_VALUE}>Chưa gán chức vụ</SelectItem>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              Danh sách lấy từ API chức vụ active của tenant hiện tại.
            </p>
          </div>

          <div>
            <Label htmlFor="branchId">Gán thêm chi nhánh làm việc</Label>
            <Select
              value={selectedBranchId || NO_BRANCH_VALUE}
              onValueChange={(value) => setSelectedBranchId(value === NO_BRANCH_VALUE ? '' : value)}
              disabled={branches.length === 0}
            >
              <SelectTrigger id="branchId">
                <SelectValue placeholder="Chọn chi nhánh để gán thêm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BRANCH_VALUE}>Không thay đổi chi nhánh</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              Nếu chọn chi nhánh, hệ thống sẽ gán thêm nhân viên vào chi nhánh đó khi lưu.
            </p>
          </div>

          <div>
            <Label htmlFor="roleId">Vai trò</Label>
            <Select
              value={selectedRoleId || NO_POSITION_VALUE}
              onValueChange={(value) => setSelectedRoleId(value === NO_POSITION_VALUE ? '' : value)}
              disabled={isRolesLoading}
            >
              <SelectTrigger id="roleId">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_POSITION_VALUE}>Chưa gán vai trò</SelectItem>
                {assignableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-gray-500">
              Vai trò quyết định quyền thực tế của nhân viên trong hệ thống.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={isPending}>
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
