import { useState } from "react";
import { X, DoorOpen, DoorClosed } from "lucide-react";
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
import { Switch } from "@shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { cn } from "@shared/utils/cn";
import { useEditBranch } from "../hooks/useEditBranch";
import type { BranchDetailFull, BranchManager } from "../data/branchDetailMock";
import type { EditBranchFormData } from "../types/branch.types";

interface EditBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branch: BranchDetailFull;
  onSuccess?: () => void;
}

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayHours = {
  open: string;
  close: string;
};

const daysOfWeek: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Thứ Hai" },
  { key: "tuesday", label: "Thứ Ba" },
  { key: "wednesday", label: "Thứ Tư" },
  { key: "thursday", label: "Thứ Năm" },
  { key: "friday", label: "Thứ Sáu" },
  { key: "saturday", label: "Thứ Bảy" },
  { key: "sunday", label: "Chủ Nhật" },
];

// Mock staff data
const mockStaffList: BranchManager[] = [
  {
    id: "staff-1",
    name: "Nguyễn Văn A",
    avatar: "https://i.pravatar.cc/150?u=staff-1",
    phone: "0901111111",
    email: "vana@smartfb.vn",
  },
  {
    id: "staff-2",
    name: "Trần Thị B",
    avatar: "https://i.pravatar.cc/150?u=staff-2",
    phone: "0902222222",
    email: "thib@smartfb.vn",
  },
  {
    id: "staff-3",
    name: "Lê Văn C",
    avatar: "https://i.pravatar.cc/150?u=staff-3",
    phone: "0903333333",
    email: "vanc@smartfb.vn",
  },
  {
    id: "staff-4",
    name: "Phạm Thị D",
    avatar: "https://i.pravatar.cc/150?u=staff-4",
    phone: "0904444444",
    email: "thid@smartfb.vn",
  },
  {
    id: "staff-5",
    name: "Hoàng Văn E",
    avatar: "https://i.pravatar.cc/150?u=staff-5",
    phone: "0905555555",
    email: "vane@smartfb.vn",
  },
];

