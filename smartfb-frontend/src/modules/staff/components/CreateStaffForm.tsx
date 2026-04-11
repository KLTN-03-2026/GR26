import { useState } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { StaffDatePickerField } from "@modules/staff/components/StaffDatePickerField";
import type { StaffGender } from "@modules/staff/types/staff.types";
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
import { useCreateStaffForm } from "../hooks/useCreateStaffForm";

const NO_POSITION_VALUE = "__no_position__";

export const CreateStaffForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const {
    branches,
    formErrors,
    isPending,
    values,
    positions,
    roles,
    onBack,
    onChange,
    onGeneratePassword,
    onSubmit,
  } = useCreateStaffForm();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Thêm nhân viên mới
          </h1>
          <p className="text-sm text-gray-500">
            Điền thông tin để tạo tài khoản nhân viên
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="">
            <Label htmlFor="fullName">
              Họ tên <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              value={values.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              placeholder="Nguyễn Văn A"
            />
            {formErrors.fullName && (
              <p className="text-red-600 text-xs mt-1">{formErrors.fullName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">
              Số điện thoại <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={values.phone}
              onChange={(e) => onChange("phone", e.target.value)}
              placeholder="0912345678"
            />
            {formErrors.phone && (
              <p className="text-red-600 text-xs mt-1">{formErrors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="nhanvien@example.com"
            />
          </div>

          <div>
            <Label htmlFor="gender">Giới tính</Label>
            <Select
              value={values.gender}
              onValueChange={(value) =>
                onChange("gender", value as StaffGender)
              }
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
          <div className="grid grid-cols-2 gap-4">
            <StaffDatePickerField
              id="hireDate"
              label="Ngày vào làm"
              required
              value={values.hireDate}
              onChange={(nextValue) => onChange("hireDate", nextValue)}
              placeholder="dd/mm/yyyy"
              errorMessage={formErrors.hireDate}
            />

            <StaffDatePickerField
              id="dateOfBirth"
              label="Ngày sinh"
              value={values.dateOfBirth}
              onChange={(nextValue) => onChange("dateOfBirth", nextValue)}
              placeholder="dd/mm/yyyy"
            />
          </div>

          <div>
            <Label htmlFor="streetAddress">Số nhà, đường</Label>
            <Input
              id="streetAddress"
              value={values.streetAddress}
              onChange={(e) => onChange("streetAddress", e.target.value)}
              placeholder="Ví dụ: 12 Nguyễn Trãi"
            />
          </div>

          <div>
            <Label htmlFor="wardDistrict">Phường/quận</Label>
            <Input
              id="wardDistrict"
              value={values.wardDistrict}
              onChange={(e) => onChange("wardDistrict", e.target.value)}
              placeholder="Ví dụ: Phường Bến Thành, Quận 1"
            />
          </div>

          <div>
            <Label htmlFor="city">Thành phố</Label>
            <Input
              id="city"
              value={values.city}
              onChange={(e) => onChange("city", e.target.value)}
              placeholder="Ví dụ: Hồ Chí Minh"
            />
          </div>

          <div>
            <Label htmlFor="branchId">
              Chi nhánh làm việc <span className="text-red-500">*</span>
            </Label>
            <Select
              value={values.branchId || NO_POSITION_VALUE}
              onValueChange={(value) =>
                onChange("branchId", value === NO_POSITION_VALUE ? "" : value)
              }
              disabled={branches.length === 0}
            >
              <SelectTrigger id="branchId">
                <SelectValue placeholder="Chọn chi nhánh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_POSITION_VALUE}>Chọn chi nhánh</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.branchId && (
              <p className="text-red-600 text-xs mt-1">{formErrors.branchId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="positionId">Chức vụ</Label>
            <Select
              value={values.positionId || NO_POSITION_VALUE}
              onValueChange={(value) =>
                onChange("positionId", value === NO_POSITION_VALUE ? "" : value)
              }
            >
              <SelectTrigger id="positionId">
                <SelectValue placeholder="Chọn chức vụ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_POSITION_VALUE}>
                  Chưa gán chức vụ
                </SelectItem>
                {positions.map((position) => (
                  <SelectItem key={position.id} value={position.id}>
                    {position.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
           
          </div>

          <div>
            <Label htmlFor="password">Mật khẩu đăng nhập</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={isPasswordVisible ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete="new-password"
                  className="pr-12"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                  onClick={() => setIsPasswordVisible((prev) => !prev)}
                >
                  {isPasswordVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={onGeneratePassword}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
            {formErrors.password && (
              <p className="text-red-600 text-xs mt-1">{formErrors.password}</p>
            )}
    
          </div>

          <div>
            <Label htmlFor="posPin">POS PIN</Label>
            <Input
              id="posPin"
              inputMode="numeric"
              maxLength={6}
              value={values.posPin}
              onChange={(e) =>
                onChange(
                  "posPin",
                  e.target.value.replace(/\D/g, "").slice(0, 6),
                )
              }
              placeholder="4 đến 6 chữ số"
            />
            {formErrors.posPin && (
              <p className="text-red-600 text-xs mt-1">{formErrors.posPin}</p>
            )}
          
          </div>

          <div>
            <Label htmlFor="roleId">Vai trò</Label>
            <Select
              value={values.roleId || NO_POSITION_VALUE}
              onValueChange={(value) =>
                onChange("roleId", value === NO_POSITION_VALUE ? "" : value)
              }
            >
              <SelectTrigger id="roleId">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_POSITION_VALUE}>Chưa gán vai trò</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onBack} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={isPending}>
            {isPending ? "Đang lưu..." : "Tạo nhân viên"}
          </Button>
        </div>
      </div>
    </div>
  );
};