export const EditBranchDialog = ({
  open,
  onOpenChange,
  branch,
  onSuccess,
}: EditBranchDialogProps) => {
  const { mutate, isPending } = useEditBranch();

  // Initialize form with current branch data
  const [formData, setFormData] = useState<EditBranchFormData>({
    name: branch.name,
    code: branch.code,
    taxCode: branch.taxCode,
    address: branch.address,
    city: branch.city,
    phone: branch.phone,
    openTime: branch.openTime,
    closeTime: branch.closeTime,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof EditBranchFormData, string>>
  >({});
  const [applyToAllDays, setApplyToAllDays] = useState(true);

  // State for manager selection
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    branch.manager?.id || "none",
  );

  // State for open/close status
  const [isOpened, setIsOpened] = useState(branch.isOpened);

  // State for per-day editing
  const [dayFormData, setDayFormData] = useState<Record<DayOfWeek, DayHours>>(
    () => {
      const initial: Record<DayOfWeek, DayHours> = {
        monday: { open: branch.openTime, close: branch.closeTime },
        tuesday: { open: branch.openTime, close: branch.closeTime },
        wednesday: { open: branch.openTime, close: branch.closeTime },
        thursday: { open: branch.openTime, close: branch.closeTime },
        friday: { open: branch.openTime, close: branch.closeTime },
        saturday: { open: branch.openTime, close: branch.closeTime },
        sunday: { open: branch.openTime, close: branch.closeTime },
      };
      return initial;
    },
  );

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EditBranchFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên chi nhánh không được để trống";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Mã chi nhánh không được để trống";
    }

    if (!formData.taxCode.trim()) {
      newErrors.taxCode = "Mã số thuế không được để trống";
    } else if (!/^\d{10,14}$/.test(formData.taxCode.replace(/\s/g, ""))) {
      newErrors.taxCode = "Mã số thuế phải có 10-14 chữ số";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Địa chỉ không được để trống";
    }

    if (!formData.city.trim()) {
      newErrors.city = "Thành phố không được để trống";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^[\d\s\-+()]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (!formData.openTime.trim()) {
      newErrors.openTime = "Giờ mở cửa không được để trống";
    }

    if (!formData.closeTime.trim()) {
      newErrors.closeTime = "Giờ đóng cửa không được để trống";
    }

    if (
      formData.openTime &&
      formData.closeTime &&
      formData.openTime >= formData.closeTime
    ) {
      newErrors.closeTime = "Giờ đóng cửa phải sau giờ mở cửa";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      mutate(
        {
          id: branch.id,
          payload: {
            // Backend hiện chỉ hỗ trợ cập nhật 4 trường cơ bản của chi nhánh.
            name: formData.name,
            code: formData.code,
            address: formData.address,
            phone: formData.phone,
          },
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            onSuccess?.();
          },
        },
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Chỉnh sửa thông tin chi nhánh
            </DialogTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4" onKeyDown={handleKeyDown}>
          {/* Section: Thông tin cơ bản và liên hệ */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              Thông tin cơ bản
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {/* Tên chi nhánh */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-gray-700">
                  Tên chi nhánh <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={errors.name ? "border-red-500" : ""}
                  placeholder="Nhập tên chi nhánh"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Mã chi nhánh */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-code" className="text-gray-700">
                  Mã chi nhánh <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  disabled
                  className={cn(
                    errors.code ? "border-red-500" : "",
                    "bg-gray-100 cursor-not-allowed",
                  )}
                  placeholder="VD: BR-Q1-001"
                />
                {errors.code && (
                  <p className="text-xs text-red-500">{errors.code}</p>
                )}
              
              </div>

              {/* Thành phố */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-city" className="text-gray-700">
                  Thành phố <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className={errors.city ? "border-red-500" : ""}
                  placeholder="VD: TP. Hồ Chí Minh"
                />
                {errors.city && (
                  <p className="text-xs text-red-500">{errors.city}</p>
                )}
              </div>

              {/* Địa chỉ - full width */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="edit-address" className="text-gray-700">
                  Địa chỉ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className={errors.address ? "border-red-500" : ""}
                  placeholder="Nhập địa chỉ chi tiết"
                />
                {errors.address && (
                  <p className="text-xs text-red-500">{errors.address}</p>
                )}
              </div>
              {/* Quản lý chi nhánh - Combobox */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-manager" className="text-gray-700">
                  Quản lý chi nhánh
                </Label>
                <Select
                  value={selectedManagerId}
                  onValueChange={setSelectedManagerId}
                >
                  <SelectTrigger id="edit-manager" className="h-9">
                    <SelectValue placeholder="Chưa có" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Chưa có</SelectItem>
                    {mockStaffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Số điện thoại */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone" className="text-gray-700">
                  Số điện thoại <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className={errors.phone ? "border-red-500" : ""}
                  placeholder="VD: 0901234567"
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone}</p>
                )}
              </div>

              {/* Mã số thuế */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-tax" className="text-gray-700">
                  Mã số thuế <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-tax"
                  value={formData.taxCode}
                  onChange={(e) =>
                    setFormData({ ...formData, taxCode: e.target.value })
                  }
                  className={errors.taxCode ? "border-red-500" : ""}
                  placeholder="Nhập mã số thuế 10-14 số"
                />
                {errors.taxCode && (
                  <p className="text-xs text-red-500">{errors.taxCode}</p>
                )}
              </div>

              {/* Trạng thái đóng/mở cửa - nằm ngang với mã số thuế */}
              <div className="space-y-1.5">
                <Label className="text-gray-700">Trạng thái cửa hàng</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isOpened ? "outline" : "default"}
                    size="sm"
                    onClick={() => setIsOpened(!isOpened)}
                    className={cn(
                      "flex-1",
                      isOpened
                        ? "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        : "bg-green-600 hover:bg-green-700 text-white",
                    )}
                  >
                    {isOpened ? (
                      <>
                        <DoorClosed className="w-4 h-4 mr-1" />
                        Đóng
                      </>
                    ) : (
                      <>
                        <DoorOpen className="w-4 h-4 mr-1" />
                        Mở
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {isOpened
                    ? `Đóng lúc: ${formData.closeTime}`
                    : `Mở lúc: ${formData.openTime}`}
                </p>
              </div>
            </div>
          </div>

          {/* Section: Giờ hoạt động */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                Giờ hoạt động
              </h3>
              <div className="flex items-center gap-2">
                <Switch
                  checked={applyToAllDays}
                  onCheckedChange={setApplyToAllDays}
                />
                <span className="text-xs text-gray-600">
                  Áp dụng cho tất cả các thứ
                </span>
              </div>
            </div>

            {applyToAllDays ? (
              // Single row for all days
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-open" className="text-gray-700">
                    Giờ mở cửa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-open"
                    type="time"
                    value={formData.openTime}
                    onChange={(e) =>
                      setFormData({ ...formData, openTime: e.target.value })
                    }
                    className={errors.openTime ? "border-red-500" : ""}
                  />
                  {errors.openTime && (
                    <p className="text-xs text-red-500">{errors.openTime}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="edit-close" className="text-gray-700">
                    Giờ đóng cửa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-close"
                    type="time"
                    value={formData.closeTime}
                    onChange={(e) =>
                      setFormData({ ...formData, closeTime: e.target.value })
                    }
                    className={errors.closeTime ? "border-red-500" : ""}
                  />
                  {errors.closeTime && (
                    <p className="text-xs text-red-500">{errors.closeTime}</p>
                  )}
                </div>
              </div>
            ) : (
              // Per-day editing
              <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-[80px_1fr_1fr] gap-2 text-xs font-medium text-gray-600 mb-2">
                  <div>Thứ</div>
                  <div>Mở cửa</div>
                  <div>Đóng cửa</div>
                </div>
                {daysOfWeek.map(({ key, label }) => {
                  const dayKey = key as keyof typeof dayFormData;
                  return (
                    <div
                      key={key}
                      className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center"
                    >
                      <span className="text-sm text-gray-700">{label}</span>
                      <Input
                        type="time"
                        value={dayFormData[dayKey].open}
                        onChange={(e) =>
                          setDayFormData({
                            ...dayFormData,
                            [dayKey]: {
                              ...dayFormData[dayKey],
                              open: e.target.value,
                            },
                          })
                        }
                        className="text-sm"
                      />
                      <Input
                        type="time"
                        value={dayFormData[dayKey].close}
                        onChange={(e) =>
                          setDayFormData({
                            ...dayFormData,
                            [dayKey]: {
                              ...dayFormData[dayKey],
                              close: e.target.value,
                            },
                          })
                        }
                        className="text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
